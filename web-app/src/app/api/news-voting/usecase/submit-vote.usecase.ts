import crypto from "node:crypto";

import { NewsVoteDTO, NewsVoteEntity, VoteOption } from "../entities";
import { INewsVoteRepository } from "../repositories/news-vote.repository.interface";
import { IRedisVoteRepository } from "../repositories/redis-vote.repository.interface";

import type { AIAnalysisDTO } from "@/app/api/ai-feedback/entities/ai-analysis.entity";
import { INewsArticleRepository } from "@/app/api/ai-feedback/repositories/news-article.repository.interface";
import {
  IEventPublisher,
} from "@/app/api/realtime-events";
import { RoundCompletedLeaderboardEntry } from "@/app/api/realtime-events/entities/event.types";
import type { IRedisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository.interface";
import type { IRoomRepository } from "@/app/api/rooms/repositories/room.repository.interface";
import type { MLTargetType, VoteOptionType } from "@/server/shared/domain/game-vocabulary";

export interface SubmitVoteInput {
  roomId: string;
  userId: string;
  vote: VoteOptionType;
  isTimeout?: boolean;
}

export interface SubmitVoteOutput {
  vote: NewsVoteDTO;
  roundCompleted: boolean;
  officialAnswer?: MLTargetType;
  modelAnalysis?: AIAnalysisDTO | null;
  leaderboard?: RoundCompletedLeaderboardEntry[];
}

export class SubmitVoteUseCase {
  constructor(
    private readonly newsVoteRepository: INewsVoteRepository,
    private readonly redisVoteRepository: IRedisVoteRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly redisRoomRepository: IRedisRoomRepository,
    private readonly newsArticleRepository: INewsArticleRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: SubmitVoteInput): Promise<SubmitVoteOutput> {
    const normalizedVote = VoteOption.normalize(input.vote);

    const room = await this.roomRepository.findById(input.roomId);
    if (!room) {
      throw new Error(`Room with id "${input.roomId}" not found`);
    }

    if (room.status !== "in_progress") {
      throw new Error("Cannot submit vote: room is not in progress");
    }

    if (room.currentRound < 1) {
      throw new Error("Cannot submit vote: invalid room round");
    }

    const member = await this.roomRepository.findMember(input.roomId, input.userId);
    if (!member) {
      throw new Error("User is not a member of this room");
    }

    const playlistItems = await this.roomRepository.getPlaylistItems(input.roomId);
    const currentItem = playlistItems.find((item) => item.roundOrder === room.currentRound);
    if (!currentItem) {
      throw new Error(`Playlist item not found for round ${room.currentRound}`);
    }

    if (await this.redisVoteRepository.isRoundCompleted(input.roomId, room.currentRound)) {
      throw new Error("Cannot submit vote: round is completed");
    }

    const hasVotedRedis = await this.redisVoteRepository.hasUserVoted(
      input.roomId,
      room.currentRound,
      input.userId,
    );
    if (hasVotedRedis) {
      throw new Error("Participant has already voted in this round");
    }

    const existingVote = await this.newsVoteRepository.findByParticipantAndPlaylistItem(
      currentItem.id,
      input.userId,
    );
    if (existingVote) {
      throw new Error("Participant has already voted in this round");
    }

    const article = await this.newsArticleRepository.findById(currentItem.articleId);
    if (!article) {
      throw new Error(`Article with id "${currentItem.articleId}" not found`);
    }

    const voteEntity = new NewsVoteEntity({
      id: crypto.randomUUID(),
      roomId: input.roomId,
      playlistItemId: currentItem.id,
      userId: input.userId,
      vote: normalizedVote,
    });

    const evaluatedVote = voteEntity.evaluate(article.targetClassification, input.isTimeout);

    await this.newsVoteRepository.create(evaluatedVote.toDTO());

    if (evaluatedVote.pointsAwarded > 0) {
      const updatedMember = await this.roomRepository.updateMemberScore(
        input.roomId,
        input.userId,
        evaluatedVote.pointsAwarded,
      );
      await this.redisRoomRepository.addMemberToLeaderboard(
        input.roomId,
        input.userId,
        updatedMember.score,
      );
    }

    const { currentVoteCount } = await this.redisVoteRepository.recordVoteAtomic(
      input.roomId,
      room.currentRound,
      input.userId,
    );

    const totalParticipants = await this.roomRepository.countMembers(input.roomId);
    const roundCompleted = currentVoteCount >= totalParticipants;

    if (roundCompleted) {
      const isFirstToComplete = await this.redisVoteRepository.markRoundCompleted(
        input.roomId,
        room.currentRound,
      );

      const leaderboard = await this.redisRoomRepository.getLeaderboard(input.roomId);
      const roundVotes =
        typeof this.newsVoteRepository.listByPlaylistItem === "function"
          ? ((await this.newsVoteRepository.listByPlaylistItem(currentItem.id)) ?? [])
          : [];
      const roundVotesMap = new Map(roundVotes.map((v) => [v.userId, v]));

      const enrichedLeaderboard: RoundCompletedLeaderboardEntry[] = leaderboard.map((entry) => {
        const vote = roundVotesMap.get(entry.userId);
        return {
          userId: entry.userId,
          score: entry.score,
          roundDelta: vote?.pointsAwarded ?? 0,
          isCorrect: vote?.isCorrect ?? false,
        };
      });

      if (isFirstToComplete) {
        await this.eventPublisher.publish(room.pin, {
          type: "ROUND_COMPLETED",
          roomId: room.id,
          pin: room.pin,
          payload: {
            round: room.currentRound,
            leaderboard: enrichedLeaderboard,
            officialAnswer: article.targetClassification,
            modelAnalysis: null,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        vote: evaluatedVote.toDTO(),
        roundCompleted: true,
        officialAnswer: article.targetClassification,
        modelAnalysis: null,
        leaderboard: enrichedLeaderboard,
      };
    }

    return {
      vote: { ...evaluatedVote.toDTO(), isCorrect: null, pointsAwarded: 0 },
      roundCompleted: false,
    };
  }
}

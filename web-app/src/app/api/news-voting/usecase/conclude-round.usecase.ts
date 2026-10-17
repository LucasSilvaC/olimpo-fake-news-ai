import crypto from "node:crypto";

import { NewsVoteEntity } from "../entities/news-vote.entity";
import { INewsVoteRepository } from "../repositories/news-vote.repository.interface";
import { IRedisVoteRepository } from "../repositories/redis-vote.repository.interface";

import type { AIAnalysisDTO } from "@/app/api/ai-feedback/entities/ai-analysis.entity";
import { INewsArticleRepository } from "@/app/api/ai-feedback/repositories/news-article.repository.interface";
import {
  IEventPublisher,
} from "@/app/api/realtime-events";
import { RoundCompletedLeaderboardEntry } from "@/app/api/realtime-events/entities/event.types";
import {
  IRoomRepository,
  IRedisRoomRepository,
} from "@/app/api/rooms/repositories";
import type { MLTargetType } from "@/server/shared/domain/game-vocabulary";

export interface ConcludeRoundInput {
  roomId: string;
  round: number;
  userId: string;
}

export interface ConcludeRoundOutput {
  roundCompleted: boolean;
  officialAnswer?: MLTargetType;
  modelAnalysis?: AIAnalysisDTO | null;
  leaderboard?: RoundCompletedLeaderboardEntry[];
}

export class ConcludeRoundUseCase {
  constructor(
    private readonly newsVoteRepository: INewsVoteRepository,
    private readonly redisVoteRepository: IRedisVoteRepository,
    private readonly roomRepository: IRoomRepository,
    private readonly redisRoomRepository: IRedisRoomRepository,
    private readonly newsArticleRepository: INewsArticleRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: ConcludeRoundInput): Promise<ConcludeRoundOutput> {
    const room = await this.roomRepository.findById(input.roomId);
    if (!room) {
      throw new Error(`Room with id "${input.roomId}" not found`);
    }

    if (!(await this.roomRepository.findMember(input.roomId, input.userId))) {
      throw new Error("User is not a member of this room");
    }

    if (room.status !== "in_progress") {
      throw new Error("Cannot conclude round: room is not in progress");
    }

    if (room.currentRound !== input.round) {
      return { roundCompleted: false };
    }

    const playlistItems = await this.roomRepository.getPlaylistItems(input.roomId);
    const currentItem = playlistItems.find((item) => item.roundOrder === room.currentRound);
    if (!currentItem) {
      throw new Error(`Playlist item not found for round ${room.currentRound}`);
    }

    const article = await this.newsArticleRepository.findById(currentItem.articleId);
    if (!article) throw new Error("Article not found");
    const alreadyCompleted = await this.redisVoteRepository.isRoundCompleted(
      input.roomId,
      input.round,
    );
    if (!alreadyCompleted) {
      const count = await this.redisVoteRepository.getVoteCount(input.roomId, input.round);
      const participants = await this.roomRepository.countMembers(input.roomId);
      const deadline = (room.updatedAt?.getTime() ?? Date.now()) + room.roundDurationSeconds * 1000;
      if (Date.now() < deadline && (participants < 1 || count < participants)) {
        throw new Error("Cannot conclude round before its server deadline or all votes");
      }
    }

    const isFirstToComplete = await this.redisVoteRepository.markRoundCompleted(
      input.roomId,
      room.currentRound,
    );

    if (!isFirstToComplete) {
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

      return {
        roundCompleted: true,
        officialAnswer: article.targetClassification,
        modelAnalysis: null,
        leaderboard: enrichedLeaderboard,
      };
    }

    const [allMembers, votedUserIds] = await Promise.all([
      this.roomRepository.listMembers(input.roomId),
      this.redisVoteRepository.getVotedUserIds(input.roomId, room.currentRound),
    ]);

    const votedSet = new Set(votedUserIds);
    const pendingMembers = allMembers.filter((m) => !votedSet.has(m.userId));

    for (const pendingMember of pendingMembers) {
      const voteEntity = new NewsVoteEntity({
        id: crypto.randomUUID(),
        roomId: input.roomId,
        playlistItemId: currentItem.id,
        userId: pendingMember.userId,
        vote: "uncertain",
        isCorrect: false,
        pointsAwarded: 0,
      });

      await this.newsVoteRepository.create(voteEntity.toDTO());

      await this.redisVoteRepository.recordVoteAtomic(
        input.roomId,
        room.currentRound,
        pendingMember.userId,
      );
    }

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

    return {
      roundCompleted: true,
      officialAnswer: article.targetClassification,
      modelAnalysis: null,
      leaderboard: enrichedLeaderboard,
    };
  }
}

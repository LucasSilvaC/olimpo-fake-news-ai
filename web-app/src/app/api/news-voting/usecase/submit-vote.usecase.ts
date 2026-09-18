import crypto from "node:crypto";

import { NewsVoteDTO, NewsVoteEntity, VoteOption } from "../entities";
import { drizzleNewsVoteRepository as defaultNewsVoteRepository } from "../repositories/drizzle-news-vote.repository";
import { INewsVoteRepository } from "../repositories/news-vote.repository.interface";
import { redisVoteRepository as defaultRedisVoteRepository } from "../repositories/redis-vote.repository";
import { IRedisVoteRepository } from "../repositories/redis-vote.repository.interface";

import {
  AIAnalysisDTO,
  getArticleAnalysisUseCase as defaultGetArticleAnalysisUseCase,
  GetArticleAnalysisUseCase,
} from "@/app/api/ai-feedback";
import { drizzleNewsArticleRepository as defaultNewsArticleRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-article.repository";
import { INewsArticleRepository } from "@/app/api/ai-feedback/repositories/news-article.repository.interface";
import {
  IEventPublisher,
  redisEventPublisher as defaultRedisEventPublisher,
} from "@/app/api/realtime-events";
import {
  drizzleRoomRepository as defaultRoomRepository,
  IRoomRepository,
  redisRoomRepository as defaultRedisRoomRepository,
  IRedisRoomRepository,
  LeaderboardEntry,
} from "@/app/api/rooms/repositories";
import { VoteOptionType } from "@/server/shared/database/schemas/enums";

export interface SubmitVoteInput {
  roomId: string;
  userId: string;
  vote: VoteOptionType;
}

export interface SubmitVoteOutput {
  vote: NewsVoteDTO;
  roundCompleted: boolean;
  analysis?: AIAnalysisDTO;
  leaderboard?: LeaderboardEntry[];
}

export class SubmitVoteUseCase {
  constructor(
    private readonly newsVoteRepository: INewsVoteRepository = defaultNewsVoteRepository,
    private readonly redisVoteRepository: IRedisVoteRepository = defaultRedisVoteRepository,
    private readonly roomRepository: IRoomRepository = defaultRoomRepository,
    private readonly redisRoomRepository: IRedisRoomRepository = defaultRedisRoomRepository,
    private readonly newsArticleRepository: INewsArticleRepository = defaultNewsArticleRepository,
    private readonly getArticleAnalysisUseCase: GetArticleAnalysisUseCase = defaultGetArticleAnalysisUseCase,
    private readonly eventPublisher: IEventPublisher = defaultRedisEventPublisher,
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

    const evaluatedVote = voteEntity.evaluate(article.targetClassification);

    await this.newsVoteRepository.create({
      id: evaluatedVote.id,
      roomId: evaluatedVote.roomId,
      playlistItemId: evaluatedVote.playlistItemId,
      userId: evaluatedVote.userId,
      vote: evaluatedVote.vote,
      isCorrect: evaluatedVote.isCorrect,
      pointsAwarded: evaluatedVote.pointsAwarded,
      createdAt: evaluatedVote.createdAt,
    });

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
      const analysis = await this.getArticleAnalysisUseCase.execute({
        articleId: currentItem.articleId,
      });
      const leaderboard = await this.redisRoomRepository.getLeaderboard(input.roomId);

      await this.eventPublisher.publish(room.pin, {
        type: "ROUND_COMPLETED",
        roomId: room.id,
        pin: room.pin,
        payload: {
          round: room.currentRound,
          leaderboard,
          analysis,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        vote: evaluatedVote.toDTO(),
        roundCompleted: true,
        analysis,
        leaderboard,
      };
    }

    return {
      vote: evaluatedVote.toDTO(),
      roundCompleted: false,
    };
  }
}

export const submitVoteUseCase = new SubmitVoteUseCase();

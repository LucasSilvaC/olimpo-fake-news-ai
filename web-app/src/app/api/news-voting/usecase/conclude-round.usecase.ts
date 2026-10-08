import crypto from "node:crypto";

import { NewsVoteEntity } from "../entities/news-vote.entity";
import { drizzleNewsVoteRepository as defaultNewsVoteRepository } from "../repositories/drizzle-news-vote.repository";
import { INewsVoteRepository } from "../repositories/news-vote.repository.interface";
import { redisVoteRepository as defaultRedisVoteRepository } from "../repositories/redis-vote.repository";
import { IRedisVoteRepository } from "../repositories/redis-vote.repository.interface";

import type { AIAnalysisDTO } from "@/app/api/ai-feedback/entities/ai-analysis.entity";
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
import type { MLTargetType } from "@/server/shared/database/schemas/enums";

export interface ConcludeRoundInput {
  roomId: string;
  round: number;
  userId: string;
}

export interface ConcludeRoundOutput {
  roundCompleted: boolean;
  officialAnswer?: MLTargetType;
  modelAnalysis?: AIAnalysisDTO | null;
  leaderboard?: LeaderboardEntry[];
}

export class ConcludeRoundUseCase {
  constructor(
    private readonly newsVoteRepository: INewsVoteRepository = defaultNewsVoteRepository,
    private readonly redisVoteRepository: IRedisVoteRepository = defaultRedisVoteRepository,
    private readonly roomRepository: IRoomRepository = defaultRoomRepository,
    private readonly redisRoomRepository: IRedisRoomRepository = defaultRedisRoomRepository,
    private readonly newsArticleRepository: INewsArticleRepository = defaultNewsArticleRepository,
    _legacyAnalysisDependency?: unknown,
    private readonly eventPublisher: IEventPublisher = defaultRedisEventPublisher,
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
      const deadline = room.updatedAt.getTime() + room.roundDurationSeconds * 1000;
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

      return {
        roundCompleted: true,
        officialAnswer: article.targetClassification,
        modelAnalysis: null,
        leaderboard,
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

      await this.newsVoteRepository.create({
        id: voteEntity.id,
        roomId: voteEntity.roomId,
        playlistItemId: voteEntity.playlistItemId,
        userId: voteEntity.userId,
        vote: voteEntity.vote,
        isCorrect: voteEntity.isCorrect,
        pointsAwarded: voteEntity.pointsAwarded,
        createdAt: voteEntity.createdAt,
      });

      await this.redisVoteRepository.recordVoteAtomic(
        input.roomId,
        room.currentRound,
        pendingMember.userId,
      );
    }

    const leaderboard = await this.redisRoomRepository.getLeaderboard(input.roomId);

    await this.eventPublisher.publish(room.pin, {
      type: "ROUND_COMPLETED",
      roomId: room.id,
      pin: room.pin,
      payload: {
        round: room.currentRound,
        leaderboard,
        officialAnswer: article.targetClassification,
        modelAnalysis: null,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      roundCompleted: true,
      officialAnswer: article.targetClassification,
      modelAnalysis: null,
      leaderboard,
    };
  }
}

export const concludeRoundUseCase = new ConcludeRoundUseCase();

import { drizzleUserRepository as defaultUserRepository } from "@/app/api/auth/repositories/drizzle-user.repository";
import { IUserRepository } from "@/app/api/auth/repositories/user.repository.interface";
import { drizzleNewsVoteRepository as defaultNewsVoteRepository } from "@/app/api/news-voting/repositories/drizzle-news-vote.repository";
import { INewsVoteRepository } from "@/app/api/news-voting/repositories/news-vote.repository.interface";
import {
  IEventPublisher,
  redisEventPublisher as defaultRedisEventPublisher,
} from "@/app/api/realtime-events";
import { MatchFinishedLeaderboardEntry } from "@/app/api/realtime-events/entities/event.types";
import { drizzleRoomRepository as defaultRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { redisRoomRepository as defaultRedisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository";
import { IRedisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository.interface";
import { IRoomRepository } from "@/app/api/rooms/repositories/room.repository.interface";
import { RoomStatus } from "@/server/shared/database/schemas/enums";

export interface FinishMatchInput {
  roomId: string;
  hostId: string;
}

export interface FinishMatchOutput {
  roomId: string;
  status: RoomStatus;
  consolidatedCount: number;
  leaderboard: MatchFinishedLeaderboardEntry[];
}

export class FinishMatchUseCase {
  constructor(
    private readonly roomRepository: IRoomRepository = defaultRoomRepository,
    private readonly redisRoomRepository: IRedisRoomRepository = defaultRedisRoomRepository,
    private readonly userRepository: IUserRepository = defaultUserRepository,
    private readonly eventPublisher: IEventPublisher = defaultRedisEventPublisher,
    private readonly newsVoteRepository: INewsVoteRepository = defaultNewsVoteRepository,
  ) {}

  async execute(input: FinishMatchInput): Promise<FinishMatchOutput> {
    const room = await this.roomRepository.findById(input.roomId);
    if (!room) {
      throw new Error(`Room with id "${input.roomId}" not found`);
    }

    if (room.hostId !== input.hostId) {
      throw new Error("Unauthorized: Only room host can finish the match");
    }

    if (room.status === "finished") {
      throw new Error("Cannot finish match: room is already finished");
    }

    await this.roomRepository.updateStatus(input.roomId, "finished");
    await this.redisRoomRepository.updateRoomStatus(room.pin, "finished");

    const members = await this.roomRepository.listMembers(input.roomId);
    let consolidatedCount = 0;

    for (const member of members) {
      if (member.score > 0) {
        await this.userRepository.updateXp(member.userId, member.score);
        consolidatedCount++;
      }
    }

    const leaderboard = await this.redisRoomRepository.getLeaderboard(input.roomId);
    const allVotes =
      typeof this.newsVoteRepository?.listByRoomId === "function"
        ? ((await this.newsVoteRepository.listByRoomId(input.roomId)) ?? [])
        : [];
    const correctCountByUser = new Map<string, number>();
    for (const vote of allVotes) {
      if (vote.isCorrect) {
        correctCountByUser.set(vote.userId, (correctCountByUser.get(vote.userId) ?? 0) + 1);
      }
    }

    const enrichedLeaderboard: MatchFinishedLeaderboardEntry[] = leaderboard.map((entry) => {
      const correctCount = correctCountByUser.get(entry.userId) ?? 0;
      const totalAnswered = room.totalRounds;
      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      return {
        userId: entry.userId,
        score: entry.score,
        correctCount,
        totalAnswered,
        accuracy,
      };
    });

    await this.eventPublisher.publish(room.pin, {
      type: "MATCH_FINISHED",
      roomId: room.id,
      pin: room.pin,
      payload: {
        leaderboard: enrichedLeaderboard,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      roomId: input.roomId,
      status: "finished",
      consolidatedCount,
      leaderboard: enrichedLeaderboard,
    };
  }
}

export const finishMatchUseCase = new FinishMatchUseCase();

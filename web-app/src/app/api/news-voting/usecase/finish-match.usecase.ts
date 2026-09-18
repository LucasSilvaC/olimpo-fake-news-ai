import { drizzleUserRepository as defaultUserRepository } from "@/app/api/auth/repositories/drizzle-user.repository";
import { IUserRepository } from "@/app/api/auth/repositories/user.repository.interface";
import { drizzleRoomRepository as defaultRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { redisRoomRepository as defaultRedisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository";
import { IRedisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository.interface";
import { LeaderboardEntry } from "@/app/api/rooms/repositories/redis-room.repository.interface";
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
  leaderboard: LeaderboardEntry[];
}

export class FinishMatchUseCase {
  constructor(
    private readonly roomRepository: IRoomRepository = defaultRoomRepository,
    private readonly redisRoomRepository: IRedisRoomRepository = defaultRedisRoomRepository,
    private readonly userRepository: IUserRepository = defaultUserRepository,
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

    return {
      roomId: input.roomId,
      status: "finished",
      consolidatedCount,
      leaderboard,
    };
  }
}

export const finishMatchUseCase = new FinishMatchUseCase();

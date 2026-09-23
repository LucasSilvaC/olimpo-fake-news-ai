import {
  finishMatchUseCase as defaultFinishMatchUseCase,
  FinishMatchUseCase,
} from "./finish-match.usecase";

import {
  IEventPublisher,
  redisEventPublisher as defaultRedisEventPublisher,
} from "@/app/api/realtime-events";
import { drizzleRoomRepository as defaultRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { LeaderboardEntry } from "@/app/api/rooms/repositories/redis-room.repository.interface";
import { IRoomRepository } from "@/app/api/rooms/repositories/room.repository.interface";
import { RoomStatus } from "@/server/shared/database/schemas/enums";

export interface AdvanceRoundInput {
  roomId: string;
  hostId: string;
}

export interface AdvanceRoundOutput {
  roomId: string;
  status: RoomStatus;
  currentRound: number;
  totalRounds: number;
  isMatchFinished: boolean;
  leaderboard?: LeaderboardEntry[];
}

export class AdvanceRoundUseCase {
  constructor(
    private readonly roomRepository: IRoomRepository = defaultRoomRepository,
    private readonly finishMatchUseCase: FinishMatchUseCase = defaultFinishMatchUseCase,
    private readonly eventPublisher: IEventPublisher = defaultRedisEventPublisher,
  ) {}

  async execute(input: AdvanceRoundInput): Promise<AdvanceRoundOutput> {
    const room = await this.roomRepository.findById(input.roomId);
    if (!room) {
      throw new Error(`Room with id "${input.roomId}" not found`);
    }

    if (room.hostId !== input.hostId) {
      throw new Error("Unauthorized: Only room host can advance the round");
    }

    if (room.status !== "in_progress") {
      throw new Error("Cannot advance round: room is not in progress");
    }

    if (room.currentRound >= room.totalRounds) {
      const finished = await this.finishMatchUseCase.execute({
        roomId: input.roomId,
        hostId: input.hostId,
      });

      return {
        roomId: input.roomId,
        status: "finished",
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        isMatchFinished: true,
        leaderboard: finished.leaderboard,
      };
    }

    const nextRound = room.currentRound + 1;
    await this.roomRepository.updateStatus(
      input.roomId,
      "in_progress",
      nextRound,
      room.totalRounds,
    );

    await this.eventPublisher.publish(room.pin, {
      type: "ROUND_STARTED",
      roomId: room.id,
      pin: room.pin,
      payload: {
        currentRound: nextRound,
        totalRounds: room.totalRounds,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      roomId: input.roomId,
      status: "in_progress",
      currentRound: nextRound,
      totalRounds: room.totalRounds,
      isMatchFinished: false,
    };
  }
}

export const advanceRoundUseCase = new AdvanceRoundUseCase();

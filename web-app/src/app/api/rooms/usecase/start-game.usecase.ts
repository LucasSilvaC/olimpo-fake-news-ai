import { RoomDTO, RoomEntity } from "../entities";
import { IRedisRoomRepository } from "../repositories/redis-room.repository.interface";
import { IRoomRepository } from "../repositories/room.repository.interface";

import {
  IEventPublisher,
} from "@/app/api/realtime-events";

export interface StartGameInput {
  roomId: string;
  hostId: string;
}

export interface StartGameResult {
  room: RoomDTO;
}

export class StartGameUseCase {
  constructor(
    private readonly roomRepository: IRoomRepository,
    private readonly redisRoomRepo: IRedisRoomRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: StartGameInput): Promise<StartGameResult> {
    const room = await this.roomRepository.findById(input.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.hostId !== input.hostId) {
      throw new Error("Only room host can start the game");
    }

    const roomEntity = new RoomEntity(room);
    if (roomEntity.status !== "waiting") {
      throw new Error(`Cannot start game: room status is ${roomEntity.status}`);
    }

    const membersCount = await this.roomRepository.countMembers(input.roomId);
    if (membersCount < 1) {
      throw new Error("Cannot start game: room must have at least one member");
    }

    const playlistItems = await this.roomRepository.getPlaylistItems(input.roomId);
    if (playlistItems.length < 1) {
      throw new Error("Cannot start game: room must have at least one playlist item");
    }

    const startedEntity = roomEntity.start(playlistItems.length);

    await this.roomRepository.updateStatus(
      room.id,
      startedEntity.status,
      startedEntity.currentRound,
      startedEntity.totalRounds,
    );

    await this.redisRoomRepo.updateRoomStatus(room.pin, "in_progress");

    await this.eventPublisher.publish(room.pin, {
      type: "ROUND_STARTED",
      roomId: room.id,
      pin: room.pin,
      payload: {
        currentRound: startedEntity.currentRound,
        totalRounds: startedEntity.totalRounds,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      room: startedEntity.toDTO(),
    };
  }
}

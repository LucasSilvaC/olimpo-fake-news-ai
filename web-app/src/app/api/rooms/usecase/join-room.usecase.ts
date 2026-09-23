import { RoomDTO, RoomEntity, RoomMemberDTO, RoomMemberEntity, RoomPin } from "../entities";
import { drizzleRoomRepository } from "../repositories/drizzle-room.repository";
import { redisRoomRepository } from "../repositories/redis-room.repository";
import { IRedisRoomRepository } from "../repositories/redis-room.repository.interface";
import { IRoomRepository } from "../repositories/room.repository.interface";

import {
  IEventPublisher,
  redisEventPublisher as defaultRedisEventPublisher,
} from "@/app/api/realtime-events";

export interface JoinRoomInput {
  userId: string;
  pin: string;
}

export interface JoinRoomResult {
  room: RoomDTO;
  member: RoomMemberDTO;
  alreadyJoined: boolean;
}

export class JoinRoomUseCase {
  constructor(
    private readonly roomRepository: IRoomRepository = drizzleRoomRepository,
    private readonly redisRoomRepo: IRedisRoomRepository = redisRoomRepository,
    private readonly eventPublisher: IEventPublisher = defaultRedisEventPublisher,
  ) {}

  async execute(input: JoinRoomInput): Promise<JoinRoomResult> {
    const normalizedPin = RoomPin.normalize(input.pin);

    // Try Redis lookup first for fast resolution, fallback to DB
    const cached = await this.redisRoomRepo.getRoomByPin(normalizedPin);
    const room = cached
      ? await this.roomRepository.findById(cached.roomId)
      : await this.roomRepository.findByPin(normalizedPin);

    if (!room) {
      throw new Error("Room not found");
    }

    const roomEntity = new RoomEntity(room);

    if (!roomEntity.canJoin()) {
      throw new Error(`Cannot join room with status: ${roomEntity.status}`);
    }

    // Check if user is already a member
    const existingMember = await this.roomRepository.findMember(roomEntity.id, input.userId);
    if (existingMember) {
      const memberEntity = new RoomMemberEntity(existingMember);
      return {
        room: roomEntity.toDTO(),
        member: memberEntity.toDTO(),
        alreadyJoined: true,
      };
    }

    // Add new participant
    const newMemberRecord = await this.roomRepository.addMember({
      id: crypto.randomUUID(),
      roomId: roomEntity.id,
      userId: input.userId,
      role: "participant",
      score: 0,
    });

    const memberEntity = new RoomMemberEntity(newMemberRecord);

    // Update Redis
    await this.redisRoomRepo.incrementParticipantCount(roomEntity.id);
    await this.redisRoomRepo.addMemberToLeaderboard(roomEntity.id, input.userId, 0);

    // Publish MEMBER_JOINED real-time event
    await this.eventPublisher.publish(roomEntity.pin, {
      type: "MEMBER_JOINED",
      roomId: roomEntity.id,
      pin: roomEntity.pin,
      payload: {
        member: memberEntity.toDTO(),
      },
      timestamp: new Date().toISOString(),
    });

    return {
      room: roomEntity.toDTO(),
      member: memberEntity.toDTO(),
      alreadyJoined: false,
    };
  }
}

export const joinRoomUseCase = new JoinRoomUseCase();

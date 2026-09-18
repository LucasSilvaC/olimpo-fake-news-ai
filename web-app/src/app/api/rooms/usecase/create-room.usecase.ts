import { RoomEntity, RoomDTO, RoomPin } from "../entities";
import { drizzleRoomRepository } from "../repositories/drizzle-room.repository";
import { redisRoomRepository } from "../repositories/redis-room.repository";
import { IRedisRoomRepository } from "../repositories/redis-room.repository.interface";
import { IRoomRepository } from "../repositories/room.repository.interface";

export interface CreateRoomInput {
  hostId: string;
  name: string;
  roundDurationSeconds?: number;
}

export interface CreateRoomResult {
  room: RoomDTO;
  pin: string;
}

export class CreateRoomUseCase {
  constructor(
    private readonly roomRepository: IRoomRepository = drizzleRoomRepository,
    private readonly redisRoomRepo: IRedisRoomRepository = redisRoomRepository,
  ) {}

  async execute(input: CreateRoomInput): Promise<CreateRoomResult> {
    const roomId = crypto.randomUUID();
    let pin = RoomPin.generate();

    // Check collision and regenerate if needed
    for (let attempt = 0; attempt < 5; attempt++) {
      const existingInRedis = await this.redisRoomRepo.getRoomByPin(pin);
      const existingInDb = existingInRedis ? null : await this.roomRepository.findByPin(pin);
      if (!existingInRedis && !existingInDb) break;
      pin = RoomPin.generate();
    }

    const roomEntity = new RoomEntity({
      id: roomId,
      pin,
      name: input.name,
      hostId: input.hostId,
      status: "waiting",
      roundDurationSeconds: input.roundDurationSeconds ?? 30,
      currentRound: 0,
      totalRounds: 0,
    });

    await this.roomRepository.create({
      id: roomEntity.id,
      pin: roomEntity.pin,
      name: roomEntity.name,
      hostId: roomEntity.hostId,
      status: roomEntity.status,
      roundDurationSeconds: roomEntity.roundDurationSeconds,
      currentRound: roomEntity.currentRound,
      totalRounds: roomEntity.totalRounds,
    });

    // Add host as the first room member
    await this.roomRepository.addMember({
      id: crypto.randomUUID(),
      roomId: roomEntity.id,
      userId: input.hostId,
      role: "host",
      score: 0,
    });

    // Cache in Redis
    await this.redisRoomRepo.setRoomPin(roomEntity.pin, roomEntity.id, "waiting");
    await this.redisRoomRepo.setParticipantCount(roomEntity.id, 1);
    await this.redisRoomRepo.addMemberToLeaderboard(roomEntity.id, input.hostId, 0);

    return {
      room: roomEntity.toDTO(),
      pin: roomEntity.pin,
    };
  }
}

export const createRoomUseCase = new CreateRoomUseCase();

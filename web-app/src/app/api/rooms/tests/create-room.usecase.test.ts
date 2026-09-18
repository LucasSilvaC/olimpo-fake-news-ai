import { beforeEach, describe, expect, it, vi } from "vitest";

import { IRedisRoomRepository } from "../repositories/redis-room.repository.interface";
import { IRoomRepository } from "../repositories/room.repository.interface";
import { CreateRoomUseCase } from "../usecase/create-room.usecase";

import { Room, RoomMember } from "@/server/shared/database/schemas";

describe("CreateRoomUseCase", () => {
  let mockRoomRepo: IRoomRepository;
  let mockRedisRoomRepo: IRedisRoomRepository;
  let useCase: CreateRoomUseCase;

  const roomsStore: Room[] = [];
  const membersStore: RoomMember[] = [];

  beforeEach(() => {
    roomsStore.length = 0;
    membersStore.length = 0;

    mockRoomRepo = {
      findById: vi.fn(async (id: string) => roomsStore.find((r) => r.id === id) ?? null),
      findByPin: vi.fn(async (pin: string) => roomsStore.find((r) => r.pin === pin) ?? null),
      create: vi.fn(async (data) => {
        const room: Room = {
          id: data.id,
          pin: data.pin,
          name: data.name,
          hostId: data.hostId,
          status: data.status ?? "waiting",
          roundDurationSeconds: data.roundDurationSeconds ?? 30,
          currentRound: data.currentRound ?? 0,
          totalRounds: data.totalRounds ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        roomsStore.push(room);
        return room;
      }),
      updateStatus: vi.fn(),
      updateRoom: vi.fn(),
      addMember: vi.fn(async (data) => {
        const member: RoomMember = {
          id: data.id,
          roomId: data.roomId,
          userId: data.userId,
          role: data.role ?? "participant",
          score: data.score ?? 0,
          joinedAt: new Date(),
        };
        membersStore.push(member);
        return member;
      }),
      findMember: vi.fn(async (roomId, userId) => {
        return membersStore.find((m) => m.roomId === roomId && m.userId === userId) ?? null;
      }),
      listMembers: vi.fn(async (roomId) => membersStore.filter((m) => m.roomId === roomId)),
      countMembers: vi.fn(async (roomId) => membersStore.filter((m) => m.roomId === roomId).length),
      updateMemberScore: vi.fn(),
      addPlaylistItems: vi.fn(),
      getPlaylistItems: vi.fn(),
    };

    mockRedisRoomRepo = {
      setRoomPin: vi.fn(async () => {}),
      getRoomByPin: vi.fn(async () => null),
      removeRoomPin: vi.fn(async () => {}),
      updateRoomStatus: vi.fn(async () => {}),
      setParticipantCount: vi.fn(async () => {}),
      getParticipantCount: vi.fn(async () => 1),
      incrementParticipantCount: vi.fn(async () => 2),
      addMemberToLeaderboard: vi.fn(async () => {}),
      getLeaderboard: vi.fn(async () => []),
    };

    useCase = new CreateRoomUseCase(mockRoomRepo, mockRedisRoomRepo);
  });

  it("should create room with unique PIN, register host as member and cache in Redis", async () => {
    const result = await useCase.execute({
      hostId: "user-host-1",
      name: "Sala Olímpica",
      roundDurationSeconds: 45,
    });

    expect(result.room).toBeDefined();
    expect(result.room.name).toBe("Sala Olímpica");
    expect(result.room.hostId).toBe("user-host-1");
    expect(result.room.status).toBe("waiting");
    expect(result.room.roundDurationSeconds).toBe(45);
    expect(result.pin).toMatch(/^\d{3} \d{3}$/);

    expect(mockRoomRepo.create).toHaveBeenCalledOnce();
    expect(mockRoomRepo.addMember).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: result.room.id,
        userId: "user-host-1",
        role: "host",
      }),
    );
    expect(mockRedisRoomRepo.setRoomPin).toHaveBeenCalledWith(
      result.pin,
      result.room.id,
      "waiting",
    );
    expect(mockRedisRoomRepo.setParticipantCount).toHaveBeenCalledWith(result.room.id, 1);
    expect(mockRedisRoomRepo.addMemberToLeaderboard).toHaveBeenCalledWith(
      result.room.id,
      "user-host-1",
      0,
    );
  });

  it("should reject creation if room name is empty", async () => {
    await expect(
      useCase.execute({
        hostId: "user-host-1",
        name: "",
      }),
    ).rejects.toThrow("Room name cannot be empty");
  });

  it("should reject creation if round duration is less than 10 seconds", async () => {
    await expect(
      useCase.execute({
        hostId: "user-host-1",
        name: "Sala Inválida",
        roundDurationSeconds: 5,
      }),
    ).rejects.toThrow("Round duration must be at least 10 seconds");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { IRedisRoomRepository } from "../repositories/redis-room.repository.interface";
import { IRoomRepository } from "../repositories/room.repository.interface";
import { StartGameUseCase } from "../usecase/start-game.usecase";

import { Room, RoomPlaylistItem } from "@/server/shared/database/schemas";

describe("StartGameUseCase", () => {
  let mockRoomRepo: IRoomRepository;
  let mockRedisRoomRepo: IRedisRoomRepository;
  let useCase: StartGameUseCase;

  const sampleWaitingRoom: Room = {
    id: "room-1",
    pin: "123 456",
    name: "Sala de Partida",
    status: "waiting",
    roundDurationSeconds: 30,
    currentRound: 0,
    totalRounds: 2,
    hostId: "user-host-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const samplePlaylistItems: RoomPlaylistItem[] = [
    {
      id: "item-1",
      roomId: "room-1",
      articleId: "art-1",
      roundOrder: 1,
      createdAt: new Date(),
    },
    {
      id: "item-2",
      roomId: "room-1",
      articleId: "art-2",
      roundOrder: 2,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockRoomRepo = {
      findById: vi.fn(async (id: string) => (id === "room-1" ? sampleWaitingRoom : null)),
      findByPin: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(async (id, status, currentRound, totalRounds) => ({
        ...sampleWaitingRoom,
        status,
        currentRound: currentRound ?? 1,
        totalRounds: totalRounds ?? 2,
      })),
      updateRoom: vi.fn(),
      addMember: vi.fn(),
      findMember: vi.fn(),
      listMembers: vi.fn(),
      countMembers: vi.fn(async () => 2),
      addPlaylistItems: vi.fn(),
      getPlaylistItems: vi.fn(async () => samplePlaylistItems),
    };

    mockRedisRoomRepo = {
      setRoomPin: vi.fn(),
      getRoomByPin: vi.fn(),
      removeRoomPin: vi.fn(),
      updateRoomStatus: vi.fn(async () => {}),
      setParticipantCount: vi.fn(),
      getParticipantCount: vi.fn(),
      incrementParticipantCount: vi.fn(),
      addMemberToLeaderboard: vi.fn(),
      getLeaderboard: vi.fn(),
    };

    useCase = new StartGameUseCase(mockRoomRepo, mockRedisRoomRepo);
  });

  it("should start game when called by host with members and playlist items", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      hostId: "user-host-1",
    });

    expect(result.room).toBeDefined();
    expect(result.room.status).toBe("in_progress");
    expect(result.room.currentRound).toBe(1);
    expect(result.room.totalRounds).toBe(2);

    expect(mockRoomRepo.updateStatus).toHaveBeenCalledWith("room-1", "in_progress", 1, 2);
    expect(mockRedisRoomRepo.updateRoomStatus).toHaveBeenCalledWith("123 456", "in_progress");
  });

  it("should reject start game by non-host", async () => {
    await expect(
      useCase.execute({
        roomId: "room-1",
        hostId: "user-not-host",
      }),
    ).rejects.toThrow("Only room host can start the game");
  });

  it("should reject start game if room has no playlist items", async () => {
    vi.mocked(mockRoomRepo.getPlaylistItems).mockResolvedValueOnce([]);

    await expect(
      useCase.execute({
        roomId: "room-1",
        hostId: "user-host-1",
      }),
    ).rejects.toThrow("Cannot start game: room must have at least one playlist item");
  });

  it("should reject start game if room has no members", async () => {
    vi.mocked(mockRoomRepo.countMembers).mockResolvedValueOnce(0);

    await expect(
      useCase.execute({
        roomId: "room-1",
        hostId: "user-host-1",
      }),
    ).rejects.toThrow("Cannot start game: room must have at least one member");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { FinishMatchUseCase } from "../usecase/finish-match.usecase";

import { IUserRepository } from "@/app/api/auth/repositories/user.repository.interface";
import { IRoomRepository, IRedisRoomRepository } from "@/app/api/rooms/repositories";
import { Room, RoomMember } from "@/server/shared/database/schemas";

describe("FinishMatchUseCase", () => {
  let roomRepository: IRoomRepository;
  let redisRoomRepository: IRedisRoomRepository;
  let userRepository: IUserRepository;
  let useCase: FinishMatchUseCase;

  const sampleRoom: Room = {
    id: "room-1",
    pin: "123 456",
    name: "Sala Final",
    status: "in_progress",
    roundDurationSeconds: 30,
    currentRound: 3,
    totalRounds: 3,
    hostId: "host-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleMembers: RoomMember[] = [
    {
      id: "mem-1",
      roomId: "room-1",
      userId: "user-1",
      role: "participant",
      score: 200,
      joinedAt: new Date(),
    },
    {
      id: "mem-2",
      roomId: "room-1",
      userId: "user-2",
      role: "participant",
      score: 125,
      joinedAt: new Date(),
    },
    {
      id: "mem-3",
      roomId: "room-1",
      userId: "user-3",
      role: "participant",
      score: 0,
      joinedAt: new Date(),
    },
  ];

  beforeEach(() => {
    roomRepository = {
      findById: vi.fn().mockResolvedValue(sampleRoom),
      findByPin: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(async (id, status) => ({
        ...sampleRoom,
        status,
      })),
      updateRoom: vi.fn(),
      addMember: vi.fn(),
      findMember: vi.fn(),
      listMembers: vi.fn().mockResolvedValue(sampleMembers),
      countMembers: vi.fn().mockResolvedValue(3),
      updateMemberScore: vi.fn(),
      addPlaylistItems: vi.fn(),
      getPlaylistItems: vi.fn(),
    };

    redisRoomRepository = {
      setRoomPin: vi.fn(),
      getRoomByPin: vi.fn(),
      removeRoomPin: vi.fn(),
      updateRoomStatus: vi.fn(),
      setParticipantCount: vi.fn(),
      getParticipantCount: vi.fn(),
      incrementParticipantCount: vi.fn(),
      addMemberToLeaderboard: vi.fn(),
      getLeaderboard: vi.fn().mockResolvedValue([
        { userId: "user-1", score: 200 },
        { userId: "user-2", score: 125 },
        { userId: "user-3", score: 0 },
      ]),
    };

    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateXp: vi.fn().mockResolvedValue({} as never),
    };

    useCase = new FinishMatchUseCase(roomRepository, redisRoomRepository, userRepository);
  });

  it("should mark room as finished in DB and Redis and consolidate XP for participants with score > 0", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      hostId: "host-1",
    });

    expect(result.status).toBe("finished");
    expect(result.consolidatedCount).toBe(2);
    expect(result.leaderboard).toHaveLength(3);

    expect(roomRepository.updateStatus).toHaveBeenCalledWith("room-1", "finished");
    expect(redisRoomRepository.updateRoomStatus).toHaveBeenCalledWith("123 456", "finished");

    expect(userRepository.updateXp).toHaveBeenCalledWith("user-1", 200);
    expect(userRepository.updateXp).toHaveBeenCalledWith("user-2", 125);
    expect(userRepository.updateXp).not.toHaveBeenCalledWith("user-3", expect.anything());
  });

  it("should reject if room is not found", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        roomId: "room-not-found",
        hostId: "host-1",
      }),
    ).rejects.toThrow('Room with id "room-not-found" not found');
  });

  it("should reject if caller is not the room host", async () => {
    await expect(
      useCase.execute({
        roomId: "room-1",
        hostId: "random-user",
      }),
    ).rejects.toThrow("Unauthorized: Only room host can finish the match");
  });

  it("should reject if room is already finished", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce({
      ...sampleRoom,
      status: "finished",
    });

    await expect(
      useCase.execute({
        roomId: "room-1",
        hostId: "host-1",
      }),
    ).rejects.toThrow("Cannot finish match: room is already finished");
  });
});

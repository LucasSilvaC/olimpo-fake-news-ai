import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdvanceRoundUseCase } from "../usecase/advance-round.usecase";
import { FinishMatchUseCase } from "../usecase/finish-match.usecase";

import { IUserRepository } from "@/app/api/auth/repositories/user.repository.interface";
import { IRoomRepository, IRedisRoomRepository } from "@/app/api/rooms/repositories";
import { Room, RoomMember } from "@/server/shared/database/schemas";

describe("AdvanceRoundUseCase", () => {
  let roomRepository: IRoomRepository;
  let redisRoomRepository: IRedisRoomRepository;
  let userRepository: IUserRepository;
  let finishMatchUseCase: FinishMatchUseCase;
  let useCase: AdvanceRoundUseCase;

  const sampleRoom: Room = {
    id: "room-1",
    pin: "123 456",
    name: "Sala de Rodadas",
    status: "in_progress",
    roundDurationSeconds: 30,
    currentRound: 1,
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
      score: 100,
      joinedAt: new Date(),
    },
    {
      id: "mem-2",
      roomId: "room-1",
      userId: "user-2",
      role: "participant",
      score: 50,
      joinedAt: new Date(),
    },
  ];

  beforeEach(() => {
    roomRepository = {
      findById: vi.fn().mockResolvedValue(sampleRoom),
      findByPin: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(async (id, status, currentRound, totalRounds) => ({
        ...sampleRoom,
        status,
        currentRound: currentRound ?? sampleRoom.currentRound,
        totalRounds: totalRounds ?? sampleRoom.totalRounds,
      })),
      updateRoom: vi.fn(),
      addMember: vi.fn(),
      findMember: vi.fn(),
      listMembers: vi.fn().mockResolvedValue(sampleMembers),
      countMembers: vi.fn().mockResolvedValue(2),
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
        { userId: "user-1", score: 100 },
        { userId: "user-2", score: 50 },
      ]),
    };

    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateXp: vi.fn().mockResolvedValue({} as never),
    };

    finishMatchUseCase = new FinishMatchUseCase(
      roomRepository,
      redisRoomRepository,
      userRepository,
    );

    useCase = new AdvanceRoundUseCase(roomRepository, finishMatchUseCase);
  });

  it("should advance to next round when currentRound < totalRounds", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      hostId: "host-1",
    });

    expect(result.isMatchFinished).toBe(false);
    expect(result.currentRound).toBe(2);
    expect(result.totalRounds).toBe(3);
    expect(result.status).toBe("in_progress");

    expect(roomRepository.updateStatus).toHaveBeenCalledWith("room-1", "in_progress", 2, 3);
  });

  it("should conclude match when advancing past the final round (currentRound === totalRounds)", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce({
      ...sampleRoom,
      currentRound: 3,
      totalRounds: 3,
    });

    const result = await useCase.execute({
      roomId: "room-1",
      hostId: "host-1",
    });

    expect(result.isMatchFinished).toBe(true);
    expect(result.status).toBe("finished");
    expect(result.leaderboard).toBeDefined();
    expect(userRepository.updateXp).toHaveBeenCalledWith("user-1", 100);
    expect(userRepository.updateXp).toHaveBeenCalledWith("user-2", 50);
  });

  it("should reject advancing if room is not found", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        roomId: "room-999",
        hostId: "host-1",
      }),
    ).rejects.toThrow('Room with id "room-999" not found');
  });

  it("should reject advancing if caller is not the room host", async () => {
    await expect(
      useCase.execute({
        roomId: "room-1",
        hostId: "impostor-user",
      }),
    ).rejects.toThrow("Unauthorized: Only room host can advance the round");
  });

  it("should reject advancing if room is not in progress", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValueOnce({
      ...sampleRoom,
      status: "waiting",
    });

    await expect(
      useCase.execute({
        roomId: "room-1",
        hostId: "host-1",
      }),
    ).rejects.toThrow("Cannot advance round: room is not in progress");
  });
});

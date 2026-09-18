import { beforeEach, describe, expect, it, vi } from "vitest";

import { IRedisRoomRepository } from "../repositories/redis-room.repository.interface";
import { IRoomRepository } from "../repositories/room.repository.interface";
import { JoinRoomUseCase } from "../usecase/join-room.usecase";

import { IEventPublisher } from "@/app/api/realtime-events";
import { Room, RoomMember } from "@/server/shared/database/schemas";

describe("JoinRoomUseCase", () => {
  let mockRoomRepo: IRoomRepository;
  let mockRedisRoomRepo: IRedisRoomRepository;
  let mockEventPublisher: IEventPublisher;
  let useCase: JoinRoomUseCase;

  const sampleWaitingRoom: Room = {
    id: "room-1",
    pin: "123 456",
    name: "Sala de Espera",
    status: "waiting",
    roundDurationSeconds: 30,
    currentRound: 0,
    totalRounds: 0,
    hostId: "user-host-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleActiveRoom: Room = {
    ...sampleWaitingRoom,
    id: "room-2",
    pin: "234 567",
    status: "in_progress",
  };

  const membersStore: RoomMember[] = [];

  beforeEach(() => {
    membersStore.length = 0;

    mockRoomRepo = {
      findById: vi.fn(async (id: string) => {
        if (id === "room-1") return sampleWaitingRoom;
        if (id === "room-2") return sampleActiveRoom;
        return null;
      }),
      findByPin: vi.fn(async (pin: string) => {
        if (pin === "123 456") return sampleWaitingRoom;
        if (pin === "234 567") return sampleActiveRoom;
        return null;
      }),
      create: vi.fn(),
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
      listMembers: vi.fn(),
      countMembers: vi.fn(),
      updateMemberScore: vi.fn(),
      addPlaylistItems: vi.fn(),
      getPlaylistItems: vi.fn(),
    };

    mockRedisRoomRepo = {
      setRoomPin: vi.fn(),
      getRoomByPin: vi.fn(async (pin: string) => {
        if (pin === "123 456") return { roomId: "room-1", status: "waiting" };
        if (pin === "234 567") return { roomId: "room-2", status: "in_progress" };
        return null;
      }),
      removeRoomPin: vi.fn(),
      updateRoomStatus: vi.fn(),
      setParticipantCount: vi.fn(),
      getParticipantCount: vi.fn(),
      incrementParticipantCount: vi.fn(async () => 2),
      addMemberToLeaderboard: vi.fn(),
      getLeaderboard: vi.fn(),
    };

    mockEventPublisher = {
      publish: vi.fn(async () => 1),
    };

    useCase = new JoinRoomUseCase(mockRoomRepo, mockRedisRoomRepo, mockEventPublisher);
  });

  it("should join room with valid PIN when status is 'waiting'", async () => {
    const result = await useCase.execute({
      userId: "user-part-1",
      pin: "123 456",
    });

    expect(result.room).toBeDefined();
    expect(result.room.id).toBe("room-1");
    expect(result.member).toBeDefined();
    expect(result.member.userId).toBe("user-part-1");
    expect(result.member.role).toBe("participant");
    expect(result.alreadyJoined).toBe(false);

    expect(mockRoomRepo.addMember).toHaveBeenCalledOnce();
    expect(mockRedisRoomRepo.incrementParticipantCount).toHaveBeenCalledWith("room-1");
    expect(mockRedisRoomRepo.addMemberToLeaderboard).toHaveBeenCalledWith(
      "room-1",
      "user-part-1",
      0,
    );
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      "123 456",
      expect.objectContaining({
        type: "MEMBER_JOINED",
        roomId: "room-1",
        pin: "123 456",
        payload: {
          member: expect.objectContaining({
            userId: "user-part-1",
            role: "participant",
          }),
        },
      }),
    );
  });

  it("should return existing membership without duplicate insertion if already in room", async () => {
    membersStore.push({
      id: "mem-exist",
      roomId: "room-1",
      userId: "user-part-1",
      role: "participant",
      score: 10,
      joinedAt: new Date(),
    });

    const result = await useCase.execute({
      userId: "user-part-1",
      pin: "123 456",
    });

    expect(result.alreadyJoined).toBe(true);
    expect(result.member.id).toBe("mem-exist");
    expect(mockRoomRepo.addMember).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });

  it("should reject joining an active room (in_progress)", async () => {
    await expect(
      useCase.execute({
        userId: "user-part-1",
        pin: "234 567",
      }),
    ).rejects.toThrow("Cannot join room with status: in_progress");
  });

  it("should throw error if PIN does not match any room", async () => {
    await expect(
      useCase.execute({
        userId: "user-part-1",
        pin: "999 999",
      }),
    ).rejects.toThrow("Room not found");
  });
});

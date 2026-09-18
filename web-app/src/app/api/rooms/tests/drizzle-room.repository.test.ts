import { beforeEach, describe, expect, it, vi } from "vitest";

import { DrizzleRoomRepository } from "../repositories/drizzle-room.repository";

import { databaseClient } from "@/server/shared/database/client";
import { Room, RoomMember, RoomPlaylistItem } from "@/server/shared/database/schemas";

interface MockDatabase {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

describe("DrizzleRoomRepository", () => {
  let mockDb: MockDatabase;
  let repository: DrizzleRoomRepository;

  const sampleRoom: Room = {
    id: "room-1",
    pin: "123 456",
    name: "Sala Drizzle",
    status: "waiting",
    roundDurationSeconds: 30,
    currentRound: 0,
    totalRounds: 0,
    hostId: "user-host-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleMember: RoomMember = {
    id: "mem-1",
    roomId: "room-1",
    userId: "user-1",
    role: "participant",
    score: 0,
    joinedAt: new Date(),
  };

  const samplePlaylistItem: RoomPlaylistItem = {
    id: "item-1",
    roomId: "room-1",
    articleId: "art-1",
    roundOrder: 1,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    };
    repository = new DrizzleRoomRepository(mockDb as unknown as typeof databaseClient);
  });

  describe("findById and findByPin", () => {
    it("should find room by id", async () => {
      const limitMock = vi.fn().mockResolvedValue([sampleRoom]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findById("room-1");
      expect(result).toEqual(sampleRoom);
    });

    it("should return null when room by id is not found", async () => {
      const limitMock = vi.fn().mockResolvedValue([]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findById("unknown");
      expect(result).toBeNull();
    });

    it("should find room by pin", async () => {
      const limitMock = vi.fn().mockResolvedValue([sampleRoom]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findByPin("123 456");
      expect(result).toEqual(sampleRoom);
    });
  });

  describe("create", () => {
    it("should insert and return new room", async () => {
      const returningMock = vi.fn().mockResolvedValue([sampleRoom]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const created = await repository.create({
        id: "room-1",
        pin: "123 456",
        name: "Sala Drizzle",
        hostId: "user-host-1",
      });

      expect(created).toEqual(sampleRoom);
    });

    it("should throw if create fails", async () => {
      const returningMock = vi.fn().mockResolvedValue([]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      await expect(
        repository.create({
          id: "room-1",
          pin: "123 456",
          name: "Sala Drizzle",
          hostId: "user-host-1",
        }),
      ).rejects.toThrow("Failed to create room record");
    });
  });

  describe("updateStatus and updateRoom", () => {
    it("should update room status, currentRound and totalRounds", async () => {
      const updatedRoom: Room = {
        ...sampleRoom,
        status: "in_progress",
        currentRound: 1,
        totalRounds: 5,
      };

      const returningMock = vi.fn().mockResolvedValue([updatedRoom]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await repository.updateStatus("room-1", "in_progress", 1, 5);
      expect(result.status).toBe("in_progress");
      expect(result.currentRound).toBe(1);
      expect(result.totalRounds).toBe(5);
    });
  });

  describe("membership operations", () => {
    it("should add member to room", async () => {
      const returningMock = vi.fn().mockResolvedValue([sampleMember]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const added = await repository.addMember({
        id: "mem-1",
        roomId: "room-1",
        userId: "user-1",
        role: "participant",
      });

      expect(added).toEqual(sampleMember);
    });

    it("should find member in room", async () => {
      const whereMock = vi.fn().mockResolvedValue([sampleMember]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const member = await repository.findMember("room-1", "user-1");
      expect(member).toEqual(sampleMember);
    });

    it("should count members in room", async () => {
      const whereMock = vi.fn().mockResolvedValue([{ value: 3 }]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const count = await repository.countMembers("room-1");
      expect(count).toBe(3);
    });

    it("should update member score and return updated member", async () => {
      const updatedMember = { ...sampleMember, score: 100 };
      const returningMock = vi.fn().mockResolvedValue([updatedMember]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await repository.updateMemberScore("room-1", "user-1", 100);
      expect(result).toEqual(updatedMember);
    });

    it("should throw error when updating score of nonexistent member", async () => {
      const returningMock = vi.fn().mockResolvedValue([]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      await expect(repository.updateMemberScore("room-1", "non-existent", 50)).rejects.toThrow(
        'Member with userId "non-existent" in room "room-1" not found',
      );
    });
  });

  describe("playlist operations", () => {
    it("should add playlist items and retrieve them ordered", async () => {
      const returningMock = vi.fn().mockResolvedValue([samplePlaylistItem]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const added = await repository.addPlaylistItems([
        {
          id: "item-1",
          roomId: "room-1",
          articleId: "art-1",
          roundOrder: 1,
        },
      ]);
      expect(added).toEqual([samplePlaylistItem]);

      const orderByMock = vi.fn().mockResolvedValue([samplePlaylistItem]);
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const items = await repository.getPlaylistItems("room-1");
      expect(items).toEqual([samplePlaylistItem]);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { DrizzleNewsVoteRepository } from "../repositories/drizzle-news-vote.repository";

import { databaseClient } from "@/server/shared/database/client";
import { NewsVote } from "@/server/shared/database/schemas";

interface MockDatabase {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

describe("DrizzleNewsVoteRepository", () => {
  let mockDb: MockDatabase;
  let repository: DrizzleNewsVoteRepository;

  const sampleVote: NewsVote = {
    id: "vote-1",
    roomId: "room-1",
    playlistItemId: "item-1",
    userId: "user-1",
    vote: "reliable",
    isCorrect: null,
    pointsAwarded: 0,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    };
    repository = new DrizzleNewsVoteRepository(mockDb as unknown as typeof databaseClient);
  });

  describe("create", () => {
    it("should insert a new vote and return created record", async () => {
      const returningMock = vi.fn().mockResolvedValue([sampleVote]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const result = await repository.create({
        id: "vote-1",
        roomId: "room-1",
        playlistItemId: "item-1",
        userId: "user-1",
        vote: "reliable",
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "vote-1",
          roomId: "room-1",
          playlistItemId: "item-1",
          userId: "user-1",
          vote: "reliable",
        }),
      );
      expect(result).toEqual(sampleVote);
    });

    it("should throw error if insert fails", async () => {
      const returningMock = vi.fn().mockResolvedValue([]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      await expect(
        repository.create({
          id: "vote-fail",
          roomId: "room-1",
          playlistItemId: "item-1",
          userId: "user-1",
          vote: "reliable",
        }),
      ).rejects.toThrow("Failed to create news vote record");
    });
  });

  describe("findById", () => {
    it("should find vote by id", async () => {
      const limitMock = vi.fn().mockResolvedValue([sampleVote]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findById("vote-1");
      expect(result).toEqual(sampleVote);
    });

    it("should return null if vote is not found", async () => {
      const limitMock = vi.fn().mockResolvedValue([]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findById("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("findByParticipantAndPlaylistItem", () => {
    it("should find vote by playlistItemId and userId", async () => {
      const limitMock = vi.fn().mockResolvedValue([sampleVote]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findByParticipantAndPlaylistItem("item-1", "user-1");
      expect(result).toEqual(sampleVote);
    });

    it("should return null if not found", async () => {
      const limitMock = vi.fn().mockResolvedValue([]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findByParticipantAndPlaylistItem("item-1", "user-2");
      expect(result).toBeNull();
    });
  });

  describe("listByPlaylistItem", () => {
    it("should list all votes for a playlist item", async () => {
      const whereMock = vi.fn().mockResolvedValue([sampleVote]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.listByPlaylistItem("item-1");
      expect(result).toEqual([sampleVote]);
    });
  });

  describe("countByPlaylistItem", () => {
    it("should return count of votes for a playlist item", async () => {
      const whereMock = vi.fn().mockResolvedValue([{ value: 3 }]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.countByPlaylistItem("item-1");
      expect(result).toBe(3);
    });
  });

  describe("updateEvaluation", () => {
    it("should update isCorrect and pointsAwarded", async () => {
      const evaluatedVote = { ...sampleVote, isCorrect: true, pointsAwarded: 100 };
      const returningMock = vi.fn().mockResolvedValue([evaluatedVote]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      const result = await repository.updateEvaluation("vote-1", true, 100);
      expect(result).toEqual(evaluatedVote);
    });

    it("should throw error if vote to update is not found", async () => {
      const returningMock = vi.fn().mockResolvedValue([]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.update.mockReturnValue({ set: setMock });

      await expect(repository.updateEvaluation("vote-non-existent", true, 100)).rejects.toThrow(
        'News vote with id "vote-non-existent" not found',
      );
    });
  });
});

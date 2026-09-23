import { beforeEach, describe, expect, it, vi } from "vitest";

import { DrizzleGlobalChallengeAnswerRepository } from "../repositories/drizzle-global-challenge-answer.repository";
import { DrizzleGlobalChallengeRepository } from "../repositories/drizzle-global-challenge.repository";

import { databaseClient } from "@/server/shared/database/client";
import {
  GlobalChallenge,
  GlobalChallengeAnswer,
  NewsArticle,
} from "@/server/shared/database/schemas";

interface MockDatabase {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
}

describe("Global Challenges Drizzle Repositories", () => {
  let mockDb: MockDatabase;

  const sampleArticle: NewsArticle = {
    id: "art-1",
    url: "https://news.com/1",
    title: "Article 1",
    content: "Content 1",
    source: "Source 1",
    author: "Author 1",
    publishedAt: new Date("2026-01-01"),
    targetClassification: "reliable",
    createdAt: new Date("2026-01-01"),
  };

  const sampleChallenge: GlobalChallenge = {
    id: "chal-1",
    title: "Challenge 1",
    articleId: "art-1",
    xpReward: 50,
    isActive: true,
    createdAt: new Date("2026-01-01"),
  };

  const sampleAnswer: GlobalChallengeAnswer = {
    id: "ans-1",
    challengeId: "chal-1",
    userId: "user-1",
    answer: "reliable",
    isCorrect: true,
    xpAwarded: 50,
    answeredAt: new Date("2026-01-01"),
  };

  beforeEach(() => {
    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
    };
  });

  describe("DrizzleGlobalChallengeRepository", () => {
    let repository: DrizzleGlobalChallengeRepository;

    beforeEach(() => {
      repository = new DrizzleGlobalChallengeRepository(mockDb as unknown as typeof databaseClient);
    });

    it("should create challenge successfully", async () => {
      const returningMock = vi.fn().mockResolvedValue([sampleChallenge]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const created = await repository.create({
        id: "chal-1",
        title: "Challenge 1",
        articleId: "art-1",
        xpReward: 50,
      });

      expect(created).toEqual(sampleChallenge);
    });

    it("should throw error if create fails", async () => {
      const returningMock = vi.fn().mockResolvedValue([]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      await expect(
        repository.create({
          id: "chal-1",
          title: "Challenge 1",
          articleId: "art-1",
          xpReward: 50,
        }),
      ).rejects.toThrow("Failed to create global challenge record");
    });

    it("should find challenge by id", async () => {
      const limitMock = vi.fn().mockResolvedValue([sampleChallenge]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findById("chal-1");
      expect(result).toEqual(sampleChallenge);
    });

    it("should return null if challenge by id not found", async () => {
      const limitMock = vi.fn().mockResolvedValue([]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findById("unknown");
      expect(result).toBeNull();
    });

    it("should find challenge by id with article", async () => {
      const limitMock = vi.fn().mockResolvedValue([
        {
          challenge: sampleChallenge,
          article: sampleArticle,
        },
      ]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
      const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findByIdWithArticle("chal-1");
      expect(result).toEqual({
        ...sampleChallenge,
        article: sampleArticle,
      });
    });

    it("should list active challenges with articles", async () => {
      const whereMock = vi.fn().mockResolvedValue([
        {
          challenge: sampleChallenge,
          article: sampleArticle,
        },
      ]);
      const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
      const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.listActive();
      expect(result).toEqual([
        {
          ...sampleChallenge,
          article: sampleArticle,
        },
      ]);
    });
  });

  describe("DrizzleGlobalChallengeAnswerRepository", () => {
    let repository: DrizzleGlobalChallengeAnswerRepository;

    beforeEach(() => {
      repository = new DrizzleGlobalChallengeAnswerRepository(
        mockDb as unknown as typeof databaseClient,
      );
    });

    it("should create answer successfully", async () => {
      const returningMock = vi.fn().mockResolvedValue([sampleAnswer]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      const created = await repository.create({
        id: "ans-1",
        challengeId: "chal-1",
        userId: "user-1",
        answer: "reliable",
        isCorrect: true,
        xpAwarded: 50,
      });

      expect(created).toEqual(sampleAnswer);
    });

    it("should throw error if create fails", async () => {
      const returningMock = vi.fn().mockResolvedValue([]);
      const valuesMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockDb.insert.mockReturnValue({ values: valuesMock });

      await expect(
        repository.create({
          id: "ans-1",
          challengeId: "chal-1",
          userId: "user-1",
          answer: "reliable",
          isCorrect: true,
          xpAwarded: 50,
        }),
      ).rejects.toThrow("Failed to record challenge answer");
    });

    it("should find answer by challenge and user", async () => {
      const limitMock = vi.fn().mockResolvedValue([sampleAnswer]);
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock });
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.findByChallengeAndUser("chal-1", "user-1");
      expect(result).toEqual(sampleAnswer);
    });

    it("should list answers by user", async () => {
      const whereMock = vi.fn().mockResolvedValue([sampleAnswer]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockDb.select.mockReturnValue({ from: fromMock });

      const result = await repository.listByUser("user-1");
      expect(result).toEqual([sampleAnswer]);
    });
  });
});

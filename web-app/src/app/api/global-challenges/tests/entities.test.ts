import { describe, expect, it } from "vitest";

import { GlobalChallengeAnswerEntity, GlobalChallengeEntity } from "../entities";

import { NewsArticle } from "@/server/shared/database/schemas";
import { VoteOptionType } from "@/server/shared/database/schemas/enums";

describe("Global Challenges Entities", () => {
  const sampleArticle: NewsArticle = {
    id: "art-1",
    url: "https://example.com/article-1",
    title: "Article 1",
    content: "Content 1",
    source: "Example Source",
    author: "Jane Doe",
    publishedAt: new Date("2026-01-01"),
    targetClassification: "reliable",
    createdAt: new Date("2026-01-01"),
  };

  describe("GlobalChallengeEntity", () => {
    it("should instantiate with valid props and default values", () => {
      const challenge = new GlobalChallengeEntity({
        id: "chal-1",
        title: "Treino 1",
        articleId: "art-1",
      });

      expect(challenge.id).toBe("chal-1");
      expect(challenge.title).toBe("Treino 1");
      expect(challenge.articleId).toBe("art-1");
      expect(challenge.xpReward).toBe(50);
      expect(challenge.isActive).toBe(true);
      expect(challenge.createdAt).toBeInstanceOf(Date);
      expect(challenge.article).toBeUndefined();
    });

    it("should instantiate with custom xpReward and article", () => {
      const challenge = new GlobalChallengeEntity({
        id: "chal-2",
        title: "Treino Especial",
        articleId: "art-1",
        xpReward: 100,
        isActive: false,
        article: sampleArticle,
      });

      expect(challenge.xpReward).toBe(100);
      expect(challenge.isActive).toBe(false);
      expect(challenge.article).toEqual(sampleArticle);
    });

    it("should throw on empty id, title or articleId", () => {
      expect(
        () =>
          new GlobalChallengeEntity({
            id: "",
            title: "Title",
            articleId: "art-1",
          }),
      ).toThrow("Challenge id cannot be empty");

      expect(
        () =>
          new GlobalChallengeEntity({
            id: "chal-1",
            title: "   ",
            articleId: "art-1",
          }),
      ).toThrow("Challenge title cannot be empty");

      expect(
        () =>
          new GlobalChallengeEntity({
            id: "chal-1",
            title: "Title",
            articleId: "",
          }),
      ).toThrow("Challenge articleId cannot be empty");
    });

    it("should throw on negative xpReward", () => {
      expect(
        () =>
          new GlobalChallengeEntity({
            id: "chal-1",
            title: "Title",
            articleId: "art-1",
            xpReward: -10,
          }),
      ).toThrow("Challenge xpReward cannot be negative");
    });

    it("should convert to DTO correctly", () => {
      const challenge = new GlobalChallengeEntity({
        id: "chal-1",
        title: "Title",
        articleId: "art-1",
        xpReward: 75,
        isActive: true,
        article: sampleArticle,
      });

      const dto = challenge.toDTO();
      expect(dto).toEqual({
        id: "chal-1",
        title: "Title",
        articleId: "art-1",
        xpReward: 75,
        isActive: true,
        createdAt: challenge.createdAt,
        article: sampleArticle,
      });
    });
  });

  describe("GlobalChallengeAnswerEntity", () => {
    it("should instantiate with valid props and normalize answer", () => {
      const answer = new GlobalChallengeAnswerEntity({
        id: "ans-1",
        challengeId: "chal-1",
        userId: "user-1",
        answer: "RELIABLE" as unknown as VoteOptionType,
      });

      expect(answer.id).toBe("ans-1");
      expect(answer.challengeId).toBe("chal-1");
      expect(answer.userId).toBe("user-1");
      expect(answer.answer).toBe("reliable");
      expect(answer.isCorrect).toBeNull();
      expect(answer.xpAwarded).toBe(0);
      expect(answer.answeredAt).toBeInstanceOf(Date);
    });

    it("should throw on empty id, challengeId or userId", () => {
      expect(
        () =>
          new GlobalChallengeAnswerEntity({
            id: "",
            challengeId: "chal-1",
            userId: "user-1",
            answer: "reliable",
          }),
      ).toThrow("Answer id cannot be empty");

      expect(
        () =>
          new GlobalChallengeAnswerEntity({
            id: "ans-1",
            challengeId: "   ",
            userId: "user-1",
            answer: "reliable",
          }),
      ).toThrow("challengeId cannot be empty");

      expect(
        () =>
          new GlobalChallengeAnswerEntity({
            id: "ans-1",
            challengeId: "chal-1",
            userId: "",
            answer: "reliable",
          }),
      ).toThrow("userId cannot be empty");
    });

    it("should throw on invalid answer option", () => {
      expect(
        () =>
          new GlobalChallengeAnswerEntity({
            id: "ans-1",
            challengeId: "chal-1",
            userId: "user-1",
            answer: "invalid_option" as unknown as VoteOptionType,
          }),
      ).toThrow(/Invalid vote option/);
    });

    it("should correctly evaluate correct answer and award challenge XP", () => {
      const answer = new GlobalChallengeAnswerEntity({
        id: "ans-1",
        challengeId: "chal-1",
        userId: "user-1",
        answer: "reliable",
      });

      const result = answer.calculateScore("reliable", 50);
      expect(result).toEqual({
        isCorrect: true,
        xpAwarded: 50,
      });

      const evaluated = answer.evaluate("reliable", 50);
      expect(evaluated.isCorrect).toBe(true);
      expect(evaluated.xpAwarded).toBe(50);
      expect(evaluated.toDTO().isCorrect).toBe(true);
      expect(evaluated.toDTO().xpAwarded).toBe(50);
    });

    it("should correctly evaluate incorrect answer and award 0 XP", () => {
      const answer = new GlobalChallengeAnswerEntity({
        id: "ans-1",
        challengeId: "chal-1",
        userId: "user-1",
        answer: "unreliable",
      });

      const result = answer.calculateScore("reliable", 50);
      expect(result).toEqual({
        isCorrect: false,
        xpAwarded: 0,
      });

      const evaluated = answer.evaluate("reliable", 50);
      expect(evaluated.isCorrect).toBe(false);
      expect(evaluated.xpAwarded).toBe(0);
      expect(evaluated.toDTO().isCorrect).toBe(false);
      expect(evaluated.toDTO().xpAwarded).toBe(0);
    });
  });
});

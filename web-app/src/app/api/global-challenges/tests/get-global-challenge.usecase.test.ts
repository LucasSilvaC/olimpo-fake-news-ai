import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GlobalChallengeWithArticle,
  IGlobalChallengeAnswerRepository,
  IGlobalChallengeRepository,
} from "../repositories";
import { GetGlobalChallengeUseCase } from "../usecase/get-global-challenge.usecase";

import { GlobalChallengeAnswer } from "@/server/shared/database/schemas";

describe("GetGlobalChallengeUseCase", () => {
  let challengeRepository: IGlobalChallengeRepository;
  let answerRepository: IGlobalChallengeAnswerRepository;
  let useCase: GetGlobalChallengeUseCase;

  const mockChallenge: GlobalChallengeWithArticle = {
    id: "chal-1",
    title: "Desafio 1",
    articleId: "art-1",
    xpReward: 60,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    article: {
      id: "art-1",
      url: "https://news.com/1",
      title: "News 1",
      content: "Content 1",
      source: "Source 1",
      author: "Author 1",
      publishedAt: new Date("2026-01-01"),
      targetClassification: "reliable",
      createdAt: new Date("2026-01-01"),
    },
  };

  const mockAnswer: GlobalChallengeAnswer = {
    id: "ans-1",
    challengeId: "chal-1",
    userId: "user-1",
    answer: "reliable",
    isCorrect: true,
    xpAwarded: 60,
    answeredAt: new Date("2026-01-02"),
  };

  beforeEach(() => {
    challengeRepository = {
      findById: vi.fn(),
      findByIdWithArticle: vi.fn().mockResolvedValue(mockChallenge),
      listActive: vi.fn(),
      create: vi.fn(),
    };

    answerRepository = {
      findByChallengeAndUser: vi.fn().mockResolvedValue(mockAnswer),
      create: vi.fn(),
      listByUser: vi.fn(),
    };

    useCase = new GetGlobalChallengeUseCase(challengeRepository, answerRepository);
  });

  it("should return challenge and user answer when answered", async () => {
    const result = await useCase.execute({
      challengeId: "chal-1",
      userId: "user-1",
    });

    expect(challengeRepository.findByIdWithArticle).toHaveBeenCalledWith("chal-1");
    expect(answerRepository.findByChallengeAndUser).toHaveBeenCalledWith("chal-1", "user-1");
    expect(result.challenge.id).toBe("chal-1");
    expect(result.isAnswered).toBe(true);
    expect(result.userAnswer).toMatchObject({
      id: "ans-1",
      answer: "reliable",
      isCorrect: true,
      xpAwarded: 60,
    });
  });

  it("should return challenge without user answer when userId is omitted", async () => {
    const result = await useCase.execute({
      challengeId: "chal-1",
    });

    expect(answerRepository.findByChallengeAndUser).not.toHaveBeenCalled();
    expect(result.isAnswered).toBe(false);
    expect(result.userAnswer).toBeUndefined();
  });

  it("should throw error if challenge is not found", async () => {
    vi.mocked(challengeRepository.findByIdWithArticle).mockResolvedValue(null);

    await expect(
      useCase.execute({
        challengeId: "unknown-chal",
      }),
    ).rejects.toThrow('Global challenge with id "unknown-chal" not found');
  });
});

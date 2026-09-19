import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GlobalChallengeWithArticle,
  IGlobalChallengeAnswerRepository,
  IGlobalChallengeRepository,
} from "../repositories";
import { ListGlobalChallengesUseCase } from "../usecase/list-global-challenges.usecase";

import { GlobalChallengeAnswer } from "@/server/shared/database/schemas";

describe("ListGlobalChallengesUseCase", () => {
  let challengeRepository: IGlobalChallengeRepository;
  let answerRepository: IGlobalChallengeAnswerRepository;
  let useCase: ListGlobalChallengesUseCase;

  const mockChallenges: GlobalChallengeWithArticle[] = [
    {
      id: "chal-1",
      title: "Desafio Eleições",
      articleId: "art-1",
      xpReward: 50,
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
    },
    {
      id: "chal-2",
      title: "Desafio Saúde",
      articleId: "art-2",
      xpReward: 100,
      isActive: true,
      createdAt: new Date("2026-01-02"),
      article: {
        id: "art-2",
        url: "https://news.com/2",
        title: "News 2",
        content: "Content 2",
        source: "Source 2",
        author: "Author 2",
        publishedAt: new Date("2026-01-02"),
        targetClassification: "unreliable",
        createdAt: new Date("2026-01-02"),
      },
    },
  ];

  const mockAnswers: GlobalChallengeAnswer[] = [
    {
      id: "ans-1",
      challengeId: "chal-1",
      userId: "user-1",
      answer: "reliable",
      isCorrect: true,
      xpAwarded: 50,
      answeredAt: new Date("2026-01-03"),
    },
  ];

  beforeEach(() => {
    challengeRepository = {
      findById: vi.fn(),
      findByIdWithArticle: vi.fn(),
      listActive: vi.fn().mockResolvedValue(mockChallenges),
      create: vi.fn(),
    };

    answerRepository = {
      findByChallengeAndUser: vi.fn(),
      create: vi.fn(),
      listByUser: vi.fn().mockResolvedValue(mockAnswers),
    };

    useCase = new ListGlobalChallengesUseCase(challengeRepository, answerRepository);
  });

  it("should list active challenges without user answer details when userId is not provided", async () => {
    const result = await useCase.execute();

    expect(challengeRepository.listActive).toHaveBeenCalledTimes(1);
    expect(answerRepository.listByUser).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);

    expect(result[0]).toMatchObject({
      id: "chal-1",
      title: "Desafio Eleições",
      xpReward: 50,
      isAnswered: false,
      userAnswer: undefined,
      userIsCorrect: undefined,
      userXpAwarded: undefined,
    });
  });

  it("should correlate user answers when userId is provided", async () => {
    const result = await useCase.execute({ userId: "user-1" });

    expect(challengeRepository.listActive).toHaveBeenCalledTimes(1);
    expect(answerRepository.listByUser).toHaveBeenCalledWith("user-1");

    // chal-1 was answered
    expect(result[0]).toMatchObject({
      id: "chal-1",
      isAnswered: true,
      userAnswer: "reliable",
      userIsCorrect: true,
      userXpAwarded: 50,
    });

    // chal-2 was not answered
    expect(result[1]).toMatchObject({
      id: "chal-2",
      isAnswered: false,
      userAnswer: undefined,
      userIsCorrect: undefined,
      userXpAwarded: undefined,
    });
  });

  it("should return empty list if no active challenges exist", async () => {
    vi.mocked(challengeRepository.listActive).mockResolvedValue([]);

    const result = await useCase.execute({ userId: "user-1" });
    expect(result).toEqual([]);
  });
});

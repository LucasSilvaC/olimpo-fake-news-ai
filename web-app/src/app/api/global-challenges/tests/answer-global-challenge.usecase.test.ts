import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GlobalChallengeWithArticle,
  IGlobalChallengeAnswerRepository,
  IGlobalChallengeRepository,
} from "../repositories";
import { AnswerGlobalChallengeUseCase } from "../usecase/answer-global-challenge.usecase";

import { IUserRepository } from "@/app/api/auth/repositories/user.repository.interface";
import { User } from "@/server/shared/database/schemas";
import { VoteOptionType } from "@/server/shared/database/schemas/enums";

describe("AnswerGlobalChallengeUseCase", () => {
  let challengeRepository: IGlobalChallengeRepository;
  let answerRepository: IGlobalChallengeAnswerRepository;
  let userRepository: IUserRepository;
  let useCase: AnswerGlobalChallengeUseCase;

  const mockActiveChallenge: GlobalChallengeWithArticle = {
    id: "chal-1",
    title: "Desafio Fake News",
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
      targetClassification: "unreliable",
      createdAt: new Date("2026-01-01"),
    },
  };

  const mockUser: User = {
    id: "user-1",
    name: "User One",
    email: "user@olympus.ai",
    passwordHash: "hash",
    xp: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    challengeRepository = {
      findById: vi.fn(),
      findByIdWithArticle: vi.fn().mockResolvedValue(mockActiveChallenge),
      listActive: vi.fn(),
      create: vi.fn(),
    };

    answerRepository = {
      findByChallengeAndUser: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async (data) => ({
        ...data,
        answeredAt: new Date(),
      })),
      listByUser: vi.fn(),
    };

    userRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn().mockResolvedValue(mockUser),
      create: vi.fn(),
      updateXp: vi.fn().mockResolvedValue({
        ...mockUser,
        xp: 150,
      }),
    };

    useCase = new AnswerGlobalChallengeUseCase(
      challengeRepository,
      answerRepository,
      userRepository,
    );
  });

  it("should successfully record correct answer, award XP, and update user profile", async () => {
    const result = await useCase.execute({
      challengeId: "chal-1",
      userId: "user-1",
      answer: "unreliable",
    });

    expect(challengeRepository.findByIdWithArticle).toHaveBeenCalledWith("chal-1");
    expect(answerRepository.findByChallengeAndUser).toHaveBeenCalledWith("chal-1", "user-1");
    expect(answerRepository.create).toHaveBeenCalledTimes(1);
    expect(userRepository.updateXp).toHaveBeenCalledWith("user-1", 50);

    expect(result.isCorrect).toBe(true);
    expect(result.xpAwarded).toBe(50);
    expect(result.targetClassification).toBe("unreliable");
    expect(result.answer.challengeId).toBe("chal-1");
    expect(result.answer.userId).toBe("user-1");
    expect(result.answer.answer).toBe("unreliable");
    expect(result.answer.isCorrect).toBe(true);
    expect(result.answer.xpAwarded).toBe(50);
  });

  it("should successfully record incorrect answer and award 0 XP without updating user profile", async () => {
    const result = await useCase.execute({
      challengeId: "chal-1",
      userId: "user-1",
      answer: "reliable",
    });

    expect(answerRepository.create).toHaveBeenCalledTimes(1);
    expect(userRepository.updateXp).not.toHaveBeenCalled();

    expect(result.isCorrect).toBe(false);
    expect(result.xpAwarded).toBe(0);
    expect(result.targetClassification).toBe("unreliable");
    expect(result.answer.isCorrect).toBe(false);
    expect(result.answer.xpAwarded).toBe(0);
  });

  it("should throw error if challenge is not found", async () => {
    vi.mocked(challengeRepository.findByIdWithArticle).mockResolvedValue(null);

    await expect(
      useCase.execute({
        challengeId: "nonexistent",
        userId: "user-1",
        answer: "reliable",
      }),
    ).rejects.toThrow('Global challenge with id "nonexistent" not found');
  });

  it("should throw error if challenge is inactive", async () => {
    vi.mocked(challengeRepository.findByIdWithArticle).mockResolvedValue({
      ...mockActiveChallenge,
      isActive: false,
    });

    await expect(
      useCase.execute({
        challengeId: "chal-1",
        userId: "user-1",
        answer: "reliable",
      }),
    ).rejects.toThrow("Cannot answer an inactive challenge");
  });

  it("should throw error if user has already answered the challenge", async () => {
    vi.mocked(answerRepository.findByChallengeAndUser).mockResolvedValue({
      id: "ans-old",
      challengeId: "chal-1",
      userId: "user-1",
      answer: "reliable",
      isCorrect: false,
      xpAwarded: 0,
      answeredAt: new Date(),
    });

    await expect(
      useCase.execute({
        challengeId: "chal-1",
        userId: "user-1",
        answer: "unreliable",
      }),
    ).rejects.toThrow("User has already answered this challenge");
  });

  it("should throw error on invalid answer vote option", async () => {
    await expect(
      useCase.execute({
        challengeId: "chal-1",
        userId: "user-1",
        answer: "invalid_vote" as unknown as VoteOptionType,
      }),
    ).rejects.toThrow(/Invalid vote option/);
  });
});

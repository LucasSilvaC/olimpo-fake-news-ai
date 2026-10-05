import crypto from "node:crypto";

import { GlobalChallengeAnswerDTO, GlobalChallengeAnswerEntity } from "../entities";
import { drizzleGlobalChallengeAnswerRepository as defaultAnswerRepository } from "../repositories/drizzle-global-challenge-answer.repository";
import { drizzleGlobalChallengeRepository as defaultChallengeRepository } from "../repositories/drizzle-global-challenge.repository";
import { IGlobalChallengeAnswerRepository } from "../repositories/global-challenge-answer.repository.interface";
import { IGlobalChallengeRepository } from "../repositories/global-challenge.repository.interface";

import { drizzleUserRepository as defaultUserRepository } from "@/app/api/auth/repositories/drizzle-user.repository";
import { IUserRepository } from "@/app/api/auth/repositories/user.repository.interface";
import { VoteOption } from "@/app/api/news-voting/entities";
import { MLTargetType, VoteOptionType } from "@/server/shared/database/schemas/enums";

export interface AnswerGlobalChallengeInput {
  challengeId: string;
  userId: string;
  answer: VoteOptionType;
}

export interface AnswerGlobalChallengeOutput {
  answer: GlobalChallengeAnswerDTO;
  isCorrect: boolean;
  xpAwarded: number;
  targetClassification: MLTargetType;
}

export class AnswerGlobalChallengeUseCase {
  constructor(
    private readonly challengeRepository: IGlobalChallengeRepository = defaultChallengeRepository,
    private readonly answerRepository: IGlobalChallengeAnswerRepository = defaultAnswerRepository,
    private readonly userRepository: IUserRepository = defaultUserRepository,
  ) {}

  async execute(input: AnswerGlobalChallengeInput): Promise<AnswerGlobalChallengeOutput> {
    const normalizedAnswer = VoteOption.normalize(input.answer);

    const challengeWithArticle = await this.challengeRepository.findByIdWithArticle(
      input.challengeId,
    );
    if (!challengeWithArticle) {
      throw new Error(`Global challenge with id "${input.challengeId}" not found`);
    }

    if (!challengeWithArticle.isActive) {
      throw new Error("Cannot answer an inactive challenge");
    }

    const existingAnswer = await this.answerRepository.findByChallengeAndUser(
      input.challengeId,
      input.userId,
    );
    if (existingAnswer) {
      throw new Error("User has already answered this challenge");
    }

    const answerEntity = new GlobalChallengeAnswerEntity({
      id: crypto.randomUUID(),
      challengeId: input.challengeId,
      userId: input.userId,
      answer: normalizedAnswer,
    });

    const evaluated = answerEntity.evaluate(
      challengeWithArticle.article.targetClassification,
      challengeWithArticle.xpReward,
    );

    const isCorrect = evaluated.isCorrect ?? false;
    const xpAwarded = evaluated.xpAwarded;

    await this.answerRepository.create({
      id: evaluated.id,
      challengeId: evaluated.challengeId,
      userId: evaluated.userId,
      answer: evaluated.answer,
      isCorrect,
      xpAwarded,
      answeredAt: evaluated.answeredAt,
    });

    if (xpAwarded > 0) {
      await this.userRepository.updateXp(input.userId, xpAwarded);
    }

    return {
      answer: evaluated.toDTO(),
      isCorrect,
      xpAwarded,
      targetClassification: challengeWithArticle.article.targetClassification,
    };
  }
}

export const answerGlobalChallengeUseCase = new AnswerGlobalChallengeUseCase();

import crypto from "node:crypto";

import { GlobalChallengeAnswerDTO, GlobalChallengeAnswerEntity } from "../entities";
import { IGlobalChallengeAnswerRepository } from "../repositories/global-challenge-answer.repository.interface";
import { IGlobalChallengeRepository } from "../repositories/global-challenge.repository.interface";

import { getDefaultAnalysis } from "./list-global-challenges.usecase";

import { INewsAnalysisRepository } from "@/app/api/ai-feedback/repositories/news-analysis.repository.interface";
import { IUserRepository } from "@/app/api/auth/repositories/user.repository.interface";
import {
  normalizeNewsClassification,
  type MLTargetType,
  type VoteOptionType,
} from "@/server/shared/domain/game-vocabulary";

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
  analysis: {
    classification: MLTargetType;
    reasons: string[];
    confidence: number;
  };
}

export class AnswerGlobalChallengeUseCase {
  constructor(
    private readonly challengeRepository: IGlobalChallengeRepository,
    private readonly answerRepository: IGlobalChallengeAnswerRepository,
    private readonly userRepository: IUserRepository,
    private readonly analysisRepository: INewsAnalysisRepository,
  ) {}

  async execute(input: AnswerGlobalChallengeInput): Promise<AnswerGlobalChallengeOutput> {
    const normalizedAnswer = normalizeNewsClassification(input.answer, "vote option");

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

    await this.answerRepository.create(evaluated.toDTO());

    if (xpAwarded > 0) {
      await this.userRepository.updateXp(input.userId, xpAwarded);
    }

    let analysis = getDefaultAnalysis(challengeWithArticle.article.targetClassification);
    try {
      const rec = await this.analysisRepository.findByArticleId(challengeWithArticle.articleId);
      if (
        rec?.analysisStatus === "legacy" &&
        rec.classification !== null &&
        rec.confidence !== null
      ) {
        const raw = Number(rec.confidence);
        const confidence = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
        analysis = {
          classification: rec.classification,
          reasons: rec.reasons,
          confidence,
        };
      }
    } catch {
      // fallback to default
    }

    return {
      answer: evaluated.toDTO(),
      isCorrect,
      xpAwarded,
      targetClassification: challengeWithArticle.article.targetClassification,
      analysis,
    };
  }
}

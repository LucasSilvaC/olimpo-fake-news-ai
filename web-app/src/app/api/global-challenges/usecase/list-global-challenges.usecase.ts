import { ChallengeAnalysisDTO, getDefaultAnalysis } from "../entities";
import { drizzleGlobalChallengeAnswerRepository as defaultAnswerRepository } from "../repositories/drizzle-global-challenge-answer.repository";
import { drizzleGlobalChallengeRepository as defaultChallengeRepository } from "../repositories/drizzle-global-challenge.repository";
import { IGlobalChallengeAnswerRepository } from "../repositories/global-challenge-answer.repository.interface";
import { IGlobalChallengeRepository } from "../repositories/global-challenge.repository.interface";

import { drizzleNewsAnalysisRepository as defaultAnalysisRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-analysis.repository";
import { INewsAnalysisRepository } from "@/app/api/ai-feedback/repositories/news-analysis.repository.interface";
import { INewsArticle } from "@/lib/news/types";
import { MLTargetType, VoteOptionType } from "@/server/shared/database/schemas/enums";

export { getDefaultAnalysis, type ChallengeAnalysisDTO };

export interface ListGlobalChallengesInput {
  userId?: string;
}

export interface ListedGlobalChallengeDTO {
  id: string;
  title: string;
  articleId: string;
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  article: {
    id: string;
    targetClassification: MLTargetType;
    article: INewsArticle;
    createdAt: Date;
  };
  analysis: {
    classification: MLTargetType;
    reasons: string[];
    confidence: number;
  };
  isAnswered: boolean;
  userAnswer?: VoteOptionType;
  userIsCorrect?: boolean;
  userXpAwarded?: number;
}

export class ListGlobalChallengesUseCase {
  constructor(
    private readonly challengeRepository: IGlobalChallengeRepository = defaultChallengeRepository,
    private readonly answerRepository: IGlobalChallengeAnswerRepository = defaultAnswerRepository,
    private readonly analysisRepository: INewsAnalysisRepository = defaultAnalysisRepository,
  ) {}

  async execute(input?: ListGlobalChallengesInput): Promise<ListedGlobalChallengeDTO[]> {
    const activeChallenges = await this.challengeRepository.listActive();

    let userAnswersMap = new Map<
      string,
      { answer: VoteOptionType; isCorrect: boolean; xpAwarded: number }
    >();

    if (input?.userId) {
      const userAnswers = await this.answerRepository.listByUser(input.userId);
      userAnswersMap = new Map(
        userAnswers.map((ans) => [
          ans.challengeId,
          {
            answer: ans.answer,
            isCorrect: ans.isCorrect,
            xpAwarded: ans.xpAwarded,
          },
        ]),
      );
    }

    const analyses = await Promise.all(
      activeChallenges.map(async (c) => {
        try {
          const rec = await this.analysisRepository.findByArticleId(c.articleId);
          if (
            rec?.analysisStatus === "legacy" &&
            rec.classification !== null &&
            rec.confidence !== null
          ) {
            const raw = Number(rec.confidence);
            const confidence = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
            return {
              classification: rec.classification,
              reasons: rec.reasons,
              confidence,
            };
          }
        } catch {
          // ignore and fallback
        }
        return getDefaultAnalysis(c.article.targetClassification);
      }),
    );

    return activeChallenges.map((challenge, index) => {
      const userAns = userAnswersMap.get(challenge.id);

      return {
        id: challenge.id,
        title: challenge.title,
        articleId: challenge.articleId,
        xpReward: challenge.xpReward,
        isActive: challenge.isActive,
        createdAt: challenge.createdAt,
        article: {
          id: challenge.article.id,
          targetClassification: challenge.article.targetClassification,
          article: challenge.article.article,
          createdAt: challenge.article.createdAt,
        },
        analysis: analyses[index] ?? getDefaultAnalysis(challenge.article.targetClassification),
        isAnswered: Boolean(userAns),
        userAnswer: userAns?.answer,
        userIsCorrect: userAns?.isCorrect,
        userXpAwarded: userAns?.xpAwarded,
      };
    });
  }
}

export const listGlobalChallengesUseCase = new ListGlobalChallengesUseCase();

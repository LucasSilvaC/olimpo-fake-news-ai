import type { ListedGlobalChallengeDTO } from "../contracts";
import { ChallengeAnalysisDTO, getDefaultAnalysis } from "../entities";
import { IGlobalChallengeAnswerRepository } from "../repositories/global-challenge-answer.repository.interface";
import { IGlobalChallengeRepository } from "../repositories/global-challenge.repository.interface";

import { INewsAnalysisRepository } from "@/app/api/ai-feedback/repositories/news-analysis.repository.interface";
import type { VoteOptionType } from "@/server/shared/domain/game-vocabulary";

export { getDefaultAnalysis, type ChallengeAnalysisDTO };
export type { ListedGlobalChallengeDTO } from "../contracts";

export interface ListGlobalChallengesInput {
  userId?: string;
}

export class ListGlobalChallengesUseCase {
  constructor(
    private readonly challengeRepository: IGlobalChallengeRepository,
    private readonly answerRepository: IGlobalChallengeAnswerRepository,
    private readonly analysisRepository: INewsAnalysisRepository,
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
            isCorrect: ans.isCorrect ?? false,
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

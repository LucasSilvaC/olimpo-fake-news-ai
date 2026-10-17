import type { INewsArticle } from "@/lib/news/types";
import type { MLTargetType, VoteOptionType } from "@/server/shared/domain/game-vocabulary";

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

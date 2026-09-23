import { drizzleGlobalChallengeAnswerRepository as defaultAnswerRepository } from "../repositories/drizzle-global-challenge-answer.repository";
import { drizzleGlobalChallengeRepository as defaultChallengeRepository } from "../repositories/drizzle-global-challenge.repository";
import { IGlobalChallengeAnswerRepository } from "../repositories/global-challenge-answer.repository.interface";
import { IGlobalChallengeRepository } from "../repositories/global-challenge.repository.interface";

import { VoteOptionType } from "@/server/shared/database/schemas/enums";

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
    title: string;
    content: string;
    url: string;
    source: string | null;
    author: string | null;
    publishedAt: Date | null;
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

    return activeChallenges.map((challenge) => {
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
          title: challenge.article.title,
          content: challenge.article.content,
          url: challenge.article.url,
          source: challenge.article.source,
          author: challenge.article.author,
          publishedAt: challenge.article.publishedAt,
        },
        isAnswered: Boolean(userAns),
        userAnswer: userAns?.answer,
        userIsCorrect: userAns?.isCorrect,
        userXpAwarded: userAns?.xpAwarded,
      };
    });
  }
}

export const listGlobalChallengesUseCase = new ListGlobalChallengesUseCase();

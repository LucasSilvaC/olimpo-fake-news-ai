import { GlobalChallengeDTO, GlobalChallengeEntity } from "../entities";
import { IGlobalChallengeAnswerRepository } from "../repositories/global-challenge-answer.repository.interface";
import { IGlobalChallengeRepository } from "../repositories/global-challenge.repository.interface";
import type { GlobalChallengeArticleReadModel } from "../repositories/global-challenge.repository.interface";

import type { VoteOptionType } from "@/server/shared/domain/game-vocabulary";

export interface GetGlobalChallengeInput {
  challengeId: string;
  userId?: string;
}

export interface GetGlobalChallengeOutput {
  challenge: GlobalChallengeDTO & { article: GlobalChallengeArticleReadModel };
  isAnswered: boolean;
  userAnswer?: {
    id: string;
    answer: VoteOptionType;
    isCorrect: boolean;
    xpAwarded: number;
    answeredAt: Date;
  };
}

export class GetGlobalChallengeUseCase {
  constructor(
    private readonly challengeRepository: IGlobalChallengeRepository,
    private readonly answerRepository: IGlobalChallengeAnswerRepository,
  ) {}

  async execute(input: GetGlobalChallengeInput): Promise<GetGlobalChallengeOutput> {
    const found = await this.challengeRepository.findByIdWithArticle(input.challengeId);
    if (!found) {
      throw new Error(`Global challenge with id "${input.challengeId}" not found`);
    }

    const entity = new GlobalChallengeEntity({
      id: found.id,
      title: found.title,
      articleId: found.articleId,
      xpReward: found.xpReward,
      isActive: found.isActive,
      createdAt: found.createdAt,
    });

    let userAnswer: GetGlobalChallengeOutput["userAnswer"];

    if (input.userId) {
      const recordedAnswer = await this.answerRepository.findByChallengeAndUser(
        input.challengeId,
        input.userId,
      );
      if (recordedAnswer) {
        userAnswer = {
          id: recordedAnswer.id,
          answer: recordedAnswer.answer,
          isCorrect: recordedAnswer.isCorrect ?? false,
          xpAwarded: recordedAnswer.xpAwarded,
          answeredAt: recordedAnswer.answeredAt,
        };
      }
    }

    return {
      challenge: { ...entity.toDTO(), article: found.article },
      isAnswered: Boolean(userAnswer),
      userAnswer,
    };
  }
}

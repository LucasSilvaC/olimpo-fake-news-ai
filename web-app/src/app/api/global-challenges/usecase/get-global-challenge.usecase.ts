import { GlobalChallengeDTO, GlobalChallengeEntity } from "../entities";
import { drizzleGlobalChallengeAnswerRepository as defaultAnswerRepository } from "../repositories/drizzle-global-challenge-answer.repository";
import { drizzleGlobalChallengeRepository as defaultChallengeRepository } from "../repositories/drizzle-global-challenge.repository";
import { IGlobalChallengeAnswerRepository } from "../repositories/global-challenge-answer.repository.interface";
import { IGlobalChallengeRepository } from "../repositories/global-challenge.repository.interface";

import { VoteOptionType } from "@/server/shared/database/schemas/enums";

export interface GetGlobalChallengeInput {
  challengeId: string;
  userId?: string;
}

export interface GetGlobalChallengeOutput {
  challenge: GlobalChallengeDTO;
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
    private readonly challengeRepository: IGlobalChallengeRepository = defaultChallengeRepository,
    private readonly answerRepository: IGlobalChallengeAnswerRepository = defaultAnswerRepository,
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
      article: found.article,
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
          isCorrect: recordedAnswer.isCorrect,
          xpAwarded: recordedAnswer.xpAwarded,
          answeredAt: recordedAnswer.answeredAt,
        };
      }
    }

    return {
      challenge: entity.toDTO(),
      isAnswered: Boolean(userAnswer),
      userAnswer,
    };
  }
}

export const getGlobalChallengeUseCase = new GetGlobalChallengeUseCase();

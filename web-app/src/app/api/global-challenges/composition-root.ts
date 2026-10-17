import "server-only";


import { drizzleGlobalChallengeAnswerRepository } from "./repositories/drizzle-global-challenge-answer.repository";
import { drizzleGlobalChallengeRepository } from "./repositories/drizzle-global-challenge.repository";
import { AnswerGlobalChallengeUseCase } from "./usecase/answer-global-challenge.usecase";
import { GetGlobalChallengeUseCase } from "./usecase/get-global-challenge.usecase";
import { ListGlobalChallengesUseCase } from "./usecase/list-global-challenges.usecase";

import { drizzleNewsAnalysisRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-analysis.repository";
import { drizzleUserRepository } from "@/app/api/auth/repositories/drizzle-user.repository";

export const answerGlobalChallengeUseCase = new AnswerGlobalChallengeUseCase(
  drizzleGlobalChallengeRepository,
  drizzleGlobalChallengeAnswerRepository,
  drizzleUserRepository,
  drizzleNewsAnalysisRepository,
);

export const getGlobalChallengeUseCase = new GetGlobalChallengeUseCase(
  drizzleGlobalChallengeRepository,
  drizzleGlobalChallengeAnswerRepository,
);

export const listGlobalChallengesUseCase = new ListGlobalChallengesUseCase(
  drizzleGlobalChallengeRepository,
  drizzleGlobalChallengeAnswerRepository,
  drizzleNewsAnalysisRepository,
);

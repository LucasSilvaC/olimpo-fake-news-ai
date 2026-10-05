import { GlobalChallengeAnswer, NewGlobalChallengeAnswer } from "@/server/shared/database/schemas";

export interface IGlobalChallengeAnswerRepository {
  findByChallengeAndUser(
    challengeId: string,
    userId: string,
  ): Promise<GlobalChallengeAnswer | null>;
  create(data: NewGlobalChallengeAnswer): Promise<GlobalChallengeAnswer>;
  listByUser(userId: string): Promise<GlobalChallengeAnswer[]>;
}

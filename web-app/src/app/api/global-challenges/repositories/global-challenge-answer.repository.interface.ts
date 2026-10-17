import type { GlobalChallengeAnswerDTO, GlobalChallengeAnswerEntityProps } from "../entities";

export interface IGlobalChallengeAnswerRepository {
  findByChallengeAndUser(
    challengeId: string,
    userId: string,
  ): Promise<GlobalChallengeAnswerDTO | null>;
  create(data: GlobalChallengeAnswerEntityProps): Promise<GlobalChallengeAnswerDTO>;
  listByUser(userId: string): Promise<GlobalChallengeAnswerDTO[]>;
}

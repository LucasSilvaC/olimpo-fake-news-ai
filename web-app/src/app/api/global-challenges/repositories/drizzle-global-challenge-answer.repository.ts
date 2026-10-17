import { and, eq } from "drizzle-orm";

import type { GlobalChallengeAnswerDTO, GlobalChallengeAnswerEntityProps } from "../entities";
import { GlobalChallengeAnswerEntity } from "../entities";

import type { IGlobalChallengeAnswerRepository } from "./global-challenge-answer.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import { globalChallengeAnswers } from "@/server/shared/database/schemas";
import type { GlobalChallengeAnswer, NewGlobalChallengeAnswer } from "@/server/shared/database/schemas";

const toAnswerDTO = (row: GlobalChallengeAnswer): GlobalChallengeAnswerDTO =>
  new GlobalChallengeAnswerEntity(row).toDTO();

export class DrizzleGlobalChallengeAnswerRepository implements IGlobalChallengeAnswerRepository {
  constructor(private readonly db = databaseClient) {}

  async create(data: GlobalChallengeAnswerEntityProps): Promise<GlobalChallengeAnswerDTO> {
    const entity = new GlobalChallengeAnswerEntity(data);
    const values: NewGlobalChallengeAnswer = {
      id: entity.id,
      challengeId: entity.challengeId,
      userId: entity.userId,
      answer: entity.answer,
      isCorrect: entity.isCorrect ?? false,
      xpAwarded: entity.xpAwarded,
      answeredAt: entity.answeredAt,
    };
    const [created] = await this.db.insert(globalChallengeAnswers).values(values).returning();
    if (!created) throw new Error("Failed to record challenge answer");
    return toAnswerDTO(created);
  }

  async findByChallengeAndUser(
    challengeId: string,
    userId: string,
  ): Promise<GlobalChallengeAnswerDTO | null> {
    const [found] = await this.db
      .select()
      .from(globalChallengeAnswers)
      .where(
        and(
          eq(globalChallengeAnswers.challengeId, challengeId),
          eq(globalChallengeAnswers.userId, userId),
        ),
      )
      .limit(1);
    return found ? toAnswerDTO(found) : null;
  }

  async listByUser(userId: string): Promise<GlobalChallengeAnswerDTO[]> {
    const rows = await this.db
      .select()
      .from(globalChallengeAnswers)
      .where(eq(globalChallengeAnswers.userId, userId));
    return rows.map(toAnswerDTO);
  }
}

export const drizzleGlobalChallengeAnswerRepository = new DrizzleGlobalChallengeAnswerRepository();

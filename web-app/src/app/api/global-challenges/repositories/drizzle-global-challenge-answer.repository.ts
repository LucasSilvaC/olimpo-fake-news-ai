import { and, eq } from "drizzle-orm";

import { IGlobalChallengeAnswerRepository } from "./global-challenge-answer.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import {
  globalChallengeAnswers,
  GlobalChallengeAnswer,
  NewGlobalChallengeAnswer,
} from "@/server/shared/database/schemas";

export class DrizzleGlobalChallengeAnswerRepository implements IGlobalChallengeAnswerRepository {
  constructor(private readonly db = databaseClient) {}

  async create(data: NewGlobalChallengeAnswer): Promise<GlobalChallengeAnswer> {
    const [created] = await this.db.insert(globalChallengeAnswers).values(data).returning();

    if (!created) {
      throw new Error("Failed to record challenge answer");
    }

    return created;
  }

  async findByChallengeAndUser(
    challengeId: string,
    userId: string,
  ): Promise<GlobalChallengeAnswer | null> {
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

    return found ?? null;
  }

  async listByUser(userId: string): Promise<GlobalChallengeAnswer[]> {
    return this.db
      .select()
      .from(globalChallengeAnswers)
      .where(eq(globalChallengeAnswers.userId, userId));
  }
}

export const drizzleGlobalChallengeAnswerRepository = new DrizzleGlobalChallengeAnswerRepository();

import { eq } from "drizzle-orm";

import {
  GlobalChallengeWithArticle,
  IGlobalChallengeRepository,
} from "./global-challenge.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import {
  globalChallenges,
  GlobalChallenge,
  NewGlobalChallenge,
  newsArticles,
} from "@/server/shared/database/schemas";

export class DrizzleGlobalChallengeRepository implements IGlobalChallengeRepository {
  constructor(private readonly db = databaseClient) {}

  async create(data: NewGlobalChallenge): Promise<GlobalChallenge> {
    const [created] = await this.db.insert(globalChallenges).values(data).returning();

    if (!created) {
      throw new Error("Failed to create global challenge record");
    }

    return created;
  }

  async findById(id: string): Promise<GlobalChallenge | null> {
    const [found] = await this.db
      .select()
      .from(globalChallenges)
      .where(eq(globalChallenges.id, id))
      .limit(1);

    return found ?? null;
  }

  async findByIdWithArticle(id: string): Promise<GlobalChallengeWithArticle | null> {
    const [row] = await this.db
      .select({
        challenge: globalChallenges,
        article: newsArticles,
      })
      .from(globalChallenges)
      .innerJoin(newsArticles, eq(globalChallenges.articleId, newsArticles.id))
      .where(eq(globalChallenges.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      ...row.challenge,
      article: row.article,
    };
  }

  async listActive(): Promise<GlobalChallengeWithArticle[]> {
    const rows = await this.db
      .select({
        challenge: globalChallenges,
        article: newsArticles,
      })
      .from(globalChallenges)
      .innerJoin(newsArticles, eq(globalChallenges.articleId, newsArticles.id))
      .where(eq(globalChallenges.isActive, true));

    return rows.map((row) => ({
      ...row.challenge,
      article: row.article,
    }));
  }
}

export const drizzleGlobalChallengeRepository = new DrizzleGlobalChallengeRepository();

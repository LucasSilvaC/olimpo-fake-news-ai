import { eq } from "drizzle-orm";

import type { GlobalChallengeDTO, GlobalChallengeEntityProps } from "../entities";
import { GlobalChallengeEntity } from "../entities";

import type {
  GlobalChallengeArticleReadModel,
  GlobalChallengeReadModel,
  IGlobalChallengeRepository,
} from "./global-challenge.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import {
  globalChallenges,
  newsArticles,
} from "@/server/shared/database/schemas";
import type { GlobalChallenge, NewGlobalChallenge, NewsArticle } from "@/server/shared/database/schemas";


const toChallengeDTO = (row: GlobalChallenge): GlobalChallengeDTO =>
  new GlobalChallengeEntity(row).toDTO();

const toArticleReadModel = (row: NewsArticle): GlobalChallengeArticleReadModel => ({
  id: row.id,
  targetClassification: row.targetClassification,
  article: row.article,
  createdAt: row.createdAt,
});

const toChallengeReadModel = (
  challenge: GlobalChallenge,
  article: NewsArticle,
): GlobalChallengeReadModel => ({
  ...toChallengeDTO(challenge),
  article: toArticleReadModel(article),
});

export class DrizzleGlobalChallengeRepository implements IGlobalChallengeRepository {
  constructor(private readonly db = databaseClient) {}

  async create(data: GlobalChallengeEntityProps): Promise<GlobalChallengeDTO> {
    const entity = new GlobalChallengeEntity(data);
    const values: NewGlobalChallenge = {
      id: entity.id,
      title: entity.title,
      articleId: entity.articleId,
      xpReward: entity.xpReward,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
    };
    const [created] = await this.db.insert(globalChallenges).values(values).returning();
    if (!created) throw new Error("Failed to create global challenge record");
    return toChallengeDTO(created);
  }

  async findById(id: string): Promise<GlobalChallengeDTO | null> {
    const [found] = await this.db
      .select()
      .from(globalChallenges)
      .where(eq(globalChallenges.id, id))
      .limit(1);
    return found ? toChallengeDTO(found) : null;
  }

  async findByIdWithArticle(id: string): Promise<GlobalChallengeReadModel | null> {
    const [row] = await this.db
      .select({ challenge: globalChallenges, article: newsArticles })
      .from(globalChallenges)
      .innerJoin(newsArticles, eq(globalChallenges.articleId, newsArticles.id))
      .where(eq(globalChallenges.id, id))
      .limit(1);
    return row ? toChallengeReadModel(row.challenge, row.article) : null;
  }

  async listActive(): Promise<GlobalChallengeReadModel[]> {
    const rows = await this.db
      .select({ challenge: globalChallenges, article: newsArticles })
      .from(globalChallenges)
      .innerJoin(newsArticles, eq(globalChallenges.articleId, newsArticles.id))
      .where(eq(globalChallenges.isActive, true));
    return rows.map((row) => toChallengeReadModel(row.challenge, row.article));
  }
}

export const drizzleGlobalChallengeRepository = new DrizzleGlobalChallengeRepository();

import { eq } from "drizzle-orm";

import { INewsAnalysisRepository } from "./news-analysis.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import {
  newsAnalyses,
  NewsAnalysis,
  NewNewsAnalysis,
} from "@/server/shared/database/schemas/news-analyses";

export class DrizzleNewsAnalysisRepository implements INewsAnalysisRepository {
  constructor(private readonly db = databaseClient) {}

  async findByArticleId(articleId: string): Promise<NewsAnalysis | null> {
    const [found] = await this.db
      .select()
      .from(newsAnalyses)
      .where(eq(newsAnalyses.articleId, articleId))
      .limit(1);

    return found ?? null;
  }

  async create(data: NewNewsAnalysis): Promise<NewsAnalysis> {
    const [created] = await this.db
      .insert(newsAnalyses)
      .values({
        ...data,
        createdAt: data.createdAt ?? new Date(),
      })
      .returning();

    if (!created) {
      throw new Error("Failed to save news analysis record");
    }

    return created;
  }
}

export const drizzleNewsAnalysisRepository = new DrizzleNewsAnalysisRepository();

import { eq } from "drizzle-orm";

import { INewsArticleRepository } from "./news-article.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import {
  newsArticles,
  NewsArticle,
  NewNewsArticle,
} from "@/server/shared/database/schemas/news-articles";

export class DrizzleNewsArticleRepository implements INewsArticleRepository {
  constructor(private readonly db = databaseClient) {}

  async findById(id: string): Promise<NewsArticle | null> {
    const [found] = await this.db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.id, id))
      .limit(1);

    return found ?? null;
  }

  async create(data: NewNewsArticle): Promise<NewsArticle> {
    const [created] = await this.db.insert(newsArticles).values(data).returning();

    if (!created) {
      throw new Error("Failed to create news article record");
    }

    return created;
  }
}

export const drizzleNewsArticleRepository = new DrizzleNewsArticleRepository();

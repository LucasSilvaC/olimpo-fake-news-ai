import crypto from "node:crypto";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { describe, expect, it, vi } from "vitest";

import type { IAIAnalysisService } from "../repositories/ai-analysis-service.interface";
import { DrizzleNewsAnalysisRepository } from "../repositories/drizzle-news-analysis.repository";
import { DrizzleNewsArticleRepository } from "../repositories/drizzle-news-article.repository";
import { GetArticleAnalysisUseCase } from "../usecase/get-article-analysis.usecase";

import { prediction } from "./supervised-fixture";

import type { databaseClient } from "@/server/shared/database/client";
import * as schema from "@/server/shared/database/schemas";

const url = process.env.SUPERVISED_TEST_DATABASE_URL;
describe.skipIf(!url)("Postgres supervised idempotence with separate workers", () => {
  it("coordinates inference in the database and preserves history", async () => {
    const client = postgres(url!, { max: 4 });
    const db = drizzle(client, { schema });
    const articleId = `supervised-validation-${crypto.randomUUID()}`;
    try {
      await db.insert(schema.newsArticles).values({
        id: articleId,
        targetClassification: "unreliable",
        article: {
          title: "Registered answer never reaches inference",
          url: "https://example.com/supervised-validation",
          canonicalUrl: null,
          description: null,
          authors: [],
          publishedAt: null,
          modifiedAt: null,
          content: "saved body ".repeat(50),
          imageUrl: null,
          publisher: null,
          language: "pt",
          extractionMethod: "local",
          usedFallback: false,
        },
      });
      await db.insert(schema.newsAnalyses).values({
        id: crypto.randomUUID(),
        articleId,
        classification: "unreliable",
        reasons: ["Historical mock"],
        modelVersion: "mock-v1",
      });
      const identity = {
        modelVersion: prediction.modelVersion,
        policyVersion: prediction.policyVersion,
        artifactSha256: prediction.artifactSha256,
        inferenceVersion: prediction.inferenceVersion,
      };
      const service: IAIAnalysisService = {
        getIdentity: vi.fn(async () => ({ ...identity })),
        analyze: vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 30));
          return { ...prediction, ...identity };
        }),
      };
      const worker = () =>
        new GetArticleAnalysisUseCase(
          new DrizzleNewsAnalysisRepository(db as unknown as typeof databaseClient),
          new DrizzleNewsArticleRepository(db as unknown as typeof databaseClient),
          service,
        );
      const first = worker();
      const second = worker();
      const outcomes = await Promise.all([
        first.execute({ articleId }),
        second.execute({ articleId }),
        first.execute({ articleId }),
        second.execute({ articleId }),
      ]);
      expect(service.analyze).toHaveBeenCalledTimes(1);
      expect(new Set(outcomes.map((result) => result.id)).size).toBe(1);
      const rows = await db
        .select()
        .from(schema.newsAnalyses)
        .where(eq(schema.newsAnalyses.articleId, articleId));
      expect(rows).toHaveLength(2);
      expect(rows.find((row) => row.modelVersion === "mock-v1")?.analysisStatus).toBe("legacy");
      identity.inferenceVersion = "serving-v2";
      await worker().execute({ articleId });
      expect(service.analyze).toHaveBeenCalledTimes(2);
    } finally {
      await db.delete(schema.newsArticles).where(eq(schema.newsArticles.id, articleId));
      await client.end();
    }
  }, 15_000);
});

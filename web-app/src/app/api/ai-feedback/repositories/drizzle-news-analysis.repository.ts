import { and, eq, inArray, sql } from "drizzle-orm";

import type {
  AnalysisCacheIdentity,
  INewsAnalysisRepository,
} from "./news-analysis.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import {
  newsAnalyses,
  type NewsAnalysis,
  type NewNewsAnalysis,
} from "@/server/shared/database/schemas/news-analyses";

export class DrizzleNewsAnalysisRepository implements INewsAnalysisRepository {
  constructor(private readonly db = databaseClient) {}
  async findByArticleId(articleId: string): Promise<NewsAnalysis | null> {
    const [row] = await this.db
      .select()
      .from(newsAnalyses)
      .where(eq(newsAnalyses.articleId, articleId))
      .limit(1);
    return row ?? null;
  }
  async findByIdentity(identity: AnalysisCacheIdentity): Promise<NewsAnalysis | null> {
    const [row] = await this.db
      .select()
      .from(newsAnalyses)
      .where(
        and(
          eq(newsAnalyses.articleId, identity.articleId),
          eq(newsAnalyses.bodySha256, identity.bodySha256),
          eq(newsAnalyses.artifactSha256, identity.artifactSha256),
          eq(newsAnalyses.inferenceVersion, identity.inferenceVersion),
          eq(newsAnalyses.policyVersion, identity.policyVersion),
          eq(newsAnalyses.modelVersion, identity.modelVersion),
          inArray(newsAnalyses.analysisStatus, ["ok", "insufficient_text", "invalid_text"]),
        ),
      )
      .limit(1);
    return row ?? null;
  }
  async create(data: NewNewsAnalysis): Promise<NewsAnalysis> {
    const [row] = await this.db.insert(newsAnalyses).values(data).onConflictDoNothing().returning();
    if (row) return row;
    throw new Error("Analysis identity conflict");
  }
  async withIdentityLock<T>(
    identity: AnalysisCacheIdentity,
    work: (repository: INewsAnalysisRepository) => Promise<T>,
  ): Promise<T> {
    // Transaction-scoped database lock also deduplicates different web-app workers.
    return this.db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${JSON.stringify(identity)}, 0))`,
      );
      const repository = new DrizzleNewsAnalysisRepository(tx as unknown as typeof databaseClient);
      return work(repository);
    });
  }
}
export const drizzleNewsAnalysisRepository = new DrizzleNewsAnalysisRepository();

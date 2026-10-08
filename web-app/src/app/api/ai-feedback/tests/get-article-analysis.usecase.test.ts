import { describe, expect, it, vi } from "vitest";

import type {
  IAIAnalysisService,
  SupervisedIdentity,
} from "../repositories/ai-analysis-service.interface";
import type {
  AnalysisCacheIdentity,
  INewsAnalysisRepository,
} from "../repositories/news-analysis.repository.interface";
import type { INewsArticleRepository } from "../repositories/news-article.repository.interface";
import { GetArticleAnalysisUseCase } from "../usecase/get-article-analysis.usecase";

import { prediction } from "./supervised-fixture";

import type { NewsAnalysis } from "@/server/shared/database/schemas/news-analyses";
import type { NewsArticle } from "@/server/shared/database/schemas/news-articles";

function fixture() {
  const rows: NewsAnalysis[] = [];
  const article = {
    id: "article-1",
    article: {
      content: "corpo original ".repeat(50),
      url: "https://example.com/news",
      title: "gabarito secreto",
    },
    targetClassification: "unreliable",
  } as NewsArticle;
  const identity: SupervisedIdentity = {
    modelVersion: prediction.modelVersion,
    policyVersion: prediction.policyVersion,
    artifactSha256: prediction.artifactSha256,
    inferenceVersion: prediction.inferenceVersion,
  };
  const matches = (row: NewsAnalysis, key: AnalysisCacheIdentity) =>
    Object.entries(key).every(([field, value]) => row[field as keyof NewsAnalysis] === value);
  const repository: INewsAnalysisRepository = {
    findByArticleId: vi.fn(async () => rows[0] ?? null),
    findByIdentity: vi.fn(async (key) => rows.find((row) => matches(row, key)) ?? null),
    create: vi.fn(async (data) => {
      const row = { ...data, confidence: null } as NewsAnalysis;
      rows.push(row);
      return row;
    }),
    withIdentityLock: async (_key, work) => work(repository),
  };
  const articles: INewsArticleRepository = {
    findById: vi.fn(async () => article),
    create: vi.fn(),
  };
  const service: IAIAnalysisService = {
    getIdentity: vi.fn(async () => ({ ...identity })),
    analyze: vi.fn(async () => ({ ...prediction, ...identity })),
  };
  const parser = vi.fn(async () => ({
    ...article.article,
    content: "safe parsed body ".repeat(50),
  }));
  const useCase = new GetArticleAnalysisUseCase(repository, articles, service, parser as never);
  return { rows, article, identity, repository, service, parser, useCase };
}
describe("Versioned supervised cache", () => {
  it("sends only raw body, caches exact identity, and shares concurrent inference", async () => {
    const f = fixture();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => f.useCase.execute({ articleId: "article-1" })),
    );
    expect(f.service.analyze).toHaveBeenCalledTimes(1);
    expect(f.service.analyze).toHaveBeenCalledWith(f.article.article.content);
    expect(new Set(results.map((value) => value.id)).size).toBe(1);
    expect(f.rows).toHaveLength(1);
    await f.useCase.execute({ articleId: "article-1" });
    expect(f.service.analyze).toHaveBeenCalledTimes(1);
    expect(f.repository.findByArticleId).not.toHaveBeenCalled();
  });
  it.each(["body", "artifact", "code"])("invalidates when %s changes", async (kind) => {
    const f = fixture();
    await f.useCase.execute({ articleId: "article-1" });
    if (kind === "body") f.article.article.content += " changed";
    if (kind === "artifact") f.identity.artifactSha256 = "b".repeat(64);
    if (kind === "code") f.identity.inferenceVersion = "serving-v2";
    await f.useCase.execute({ articleId: "article-1" });
    expect(f.service.analyze).toHaveBeenCalledTimes(2);
    expect(f.rows).toHaveLength(2);
  });
  it("does not reuse historical mock rows", async () => {
    const f = fixture();
    f.rows.push({ articleId: "article-1", modelVersion: "mock-v1" } as NewsAnalysis);
    expect((await f.useCase.execute({ articleId: "article-1" })).modelVersion).toBe(
      prediction.modelVersion,
    );
    expect(f.service.analyze).toHaveBeenCalledTimes(1);
  });
  it("transient failure has no fake score, is not cached, and allows retry", async () => {
    const f = fixture();
    vi.mocked(f.service.analyze).mockRejectedValueOnce(new Error("worker offline"));
    expect(await f.useCase.execute({ articleId: "article-1" })).toMatchObject({
      analysisStatus: "unavailable",
      classification: null,
      fakeScore: null,
    });
    expect(f.rows).toHaveLength(0);
    expect((await f.useCase.execute({ articleId: "article-1" })).analysisStatus).toBe("ok");
  });
  it("rejects stale identity or contradictory score from the motor without caching", async () => {
    const f = fixture();
    vi.mocked(f.service.analyze).mockResolvedValueOnce({
      ...prediction,
      inferenceVersion: "other-code",
    });
    expect((await f.useCase.execute({ articleId: "article-1" })).analysisStatus).toBe(
      "unavailable",
    );
    expect(f.rows).toHaveLength(0);
  });
  it("uses the saved URL safe parser only when body is empty", async () => {
    const f = fixture();
    f.article.article.content = "";
    await f.useCase.execute({ articleId: "article-1" });
    expect(f.parser).toHaveBeenCalledWith(f.article.article.url);
    expect(f.service.analyze).toHaveBeenCalledWith("safe parsed body ".repeat(50));
  });
});

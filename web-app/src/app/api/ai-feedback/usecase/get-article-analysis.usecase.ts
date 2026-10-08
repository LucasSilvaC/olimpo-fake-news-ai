import crypto from "node:crypto";

import { AIAnalysisEntity, type AIAnalysisDTO } from "../entities/ai-analysis.entity";
import type {
  AIAnalysisResult,
  IAIAnalysisService,
  SupervisedIdentity,
} from "../repositories/ai-analysis-service.interface";
import { drizzleNewsAnalysisRepository } from "../repositories/drizzle-news-analysis.repository";
import { drizzleNewsArticleRepository } from "../repositories/drizzle-news-article.repository";
import {
  httpAIAnalysisService,
  unavailableSupervisedAnalysis,
} from "../repositories/http-ai-analysis.service";
import type { INewsAnalysisRepository } from "../repositories/news-analysis.repository.interface";
import type { INewsArticleRepository } from "../repositories/news-article.repository.interface";
import { supervisedAnalysisSchema } from "../repositories/supervised-contract";

import { extractNews } from "@/lib/news/extract-news";

export interface GetArticleAnalysisInput {
  articleId: string;
}
export type GetArticleAnalysisOutput = AIAnalysisDTO;
export class GetArticleAnalysisUseCase {
  private readonly inFlight = new Map<string, Promise<AIAnalysisDTO>>();
  constructor(
    private readonly newsAnalysisRepository: INewsAnalysisRepository = drizzleNewsAnalysisRepository,
    private readonly newsArticleRepository: INewsArticleRepository = drizzleNewsArticleRepository,
    private readonly aiAnalysisService: IAIAnalysisService = httpAIAnalysisService,
    private readonly extractNewsFn = extractNews,
  ) {}
  async execute(input: GetArticleAnalysisInput): Promise<AIAnalysisDTO> {
    if (!input.articleId?.trim()) throw new Error("articleId cannot be empty");
    const article = await this.newsArticleRepository.findById(input.articleId);
    if (!article) throw new Error("Article not found");
    let text = article.article.content ?? "";
    if (!text.trim()) {
      try {
        text = (await this.extractNewsFn(article.article.url)).content;
      } catch {
        /* Safe parser failure becomes an explicit unavailable state. */
        return this.unavailable(input.articleId);
      }
    }
    let identity: SupervisedIdentity;
    try {
      identity = await this.aiAnalysisService.getIdentity();
    } catch {
      return this.unavailable(input.articleId);
    }
    const cacheIdentity = {
      ...identity,
      articleId: input.articleId,
      bodySha256: crypto.createHash("sha256").update(text, "utf8").digest("hex"),
    };
    const key = JSON.stringify(cacheIdentity);
    const pending = this.inFlight.get(key);
    if (pending) return pending;
    const work = this.newsAnalysisRepository.withIdentityLock(cacheIdentity, async (repository) => {
      const existing = await repository.findByIdentity(cacheIdentity);
      if (existing) return new AIAnalysisEntity(existing).toDTO();
      let result: AIAnalysisResult;
      try {
        result = supervisedAnalysisSchema.parse(await this.aiAnalysisService.analyze(text));
        if (
          Object.entries(identity).some(
            ([name, value]) => result[name as keyof SupervisedIdentity] !== value,
          )
        )
          throw new Error("Model identity changed during analysis");
      } catch {
        return this.unavailable(input.articleId, identity);
      }
      if (result.analysisStatus === "unavailable")
        return this.unavailable(input.articleId, identity);
      const saved = await repository.create({
        id: crypto.randomUUID(),
        ...cacheIdentity,
        ...result,
        createdAt: new Date(),
      });
      return new AIAnalysisEntity(saved).toDTO();
    });
    this.inFlight.set(key, work);
    try {
      return await work;
    } finally {
      this.inFlight.delete(key);
    }
  }
  private unavailable(articleId: string, identity?: SupervisedIdentity): AIAnalysisDTO {
    return {
      ...unavailableSupervisedAnalysis(identity),
      id: crypto.randomUUID(),
      articleId,
      createdAt: new Date(),
    };
  }
}
export const getArticleAnalysisUseCase = new GetArticleAnalysisUseCase();

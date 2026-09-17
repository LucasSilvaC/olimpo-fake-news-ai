import crypto from "node:crypto";

import { AIAnalysisDTO, AIAnalysisEntity } from "../entities/ai-analysis.entity";
import { IAIAnalysisService } from "../repositories/ai-analysis-service.interface";
import { drizzleNewsAnalysisRepository } from "../repositories/drizzle-news-analysis.repository";
import { drizzleNewsArticleRepository } from "../repositories/drizzle-news-article.repository";
import { mockAIAnalysisService } from "../repositories/mock-ai-analysis.service";
import { INewsAnalysisRepository } from "../repositories/news-analysis.repository.interface";
import { INewsArticleRepository } from "../repositories/news-article.repository.interface";

import { MLTargetType } from "@/server/shared/database/schemas/enums";

export interface GetArticleAnalysisInput {
  articleId: string;
  forceRefresh?: boolean;
  article?: {
    id?: string;
    title: string;
    content: string;
    targetClassification?: MLTargetType;
    source?: string | null;
    author?: string | null;
  };
}

export type GetArticleAnalysisOutput = AIAnalysisDTO;

export class GetArticleAnalysisUseCase {
  constructor(
    private readonly newsAnalysisRepository: INewsAnalysisRepository = drizzleNewsAnalysisRepository,
    private readonly newsArticleRepository: INewsArticleRepository = drizzleNewsArticleRepository,
    private readonly aiAnalysisService: IAIAnalysisService = mockAIAnalysisService,
  ) {}

  async execute(input: GetArticleAnalysisInput): Promise<GetArticleAnalysisOutput> {
    if (!input.articleId || input.articleId.trim() === "") {
      throw new Error("articleId cannot be empty");
    }

    if (!input.forceRefresh) {
      const existing = await this.newsAnalysisRepository.findByArticleId(input.articleId);
      if (existing) {
        const entity = new AIAnalysisEntity(existing);
        return entity.toDTO();
      }
    }

    let articleData = input.article;
    if (!articleData) {
      const articleRecord = await this.newsArticleRepository.findById(input.articleId);
      if (!articleRecord) {
        throw new Error(`Article with id "${input.articleId}" not found`);
      }
      articleData = {
        id: articleRecord.id,
        title: articleRecord.title,
        content: articleRecord.content,
        targetClassification: articleRecord.targetClassification as MLTargetType,
        source: articleRecord.source,
        author: articleRecord.author,
      };
    }

    const analysisResult = await this.aiAnalysisService.analyze({
      articleId: input.articleId,
      title: articleData.title,
      content: articleData.content,
      targetClassification: articleData.targetClassification,
      source: articleData.source,
      author: articleData.author,
    });

    const saved = await this.newsAnalysisRepository.create({
      id: crypto.randomUUID(),
      articleId: input.articleId,
      classification: analysisResult.classification,
      confidence: analysisResult.confidence.toString(),
      reasons: analysisResult.reasons,
      modelVersion: analysisResult.modelVersion,
      createdAt: new Date(),
    });

    const entity = new AIAnalysisEntity(saved);
    return entity.toDTO();
  }
}

export const getArticleAnalysisUseCase = new GetArticleAnalysisUseCase();

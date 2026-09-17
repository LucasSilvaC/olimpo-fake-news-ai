import { describe, expect, it, vi } from "vitest";

import { IAIAnalysisService } from "../repositories/ai-analysis-service.interface";
import { INewsAnalysisRepository } from "../repositories/news-analysis.repository.interface";
import { INewsArticleRepository } from "../repositories/news-article.repository.interface";
import { GetArticleAnalysisUseCase } from "../usecase/get-article-analysis.usecase";

import { NewsAnalysis, NewNewsAnalysis } from "@/server/shared/database/schemas/news-analyses";
import { NewsArticle, NewNewsArticle } from "@/server/shared/database/schemas/news-articles";

describe("GetArticleAnalysisUseCase", () => {
  const createMockRepositories = () => {
    const analysisDb: Map<string, NewsAnalysis> = new Map();
    const articleDb: Map<string, NewsArticle> = new Map();

    const analysisRepo: INewsAnalysisRepository = {
      findByArticleId: vi.fn(async (articleId: string) => analysisDb.get(articleId) ?? null),
      create: vi.fn(async (data: NewNewsAnalysis) => {
        const item: NewsAnalysis = {
          id: data.id,
          articleId: data.articleId,
          classification: data.classification,
          confidence: data.confidence ?? null,
          reasons: data.reasons,
          modelVersion: data.modelVersion ?? "mock-v1",
          createdAt: data.createdAt ?? new Date(),
        };
        analysisDb.set(data.articleId, item);
        return item;
      }),
    };

    const articleRepo: INewsArticleRepository = {
      findById: vi.fn(async (id: string) => articleDb.get(id) ?? null),
      create: vi.fn(async (data: NewNewsArticle) => {
        const item: NewsArticle = {
          id: data.id,
          url: data.url,
          title: data.title,
          content: data.content,
          source: data.source ?? null,
          author: data.author ?? null,
          publishedAt: data.publishedAt ?? null,
          targetClassification: data.targetClassification ?? "uncertain",
          createdAt: new Date(),
        };
        articleDb.set(data.id, item);
        return item;
      }),
    };

    const aiService: IAIAnalysisService = {
      analyze: vi.fn(async (article) => ({
        classification: article.targetClassification ?? "reliable",
        confidence: 0.95,
        reasons: ["Análise mock detalhada", "Fonte confiável"],
        modelVersion: "mock-v1",
      })),
    };

    return { analysisRepo, articleRepo, aiService, analysisDb, articleDb };
  };

  it("returns cached analysis if already present in repository", async () => {
    const { analysisRepo, articleRepo, aiService, analysisDb } = createMockRepositories();

    analysisDb.set("article-1", {
      id: "analysis-existing-1",
      articleId: "article-1",
      classification: "unreliable",
      confidence: "0.85",
      reasons: ["Razão salva em cache"],
      modelVersion: "mock-v1",
      createdAt: new Date(),
    });

    const usecase = new GetArticleAnalysisUseCase(analysisRepo, articleRepo, aiService);
    const result = await usecase.execute({ articleId: "article-1" });

    expect(result.id).toBe("analysis-existing-1");
    expect(result.classification).toBe("unreliable");
    expect(result.confidence).toBe(0.85);
    expect(result.reasons).toEqual(["Razão salva em cache"]);
    expect(aiService.analyze).not.toHaveBeenCalled();
    expect(analysisRepo.create).not.toHaveBeenCalled();
  });

  it("generates and persists analysis if not already cached", async () => {
    const { analysisRepo, articleRepo, aiService, articleDb } = createMockRepositories();

    articleDb.set("article-2", {
      id: "article-2",
      url: "https://noticia.com/artigo",
      title: "Descoberta Científica Relevante",
      content: "Pesquisa detalhada sobre avanços médicos.",
      source: "Revista Científica",
      author: "Dra. Maria",
      publishedAt: new Date(),
      targetClassification: "reliable",
      createdAt: new Date(),
    });

    const usecase = new GetArticleAnalysisUseCase(analysisRepo, articleRepo, aiService);
    const result = await usecase.execute({ articleId: "article-2" });

    expect(result.articleId).toBe("article-2");
    expect(result.classification).toBe("reliable");
    expect(result.confidence).toBe(0.95);
    expect(aiService.analyze).toHaveBeenCalledTimes(1);
    expect(analysisRepo.create).toHaveBeenCalledTimes(1);
  });

  it("forces re-generation when forceRefresh is true even if cached", async () => {
    const { analysisRepo, articleRepo, aiService, analysisDb, articleDb } =
      createMockRepositories();

    analysisDb.set("article-3", {
      id: "old-analysis",
      articleId: "article-3",
      classification: "uncertain",
      confidence: "0.50",
      reasons: ["Razão antiga"],
      modelVersion: "mock-v0",
      createdAt: new Date(),
    });

    articleDb.set("article-3", {
      id: "article-3",
      url: "https://noticia.com/artigo-3",
      title: "Artigo Atualizado",
      content: "Novo conteúdo verificado.",
      source: "Agência",
      author: "Editor",
      publishedAt: new Date(),
      targetClassification: "reliable",
      createdAt: new Date(),
    });

    const usecase = new GetArticleAnalysisUseCase(analysisRepo, articleRepo, aiService);
    const result = await usecase.execute({ articleId: "article-3", forceRefresh: true });

    expect(result.classification).toBe("reliable");
    expect(aiService.analyze).toHaveBeenCalledTimes(1);
    expect(analysisRepo.create).toHaveBeenCalledTimes(1);
  });

  it("uses provided inline article without querying articleRepository", async () => {
    const { analysisRepo, articleRepo, aiService } = createMockRepositories();

    const usecase = new GetArticleAnalysisUseCase(analysisRepo, articleRepo, aiService);
    const result = await usecase.execute({
      articleId: "inline-art-1",
      article: {
        title: "Notícia Inline",
        content: "Texto direto passado no usecase",
        targetClassification: "unreliable",
      },
    });

    expect(result.classification).toBe("unreliable");
    expect(articleRepo.findById).not.toHaveBeenCalled();
    expect(aiService.analyze).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Notícia Inline",
        targetClassification: "unreliable",
      }),
    );
  });

  it("throws error when article is not found and no inline article provided", async () => {
    const { analysisRepo, articleRepo, aiService } = createMockRepositories();

    const usecase = new GetArticleAnalysisUseCase(analysisRepo, articleRepo, aiService);

    await expect(usecase.execute({ articleId: "non-existing-article" })).rejects.toThrow(
      'Article with id "non-existing-article" not found',
    );
  });

  it("throws error when articleId is empty", async () => {
    const { analysisRepo, articleRepo, aiService } = createMockRepositories();

    const usecase = new GetArticleAnalysisUseCase(analysisRepo, articleRepo, aiService);

    await expect(usecase.execute({ articleId: "" })).rejects.toThrow("articleId cannot be empty");
    await expect(usecase.execute({ articleId: "   " })).rejects.toThrow(
      "articleId cannot be empty",
    );
  });
});

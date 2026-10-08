import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  populateChallenges,
  SEED_CHALLENGES,
  type SeedChallengeDefinition,
} from "../../scripts/populate-challenges";

import type { AIAnalysisResult } from "@/app/api/ai-feedback/repositories/ai-analysis-service.interface";
import type { INewsArticle } from "@/lib/news/types";
import { globalChallenges, newsAnalyses, newsArticles } from "@/server/shared/database/schemas";

interface InsertedArticleRecord {
  id: string;
  article: INewsArticle;
  targetClassification: string;
}
interface InsertedChallengeRecord {
  id: string;
  title: string;
  articleId: string;
  xpReward: number;
  isActive: boolean;
}
interface InsertedAnalysisRecord {
  id: string;
  articleId: string;
  classification: string;
  reasons: string[];
  confidence: string;
  modelVersion: string;
  createdAt: Date;
}

describe("populateChallenges script", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("SEED_CHALLENGES dataset", () => {
    it("should define exactly 3 seed challenges", () => {
      expect(SEED_CHALLENGES).toHaveLength(3);
    });

    it("should have a balanced classification distribution (1 reliable, 1 unreliable, 1 uncertain)", () => {
      const distribution = SEED_CHALLENGES.reduce(
        (acc, item) => {
          acc[item.targetClassification] = (acc[item.targetClassification] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      expect(distribution).toEqual({
        reliable: 1,
        unreliable: 1,
        uncertain: 1,
      });
    });

    it("should ensure all items have valid G1 URLs, titles, categories, and non-empty fallbacks", () => {
      for (const item of SEED_CHALLENGES) {
        expect(item.url).toMatch(/^https:\/\/g1\.globo\.com\//);
        expect(item.title.trim().length).toBeGreaterThan(10);
        expect(item.category.trim().length).toBeGreaterThan(2);
        expect(item.fallbackDescription.trim().length).toBeGreaterThan(20);
        expect(item.fallbackContent.trim().length).toBeGreaterThan(50);
        expect(["reliable", "unreliable", "uncertain"]).toContain(item.targetClassification);
      }
    });
  });

  describe("Idempotency", () => {
    it("should skip challenges if they already exist by title or URL", async () => {
      const mockExistingArticles = [
        {
          id: "existing-art-1",
          article: { url: SEED_CHALLENGES[0]!.url },
          targetClassification: "reliable",
        },
      ];
      const mockExistingChallenges = [
        {
          id: "existing-chal-2",
          title: SEED_CHALLENGES[1]!.title,
          articleId: "art-2",
        },
      ];

      const insertedArticles: unknown[] = [];
      const insertedChallenges: unknown[] = [];
      const insertedAnalyses: unknown[] = [];

      const mockDb = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table) => {
            if (table === globalChallenges) {
              return Promise.resolve(mockExistingChallenges);
            }
            if (table === newsArticles) {
              return Promise.resolve(mockExistingArticles);
            }
            return Promise.resolve([]);
          }),
        })),
        insert: vi.fn().mockImplementation((table) => ({
          values: vi.fn().mockImplementation((values) => {
            if (table === newsArticles) insertedArticles.push(values);
            if (table === globalChallenges) insertedChallenges.push(values);
            if (table === newsAnalyses) insertedAnalyses.push(values);
            return Promise.resolve();
          }),
        })),
      };

      const result = await populateChallenges(mockDb, {
        challenges: [SEED_CHALLENGES[0]!, SEED_CHALLENGES[1]!],
      });

      expect(result.insertedCount).toBe(0);
      expect(result.skippedCount).toBe(2);
      expect(result.totalProcessed).toBe(2);
      expect(insertedArticles).toHaveLength(0);
      expect(insertedChallenges).toHaveLength(0);
      expect(insertedAnalyses).toHaveLength(0);
    });

    it("should be completely idempotent when run consecutively against the same database state", async () => {
      const storedArticles: Array<{ id: string; article: { url: string } }> = [];
      const storedChallenges: Array<{ id: string; title: string }> = [];
      const storedAnalyses: Array<unknown> = [];

      const mockDb = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table) => {
            if (table === globalChallenges) return Promise.resolve([...storedChallenges]);
            if (table === newsArticles) return Promise.resolve([...storedArticles]);
            return Promise.resolve([]);
          }),
        })),
        insert: vi.fn().mockImplementation((table) => ({
          values: vi.fn().mockImplementation((values) => {
            if (table === newsArticles) {
              storedArticles.push({
                id: values.id,
                article: { url: values.article.url },
              });
            }
            if (table === globalChallenges) {
              storedChallenges.push({
                id: values.id,
                title: values.title,
              });
            }
            if (table === newsAnalyses) {
              storedAnalyses.push(values);
            }
            return Promise.resolve();
          }),
        })),
      };

      const mockExtract = vi.fn().mockResolvedValue({
        url: "https://g1.globo.com/teste",
        canonicalUrl: "https://g1.globo.com/teste",
        title: "Notícia Teste",
        description: "Descrição Teste",
        authors: ["Autor"],
        publishedAt: new Date().toISOString(),
        modifiedAt: null,
        content: "Conteúdo completo da notícia de teste.",
        imageUrl: null,
        publisher: "G1",
        language: "pt-BR",
        extractionMethod: "local",
        usedFallback: false,
      } as INewsArticle);

      // First run: inserts all 3 challenges
      const firstRun = await populateChallenges(mockDb, {
        challenges: SEED_CHALLENGES,
        extractNewsFn: mockExtract,
      });

      expect(firstRun.insertedCount).toBe(3);
      expect(firstRun.skippedCount).toBe(0);
      expect(storedChallenges).toHaveLength(3);
      expect(storedArticles).toHaveLength(3);
      expect(storedAnalyses).toHaveLength(3);

      // Second run: skips all 3 challenges
      const secondRun = await populateChallenges(mockDb, {
        challenges: SEED_CHALLENGES,
        extractNewsFn: mockExtract,
      });

      expect(secondRun.insertedCount).toBe(0);
      expect(secondRun.skippedCount).toBe(3);
      expect(storedChallenges).toHaveLength(3);
      expect(storedArticles).toHaveLength(3);
      expect(storedAnalyses).toHaveLength(3);
    });

    it("should clear existing challenges when clearExisting is set to true", async () => {
      const deleteMock = vi.fn().mockResolvedValue([]);
      const mockDb = {
        delete: vi
          .fn()
          .mockReturnValue({ where: deleteMock, then: (resolve: () => void) => resolve() }),
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockResolvedValue([]),
        })),
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockResolvedValue([]),
        })),
      };

      await populateChallenges(mockDb, {
        challenges: [SEED_CHALLENGES[0]!],
        clearExisting: true,
      });

      expect(mockDb.delete).toHaveBeenCalledWith(globalChallenges);
    });
  });

  describe("Extraction error resilience and model fallback", () => {
    it("should handle extraction and analysis failure gracefully and use fallback sample data and model analysis", async () => {
      const mockTestChallenge: SeedChallengeDefinition = {
        url: "https://g1.globo.com/planeta-bizarro/noticia/2019/09/04/gato-e-preso-suspeito-de-furto-nos-eua.ghtml",
        title: "Gato é 'preso' suspeito de furto nos EUA",
        category: "Planeta Bizarro",
        targetClassification: "reliable",
        fallbackDescription: "Descrição de fallback confiável",
        fallbackContent: "Conteúdo completo de fallback utilizado quando houver erro de rede.",
      };

      const insertedArticles: InsertedArticleRecord[] = [];
      const insertedChallenges: InsertedChallengeRecord[] = [];
      const insertedAnalyses: InsertedAnalysisRecord[] = [];

      const mockDb = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockResolvedValue([]),
        })),
        insert: vi.fn().mockImplementation((table) => ({
          values: vi.fn().mockImplementation((values) => {
            if (table === newsArticles) insertedArticles.push(values);
            if (table === globalChallenges) insertedChallenges.push(values);
            if (table === newsAnalyses) insertedAnalyses.push(values);
            return Promise.resolve();
          }),
        })),
      };

      const failingExtract = vi
        .fn()
        .mockRejectedValue(new Error("Network timeout: 504 Gateway Timeout"));

      const failingAnalyze = vi
        .fn()
        .mockRejectedValue(new Error("Model service unavailable: Connection refused"));

      const result = await populateChallenges(mockDb, {
        challenges: [mockTestChallenge],
        extractNewsFn: failingExtract,
        analyzeNewsFn: failingAnalyze,
      });

      expect(result.insertedCount).toBe(1);
      expect(result.skippedCount).toBe(0);

      // Verifies fallback data was populated in newsArticles
      expect(insertedArticles).toHaveLength(1);
      const articleRecord = insertedArticles[0]!;
      expect(articleRecord.targetClassification).toBe("reliable");
      expect(articleRecord.article.usedFallback).toBe(true);
      expect(articleRecord.article.description).toBe(mockTestChallenge.fallbackDescription);
      expect(articleRecord.article.content).toBe(mockTestChallenge.fallbackContent);
      expect(articleRecord.article.title).toBe(mockTestChallenge.title);

      // Verifies challenge was populated
      expect(insertedChallenges).toHaveLength(1);
      expect(insertedChallenges[0]!.title).toBe(mockTestChallenge.title);
      expect(insertedChallenges[0]!.xpReward).toBe(50);
      expect(insertedChallenges[0]!.isActive).toBe(true);

      // Verifies fallback model AI analysis was populated
      expect(insertedAnalyses).toHaveLength(1);
      expect(insertedAnalyses[0]!.classification).toBe("reliable");
      expect(insertedAnalyses[0]!.confidence).toBe("0.93");
      expect(insertedAnalyses[0]!.modelVersion).toBe("svm-spacy-chi2k10k-svd500-v1");
      expect(insertedAnalyses[0]!.reasons.length).toBeGreaterThan(0);

      // Verifies warnings were logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to extract from external URL"),
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to analyze with model-engine"),
      );
    });
  });

  describe("Successful extraction and model analysis flow", () => {
    it("should persist extracted article, challenge, and AI analysis using model-engine", async () => {
      const mockTestChallenge: SeedChallengeDefinition = {
        url: "https://g1.globo.com/pe/pernambuco/noticia/2026/10/07/incendio-predio-da-ufpe-video.ghtml?utm_source=chatgpt.com",
        title: "Incêndio de grandes proporções atinge prédio da UFPE no Recife; VÍDEO",
        category: "Pernambuco",
        targetClassification: "unreliable",
        fallbackDescription: "Descrição fallback",
        fallbackContent: "Conteúdo fallback",
      };

      const insertedArticles: InsertedArticleRecord[] = [];
      const insertedChallenges: InsertedChallengeRecord[] = [];
      const insertedAnalyses: InsertedAnalysisRecord[] = [];

      const mockDb = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockResolvedValue([]),
        })),
        insert: vi.fn().mockImplementation((table) => ({
          values: vi.fn().mockImplementation((values) => {
            if (table === newsArticles) insertedArticles.push(values);
            if (table === globalChallenges) insertedChallenges.push(values);
            if (table === newsAnalyses) insertedAnalyses.push(values);
            return Promise.resolve();
          }),
        })),
      };

      const extractedArticle: INewsArticle = {
        url: mockTestChallenge.url,
        canonicalUrl: mockTestChallenge.url,
        title: mockTestChallenge.title,
        description: "Descrição extraída com sucesso",
        authors: ["Jornalista G1"],
        publishedAt: "2026-10-07T20:00:00Z",
        modifiedAt: null,
        content:
          "Segundo testemunhas, o fogo começou por volta das 19h30 no campus da universidade.",
        imageUrl: "https://s2-g1.glbimg.com/incendio.jpg",
        publisher: "G1",
        language: "pt-BR",
        extractionMethod: "local",
        usedFallback: false,
      };

      const mockAnalysisResult: AIAnalysisResult = {
        analysisStatus: "ok",
        classification: "unreliable",
        fakeProbability: 0.6766,
        fakeScore: 67.66,
        scoreKind: "predicted_fake_probability",
        modelVersion: "svm-spacy-chi2k10k-svd500-v1",
        policyVersion: "olimpo-decision-policy-v1",
        artifactSha256: "artifact-sha",
        inferenceVersion: "inference-v1",
        reasons: [
          "Termos associados a notícias falsas no corpus de treino que influenciaram a previsão: 'informou', 'local'.",
        ],
        inputScope: {
          source: "article_body",
          wordLimit: 100,
          analyzedWordCount: 80,
          truncated: false,
        },
      };

      const mockExtract = vi.fn().mockResolvedValue(extractedArticle);
      const mockAnalyze = vi.fn().mockResolvedValue(mockAnalysisResult);

      const result = await populateChallenges(mockDb, {
        challenges: [mockTestChallenge],
        extractNewsFn: mockExtract,
        analyzeNewsFn: mockAnalyze,
      });

      expect(result.insertedCount).toBe(1);
      expect(mockAnalyze).toHaveBeenCalledWith(extractedArticle.content);
      expect(insertedArticles[0]!.article).toEqual(extractedArticle);
      expect(insertedArticles[0]!.targetClassification).toBe("unreliable");
      expect(insertedChallenges[0]!.title).toBe(mockTestChallenge.title);
      expect(insertedAnalyses[0]!.classification).toBe("unreliable");
      expect(insertedAnalyses[0]!.confidence).toBe("0.68");
      expect(insertedAnalyses[0]!.modelVersion).toBe("svm-spacy-chi2k10k-svd500-v1");
      expect(insertedAnalyses[0]!.reasons[0]).toContain("Termos associados a notícias falsas");
    });
  });
});

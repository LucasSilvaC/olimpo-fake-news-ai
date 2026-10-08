import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  populateChallenges,
  SEED_CHALLENGES,
  type SeedChallengeDefinition,
} from "../../scripts/populate-challenges";

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
    it("should define exactly 10 seed challenges", () => {
      expect(SEED_CHALLENGES).toHaveLength(10);
    });

    it("should have a balanced classification distribution (4 reliable, 3 unreliable, 3 uncertain)", () => {
      const distribution = SEED_CHALLENGES.reduce(
        (acc, item) => {
          acc[item.targetClassification] = (acc[item.targetClassification] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      expect(distribution).toEqual({
        reliable: 4,
        unreliable: 3,
        uncertain: 3,
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

      // First run: inserts all 10 challenges
      const firstRun = await populateChallenges(mockDb, {
        challenges: SEED_CHALLENGES,
        extractNewsFn: mockExtract,
      });

      expect(firstRun.insertedCount).toBe(10);
      expect(firstRun.skippedCount).toBe(0);
      expect(storedChallenges).toHaveLength(10);
      expect(storedArticles).toHaveLength(10);
      expect(storedAnalyses).toHaveLength(10);

      // Second run: skips all 10 challenges
      const secondRun = await populateChallenges(mockDb, {
        challenges: SEED_CHALLENGES,
        extractNewsFn: mockExtract,
      });

      expect(secondRun.insertedCount).toBe(0);
      expect(secondRun.skippedCount).toBe(10);
      expect(storedChallenges).toHaveLength(10);
      expect(storedArticles).toHaveLength(10);
      expect(storedAnalyses).toHaveLength(10);
    });
  });

  describe("Extraction error resilience", () => {
    it("should handle extraction failure gracefully and use fallback sample data", async () => {
      const mockTestChallenge: SeedChallengeDefinition = {
        url: "https://g1.globo.com/saude/noticia/teste-falha.ghtml",
        title: "Notícia com Falha de Extração",
        category: "Saúde",
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

      const result = await populateChallenges(mockDb, {
        challenges: [mockTestChallenge],
        extractNewsFn: failingExtract,
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

      // Verifies mock AI analysis was populated
      expect(insertedAnalyses).toHaveLength(1);
      expect(insertedAnalyses[0]!.classification).toBe("reliable");
      expect(insertedAnalyses[0]!.confidence).toBe("0.95");
      expect(insertedAnalyses[0]!.reasons.length).toBeGreaterThan(0);

      // Verifies warning was logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to extract from external URL"),
      );
    });
  });

  describe("Successful extraction flow", () => {
    it("should persist extracted article, challenge, and AI analysis with correct mock confidence", async () => {
      const mockTestChallenge: SeedChallengeDefinition = {
        url: "https://g1.globo.com/fato-ou-fake/noticia/teste-fake.ghtml",
        title: "Notícia Desinformação Teste",
        category: "Fato ou Fake",
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
        publishedAt: "2026-02-01T12:00:00Z",
        modifiedAt: null,
        content: "Conteúdo extraído com sucesso da página oficial.",
        imageUrl: "https://s2-g1.glbimg.com/foto.jpg",
        publisher: "G1",
        language: "pt-BR",
        extractionMethod: "local",
        usedFallback: false,
      };

      const mockExtract = vi.fn().mockResolvedValue(extractedArticle);

      const result = await populateChallenges(mockDb, {
        challenges: [mockTestChallenge],
        extractNewsFn: mockExtract,
      });

      expect(result.insertedCount).toBe(1);
      expect(insertedArticles[0]!.article).toEqual(extractedArticle);
      expect(insertedArticles[0]!.targetClassification).toBe("unreliable");
      expect(insertedChallenges[0]!.title).toBe(mockTestChallenge.title);
      expect(insertedAnalyses[0]!.classification).toBe("unreliable");
      expect(insertedAnalyses[0]!.confidence).toBe("0.98");
      expect(insertedAnalyses[0]!.reasons[0]).toContain("Alegações factuais inconsistentes");
    });
  });
});

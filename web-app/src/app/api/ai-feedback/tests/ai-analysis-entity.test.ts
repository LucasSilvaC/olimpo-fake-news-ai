import { describe, expect, it } from "vitest";

import { AIAnalysisEntity } from "../entities/ai-analysis.entity";

import { MLTargetType } from "@/server/shared/database/schemas/enums";

describe("AIAnalysisEntity", () => {
  describe("Validation helpers", () => {
    it("validates classification values correctly", () => {
      expect(AIAnalysisEntity.validateClassification("reliable")).toBe(true);
      expect(AIAnalysisEntity.validateClassification("uncertain")).toBe(true);
      expect(AIAnalysisEntity.validateClassification("unreliable")).toBe(true);
      expect(AIAnalysisEntity.validateClassification("fake")).toBe(false);
      expect(AIAnalysisEntity.validateClassification("")).toBe(false);
      expect(AIAnalysisEntity.validateClassification(null)).toBe(false);
    });

    it("validates confidence values correctly", () => {
      expect(AIAnalysisEntity.validateConfidence(0)).toBe(true);
      expect(AIAnalysisEntity.validateConfidence(0.5)).toBe(true);
      expect(AIAnalysisEntity.validateConfidence(1)).toBe(true);
      expect(AIAnalysisEntity.validateConfidence(-0.1)).toBe(false);
      expect(AIAnalysisEntity.validateConfidence(1.1)).toBe(false);
      expect(AIAnalysisEntity.validateConfidence(Number.NaN)).toBe(false);
    });

    it("validates reasons list correctly", () => {
      expect(AIAnalysisEntity.validateReasons(["Reason 1", "Reason 2"])).toBe(true);
      expect(AIAnalysisEntity.validateReasons([])).toBe(false);
      expect(AIAnalysisEntity.validateReasons([""])).toBe(false);
      expect(AIAnalysisEntity.validateReasons(["   "])).toBe(false);
      expect(AIAnalysisEntity.validateReasons(null)).toBe(false);
    });
  });

  describe("Instantiation and DTO conversion", () => {
    it("instantiates an entity with valid props and returns DTO", () => {
      const now = new Date();
      const entity = new AIAnalysisEntity({
        id: "analysis-1",
        articleId: "article-123",
        classification: "reliable",
        confidence: 0.95,
        reasons: ["Fontes confiáveis citadas", "Verificado por múltiplos veículos"],
        modelVersion: "mock-v1",
        createdAt: now,
      });

      expect(entity.id).toBe("analysis-1");
      expect(entity.articleId).toBe("article-123");
      expect(entity.classification).toBe("reliable");
      expect(entity.confidence).toBe(0.95);
      expect(entity.reasons).toEqual([
        "Fontes confiáveis citadas",
        "Verificado por múltiplos veículos",
      ]);
      expect(entity.modelVersion).toBe("mock-v1");
      expect(entity.createdAt).toBe(now);

      const dto = entity.toDTO();
      expect(dto).toEqual({
        id: "analysis-1",
        articleId: "article-123",
        classification: "reliable",
        reasons: ["Fontes confiáveis citadas", "Verificado por múltiplos veículos"],
        confidence: 0.95,
        modelVersion: "mock-v1",
        createdAt: now,
      });
    });

    it("handles numeric string confidence from database", () => {
      const entity = new AIAnalysisEntity({
        id: "analysis-1",
        articleId: "article-123",
        classification: "unreliable",
        confidence: "0.88" as unknown as number,
        reasons: ["Afirmação sensacionalista"],
        modelVersion: "mock-v1",
        createdAt: new Date(),
      });

      expect(entity.confidence).toBe(0.88);
    });

    it("throws error for empty id or articleId", () => {
      expect(
        () =>
          new AIAnalysisEntity({
            id: "",
            articleId: "article-1",
            classification: "reliable",
            confidence: 0.9,
            reasons: ["Valid reason"],
          }),
      ).toThrow("AIAnalysis id cannot be empty");

      expect(
        () =>
          new AIAnalysisEntity({
            id: "analysis-1",
            articleId: "",
            classification: "reliable",
            confidence: 0.9,
            reasons: ["Valid reason"],
          }),
      ).toThrow("AIAnalysis articleId cannot be empty");
    });

    it("throws error for invalid classification", () => {
      expect(
        () =>
          new AIAnalysisEntity({
            id: "analysis-1",
            articleId: "article-1",
            classification: "invalid-tier" as unknown as MLTargetType,
            confidence: 0.9,
            reasons: ["Valid reason"],
          }),
      ).toThrow('Invalid classification: "invalid-tier"');
    });

    it("throws error for invalid confidence", () => {
      expect(
        () =>
          new AIAnalysisEntity({
            id: "analysis-1",
            articleId: "article-1",
            classification: "reliable",
            confidence: 1.5,
            reasons: ["Valid reason"],
          }),
      ).toThrow("Invalid confidence: 1.5. Must be between 0 and 1.");
    });

    it("throws error for empty reasons array", () => {
      expect(
        () =>
          new AIAnalysisEntity({
            id: "analysis-1",
            articleId: "article-1",
            classification: "reliable",
            confidence: 0.9,
            reasons: [],
          }),
      ).toThrow("AIAnalysis reasons must be a non-empty array of strings");
    });
  });
});

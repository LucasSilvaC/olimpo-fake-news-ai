import { describe, expect, it } from "vitest";

import { AIAnalysisEntity } from "../entities/ai-analysis.entity";
import { supervisedAnalysisSchema } from "../repositories/supervised-contract";

import { prediction } from "./supervised-fixture";

describe("Supervised analysis contract", () => {
  it.each([0, 0.35, 0.5, 0.65, 1])(
    "honors calibrated probability and inclusive policy boundaries: %s",
    (p) => {
      const classification = p <= 0.35 ? "reliable" : p >= 0.65 ? "unreliable" : "uncertain";
      const dto = new AIAnalysisEntity({
        ...prediction,
        id: "analysis-1",
        articleId: "article-1",
        createdAt: new Date(),
        classification,
        fakeProbability: p,
        fakeScore: p * 100,
      }).toDTO();
      expect(dto.fakeScore).toBe(p * 100);
      expect(dto).not.toHaveProperty("confidence");
    },
  );
  it.each([
    { fakeProbability: Infinity },
    { fakeProbability: NaN },
    { fakeScore: 19 },
    { classification: "unreliable" },
    { fakeProbability: -0.1 },
    { scoreKind: "reliability" },
    { inputScope: { ...prediction.inputScope, analyzedWordCount: 29 } },
    { unexpected: true },
  ])("rejects malformed or contradictory engine results %j", (override) => {
    expect(supervisedAnalysisSchema.safeParse({ ...prediction, ...override }).success).toBe(false);
  });
  it("keeps insufficient text and failures scores null", () => {
    expect(
      supervisedAnalysisSchema.parse({
        ...prediction,
        analysisStatus: "insufficient_text",
        classification: "uncertain",
        fakeProbability: null,
        fakeScore: null,
        inputScope: { ...prediction.inputScope, analyzedWordCount: 29 },
      }).fakeScore,
    ).toBeNull();
    expect(
      supervisedAnalysisSchema.safeParse({
        ...prediction,
        analysisStatus: "unavailable",
        classification: null,
      }).success,
    ).toBe(false);
  });
  it("rejects mock identities", () => {
    expect(
      supervisedAnalysisSchema.safeParse({ ...prediction, modelVersion: "mock-v1" }).success,
    ).toBe(false);
  });
});

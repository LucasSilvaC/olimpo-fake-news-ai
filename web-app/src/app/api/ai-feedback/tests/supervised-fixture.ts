import type { AIAnalysisResult } from "../repositories/ai-analysis-service.interface";

import type { NewsAnalysis } from "@/server/shared/database/schemas/news-analyses";
export const prediction: AIAnalysisResult = {
  analysisStatus: "ok",
  classification: "reliable",
  fakeProbability: 0.18,
  fakeScore: 18,
  scoreKind: "predicted_fake_probability",
  modelVersion: "svm-spacy-chi2k10k-svd500-v1",
  policyVersion: "olimpo-decision-policy-v1",
  artifactSha256: "a".repeat(64),
  inferenceVersion: "serving-v1",
  reasons: ["Termos medidos no texto influenciaram a previsão."],
  inputScope: { source: "article_body", wordLimit: 100, analyzedWordCount: 50, truncated: false },
};

export const predictionRecord: NewsAnalysis = {
  ...prediction,
  id: "analysis-test",
  articleId: "art-1",
  bodySha256: "b".repeat(64),
  confidence: null,
  createdAt: new Date("2026-01-01"),
};

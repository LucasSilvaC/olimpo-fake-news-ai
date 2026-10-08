import type { MLTargetType } from "@/server/shared/database/schemas/enums";

export interface SupervisedIdentity {
  modelVersion: string;
  policyVersion: string;
  artifactSha256: string;
  inferenceVersion: string;
}
export interface AnalysisInputScope {
  source: "article_body";
  wordLimit: 100;
  analyzedWordCount: number;
  truncated: boolean;
}
export interface AIAnalysisResult extends SupervisedIdentity {
  analysisStatus: "ok" | "insufficient_text" | "invalid_text" | "unavailable";
  classification: MLTargetType | null;
  fakeProbability: number | null;
  fakeScore: number | null;
  scoreKind: "predicted_fake_probability";
  reasons: string[];
  inputScope: AnalysisInputScope;
}
export interface IAIAnalysisService {
  getIdentity(): Promise<SupervisedIdentity>;
  analyze(text: string): Promise<AIAnalysisResult>;
}

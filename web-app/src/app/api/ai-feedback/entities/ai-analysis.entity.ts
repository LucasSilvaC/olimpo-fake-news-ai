import type { AIAnalysisResult } from "../repositories/ai-analysis-service.interface";
import { supervisedAnalysisSchema } from "../repositories/supervised-contract";

import type { NewsAnalysis } from "@/server/shared/database/schemas/news-analyses";

export interface AIAnalysisDTO extends AIAnalysisResult {
  id: string;
  articleId: string;
  createdAt: Date;
}
export class AIAnalysisEntity {
  private readonly dto: AIAnalysisDTO;
  constructor(props: AIAnalysisDTO | NewsAnalysis) {
    if (!props.id?.trim() || !props.articleId?.trim())
      throw new Error("Analysis identity is required");
    const { id, articleId, createdAt } = props;
    const result = supervisedAnalysisSchema.parse({
      analysisStatus: props.analysisStatus,
      classification: props.classification,
      fakeProbability: props.fakeProbability,
      fakeScore: props.fakeScore,
      scoreKind: props.scoreKind,
      reasons: props.reasons,
      modelVersion: props.modelVersion,
      policyVersion: props.policyVersion,
      artifactSha256: props.artifactSha256,
      inferenceVersion: props.inferenceVersion,
      inputScope: props.inputScope,
    });
    this.dto = { ...result, id, articleId, createdAt };
  }
  toDTO(): AIAnalysisDTO {
    return { ...this.dto, reasons: [...this.dto.reasons], inputScope: { ...this.dto.inputScope } };
  }
}

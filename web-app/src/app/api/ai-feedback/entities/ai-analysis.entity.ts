import { MLTargetType } from "@/server/shared/database/schemas/enums";
import { NewsAnalysis } from "@/server/shared/database/schemas/news-analyses";

export interface AIAnalysisDTO {
  id: string;
  articleId: string;
  classification: MLTargetType;
  reasons: string[];
  confidence: number;
  modelVersion: string;
  createdAt: Date;
}

export interface CreateAIAnalysisProps {
  id: string;
  articleId: string;
  classification: MLTargetType;
  reasons: string[];
  confidence: number;
  modelVersion?: string;
  createdAt?: Date;
}

const VALID_CLASSIFICATIONS: MLTargetType[] = ["reliable", "uncertain", "unreliable"];

export class AIAnalysisEntity {
  readonly id: string;
  readonly articleId: string;
  readonly classification: MLTargetType;
  readonly reasons: string[];
  readonly confidence: number;
  readonly modelVersion: string;
  readonly createdAt: Date;

  constructor(props: CreateAIAnalysisProps | NewsAnalysis) {
    if (!props.id || props.id.trim() === "") {
      throw new Error("AIAnalysis id cannot be empty");
    }
    if (!props.articleId || props.articleId.trim() === "") {
      throw new Error("AIAnalysis articleId cannot be empty");
    }

    if (!AIAnalysisEntity.validateClassification(props.classification)) {
      throw new Error(`Invalid classification: "${props.classification}"`);
    }

    const numericConfidence =
      typeof props.confidence === "number"
        ? props.confidence
        : Number.parseFloat(props.confidence as string);

    if (!AIAnalysisEntity.validateConfidence(numericConfidence)) {
      throw new Error(`Invalid confidence: ${props.confidence}. Must be between 0 and 1.`);
    }

    if (!AIAnalysisEntity.validateReasons(props.reasons)) {
      throw new Error("AIAnalysis reasons must be a non-empty array of strings");
    }

    this.id = props.id;
    this.articleId = props.articleId;
    this.classification = props.classification as MLTargetType;
    this.confidence = numericConfidence;
    this.reasons = Array.isArray(props.reasons) ? [...props.reasons] : [];
    this.modelVersion = props.modelVersion ?? "mock-v1";
    this.createdAt = props.createdAt instanceof Date ? props.createdAt : new Date();
  }

  static validateClassification(classification: unknown): classification is MLTargetType {
    return (
      typeof classification === "string" &&
      VALID_CLASSIFICATIONS.includes(classification as MLTargetType)
    );
  }

  static validateConfidence(confidence: unknown): boolean {
    return (
      typeof confidence === "number" &&
      !Number.isNaN(confidence) &&
      confidence >= 0 &&
      confidence <= 1
    );
  }

  static validateReasons(reasons: unknown): reasons is string[] {
    return (
      Array.isArray(reasons) &&
      reasons.length > 0 &&
      reasons.every((r) => typeof r === "string" && r.trim().length > 0)
    );
  }

  toDTO(): AIAnalysisDTO {
    return {
      id: this.id,
      articleId: this.articleId,
      classification: this.classification,
      reasons: [...this.reasons],
      confidence: this.confidence,
      modelVersion: this.modelVersion,
      createdAt: this.createdAt,
    };
  }
}

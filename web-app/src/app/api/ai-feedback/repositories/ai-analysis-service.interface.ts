import { MLTargetType } from "@/server/shared/database/schemas/enums";

export interface ArticleAnalysisInput {
  articleId?: string;
  title: string;
  content: string;
  targetClassification?: MLTargetType;
  source?: string | null;
  author?: string | null;
}

export interface AIAnalysisResult {
  classification: MLTargetType;
  confidence: number;
  reasons: string[];
  modelVersion: string;
}

export interface IAIAnalysisService {
  analyze(article: ArticleAnalysisInput): Promise<AIAnalysisResult>;
}

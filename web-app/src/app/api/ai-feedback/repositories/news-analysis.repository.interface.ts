import type { SupervisedIdentity } from "./ai-analysis-service.interface";

import type { NewsAnalysis, NewNewsAnalysis } from "@/server/shared/database/schemas/news-analyses";
export interface AnalysisCacheIdentity extends SupervisedIdentity {
  articleId: string;
  bodySha256: string;
}
export interface INewsAnalysisRepository {
  findByArticleId(articleId: string): Promise<NewsAnalysis | null>;
  findByIdentity(identity: AnalysisCacheIdentity): Promise<NewsAnalysis | null>;
  create(data: NewNewsAnalysis): Promise<NewsAnalysis>;
  withIdentityLock<T>(
    identity: AnalysisCacheIdentity,
    work: (repository: INewsAnalysisRepository) => Promise<T>,
  ): Promise<T>;
}

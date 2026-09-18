import { NewsAnalysis, NewNewsAnalysis } from "@/server/shared/database/schemas/news-analyses";

export interface INewsAnalysisRepository {
  findByArticleId(articleId: string): Promise<NewsAnalysis | null>;
  create(data: NewNewsAnalysis): Promise<NewsAnalysis>;
}

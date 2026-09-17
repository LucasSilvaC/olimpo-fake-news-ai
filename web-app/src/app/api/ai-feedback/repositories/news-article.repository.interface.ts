import { NewsArticle, NewNewsArticle } from "@/server/shared/database/schemas/news-articles";

export interface INewsArticleRepository {
  findById(id: string): Promise<NewsArticle | null>;
  create(data: NewNewsArticle): Promise<NewsArticle>;
}

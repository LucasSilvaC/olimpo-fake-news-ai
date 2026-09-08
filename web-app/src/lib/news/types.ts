export type ExtractionMethod = "local" | "jina";

export interface INewsArticle {
  url: string;
  canonicalUrl: string | null;
  title: string | null;
  description: string | null;
  authors: string[];
  publishedAt: string | null;
  modifiedAt: string | null;
  content: string;
  imageUrl: string | null;
  publisher: string | null;
  language: string | null;
  extractionMethod: ExtractionMethod;
  usedFallback: boolean;
}

export type ArticleFields = Partial<Omit<INewsArticle, "url" | "extractionMethod" | "usedFallback">>;

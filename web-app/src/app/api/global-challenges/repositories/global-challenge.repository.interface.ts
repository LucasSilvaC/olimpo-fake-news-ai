import { GlobalChallenge, NewGlobalChallenge, NewsArticle } from "@/server/shared/database/schemas";

export type GlobalChallengeWithArticle = GlobalChallenge & {
  article: NewsArticle;
};

export interface IGlobalChallengeRepository {
  findById(id: string): Promise<GlobalChallenge | null>;
  findByIdWithArticle(id: string): Promise<GlobalChallengeWithArticle | null>;
  listActive(): Promise<GlobalChallengeWithArticle[]>;
  create(data: NewGlobalChallenge): Promise<GlobalChallenge>;
}

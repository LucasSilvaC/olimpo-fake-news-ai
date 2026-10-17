import type { GlobalChallengeDTO, GlobalChallengeEntityProps } from "../entities";

import type { INewsArticle } from "@/lib/news/types";
import type { MLTargetType } from "@/server/shared/domain/game-vocabulary";

export interface GlobalChallengeArticleReadModel {
  id: string;
  targetClassification: MLTargetType;
  article: INewsArticle;
  createdAt: Date;
}

export interface GlobalChallengeReadModel extends GlobalChallengeDTO {
  article: GlobalChallengeArticleReadModel;
}

export type GlobalChallengeWithArticle = GlobalChallengeReadModel;

export interface IGlobalChallengeRepository {
  findById(id: string): Promise<GlobalChallengeDTO | null>;
  findByIdWithArticle(id: string): Promise<GlobalChallengeReadModel | null>;
  listActive(): Promise<GlobalChallengeReadModel[]>;
  create(data: GlobalChallengeEntityProps): Promise<GlobalChallengeDTO>;
}

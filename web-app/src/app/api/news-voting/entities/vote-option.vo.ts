import {
  NEWS_CLASSIFICATIONS,
  isNewsClassification,
  normalizeNewsClassification,
  type VoteOptionType,
} from "@/server/shared/domain/game-vocabulary";

export const VALID_VOTE_OPTIONS: readonly VoteOptionType[] = NEWS_CLASSIFICATIONS;

export class VoteOption {
  public static isValid(value: unknown): value is VoteOptionType {
    return isNewsClassification(value);
  }

  public static normalize(value: unknown): VoteOptionType {
    return normalizeNewsClassification(value, "vote option");
  }
}

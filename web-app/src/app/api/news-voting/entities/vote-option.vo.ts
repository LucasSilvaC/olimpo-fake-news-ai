import { VoteOptionType } from "@/server/shared/database/schemas/enums";

export const VALID_VOTE_OPTIONS: readonly VoteOptionType[] = [
  "reliable",
  "uncertain",
  "unreliable",
] as const;

export class VoteOption {
  public static isValid(value: unknown): value is VoteOptionType {
    if (typeof value !== "string") return false;
    return VALID_VOTE_OPTIONS.includes(value.toLowerCase().trim() as VoteOptionType);
  }

  public static normalize(value: unknown): VoteOptionType {
    if (!VoteOption.isValid(value)) {
      throw new Error(
        `Invalid vote option: ${String(value)}. Must be one of: ${VALID_VOTE_OPTIONS.join(", ")}`,
      );
    }
    return (value as string).toLowerCase().trim() as VoteOptionType;
  }
}

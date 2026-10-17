export type RoleType = "host" | "participant";
export type UserRoleType = "participant" | "admin";
export type RoomStatus = "waiting" | "in_progress" | "finished";
export type NewsClassification = "reliable" | "uncertain" | "unreliable";
export type MLTargetType = NewsClassification;
export type VoteOptionType = NewsClassification;

export const NEWS_CLASSIFICATIONS: readonly NewsClassification[] = [
  "reliable",
  "uncertain",
  "unreliable",
];

export function isNewsClassification(value: unknown): value is NewsClassification {
  return (
    typeof value === "string" &&
    NEWS_CLASSIFICATIONS.includes(value.trim().toLowerCase() as NewsClassification)
  );
}

export function normalizeNewsClassification(
  value: unknown,
  label: "classification" | "vote option" = "classification",
): NewsClassification {
  if (!isNewsClassification(value)) {
    throw new Error(
      `Invalid ${label}: ${String(value)}. Must be one of: ${NEWS_CLASSIFICATIONS.join(", ")}`,
    );
  }
  return value.trim().toLowerCase() as NewsClassification;
}

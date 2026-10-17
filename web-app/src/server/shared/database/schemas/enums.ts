import { pgEnum } from "drizzle-orm/pg-core";
export type { MLTargetType, RoleType, RoomStatus, UserRoleType, VoteOptionType } from "@/server/shared/domain/game-vocabulary";

export const roleTypeEnum = pgEnum("role_type", ["host", "participant"]);
export const userRoleEnum = pgEnum("user_role_type", ["participant", "admin"]);
export const roomStatusEnum = pgEnum("room_status_type", ["waiting", "in_progress", "finished"]);
export const mlTargetTypeEnum = pgEnum("ml_target_type", ["reliable", "uncertain", "unreliable"]);
export const voteOptionTypeEnum = pgEnum("vote_option_type", [
  "reliable",
  "uncertain",
  "unreliable",
]);

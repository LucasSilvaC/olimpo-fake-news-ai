import { pgEnum } from "drizzle-orm/pg-core";

export const roleTypeEnum = pgEnum("role_type", ["host", "participant"]);
export const roomStatusEnum = pgEnum("room_status_type", ["waiting", "in_progress", "finished"]);
export const mlTargetTypeEnum = pgEnum("ml_target_type", ["reliable", "uncertain", "unreliable"]);
export const voteOptionTypeEnum = pgEnum("vote_option_type", ["reliable", "uncertain", "unreliable"]);

export type RoleType = "host" | "participant";
export type RoomStatus = "waiting" | "in_progress" | "finished";
export type MLTargetType = "reliable" | "uncertain" | "unreliable";
export type VoteOptionType = "reliable" | "uncertain" | "unreliable";

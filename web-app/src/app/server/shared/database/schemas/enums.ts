import { pgEnum } from "drizzle-orm/pg-core";

export const mlTargetEnum = pgEnum("ml_target_type", ["reliable", "uncertain", "unreliable"]);
export const voteOptionEnum = pgEnum("vote_option_type", ["reliable", "uncertain", "unreliable"]);
export const roomStatusEnum = pgEnum("room_status_type", ["waiting", "in_progress", "finished"]);
export const roomMemberRoleEnum = pgEnum("room_member_role", ["host", "participant"]);

export type MlTargetType = (typeof mlTargetEnum.enumValues)[number];
export type VoteOptionType = (typeof voteOptionEnum.enumValues)[number];
export type RoomStatusType = (typeof roomStatusEnum.enumValues)[number];
export type RoomMemberRoleType = (typeof roomMemberRoleEnum.enumValues)[number];

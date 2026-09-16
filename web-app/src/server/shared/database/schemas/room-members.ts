import { pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { roleTypeEnum } from "./enums";
import { rooms } from "./rooms";
import { users } from "./users";

export const roomMembers = pgTable(
  "room_members",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleTypeEnum("role").notNull().default("participant"),
    score: integer("score").notNull().default(0),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("room_members_room_user_idx").on(table.roomId, table.userId),
  ],
);

export type RoomMember = typeof roomMembers.$inferSelect;
export type NewRoomMember = typeof roomMembers.$inferInsert;

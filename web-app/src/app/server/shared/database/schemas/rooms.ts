import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { roomMemberRoleEnum, roomStatusEnum } from "./enums";
import { newsArticles } from "./news";
import { users } from "./users";

export const rooms = pgTable("rooms", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pin: text("pin").notNull().unique(),
  name: text("name").notNull(),
  hostId: text("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: roomStatusEnum("status").notNull().default("waiting"),
  roundDurationSeconds: integer("round_duration_seconds").notNull().default(30),
  currentRound: integer("current_round").notNull().default(0),
  totalRounds: integer("total_rounds").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roomMembers = pgTable(
  "room_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roomMemberRoleEnum("role").notNull().default("participant"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("room_members_room_user_idx").on(table.roomId, table.userId),
  ]
);

export const roomPlaylistItems = pgTable(
  "room_playlist_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    articleId: text("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    roundOrder: integer("round_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("room_playlist_items_room_order_idx").on(table.roomId, table.roundOrder),
  ]
);

export type RoomRecord = typeof rooms.$inferSelect;
export type NewRoomRecord = typeof rooms.$inferInsert;
export type RoomMemberRecord = typeof roomMembers.$inferSelect;
export type NewRoomMemberRecord = typeof roomMembers.$inferInsert;
export type RoomPlaylistItemRecord = typeof roomPlaylistItems.$inferSelect;
export type NewRoomPlaylistItemRecord = typeof roomPlaylistItems.$inferInsert;

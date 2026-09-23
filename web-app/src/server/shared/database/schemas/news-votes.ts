import { pgTable, text, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";

import { voteOptionTypeEnum } from "./enums";
import { roomPlaylistItems } from "./room-playlist-items";
import { rooms } from "./rooms";
import { users } from "./users";

export const newsVotes = pgTable(
  "news_votes",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    playlistItemId: text("playlist_item_id")
      .notNull()
      .references(() => roomPlaylistItems.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vote: voteOptionTypeEnum("vote").notNull(),
    isCorrect: boolean("is_correct"),
    pointsAwarded: integer("points_awarded").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("news_votes_playlist_item_user_idx").on(table.playlistItemId, table.userId),
  ],
);

export type NewsVote = typeof newsVotes.$inferSelect;
export type NewNewsVote = typeof newsVotes.$inferInsert;

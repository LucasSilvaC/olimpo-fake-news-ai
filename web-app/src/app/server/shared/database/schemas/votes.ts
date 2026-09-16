import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { voteOptionEnum } from "./enums";
import { roomPlaylistItems } from "./rooms";
import { users } from "./users";

export const newsVotes = pgTable(
  "news_votes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    playlistItemId: text("playlist_item_id")
      .notNull()
      .references(() => roomPlaylistItems.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vote: voteOptionEnum("vote").notNull(),
    isCorrect: boolean("is_correct"),
    pointsEarned: integer("points_earned").notNull().default(0),
    votedAt: timestamp("voted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("news_votes_playlist_item_user_idx").on(table.playlistItemId, table.userId),
  ]
);

export type NewsVoteRecord = typeof newsVotes.$inferSelect;
export type NewNewsVoteRecord = typeof newsVotes.$inferInsert;

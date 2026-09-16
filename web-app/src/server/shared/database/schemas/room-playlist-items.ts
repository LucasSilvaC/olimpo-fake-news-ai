import { pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { rooms } from "./rooms";
import { newsArticles } from "./news-articles";

export const roomPlaylistItems = pgTable(
  "room_playlist_items",
  {
    id: text("id").primaryKey(),
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
  ],
);

export type RoomPlaylistItem = typeof roomPlaylistItems.$inferSelect;
export type NewRoomPlaylistItem = typeof roomPlaylistItems.$inferInsert;

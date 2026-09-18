import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

import { newsArticles } from "./news-articles";

export const globalChallenges = pgTable("global_challenges", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  articleId: text("article_id")
    .notNull()
    .references(() => newsArticles.id, { onDelete: "cascade" }),
  xpReward: integer("xp_reward").notNull().default(50),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GlobalChallenge = typeof globalChallenges.$inferSelect;
export type NewGlobalChallenge = typeof globalChallenges.$inferInsert;

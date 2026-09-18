import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { mlTargetTypeEnum } from "./enums";

export const newsArticles = pgTable("news_articles", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  source: text("source"),
  author: text("author"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  targetClassification: mlTargetTypeEnum("target_classification").notNull().default("uncertain"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsArticle = typeof newsArticles.$inferSelect;
export type NewNewsArticle = typeof newsArticles.$inferInsert;

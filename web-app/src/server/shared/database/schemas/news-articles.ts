import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { mlTargetTypeEnum } from "./enums";

import { INewsArticle } from "@/lib/news/types";

export const newsArticles = pgTable("news_articles", {
  id: text("id").primaryKey(),
  article: jsonb("article").$type<INewsArticle>().notNull(),
  targetClassification: mlTargetTypeEnum("target_classification").notNull().default("uncertain"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsArticle = typeof newsArticles.$inferSelect;
export type NewNewsArticle = typeof newsArticles.$inferInsert;

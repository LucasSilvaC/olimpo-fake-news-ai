import { doublePrecision, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { mlTargetEnum } from "./enums";

export const newsArticles = pgTable("news_articles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceUrl: text("source_url"),
  sourceDomain: text("source_domain"),
  imageUrl: text("image_url"),
  groundTruthClassification: mlTargetEnum("ground_truth_classification").notNull().default("reliable"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsAnalyses = pgTable("news_analyses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  articleId: text("article_id")
    .notNull()
    .references(() => newsArticles.id, { onDelete: "cascade" }),
  classification: mlTargetEnum("classification").notNull(),
  rationale: jsonb("rationale").$type<string[]>().notNull(),
  confidence: doublePrecision("confidence").notNull().default(1.0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsArticleRecord = typeof newsArticles.$inferSelect;
export type NewNewsArticleRecord = typeof newsArticles.$inferInsert;
export type NewsAnalysisRecord = typeof newsAnalyses.$inferSelect;
export type NewNewsAnalysisRecord = typeof newsAnalyses.$inferInsert;

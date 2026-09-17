import { pgTable, text, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";

import { mlTargetTypeEnum } from "./enums";
import { newsArticles } from "./news-articles";

export const newsAnalyses = pgTable("news_analyses", {
  id: text("id").primaryKey(),
  articleId: text("article_id")
    .notNull()
    .references(() => newsArticles.id, { onDelete: "cascade" }),
  classification: mlTargetTypeEnum("classification").notNull(),
  reasons: jsonb("reasons").notNull().$type<string[]>(),
  confidence: numeric("confidence", { precision: 4, scale: 2 }),
  modelVersion: text("model_version").notNull().default("mock-v1"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NewsAnalysis = typeof newsAnalyses.$inferSelect;
export type NewNewsAnalysis = typeof newsAnalyses.$inferInsert;

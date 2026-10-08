import {
  pgTable,
  text,
  timestamp,
  numeric,
  jsonb,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { mlTargetTypeEnum } from "./enums";
import { newsArticles } from "./news-articles";

import type { AnalysisInputScope } from "@/app/api/ai-feedback/repositories/ai-analysis-service.interface";

export const newsAnalyses = pgTable(
  "news_analyses",
  {
    id: text("id").primaryKey(),
    articleId: text("article_id")
      .notNull()
      .references(() => newsArticles.id, { onDelete: "cascade" }),
    classification: mlTargetTypeEnum("classification"),
    reasons: jsonb("reasons").notNull().$type<string[]>(),
    confidence: numeric("confidence", { precision: 4, scale: 2 }), // Legacy historical rows only.
    modelVersion: text("model_version").notNull().default("mock-v1"),
    analysisStatus: text("analysis_status").notNull().default("legacy"),
    fakeProbability: doublePrecision("fake_probability"),
    fakeScore: doublePrecision("fake_score"),
    scoreKind: text("score_kind"),
    policyVersion: text("policy_version"),
    bodySha256: text("body_sha256"),
    artifactSha256: text("artifact_sha256"),
    inferenceVersion: text("inference_version"),
    inputScope: jsonb("input_scope").$type<AnalysisInputScope>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("news_analyses_supervised_identity_unique").on(
      table.articleId,
      table.bodySha256,
      table.artifactSha256,
      table.inferenceVersion,
      table.policyVersion,
    ),
  ],
);
export type NewsAnalysis = typeof newsAnalyses.$inferSelect;
export type NewNewsAnalysis = typeof newsAnalyses.$inferInsert;

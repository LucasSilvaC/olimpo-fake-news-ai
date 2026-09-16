import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { voteOptionEnum } from "./enums";
import { newsArticles } from "./news";
import { users } from "./users";

export const globalChallenges = pgTable("global_challenges", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  articleId: text("article_id")
    .notNull()
    .references(() => newsArticles.id, { onDelete: "cascade" }),
  xpReward: integer("xp_reward").notNull().default(50),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const globalChallengeAnswers = pgTable(
  "global_challenge_answers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => globalChallenges.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vote: voteOptionEnum("vote").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    xpEarned: integer("xp_earned").notNull().default(0),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("global_challenge_answers_challenge_user_idx").on(table.challengeId, table.userId),
  ]
);

export type GlobalChallengeRecord = typeof globalChallenges.$inferSelect;
export type NewGlobalChallengeRecord = typeof globalChallenges.$inferInsert;
export type GlobalChallengeAnswerRecord = typeof globalChallengeAnswers.$inferSelect;
export type NewGlobalChallengeAnswerRecord = typeof globalChallengeAnswers.$inferInsert;

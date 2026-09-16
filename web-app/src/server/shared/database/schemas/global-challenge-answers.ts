import { pgTable, text, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { voteOptionTypeEnum } from "./enums";
import { globalChallenges } from "./global-challenges";
import { users } from "./users";

export const globalChallengeAnswers = pgTable(
  "global_challenge_answers",
  {
    id: text("id").primaryKey(),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => globalChallenges.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    answer: voteOptionTypeEnum("answer").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    xpAwarded: integer("xp_awarded").notNull().default(0),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("global_challenge_answers_challenge_user_idx").on(table.challengeId, table.userId),
  ],
);

export type GlobalChallengeAnswer = typeof globalChallengeAnswers.$inferSelect;
export type NewGlobalChallengeAnswer = typeof globalChallengeAnswers.$inferInsert;

import { pgTable, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { roomStatusEnum } from "./enums";
import { users } from "./users";

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  pin: varchar("pin", { length: 7 }).notNull().unique(),
  name: text("name").notNull(),
  status: roomStatusEnum("status").notNull().default("waiting"),
  roundDurationSeconds: integer("round_duration_seconds").notNull().default(30),
  currentRound: integer("current_round").notNull().default(0),
  totalRounds: integer("total_rounds").notNull().default(0),
  hostId: text("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

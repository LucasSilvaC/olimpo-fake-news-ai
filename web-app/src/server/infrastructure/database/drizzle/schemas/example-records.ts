import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const exampleRecords = pgTable("example_records", { id: text("id").primaryKey(), title: text("title").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull() });

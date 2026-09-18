import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schemas";

const globalForDatabase = globalThis as unknown as {
  databaseClient?: ReturnType<typeof createDatabaseClient>;
};

export function createDatabaseClient() {
  const connectionString =
    process.env.DATABASE_URL || "postgres://acrux:acrux@localhost:5432/acrux_template";
  const sqlClient = postgres(connectionString, { max: 1 });
  return drizzle(sqlClient, { schema });
}

export const db = globalForDatabase.databaseClient ?? createDatabaseClient();
export const databaseClient = db;

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.databaseClient = db;
}

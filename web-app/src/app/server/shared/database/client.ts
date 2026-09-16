import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schemas";

import { requireDatabaseUrl } from "@/server/infrastructure/config/environment";

const globalForDatabase = globalThis as unknown as {
  databaseClient?: ReturnType<typeof createDatabaseClient>;
};

function createDatabaseClient() {
  const sqlClient = postgres(requireDatabaseUrl(), { max: 1 });
  return drizzle(sqlClient, { schema });
}

export const databaseClient = globalForDatabase.databaseClient ?? createDatabaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.databaseClient = databaseClient;
}

export type DatabaseClient = typeof databaseClient;

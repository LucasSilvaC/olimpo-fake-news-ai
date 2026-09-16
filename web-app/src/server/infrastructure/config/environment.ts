import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional().default("redis://localhost:6379"),
  AUTH_SECRET: z.string().optional().default("olimpo-jwt-secret-key-change-in-production-min-32-chars"),
  JINA_API_KEY: z.string().optional(),
});
const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export const environment = {
  server: serverEnvironmentSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    JINA_API_KEY: process.env.JINA_API_KEY,
  }),
  public: publicEnvironmentSchema.parse({ NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL }),
};

export function requireDatabaseUrl(): string {
  const databaseUrl = environment.server.DATABASE_URL;
  if (!databaseUrl)
    throw new Error("DATABASE_URL is required for database operations. Add it to .env.local.");
  return databaseUrl;
}

export function getRedisUrl(): string {
  return environment.server.REDIS_URL;
}

export function getAuthSecret(): string {
  return environment.server.AUTH_SECRET;
}

import "server-only";

import Redis from "ioredis";

import { getRedisUrl } from "@/server/infrastructure/config/environment";

const globalForRedis = globalThis as unknown as {
  redisClient?: Redis;
};

export function createRedisClient(): Redis {
  const redis = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  redis.on("error", (err) => {
    if (process.env.NODE_ENV !== "test") {
      console.error("[Redis Client Error]", err.message);
    }
  });

  return redis;
}

export const redisClient = globalForRedis.redisClient ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisClient = redisClient;
}

export type RedisClient = Redis;

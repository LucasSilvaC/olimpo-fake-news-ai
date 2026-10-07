// @vitest-environment node
import Redis from "ioredis";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  PRESENCE_DISCONNECT_GRACE_MS,
  RedisRoomPresence,
} from "../repositories/redis-room-presence";

// Run against an isolated Redis: ROOM_PRESENCE_REDIS_URL=redis://127.0.0.1:16389
describe.skipIf(!process.env.ROOM_PRESENCE_REDIS_URL)("Redis room presence (integration)", () => {
  let redis: Redis;
  let presence: RedisRoomPresence;
  let roomId: string;
  let pin: string;
  let connectionsKey: string;

  beforeEach(() => {
    redis = new Redis(process.env.ROOM_PRESENCE_REDIS_URL!, { maxRetriesPerRequest: 1 });
    presence = new RedisRoomPresence(redis);
    roomId = crypto.randomUUID();
    pin = `test-${roomId}`;
    connectionsKey = `room:{${roomId}}:presence:connections`;
  });
  afterEach(async () => {
    await redis.del(connectionsKey, `room:{${roomId}}:presence:snapshot`);
    await redis.quit();
  });

  it("keeps a participant online while another tab is connected", async () => {
    await presence.touch(roomId, pin, "player|tab-1");
    await presence.touch(roomId, pin, "player|tab-2");
    await presence.disconnect(roomId, pin, "player|tab-1");
    // Simulate the first tab's grace period expiring.
    await redis.zadd(connectionsKey, 0, "player|tab-1");
    expect(await presence.touch(roomId, pin, "host|tab-1")).toEqual(["host", "player"]);
    expect(await redis.zcard(connectionsKey)).toBe(2);
  });

  it("expires crashed connections without requiring disconnect cleanup", async () => {
    await presence.touch(roomId, pin, "player|crashed");
    await redis.zadd(connectionsKey, 0, "player|crashed");
    expect(await presence.touch(roomId, pin, "host|tab")).toEqual(["host"]);
  });

  it("allows refresh/reconnection during the grace period", async () => {
    await presence.touch(roomId, pin, "player|old");
    await presence.disconnect(roomId, pin, "player|old");
    const [seconds, microseconds] = await redis.time();
    const now = Number(seconds) * 1000 + Math.floor(Number(microseconds) / 1000);
    const expiry = Number(await redis.zscore(connectionsKey, "player|old"));
    expect(expiry - now).toBeGreaterThan(PRESENCE_DISCONNECT_GRACE_MS - 1000);
    expect(expiry - now).toBeLessThanOrEqual(PRESENCE_DISCONNECT_GRACE_MS);
    expect(await presence.touch(roomId, pin, "player|new")).toEqual(["player"]);
  });

  it("publishes changes once and serializes an empty list as an array", async () => {
    const subscriber = redis.duplicate();
    const messages: string[] = [];
    subscriber.on("message", (_, message) => messages.push(message));
    await subscriber.subscribe(`room:${pin}`);
    try {
      await presence.touch(roomId, pin, "player|tab");
      await presence.touch(roomId, pin, "player|tab");
      await redis.zadd(connectionsKey, 0, "player|tab");
      await presence.disconnect(roomId, pin, "missing|tab");
      // PING round trip on the subscriber ensures published messages have arrived.
      await subscriber.ping();
      expect(messages.map((message) => JSON.parse(message).payload.userIds)).toEqual([
        ["player"],
        [],
      ]);
      expect(JSON.parse(messages[1]!)).toMatchObject({ type: "PRESENCE_CHANGED", roomId, pin });
    } finally {
      await subscriber.quit();
    }
  });
});

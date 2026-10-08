import type Redis from "ioredis";

import type { PresenceChangedPayload, RoomEvent } from "../entities/event.types";

import { redisClient } from "@/server/shared/redis/client";

export const PRESENCE_HEARTBEAT_MS = 5_000;
export const PRESENCE_LEASE_MS = 30_000;
export const PRESENCE_DISCONNECT_GRACE_MS = 10_000;

// Refresh, expiration, snapshot and publication are atomic across server instances.
// Each tab has its own lease; disconnecting one tab keeps the other tabs online.
export const UPDATE_PRESENCE_SCRIPT = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
if ARGV[2] == 'disconnect' then
  redis.call('ZADD', KEYS[1], 'XX', now + tonumber(ARGV[3]), ARGV[1])
else
  redis.call('ZADD', KEYS[1], now + tonumber(ARGV[3]), ARGV[1])
end
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)
local connections = redis.call('ZRANGE', KEYS[1], 0, -1)
local seen = {}
local users = {}
for _, connection in ipairs(connections) do
  local user = string.match(connection, '^([^|]+)|')
  if user and not seen[user] then
    seen[user] = true
    table.insert(users, user)
  end
end
table.sort(users)
local snapshot = '[]'
if #users > 0 then snapshot = cjson.encode(users) end
if redis.call('GET', KEYS[2]) ~= snapshot then
  local event = cjson.decode(ARGV[4])
  local message = cjson.encode(event)
  message = string.sub(message, 1, -2) .. ',"payload":{"userIds":' .. snapshot .. '}}'
  redis.call('PUBLISH', ARGV[5], message)
end
redis.call('SET', KEYS[2], snapshot, 'EX', 60)
redis.call('EXPIRE', KEYS[1], 60)
return snapshot
`;

export interface IRoomPresence {
  touch(roomId: string, pin: string, connectionId: string): Promise<string[]>;
  disconnect(roomId: string, pin: string, connectionId: string): Promise<void>;
}

export class RedisRoomPresence implements IRoomPresence {
  constructor(private readonly redis: Pick<Redis, "eval"> = redisClient) {}

  private async update(
    roomId: string,
    pin: string,
    connectionId: string,
    mode: "touch" | "disconnect",
  ): Promise<string[]> {
    const result = await this.redis.eval(
      UPDATE_PRESENCE_SCRIPT,
      2,
      `room:{${roomId}}:presence:connections`,
      `room:{${roomId}}:presence:snapshot`,
      connectionId,
      mode,
      mode === "touch" ? PRESENCE_LEASE_MS : PRESENCE_DISCONNECT_GRACE_MS,
      JSON.stringify({
        type: "PRESENCE_CHANGED",
        roomId,
        pin,
        timestamp: new Date().toISOString(),
      }),
      `room:${pin}`,
    );
    return JSON.parse(result as string) as string[];
  }

  touch(roomId: string, pin: string, connectionId: string): Promise<string[]> {
    return this.update(roomId, pin, connectionId, "touch");
  }

  async disconnect(roomId: string, pin: string, connectionId: string): Promise<void> {
    await this.update(roomId, pin, connectionId, "disconnect");
  }
}

export function createPresenceEvent(
  roomId: string,
  pin: string,
  userIds: string[],
): RoomEvent<PresenceChangedPayload> {
  return {
    type: "PRESENCE_CHANGED",
    roomId,
    pin,
    payload: { userIds },
    timestamp: new Date().toISOString(),
  };
}

export const redisRoomPresence = new RedisRoomPresence();

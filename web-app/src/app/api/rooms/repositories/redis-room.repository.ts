import Redis from "ioredis";

import {
  IRedisRoomRepository,
  LeaderboardEntry,
  RedisPinData,
} from "./redis-room.repository.interface";

import { redisClient } from "@/server/shared/redis/client";

export class RedisRoomRepository implements IRedisRoomRepository {
  constructor(private readonly redis: Redis = redisClient) {}

  private pinKey(pin: string): string {
    return `room:pin:${pin}`;
  }

  private participantKey(roomId: string): string {
    return `room:${roomId}:participants`;
  }

  private leaderboardKey(roomId: string): string {
    return `room:${roomId}:scores`;
  }

  async setRoomPin(pin: string, roomId: string, status: string): Promise<void> {
    const data: RedisPinData = { roomId, status };
    await this.redis.set(this.pinKey(pin), JSON.stringify(data));
  }

  async getRoomByPin(pin: string): Promise<RedisPinData | null> {
    const raw = await this.redis.get(this.pinKey(pin));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RedisPinData;
    } catch {
      return null;
    }
  }

  async removeRoomPin(pin: string): Promise<void> {
    await this.redis.del(this.pinKey(pin));
  }

  async updateRoomStatus(pin: string, status: string): Promise<void> {
    const current = await this.getRoomByPin(pin);
    if (current) {
      current.status = status;
      await this.redis.set(this.pinKey(pin), JSON.stringify(current));
    }
  }

  async setParticipantCount(roomId: string, count: number): Promise<void> {
    await this.redis.set(this.participantKey(roomId), String(count));
  }

  async getParticipantCount(roomId: string): Promise<number> {
    const raw = await this.redis.get(this.participantKey(roomId));
    if (!raw) return 0;
    const count = parseInt(raw, 10);
    return isNaN(count) ? 0 : count;
  }

  async incrementParticipantCount(roomId: string): Promise<number> {
    return this.redis.incr(this.participantKey(roomId));
  }

  async addMemberToLeaderboard(roomId: string, userId: string, score: number): Promise<void> {
    await this.redis.zadd(this.leaderboardKey(roomId), score, userId);
  }

  async getLeaderboard(roomId: string): Promise<LeaderboardEntry[]> {
    const raw = await this.redis.zrevrange(this.leaderboardKey(roomId), 0, -1, "WITHSCORES");

    const result: LeaderboardEntry[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      const userId = raw[i];
      const score = parseFloat(raw[i + 1] ?? "0");
      if (userId) {
        result.push({ userId, score });
      }
    }
    return result;
  }
}

export const redisRoomRepository = new RedisRoomRepository();

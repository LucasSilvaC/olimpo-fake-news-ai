import Redis from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RedisRoomRepository } from "../repositories/redis-room.repository";

interface MockRedisClient {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  incr: ReturnType<typeof vi.fn>;
  zadd: ReturnType<typeof vi.fn>;
  zrevrange: ReturnType<typeof vi.fn>;
}

describe("RedisRoomRepository", () => {
  let mockRedis: MockRedisClient;
  let repository: RedisRoomRepository;

  beforeEach(() => {
    const store = new Map<string, string>();
    const sortedSets = new Map<string, Map<string, number>>();

    mockRedis = {
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
        return "OK";
      }),
      get: vi.fn(async (key: string) => {
        return store.get(key) ?? null;
      }),
      del: vi.fn(async (key: string) => {
        const deleted = store.delete(key);
        return deleted ? 1 : 0;
      }),
      incr: vi.fn(async (key: string) => {
        const current = parseInt(store.get(key) || "0", 10);
        const next = current + 1;
        store.set(key, String(next));
        return next;
      }),
      zadd: vi.fn(async (key: string, score: number, member: string) => {
        if (!sortedSets.has(key)) {
          sortedSets.set(key, new Map());
        }
        sortedSets.get(key)!.set(member, score);
        return 1;
      }),
      zrevrange: vi.fn(async (key: string, start: number, stop: number, withScores?: string) => {
        const set = sortedSets.get(key);
        if (!set) return [];
        const entries = Array.from(set.entries()).sort((a, b) => b[1] - a[1]);
        const sliced = stop === -1 ? entries.slice(start) : entries.slice(start, stop + 1);
        if (withScores === "WITHSCORES") {
          const result: string[] = [];
          for (const [member, score] of sliced) {
            result.push(member, String(score));
          }
          return result;
        }
        return sliced.map(([member]) => member);
      }),
    };

    repository = new RedisRoomRepository(mockRedis as unknown as Redis);
  });

  describe("Room PIN operations", () => {
    it("should set room pin mapping with roomId and status", async () => {
      await repository.setRoomPin("123 456", "room-1", "waiting");
      expect(mockRedis.set).toHaveBeenCalledWith(
        "room:pin:123 456",
        JSON.stringify({ roomId: "room-1", status: "waiting" }),
      );
    });

    it("should get room by pin", async () => {
      await repository.setRoomPin("123 456", "room-1", "waiting");
      const data = await repository.getRoomByPin("123 456");
      expect(data).toEqual({ roomId: "room-1", status: "waiting" });
    });

    it("should return null for non-existing pin", async () => {
      const data = await repository.getRoomByPin("999 999");
      expect(data).toBeNull();
    });

    it("should remove room pin", async () => {
      await repository.setRoomPin("123 456", "room-1", "waiting");
      await repository.removeRoomPin("123 456");
      expect(mockRedis.del).toHaveBeenCalledWith("room:pin:123 456");
      const data = await repository.getRoomByPin("123 456");
      expect(data).toBeNull();
    });

    it("should update room status if pin exists", async () => {
      await repository.setRoomPin("123 456", "room-1", "waiting");
      await repository.updateRoomStatus("123 456", "in_progress");
      const data = await repository.getRoomByPin("123 456");
      expect(data).toEqual({ roomId: "room-1", status: "in_progress" });
    });
  });

  describe("Participant count operations", () => {
    it("should set and get participant count", async () => {
      await repository.setParticipantCount("room-1", 5);
      const count = await repository.getParticipantCount("room-1");
      expect(count).toBe(5);
    });

    it("should return 0 when participant count is not set", async () => {
      const count = await repository.getParticipantCount("room-non-existing");
      expect(count).toBe(0);
    });

    it("should increment participant count atomically", async () => {
      await repository.setParticipantCount("room-1", 1);
      const newCount = await repository.incrementParticipantCount("room-1");
      expect(newCount).toBe(2);
      expect(mockRedis.incr).toHaveBeenCalledWith("room:room-1:participants");
    });
  });

  describe("Live Leaderboard operations", () => {
    it("should add member score and retrieve leaderboard sorted descending", async () => {
      await repository.addMemberToLeaderboard("room-1", "user-1", 100);
      await repository.addMemberToLeaderboard("room-1", "user-2", 250);
      await repository.addMemberToLeaderboard("room-1", "user-3", 180);

      const leaderboard = await repository.getLeaderboard("room-1");
      expect(leaderboard).toEqual([
        { userId: "user-2", score: 250 },
        { userId: "user-3", score: 180 },
        { userId: "user-1", score: 100 },
      ]);
    });
  });
});

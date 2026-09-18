import Redis from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RedisVoteRepository } from "../repositories/redis-vote.repository";

interface MockRedisClient {
  sadd: ReturnType<typeof vi.fn>;
  scard: ReturnType<typeof vi.fn>;
  sismember: ReturnType<typeof vi.fn>;
  smembers: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
}

describe("RedisVoteRepository", () => {
  let mockRedis: MockRedisClient;
  let repository: RedisVoteRepository;

  beforeEach(() => {
    const sets = new Map<string, Set<string>>();

    mockRedis = {
      sadd: vi.fn(async (key: string, member: string) => {
        if (!sets.has(key)) {
          sets.set(key, new Set());
        }
        const set = sets.get(key)!;
        if (set.has(member)) {
          return 0;
        }
        set.add(member);
        return 1;
      }),
      scard: vi.fn(async (key: string) => {
        return sets.get(key)?.size ?? 0;
      }),
      sismember: vi.fn(async (key: string, member: string) => {
        const set = sets.get(key);
        return set && set.has(member) ? 1 : 0;
      }),
      smembers: vi.fn(async (key: string) => {
        const set = sets.get(key);
        return set ? Array.from(set) : [];
      }),
      del: vi.fn(async (key: string) => {
        const deleted = sets.delete(key);
        return deleted ? 1 : 0;
      }),
    };

    repository = new RedisVoteRepository(mockRedis as unknown as Redis);
  });

  describe("recordVoteAtomic", () => {
    it("should atomically record a first vote and return updated count", async () => {
      const result = await repository.recordVoteAtomic("room-1", 1, "user-1");

      expect(result.isFirstVote).toBe(true);
      expect(result.currentVoteCount).toBe(1);
    });

    it("should detect duplicate votes for the same user in the round", async () => {
      await repository.recordVoteAtomic("room-1", 1, "user-1");
      const duplicateResult = await repository.recordVoteAtomic("room-1", 1, "user-1");

      expect(duplicateResult.isFirstVote).toBe(false);
      expect(duplicateResult.currentVoteCount).toBe(1);
    });

    it("should track distinct votes for multiple participants in the same round", async () => {
      await repository.recordVoteAtomic("room-1", 1, "user-1");
      const secondResult = await repository.recordVoteAtomic("room-1", 1, "user-2");

      expect(secondResult.isFirstVote).toBe(true);
      expect(secondResult.currentVoteCount).toBe(2);
    });

    it("should isolate votes across different rounds", async () => {
      await repository.recordVoteAtomic("room-1", 1, "user-1");
      const round2Result = await repository.recordVoteAtomic("room-1", 2, "user-1");

      expect(round2Result.isFirstVote).toBe(true);
      expect(round2Result.currentVoteCount).toBe(1);
    });
  });

  describe("getVoteCount", () => {
    it("should return 0 when no votes exist", async () => {
      const count = await repository.getVoteCount("room-1", 1);
      expect(count).toBe(0);
    });

    it("should return the correct count of votes", async () => {
      await repository.recordVoteAtomic("room-1", 1, "user-1");
      await repository.recordVoteAtomic("room-1", 1, "user-2");

      const count = await repository.getVoteCount("room-1", 1);
      expect(count).toBe(2);
    });
  });

  describe("hasUserVoted", () => {
    it("should return true if user has already voted", async () => {
      await repository.recordVoteAtomic("room-1", 1, "user-1");

      expect(await repository.hasUserVoted("room-1", 1, "user-1")).toBe(true);
      expect(await repository.hasUserVoted("room-1", 1, "user-2")).toBe(false);
    });
  });

  describe("getVotedUserIds", () => {
    it("should return list of user IDs who voted", async () => {
      await repository.recordVoteAtomic("room-1", 1, "user-1");
      await repository.recordVoteAtomic("room-1", 1, "user-2");

      const userIds = await repository.getVotedUserIds("room-1", 1);
      expect(userIds).toContain("user-1");
      expect(userIds).toContain("user-2");
    });
  });

  describe("clearRoundVotes", () => {
    it("should clear votes for a given round", async () => {
      await repository.recordVoteAtomic("room-1", 1, "user-1");
      await repository.clearRoundVotes("room-1", 1);

      expect(await repository.getVoteCount("room-1", 1)).toBe(0);
      expect(await repository.hasUserVoted("room-1", 1, "user-1")).toBe(false);
    });
  });
});

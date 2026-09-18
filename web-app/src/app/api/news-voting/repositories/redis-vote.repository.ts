import Redis from "ioredis";

import { AtomicVoteResult, IRedisVoteRepository } from "./redis-vote.repository.interface";

import { redisClient } from "@/server/shared/redis/client";

export class RedisVoteRepository implements IRedisVoteRepository {
  constructor(private readonly redis: Redis = redisClient) {}

  private roundVotesKey(roomId: string, roundOrder: number): string {
    return `room:${roomId}:round:${roundOrder}:votes`;
  }

  async recordVoteAtomic(
    roomId: string,
    roundOrder: number,
    userId: string,
  ): Promise<AtomicVoteResult> {
    const key = this.roundVotesKey(roomId, roundOrder);
    const added = await this.redis.sadd(key, userId);
    const currentVoteCount = await this.redis.scard(key);

    return {
      isFirstVote: added === 1,
      currentVoteCount,
    };
  }

  async getVoteCount(roomId: string, roundOrder: number): Promise<number> {
    const key = this.roundVotesKey(roomId, roundOrder);
    return this.redis.scard(key);
  }

  async hasUserVoted(roomId: string, roundOrder: number, userId: string): Promise<boolean> {
    const key = this.roundVotesKey(roomId, roundOrder);
    const isMember = await this.redis.sismember(key, userId);
    return isMember === 1;
  }

  async getVotedUserIds(roomId: string, roundOrder: number): Promise<string[]> {
    const key = this.roundVotesKey(roomId, roundOrder);
    return this.redis.smembers(key);
  }

  async clearRoundVotes(roomId: string, roundOrder: number): Promise<void> {
    const key = this.roundVotesKey(roomId, roundOrder);
    await this.redis.del(key);
  }
}

export const redisVoteRepository = new RedisVoteRepository();

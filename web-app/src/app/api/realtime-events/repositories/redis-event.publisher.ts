import Redis from "ioredis";

import { RoomEvent } from "../entities";

import { IEventPublisher } from "./event-publisher.interface";

import { RoomPin } from "@/app/api/rooms/entities";
import { redisClient } from "@/server/shared/redis/client";

export class RedisEventPublisher implements IEventPublisher {
  constructor(private readonly redis: Redis = redisClient) {}

  private getChannel(pin: string): string {
    const normalized = RoomPin.normalize(pin);
    return `room:${normalized}`;
  }

  async publish<T = unknown>(pin: string, event: RoomEvent<T>): Promise<number> {
    const channel = this.getChannel(pin);
    const message = JSON.stringify(event);
    return this.redis.publish(channel, message);
  }
}

export const redisEventPublisher = new RedisEventPublisher();

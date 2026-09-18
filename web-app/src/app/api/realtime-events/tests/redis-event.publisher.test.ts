import Redis from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoomEvent } from "../entities";
import { RedisEventPublisher } from "../repositories/redis-event.publisher";
import { PublishRoomEventUseCase } from "../usecase/publish-room-event.usecase";

describe("RedisEventPublisher", () => {
  let mockRedis: { publish: ReturnType<typeof vi.fn> };
  let publisher: RedisEventPublisher;

  beforeEach(() => {
    mockRedis = {
      publish: vi.fn(async () => 2),
    };
    publisher = new RedisEventPublisher(mockRedis as unknown as Redis);
  });

  it("should publish serialized event to the normalized room channel", async () => {
    const event: RoomEvent = {
      type: "MEMBER_JOINED",
      roomId: "room-123",
      pin: "123 456",
      payload: { memberId: "mem-1" },
      timestamp: new Date().toISOString(),
    };

    const subscribers = await publisher.publish("123 456", event);

    expect(subscribers).toBe(2);
    expect(mockRedis.publish).toHaveBeenCalledWith("room:123 456", JSON.stringify(event));
  });

  it("should normalize pin without spaces when publishing to channel", async () => {
    const event: RoomEvent = {
      type: "ROUND_STARTED",
      roomId: "room-123",
      pin: "123456",
      payload: { currentRound: 1, totalRounds: 5 },
      timestamp: new Date().toISOString(),
    };

    await publisher.publish("123456", event);

    expect(mockRedis.publish).toHaveBeenCalledWith("room:123 456", JSON.stringify(event));
  });

  it("should propagate errors if Redis publishing fails", async () => {
    mockRedis.publish.mockRejectedValueOnce(new Error("Redis connection error"));

    const event: RoomEvent = {
      type: "MATCH_FINISHED",
      roomId: "room-123",
      pin: "123 456",
      payload: { leaderboard: [] },
      timestamp: new Date().toISOString(),
    };

    await expect(publisher.publish("123 456", event)).rejects.toThrow("Redis connection error");
  });
});

describe("PublishRoomEventUseCase", () => {
  it("should construct full RoomEvent and call event publisher", async () => {
    const mockPublisher = {
      publish: vi.fn(async () => 1),
    };

    const useCase = new PublishRoomEventUseCase(mockPublisher);

    const result = await useCase.execute({
      pin: "123 456",
      roomId: "room-123",
      type: "ROUND_STARTED",
      payload: { currentRound: 1, totalRounds: 3 },
    });

    expect(result.type).toBe("ROUND_STARTED");
    expect(result.roomId).toBe("room-123");
    expect(result.pin).toBe("123 456");
    expect(result.payload).toEqual({ currentRound: 1, totalRounds: 3 });
    expect(result.timestamp).toBeDefined();

    expect(mockPublisher.publish).toHaveBeenCalledWith("123 456", result);
  });
});

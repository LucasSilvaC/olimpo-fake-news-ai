import Redis from "ioredis";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/rooms/[pin]/events/route";
import { createSSEResponse } from "@/app/api/rooms/[pin]/events/sse-response";
import { IRedisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository.interface";
import { IRoomRepository } from "@/app/api/rooms/repositories/room.repository.interface";
import { Room } from "@/server/shared/database/schemas";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  touch: vi.fn(),
  disconnect: vi.fn(),
}));
vi.mock("@/app/api/auth/usecase/get-session.usecase", () => ({
  getSessionUseCase: { execute: mocks.getSession },
}));
vi.mock("@/app/api/realtime-events/repositories/redis-room-presence", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  redisRoomPresence: { touch: mocks.touch, disconnect: mocks.disconnect },
}));

interface MockSubscriber {
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  unsubscribe: ReturnType<typeof vi.fn>;
  quit: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  removeAllListeners: ReturnType<typeof vi.fn>;
}

describe("SSE Route Handler (/api/rooms/[pin]/events)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ id: "participant-1" });
    mocks.touch.mockResolvedValue(["participant-1"]);
    mocks.disconnect.mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
  const sampleRoom: Room = {
    id: "room-123",
    pin: "123 456",
    name: "Sala SSE",
    status: "in_progress",
    roundDurationSeconds: 30,
    currentRound: 1,
    totalRounds: 3,
    hostId: "host-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockSubscriber = (): MockSubscriber & {
    emitMessage: (channel: string, msg: string) => void;
  } => {
    let messageHandler: ((channel: string, msg: string) => void) | undefined;
    return {
      on: vi.fn((event: string, handler: (channel: string, msg: string) => void) => {
        if (event === "message") {
          messageHandler = handler;
        }
      }),
      subscribe: vi.fn(async () => 1),
      unsubscribe: vi.fn(async () => 1),
      quit: vi.fn(async () => "OK"),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
      emitMessage: (channel: string, msg: string) => {
        messageHandler?.(channel, msg);
      },
    };
  };

  const createMockRoomRepo = (room: Room | null = sampleRoom): IRoomRepository => ({
    findById: vi.fn(async () => room),
    findByPin: vi.fn(async () => room),
    create: vi.fn(),
    updateStatus: vi.fn(),
    updateRoom: vi.fn(),
    addMember: vi.fn(),
    findMember: vi.fn(),
    listMembers: vi.fn(),
    countMembers: vi.fn(),
    updateMemberScore: vi.fn(),
    addPlaylistItems: vi.fn(),
    getPlaylistItems: vi.fn(),
  });

  const createMockRedisRoomRepo = (
    pinData: { roomId: string; status: string } | null = {
      roomId: "room-123",
      status: "in_progress",
    },
  ): IRedisRoomRepository => ({
    setRoomPin: vi.fn(),
    getRoomByPin: vi.fn(async () => pinData),
    removeRoomPin: vi.fn(),
    updateRoomStatus: vi.fn(),
    setParticipantCount: vi.fn(),
    getParticipantCount: vi.fn(),
    incrementParticipantCount: vi.fn(),
    addMemberToLeaderboard: vi.fn(),
    getLeaderboard: vi.fn(),
  });

  it("should return 400 when PIN format is invalid", async () => {
    const request = new Request("http://localhost/api/rooms/invalid-pin/events");
    const response = await createSSEResponse(request, "invalid-pin");

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Invalid PIN format" });
  });

  it("should return 404 when room is not found", async () => {
    const request = new Request("http://localhost/api/rooms/999%20999/events");
    const response = await createSSEResponse(request, "999 999", {
      roomRepository: createMockRoomRepo(null),
      redisRoomRepo: createMockRedisRoomRepo(null),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: "Room not found" });
  });

  it("should establish SSE stream with proper headers for valid room", async () => {
    const mockSubscriber = createMockSubscriber();
    const request = new Request("http://localhost/api/rooms/123%20456/events");

    const response = await createSSEResponse(request, "123 456", {
      roomRepository: createMockRoomRepo(),
      redisRoomRepo: createMockRedisRoomRepo(),
      createSubscriber: () => mockSubscriber as unknown as Redis,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("no-cache, no-transform");
    expect(response.headers.get("Connection")).toBe("keep-alive");

    expect(mockSubscriber.subscribe).toHaveBeenCalledWith("room:123 456");
  });

  it("should stream initial connected message and format Redis messages as SSE events", async () => {
    const mockSubscriber = createMockSubscriber();
    const request = new Request("http://localhost/api/rooms/123456/events");

    const response = await createSSEResponse(request, "123456", {
      roomRepository: createMockRoomRepo(),
      redisRoomRepo: createMockRedisRoomRepo(),
      createSubscriber: () => mockSubscriber as unknown as Redis,
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    // First chunk: connected comment
    const first = await reader.read();
    expect(decoder.decode(first.value)).toBe(": connected\n\n");

    const snapshot = await reader.read();
    expect(decoder.decode(snapshot.value)).toContain("event: PRESENCE_CHANGED");
    expect(decoder.decode(snapshot.value)).toContain('"userIds":["participant-1"]');

    // Emit a typed domain event
    const eventPayload = {
      type: "MEMBER_JOINED",
      roomId: "room-123",
      pin: "123 456",
      payload: { memberId: "m1" },
      timestamp: "2026-09-18T20:00:00.000Z",
    };
    mockSubscriber.emitMessage("room:123 456", JSON.stringify(eventPayload));

    const second = await reader.read();
    expect(decoder.decode(second.value)).toBe(
      `event: MEMBER_JOINED\ndata: ${JSON.stringify(eventPayload)}\n\n`,
    );

    // Cancel reader to trigger cleanup
    await reader.cancel();
    expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith("room:123 456");
    expect(mockSubscriber.quit).toHaveBeenCalled();
  });

  it("should clean up Redis subscriber when request.signal is aborted", async () => {
    const mockSubscriber = createMockSubscriber();
    const controller = new AbortController();
    const request = new Request("http://localhost/api/rooms/123%20456/events", {
      signal: controller.signal,
    });

    const response = await createSSEResponse(request, "123 456", {
      roomRepository: createMockRoomRepo(),
      redisRoomRepo: createMockRedisRoomRepo(),
      createSubscriber: () => mockSubscriber as unknown as Redis,
    });

    // Read initial chunk so stream starts
    const reader = response.body!.getReader();
    await reader.read();

    // Abort request
    controller.abort();

    await vi.waitFor(() => {
      expect(mockSubscriber.removeAllListeners).toHaveBeenCalled();
      expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith("room:123 456");
      expect(mockSubscriber.quit).toHaveBeenCalled();
    });
  });

  it("should work when invoking GET handler with Next.js route params", async () => {
    const request = new Request("http://localhost/api/rooms/123%20456/events");

    // Test GET wrapper function
    const response = await GET(request, {
      params: Promise.resolve({ pin: "invalid-pin" }),
    });

    expect(response.status).toBe(400);
  });

  it("rejects unauthenticated presence connections", async () => {
    mocks.getSession.mockRejectedValueOnce(new Error("Unauthorized"));
    const response = await createSSEResponse(new Request("http://localhost"), "123456");
    expect(response.status).toBe(401);
    expect(mocks.touch).not.toHaveBeenCalled();
  });

  it("renews presence and stops renewing after cancellation", async () => {
    const subscriber = createMockSubscriber();
    const response = await createSSEResponse(new Request("http://localhost"), "123456", {
      roomRepository: createMockRoomRepo(),
      redisRoomRepo: createMockRedisRoomRepo(),
      createSubscriber: () => subscriber as unknown as Redis,
    });
    const reader = response.body!.getReader();
    await reader.read();
    await reader.read();
    expect(mocks.touch).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(mocks.touch).toHaveBeenCalledTimes(2);
    await reader.cancel();
    expect(mocks.disconnect).toHaveBeenCalledWith(
      sampleRoom.id,
      sampleRoom.pin,
      expect.stringMatching(/^participant-1\|/),
    );
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mocks.touch).toHaveBeenCalledTimes(2);
  });

  it("cleans up on presence failure so EventSource can reconnect", async () => {
    mocks.touch.mockRejectedValueOnce(new Error("Redis unavailable"));
    const subscriber = createMockSubscriber();
    const response = await createSSEResponse(new Request("http://localhost"), "123456", {
      roomRepository: createMockRoomRepo(),
      redisRoomRepo: createMockRedisRoomRepo(),
      createSubscriber: () => subscriber as unknown as Redis,
    });
    const reader = response.body!.getReader();
    await reader.read();
    await expect(reader.read()).rejects.toThrow("Redis unavailable");
    await vi.advanceTimersByTimeAsync(0);
    expect(subscriber.quit).toHaveBeenCalled();
    expect(mocks.disconnect).toHaveBeenCalledOnce();
  });
});

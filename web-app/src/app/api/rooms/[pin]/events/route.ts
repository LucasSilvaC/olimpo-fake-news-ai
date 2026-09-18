import Redis from "ioredis";

import { RoomPin } from "@/app/api/rooms/entities/room-pin.vo";
import { drizzleRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { redisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository";
import { IRedisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository.interface";
import { IRoomRepository } from "@/app/api/rooms/repositories/room.repository.interface";
import { createRedisClient } from "@/server/shared/redis/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface SSERouteDependencies {
  roomRepository?: IRoomRepository;
  redisRoomRepo?: IRedisRoomRepository;
  createSubscriber?: () => Redis;
}

export async function createSSEResponse(
  request: Request,
  pinParam: string,
  deps: SSERouteDependencies = {},
): Promise<Response> {
  const roomRepository = deps.roomRepository ?? drizzleRoomRepository;
  const redisRoomRepo = deps.redisRoomRepo ?? redisRoomRepository;
  const createSubscriber = deps.createSubscriber ?? createRedisClient;

  const decodedPin = decodeURIComponent(pinParam);
  const normalizedPin = RoomPin.normalize(decodedPin);

  if (!RoomPin.isValid(normalizedPin)) {
    return new Response(JSON.stringify({ error: "Invalid PIN format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if room exists (Redis first, fallback to DB)
  const cached = await redisRoomRepo.getRoomByPin(normalizedPin);
  const room = cached
    ? await roomRepository.findById(cached.roomId)
    : await roomRepository.findByPin(normalizedPin);

  if (!room) {
    return new Response(JSON.stringify({ error: "Room not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const channel = `room:${normalizedPin}`;
  const subscriber = createSubscriber();
  const encoder = new TextEncoder();
  let isCleanedUp = false;

  const cleanup = async () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    try {
      subscriber.removeAllListeners();
      await subscriber.unsubscribe(channel).catch(() => {});
      await subscriber.quit().catch(() => {});
    } catch {
      subscriber.disconnect();
    }
  };

  request.signal.addEventListener("abort", () => {
    void cleanup();
  });

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection comment
      controller.enqueue(encoder.encode(": connected\n\n"));

      subscriber.on("message", (msgChannel, message) => {
        if (msgChannel === channel && !isCleanedUp) {
          try {
            const eventData = JSON.parse(message);
            const eventType = eventData.type || "message";
            controller.enqueue(encoder.encode(`event: ${eventType}\ndata: ${message}\n\n`));
          } catch {
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          }
        }
      });

      subscriber.on("error", () => {
        // Silently handle subscriber errors
      });

      try {
        await subscriber.subscribe(channel);
      } catch (err) {
        controller.error(err);
        await cleanup();
      }
    },
    async cancel() {
      await cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ pin: string }> | { pin: string } },
): Promise<Response> {
  const params = await Promise.resolve(context.params);
  return createSSEResponse(request, params.pin);
}

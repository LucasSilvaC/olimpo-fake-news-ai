import Redis from "ioredis";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import { redisVoteRepository } from "@/app/api/news-voting/repositories/redis-vote.repository";
import type { IRedisVoteRepository } from "@/app/api/news-voting/repositories/redis-vote.repository.interface";
import {
  createPresenceEvent,
  type IRoomPresence,
  PRESENCE_HEARTBEAT_MS,
  redisRoomPresence,
} from "@/app/api/realtime-events/repositories/redis-room-presence";
import { RoomPin } from "@/app/api/rooms/entities/room-pin.vo";
import { drizzleRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { redisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository";
import { IRedisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository.interface";
import { IRoomRepository } from "@/app/api/rooms/repositories/room.repository.interface";
import { createRedisClient } from "@/server/shared/redis/client";

export interface SSERouteDependencies {
  roomRepository?: IRoomRepository;
  redisRoomRepo?: IRedisRoomRepository;
  createSubscriber?: () => Redis;
  getUserId?: () => Promise<string>;
  presence?: IRoomPresence;
  roundRepository?: Pick<IRedisVoteRepository, "isRoundCompleted">;
}

export async function createSSEResponse(
  request: Request,
  pinParam: string,
  deps: SSERouteDependencies = {},
): Promise<Response> {
  const roomRepository = deps.roomRepository ?? drizzleRoomRepository;
  const redisRoomRepo = deps.redisRoomRepo ?? redisRoomRepository;
  const createSubscriber = deps.createSubscriber ?? createRedisClient;
  const presence = deps.presence ?? redisRoomPresence;

  let decodedPin: string;
  try {
    decodedPin = decodeURIComponent(pinParam);
  } catch {
    return Response.json({ error: "Invalid PIN format" }, { status: 400 });
  }
  const normalizedPin = RoomPin.normalize(decodedPin);

  if (!RoomPin.isValid(normalizedPin)) {
    return new Response(JSON.stringify({ error: "Invalid PIN format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let userId: string;
  try {
    userId = await (deps.getUserId ?? (async () => (await getSessionUseCase.execute()).id))();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

  if (!(await roomRepository.findMember(room.id, userId))) {
    return Response.json({ error: "User is not a member of this room" }, { status: 403 });
  }

  const channel = `room:${normalizedPin}`;
  const subscriber = createSubscriber();
  const encoder = new TextEncoder();
  let isCleanedUp = false;
  const connectionId = `${userId}|${crypto.randomUUID()}`;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let presenceWork: Promise<void> = Promise.resolve();
  let closeStream: (() => void) | undefined;

  const cleanup = async () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    clearInterval(heartbeat);
    request.signal.removeEventListener("abort", onAbort);
    closeStream?.();
    await presenceWork.catch(() => {});
    // A crashed server still expires through the lease even if cleanup cannot run.
    await presence.disconnect(room.id, normalizedPin, connectionId).catch(() => {});
    try {
      subscriber.removeAllListeners();
      await subscriber.unsubscribe(channel).catch(() => {});
      await subscriber.quit().catch(() => {});
    } catch {
      subscriber.disconnect();
    }
  };

  const onAbort = () => {
    void cleanup();
  };
  request.signal.addEventListener("abort", onAbort);

  const stream = new ReadableStream({
    async start(controller) {
      let streamClosed = false;
      closeStream = () => {
        if (streamClosed) return;
        streamClosed = true;
        try {
          controller.close();
        } catch {
          // Cancellation may already have closed the stream.
        }
      };
      const send = (message: string) => {
        if (!isCleanedUp) controller.enqueue(encoder.encode(message));
      };
      if (request.signal.aborted) {
        await cleanup();
        return;
      }
      // Send initial connection comment
      send(": connected\n\n");

      subscriber.on("message", (msgChannel, message) => {
        if (msgChannel !== channel || isCleanedUp) return;
        void (async () => {
          try {
            const eventData = JSON.parse(message);
            if (eventData.roomId !== room.id) return;
            if (eventData.type === "ROUND_COMPLETED") {
              const round = eventData.payload?.round;
              if (
                !Number.isInteger(round) ||
                round < 1 ||
                !(await (deps.roundRepository ?? redisVoteRepository).isRoundCompleted(
                  room.id,
                  round,
                ))
              )
                return;
              // Predictions are requested through the authenticated route, never pushed over SSE.
              eventData.payload = {
                round,
                leaderboard: eventData.payload.leaderboard,
                officialAnswer: eventData.payload.officialAnswer,
                modelAnalysis: null,
              };
            }
            send(`event: ${eventData.type || "message"}\ndata: ${JSON.stringify(eventData)}\n\n`);
          } catch {
            /* Drop malformed or unauthorized events. */
          }
        })();
      });

      subscriber.on("error", () => {
        void cleanup();
      });

      try {
        await subscriber.subscribe(channel);
        if (isCleanedUp) return;
        const updatePresence = async () => {
          if (isCleanedUp) return;
          const userIds = await presence.touch(room.id, normalizedPin, connectionId);
          // Every connection receives a snapshot, including after missed events/reconnects.
          const event = createPresenceEvent(room.id, normalizedPin, userIds);
          send(`event: PRESENCE_CHANGED\ndata: ${JSON.stringify(event)}\n\n`);
        };
        presenceWork = updatePresence();
        await presenceWork;
        if (isCleanedUp) return;
        heartbeat = setInterval(() => {
          send(": heartbeat\n\n");
          presenceWork = presenceWork.then(updatePresence).catch(() => {
            void cleanup();
          });
        }, PRESENCE_HEARTBEAT_MS);
      } catch (err) {
        if (!isCleanedUp) {
          streamClosed = true;
          controller.error(err);
        }
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

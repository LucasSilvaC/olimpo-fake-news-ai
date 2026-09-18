"use server";

import { z } from "zod";

import { RoomDTO } from "../entities";
import { startGameUseCase } from "../usecase/start-game.usecase";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";

const startGameSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
});

export type StartGameActionInput = z.infer<typeof startGameSchema>;

export type StartGameActionResult =
  { success: true; room: RoomDTO } | { success: false; error: string };

export async function startGameAction(
  input: FormData | StartGameActionInput,
): Promise<StartGameActionResult> {
  try {
    const session = await getSessionUseCase.execute();

    const rawData =
      input instanceof FormData
        ? {
            roomId: input.get("roomId"),
          }
        : input;

    const parsed = startGameSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid room ID",
      };
    }

    const result = await startGameUseCase.execute({
      roomId: parsed.data.roomId,
      hostId: session.id,
    });

    return {
      success: true,
      room: result.room,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start game";
    return {
      success: false,
      error: message,
    };
  }
}

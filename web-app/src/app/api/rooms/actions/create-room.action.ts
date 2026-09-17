"use server";

import { z } from "zod";

import { RoomDTO } from "../entities";
import { createRoomUseCase } from "../usecase/create-room.usecase";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";

const createRoomSchema = z.object({
  name: z.string().trim().min(1, "Room name is required"),
  roundDurationSeconds: z.coerce
    .number()
    .int()
    .min(10, "Duration must be at least 10 seconds")
    .optional()
    .default(30),
});

export type CreateRoomActionInput = z.input<typeof createRoomSchema>;

export type CreateRoomActionResult =
  { success: true; room: RoomDTO; pin: string } | { success: false; error: string };

export async function createRoomAction(
  input: FormData | CreateRoomActionInput,
): Promise<CreateRoomActionResult> {
  try {
    const session = await getSessionUseCase.execute();

    const rawData =
      input instanceof FormData
        ? {
            name: input.get("name"),
            roundDurationSeconds: input.get("roundDurationSeconds") ?? undefined,
          }
        : input;

    const parsed = createRoomSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid room configuration",
      };
    }

    const result = await createRoomUseCase.execute({
      hostId: session.id,
      name: parsed.data.name,
      roundDurationSeconds: parsed.data.roundDurationSeconds,
    });

    return {
      success: true,
      room: result.room,
      pin: result.pin,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create room";
    return {
      success: false,
      error: message,
    };
  }
}

"use server";

import { z } from "zod";

import { RoomDTO, RoomMemberDTO } from "../entities";
import { joinRoomUseCase } from "../usecase/join-room.usecase";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";

const joinRoomSchema = z.object({
  pin: z.string().trim().min(1, "Room PIN is required"),
});

export type JoinRoomActionInput = z.infer<typeof joinRoomSchema>;

export type JoinRoomActionResult =
  | { success: true; room: RoomDTO; member: RoomMemberDTO; alreadyJoined: boolean }
  | { success: false; error: string };

export async function joinRoomAction(
  input: FormData | JoinRoomActionInput,
): Promise<JoinRoomActionResult> {
  try {
    const session = await getSessionUseCase.execute();

    const rawData =
      input instanceof FormData
        ? {
            pin: input.get("pin"),
          }
        : input;

    const parsed = joinRoomSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid room PIN",
      };
    }

    const result = await joinRoomUseCase.execute({
      userId: session.id,
      pin: parsed.data.pin,
    });

    return {
      success: true,
      room: result.room,
      member: result.member,
      alreadyJoined: result.alreadyJoined,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to join room";
    return {
      success: false,
      error: message,
    };
  }
}

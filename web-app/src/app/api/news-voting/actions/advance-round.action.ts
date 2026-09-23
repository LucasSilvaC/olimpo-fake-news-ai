"use server";

import { z } from "zod";

import { AdvanceRoundOutput } from "../usecase/advance-round.usecase";
import { advanceRoundUseCase } from "../usecase/advance-round.usecase";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";

const advanceRoundSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
});

export type AdvanceRoundActionInput = z.infer<typeof advanceRoundSchema>;

export type AdvanceRoundActionResult =
  | {
      success: true;
      round: AdvanceRoundOutput;
    }
  | {
      success: false;
      error: string;
    };

export async function advanceRoundAction(
  input: FormData | AdvanceRoundActionInput,
): Promise<AdvanceRoundActionResult> {
  try {
    const session = await getSessionUseCase.execute();

    const rawData =
      input instanceof FormData
        ? {
            roomId: input.get("roomId"),
          }
        : input;

    const parsed = advanceRoundSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid room ID",
      };
    }

    const result = await advanceRoundUseCase.execute({
      roomId: parsed.data.roomId,
      hostId: session.id,
    });

    return {
      success: true,
      round: result,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to advance round";
    return {
      success: false,
      error: message,
    };
  }
}

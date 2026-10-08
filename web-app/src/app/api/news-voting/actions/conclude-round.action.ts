"use server";

import { z } from "zod";

import { concludeRoundUseCase } from "../usecase/conclude-round.usecase";

import type { AIAnalysisDTO } from "@/app/api/ai-feedback/entities/ai-analysis.entity";
import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import type { RoundCompletedLeaderboardEntry } from "@/app/api/realtime-events/entities/event.types";
import type { MLTargetType } from "@/server/shared/database/schemas/enums";

const concludeRoundSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  round: z.coerce.number().int().min(1, "Round must be at least 1"),
});

export type ConcludeRoundActionInput = z.infer<typeof concludeRoundSchema>;

export type ConcludeRoundActionResult =
  | {
      success: true;
      roundCompleted: boolean;
      officialAnswer?: MLTargetType;
      modelAnalysis?: AIAnalysisDTO | null;
      leaderboard?: RoundCompletedLeaderboardEntry[];
    }
  | {
      success: false;
      error: string;
    };

export async function concludeRoundAction(
  input: FormData | ConcludeRoundActionInput,
): Promise<ConcludeRoundActionResult> {
  try {
    const session = await getSessionUseCase.execute();

    const rawData =
      input instanceof FormData
        ? {
            roomId: input.get("roomId"),
            round: input.get("round"),
          }
        : input;

    const parsed = concludeRoundSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input",
      };
    }

    const result = await concludeRoundUseCase.execute({
      roomId: parsed.data.roomId,
      round: parsed.data.round,
      userId: session.id,
    });

    return {
      success: true,
      roundCompleted: result.roundCompleted,
      officialAnswer: result.officialAnswer,
      modelAnalysis: result.modelAnalysis,
      leaderboard: result.leaderboard,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to conclude round";
    return {
      success: false,
      error: message,
    };
  }
}

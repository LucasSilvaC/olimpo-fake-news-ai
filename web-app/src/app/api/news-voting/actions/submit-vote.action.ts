"use server";

import { z } from "zod";

import { NewsVoteDTO } from "../entities";
import { submitVoteUseCase } from "../usecase/submit-vote.usecase";

import { AIAnalysisDTO } from "@/app/api/ai-feedback";
import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import { LeaderboardEntry } from "@/app/api/rooms/repositories";
import { VoteOptionType } from "@/server/shared/database/schemas/enums";

const submitVoteSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  vote: z.enum(["reliable", "uncertain", "unreliable"] as const, {
    message: "Vote must be 'reliable', 'uncertain', or 'unreliable'",
  }),
});

export type SubmitVoteActionInput = z.infer<typeof submitVoteSchema>;

export type SubmitVoteActionResult =
  | {
      success: true;
      vote: NewsVoteDTO;
      roundCompleted: boolean;
      analysis?: AIAnalysisDTO;
      leaderboard?: LeaderboardEntry[];
    }
  | {
      success: false;
      error: string;
    };

export async function submitVoteAction(
  input: FormData | SubmitVoteActionInput,
): Promise<SubmitVoteActionResult> {
  try {
    const session = await getSessionUseCase.execute();

    const rawData =
      input instanceof FormData
        ? {
            roomId: input.get("roomId"),
            vote: input.get("vote"),
          }
        : input;

    const parsed = submitVoteSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid vote input",
      };
    }

    const result = await submitVoteUseCase.execute({
      roomId: parsed.data.roomId,
      userId: session.id,
      vote: parsed.data.vote as VoteOptionType,
    });

    return {
      success: true,
      vote: result.vote,
      roundCompleted: result.roundCompleted,
      analysis: result.analysis,
      leaderboard: result.leaderboard,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit vote";
    return {
      success: false,
      error: message,
    };
  }
}

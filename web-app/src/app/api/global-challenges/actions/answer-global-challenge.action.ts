"use server";

import { z } from "zod";

import { answerGlobalChallengeUseCase } from "../composition-root";
import { GlobalChallengeAnswerDTO } from "../entities";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import type { MLTargetType, VoteOptionType } from "@/server/shared/domain/game-vocabulary";

const answerGlobalChallengeSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required"),
  answer: z.enum(["reliable", "uncertain", "unreliable"] as const, {
    message: "Answer must be 'reliable', 'uncertain', or 'unreliable'",
  }),
});

export type AnswerGlobalChallengeActionInput = z.infer<typeof answerGlobalChallengeSchema>;

export type AnswerGlobalChallengeActionResult =
  | {
      success: true;
      answer: GlobalChallengeAnswerDTO;
      isCorrect: boolean;
      xpAwarded: number;
      targetClassification: MLTargetType;
      analysis: {
        classification: MLTargetType;
        reasons: string[];
        confidence: number;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function answerGlobalChallengeAction(
  input: FormData | AnswerGlobalChallengeActionInput,
): Promise<AnswerGlobalChallengeActionResult> {
  try {
    const session = await getSessionUseCase.execute();

    const rawData =
      input instanceof FormData
        ? {
            challengeId: input.get("challengeId"),
            answer: input.get("answer"),
          }
        : input;

    const parsed = answerGlobalChallengeSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid challenge answer input",
      };
    }

    const result = await answerGlobalChallengeUseCase.execute({
      challengeId: parsed.data.challengeId,
      userId: session.id,
      answer: parsed.data.answer as VoteOptionType,
    });

    return {
      success: true,
      answer: result.answer,
      isCorrect: result.isCorrect,
      xpAwarded: result.xpAwarded,
      targetClassification: result.targetClassification,
      analysis: result.analysis,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to answer global challenge";
    return {
      success: false,
      error: message,
    };
  }
}

"use server";

import { z } from "zod";

import { GlobalChallengeAnswerDTO } from "../entities";
import { answerGlobalChallengeUseCase } from "../usecase/answer-global-challenge.usecase";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import { MLTargetType, VoteOptionType } from "@/server/shared/database/schemas/enums";

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
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to answer global challenge";
    return {
      success: false,
      error: message,
    };
  }
}

"use server";

import {
  ListedGlobalChallengeDTO,
  listGlobalChallengesUseCase,
} from "../usecase/list-global-challenges.usecase";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";

export type ListGlobalChallengesActionResult =
  | {
      success: true;
      challenges: ListedGlobalChallengeDTO[];
    }
  | {
      success: false;
      error: string;
    };

export async function listGlobalChallengesAction(): Promise<ListGlobalChallengesActionResult> {
  try {
    let userId: string | undefined;

    try {
      const session = await getSessionUseCase.execute();
      userId = session.id;
    } catch {
      // User is not authenticated; proceed without personalized answer status
      userId = undefined;
    }

    const challenges = await listGlobalChallengesUseCase.execute({ userId });

    return {
      success: true,
      challenges,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list global challenges";
    return {
      success: false,
      error: message,
    };
  }
}

import type { Metadata } from "next";
import { connection } from "next/server";
import * as React from "react";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import { listGlobalChallengesAction } from "@/app/api/global-challenges/actions/list-global-challenges.action";
import { ChallengeGameView } from "@/views/challenge";

export const metadata: Metadata = {
  title: "Desafios Solo | Olimpo",
  description:
    "Treine suas habilidades investigativas e checagem de fatos com desafios individuais.",
};

export default async function ChallengePage(): Promise<React.ReactElement> {
  await connection();
  const [user, challengesResult] = await Promise.all([
    getSessionUseCase.execute(),
    listGlobalChallengesAction(),
  ]);

  const challenges = challengesResult.success ? challengesResult.challenges : [];

  return (
    <ChallengeGameView
      challenges={challenges}
      currentUser={{
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        xp: user.xp,
      }}
    />
  );
}

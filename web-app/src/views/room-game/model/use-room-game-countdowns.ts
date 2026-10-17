"use client";

import * as React from "react";


import { secondsUntil } from "./room-game-time";
import type { GameStage } from "./types";

import { concludeRoundAction } from "@/app/api/news-voting/actions/conclude-round.action";

interface UseRoomGameCountdownsInput {
  roomId: string;
  currentRound: number;
  isHost: boolean;
  stage: GameStage;
  roundClosed: boolean;
  roundDeadline: number;
  timeRemaining: number | null;
  verdictCountdown: number | null;
  setStage: React.Dispatch<React.SetStateAction<GameStage>>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number | null>>;
  setVerdictCountdown: React.Dispatch<React.SetStateAction<number | null>>;
}

export function useRoomGameCountdowns({
  roomId,
  currentRound,
  isHost,
  stage,
  roundClosed,
  roundDeadline,
  timeRemaining,
  verdictCountdown,
  setStage,
  setTimeRemaining,
  setVerdictCountdown,
}: UseRoomGameCountdownsInput) {
  React.useEffect(() => {
    if (roundClosed || (stage !== "CHECKING" && stage !== "WAITING")) return;
    const interval = setInterval(() => {
      const remaining = secondsUntil(roundDeadline);
      setTimeRemaining(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, roundDeadline, roundClosed, setTimeRemaining]);

  React.useEffect(() => {
    if (timeRemaining !== 0 || roundClosed || (stage !== "CHECKING" && stage !== "WAITING")) {
      return;
    }
    const timeoutId = setTimeout(
      () => {
        void concludeRoundAction({ roomId, round: currentRound }).catch(() => {
          // The event stream or another participant may complete the round first.
        });
      },
      isHost ? 1200 : 3500,
    );
    return () => clearTimeout(timeoutId);
  }, [timeRemaining, stage, roundClosed, isHost, roomId, currentRound]);

  React.useEffect(() => {
    if (stage !== "WAITING" || verdictCountdown === null || verdictCountdown <= 0) return;
    const interval = setInterval(() => {
      setVerdictCountdown((previous) => {
        if (previous === null || previous <= 1) {
          clearInterval(interval);
          setStage("ROUND_SCOREBOARD");
          return null;
        }
        return previous - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, verdictCountdown, setStage, setVerdictCountdown]);

  return React.useCallback((): void => {
    setVerdictCountdown(null);
    setStage("ROUND_SCOREBOARD");
  }, [setStage, setVerdictCountdown]);
}

"use client";

import * as React from "react";
import { toast } from "sonner";


import { deadlineFor, secondsUntil } from "./room-game-time";
import type { GameStage, IRoomPlayerState, IUserVoteState, RoomGameRoom } from "./types";

import type {
  MatchFinishedPayload,
  RoundCompletedPayload,
  RoundStartedPayload,
  RoomEvent,
  RoundCompletedLeaderboardEntry,
} from "@/app/api/realtime-events/entities/event.types";

interface UseRoomGameEventsInput {
  room: RoomGameRoom;
  currentRound: number;
  applyRoundCompleted: (
    round: number,
    entries: RoundCompletedLeaderboardEntry[],
    officialAnswer: IUserVoteState["vote"] | null,
    submittedVote?: IUserVoteState,
  ) => void;
  setCurrentRound: React.Dispatch<React.SetStateAction<number>>;
  setLastVote: React.Dispatch<React.SetStateAction<IUserVoteState | null>>;
  setPlayers: React.Dispatch<React.SetStateAction<IRoomPlayerState[]>>;
  setRoundClosed: React.Dispatch<React.SetStateAction<boolean>>;
  setVerdictCountdown: React.Dispatch<React.SetStateAction<number | null>>;
  setVotedCount: React.Dispatch<React.SetStateAction<number>>;
  setRoundDeadline: React.Dispatch<React.SetStateAction<number>>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number | null>>;
  setStage: React.Dispatch<React.SetStateAction<GameStage>>;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useRoomGameEvents({
  room,
  currentRound,
  applyRoundCompleted,
  setCurrentRound,
  setLastVote,
  setPlayers,
  setRoundClosed,
  setVerdictCountdown,
  setVotedCount,
  setRoundDeadline,
  setTimeRemaining,
  setStage,
  setIsConnected,
}: UseRoomGameEventsInput): void {
  React.useEffect(() => {
    const source = new EventSource(`/api/rooms/${encodeURIComponent(room.pin)}/events`);
    source.onopen = () => setIsConnected(true);
    source.onerror = () => setIsConnected(false);

    const handleRoundStarted = (event: Event): void => {
      try {
        const data = JSON.parse(
          (event as MessageEvent<string>).data,
        ) as RoomEvent<RoundStartedPayload>;
        const nextRound = data.payload?.currentRound ?? currentRound + 1;
        if (nextRound <= currentRound) return;
        setCurrentRound(nextRound);
        setLastVote(null);
        setPlayers((previous) =>
          previous.map((player) => ({ ...player, roundDelta: 0, isCorrect: undefined })),
        );
        setRoundClosed(false);
        setVerdictCountdown(null);
        setVotedCount(0);
        const nextDeadline = deadlineFor(data.timestamp, room.roundDurationSeconds);
        setRoundDeadline(nextDeadline);
        setTimeRemaining(secondsUntil(nextDeadline));
        setStage("CHECKING");
        toast.info(`Rodada ${nextRound} iniciada!`, {
          description: "Analise a notícia com atenção e dê o seu veredito.",
        });
      } catch {
        setStage("CHECKING");
      }
    };

    const handleRoundCompleted = (event: Event): void => {
      try {
        const data = JSON.parse(
          (event as MessageEvent<string>).data,
        ) as RoomEvent<RoundCompletedPayload>;
        applyRoundCompleted(
          data.payload.round,
          data.payload.leaderboard ?? [],
          data.payload.officialAnswer ?? null,
        );
        toast.success("Rodada finalizada!", {
          description: "Confira o gabarito oficial da rodada e reflita sobre sua resposta.",
        });
      } catch {
        setStage("ROUND_SCOREBOARD");
      }
    };

    const handleMatchFinished = (event: Event): void => {
      try {
        const data = JSON.parse(
          (event as MessageEvent<string>).data,
        ) as RoomEvent<MatchFinishedPayload>;
        if (data.payload?.leaderboard) {
          setPlayers((previous) =>
            previous.map((player) => {
              const entry = data.payload.leaderboard.find((item) => item.userId === player.userId);
              if (!entry) return player;
              return {
                ...player,
                score: entry.score,
                correctCount: entry.correctCount ?? player.correctCount,
              };
            }),
          );
        }
        setStage("MATCH_FINALE");
        toast.success("Partida concluída!", {
          description: "Chegamos ao fim da investigação. Veja os vencedores no pódio!",
        });
      } catch {
        setStage("MATCH_FINALE");
      }
    };

    source.addEventListener("ROUND_STARTED", handleRoundStarted);
    source.addEventListener("ROUND_COMPLETED", handleRoundCompleted);
    source.addEventListener("MATCH_FINISHED", handleMatchFinished);
    return () => {
      source.removeEventListener("ROUND_STARTED", handleRoundStarted);
      source.removeEventListener("ROUND_COMPLETED", handleRoundCompleted);
      source.removeEventListener("MATCH_FINISHED", handleMatchFinished);
      source.close();
    };
  }, [
    applyRoundCompleted,
    currentRound,
    room.pin,
    room.roundDurationSeconds,
    setCurrentRound,
    setIsConnected,
    setLastVote,
    setPlayers,
    setRoundClosed,
    setRoundDeadline,
    setStage,
    setTimeRemaining,
    setVerdictCountdown,
    setVotedCount,
  ]);
}

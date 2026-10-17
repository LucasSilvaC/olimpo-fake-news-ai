"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import type {
  GameStage,
  IRoomGameViewProps,
  IRoomPlayerState,
  IUserVoteState,
} from "../model/types";

import { deadlineFor, secondsUntil } from "./room-game-time";
import { useRoomGameCountdowns } from "./use-room-game-countdowns";
import { useRoomGameEvents } from "./use-room-game-events";

import { advanceRoundAction } from "@/app/api/news-voting/actions/advance-round.action";
import type { SubmitVoteActionResult } from "@/app/api/news-voting/actions/submit-vote.action";
import type { RoundCompletedLeaderboardEntry } from "@/app/api/realtime-events/entities/event.types";
import type { INewsArticleData } from "@/features/news-voting";
import type { IMatchPlayer, IScoreboardPlayer } from "@/widgets/game-stages";



const FALLBACK_ARTICLE: INewsArticleData = {
  title: "Notícia em Verificação Editorial",
  description:
    "Esta notícia está sendo avaliada pelos investigadores da sala. Analise os fatos e submeta o seu veredito.",
  publisher: "Olimpo Fact-Checking",
  url: "https://olimpo.news",
  imageUrl: null,
};

const ANSWER_LABELS = { reliable: "Verdadeiro", unreliable: "Falso", uncertain: "Incerto" };

export function useRoomGameViewModel({
  room,
  members,
  playlistArticles,
  currentUserId,
  initialStage,
  initialVote = null,
  initialRoundClosed = false,
}: IRoomGameViewProps) {
  const router = useRouter();

  // Determine starting stage
  const defaultStage: GameStage = React.useMemo(() => {
    if (initialStage) return initialStage;
    if (room.status === "finished") return "MATCH_FINALE";
    if (initialRoundClosed) return "ROUND_SCOREBOARD";
    if (initialVote) return "WAITING";
    return "CHECKING";
  }, [initialStage, initialVote, initialRoundClosed, room.status]);

  const [stage, setStage] = React.useState<GameStage>(defaultStage);
  const [currentRound, setCurrentRound] = React.useState<number>(room.currentRound || 1);
  const [roundDeadline, setRoundDeadline] = React.useState(() =>
    deadlineFor(room.roundStartedAt, room.roundDurationSeconds),
  );
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(() =>
    secondsUntil(roundDeadline),
  );
  const [lastVote, setLastVote] = React.useState<IUserVoteState | null>(initialVote);
  const [votedCount, setVotedCount] = React.useState<number>(initialVote ? 1 : 0);
  const [isConnected, setIsConnected] = React.useState(true);

  // The server completion marker controls prediction access separately from a vote.
  const [roundClosed, setRoundClosed] = React.useState(initialRoundClosed);
  const [verdictCountdown, setVerdictCountdown] = React.useState<number | null>(null);

  // Maintain players scores and streaks
  const [players, setPlayers] = React.useState<IRoomPlayerState[]>(() =>
    members.map((m) => ({
      userId: m.userId,
      name: m.name,
      score: m.score,
      roundDelta: 0,
      streak: 0,
      correctCount: m.correctCount ?? 0,
      avatar: m.avatar,
    })),
  );

  const lastCompletedRoundRef = React.useRef<number>(initialRoundClosed ? room.currentRound : 0);

  const isHost = room.hostId === currentUserId;

  const currentUserName = React.useMemo(() => {
    return members.find((m) => m.userId === currentUserId)?.name ?? "Investigador";
  }, [members, currentUserId]);

  // Active article based on currentRound
  const activeArticle = React.useMemo<INewsArticleData>(() => {
    const matched =
      playlistArticles.find((item) => item.roundOrder === currentRound) ??
      playlistArticles[currentRound - 1];

    if (!matched) {
      return FALLBACK_ARTICLE;
    }

    return {
      id: matched.id,
      title: matched.title,
      description: matched.description,
      publisher: matched.publisher,
      authors: matched.authors,
      publishedAt: matched.publishedAt,
      imageUrl: matched.imageUrl,
      url: matched.url,
      content: matched.content,
    };
  }, [playlistArticles, currentRound]);

  // Apply each completed round once across action responses and SSE delivery.
  const applyRoundCompleted = React.useCallback(
    (
      round: number,
      entries: RoundCompletedLeaderboardEntry[],
      officialAnswer: IUserVoteState["vote"] | null,
      submittedVote?: IUserVoteState,
    ) => {
      if (round !== currentRound || lastCompletedRoundRef.current >= round) return;
      lastCompletedRoundRef.current = round;
      setPlayers((prev) =>
        prev.map((player) => {
          const entry = entries.find((item) => item.userId === player.userId);
          if (!entry) return player;
          const roundDelta = entry.roundDelta;
          const isCorrect = entry.isCorrect;
          return {
            ...player,
            score: entry.score,
            roundDelta,
            isCorrect,
            streak: isCorrect ? player.streak + 1 : 0,
            correctCount: player.correctCount + (isCorrect ? 1 : 0),
          };
        }),
      );
      setRoundClosed(true);
      setLastVote((prev) => {
        const vote = submittedVote ?? prev;
        const entry = entries.find((item) => item.userId === currentUserId);
        return {
          vote: vote?.vote ?? "uncertain",
          officialAnswer,
          isCorrect: entry?.isCorrect ?? vote?.isCorrect ?? false,
          pointsAwarded: entry?.roundDelta ?? vote?.pointsAwarded ?? 0,
          timeTakenSeconds: vote?.timeTakenSeconds ?? (room.roundDurationSeconds || 30),
          isTimeout: vote?.isTimeout ?? vote === null,
        };
      });
      setVotedCount(members.length);
      setStage((prev) =>
        prev === "MATCH_FINALE" || prev === "ROUND_SCOREBOARD" ? prev : "WAITING",
      );
      setVerdictCountdown(10);
    },
    [currentRound, currentUserId, members.length, room.roundDurationSeconds],
  );

  const handleSkipVerdictCountdown = useRoomGameCountdowns({
    roomId: room.id,
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
  });

  useRoomGameEvents({
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
  });
  // Handle vote submission from NewsCheckStage
  const handleVoteSubmitted = React.useCallback(
    (data: {
      vote: "reliable" | "unreliable" | "uncertain";
      result: SubmitVoteActionResult;
      timeTakenSeconds: number;
      isTimeout?: boolean;
    }): void => {
      if (data.result.success) {
        const voteState: IUserVoteState = {
          vote: data.vote,
          pointsAwarded: data.result.vote.pointsAwarded,
          isCorrect: data.result.vote.isCorrect,
          officialAnswer: data.result.roundCompleted ? (data.result.officialAnswer ?? null) : null,
          timeTakenSeconds: data.timeTakenSeconds,
          isTimeout: data.isTimeout,
        };

        setLastVote((prev) => {
          const officialAnswer = voteState.officialAnswer ?? prev?.officialAnswer ?? null;
          return {
            ...voteState,
            officialAnswer,
          };
        });
        setStage((prev) =>
          prev === "MATCH_FINALE" || prev === "ROUND_SCOREBOARD" ? prev : "WAITING",
        );
        setVotedCount((prev) => Math.min(members.length, prev + 1));

        // If everyone voted and round completed on this action
        if (data.result.roundCompleted) {
          applyRoundCompleted(
            currentRound,
            data.result.leaderboard ?? [],
            data.result.officialAnswer ?? null,
            voteState,
          );
        }
      } else {
        toast.error(data.result.error || "Não foi possível registrar o seu voto.");
      }
    },
    [applyRoundCompleted, currentRound, members.length],
  );

  // Prepare leaderboard data for RoundScoreboardStage
  const scoreboardPlayers: IScoreboardPlayer[] = React.useMemo(() => {
    return [...players]
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        userId: p.userId,
        name: p.name,
        score: p.score,
        roundDelta: p.roundDelta,
        streak: p.streak,
        isCorrect: p.isCorrect,
        timeSeconds: p.timeSeconds,
        isCurrentUser: p.userId === currentUserId,
      }));
  }, [players, currentUserId]);

  // Prepare leaderboard data for MatchScoreboardStage
  const matchPlayers: IMatchPlayer[] = React.useMemo(() => {
    return [...players]
      .sort((a, b) => b.score - a.score)
      .map((p) => {
        const accuracy =
          room.totalRounds > 0 ? Math.round((p.correctCount / room.totalRounds) * 100) : 0;

        return {
          userId: p.userId,
          name: p.name,
          score: p.score,
          correctCount: p.correctCount,
          totalAnswered: room.totalRounds,
          accuracy,
          isCurrentUser: p.userId === currentUserId,
        };
      });
  }, [players, room.totalRounds, currentUserId]);

  const handleExitGame = React.useCallback((): void => {
    router.push("/");
  }, [router]);

  const handleAdvanceRound = React.useCallback(async (): Promise<void> => {
    const result = await advanceRoundAction({ roomId: room.id });
    if (!result.success) throw new Error(result.error);
    toast.success("Avançando para a próxima rodada!");
  }, [room.id]);

  return {
    stage,
    currentRound,
    timeRemaining,
    lastVote,
    votedCount,
    isConnected,
    roundClosed,
    verdictCountdown,
    isHost,
    currentUserName,
    activeArticle,
    handleSkipVerdictCountdown,
    handleVoteSubmitted,
    scoreboardPlayers,
    matchPlayers,
    handleExitGame,
    handleAdvanceRound,
    answerLabels: ANSWER_LABELS,
  };
}

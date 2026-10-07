"use client";

import { ArrowLeft, ShieldCheck, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { MatchScoreboardStage, type IMatchPlayer } from "./match-scoreboard-stage";
import { NewsCheckStage, type INewsArticleData } from "./news-check-stage";
import { RoundScoreboardStage, type IScoreboardPlayer } from "./round-scoreboard-stage";
import { VerdictWaitingStage } from "./verdict-waiting-stage";

import type { SubmitVoteActionResult } from "@/app/api/news-voting/actions/submit-vote.action";
import type {
  MatchFinishedPayload,
  RoundCompletedPayload,
  RoundStartedPayload,
  RoomEvent,
} from "@/app/api/realtime-events/entities/event.types";
import type { RoomStatus } from "@/server/shared/database/schemas/enums";
import { Header } from "@/widgets/app-header";

export type GameStage = "CHECKING" | "WAITING" | "ROUND_SCOREBOARD" | "MATCH_FINALE";

export interface RoomGameMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  score: number;
  avatar?: string;
}

export interface RoomGameRoom {
  id: string;
  pin: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  roundDurationSeconds: number;
  currentRound: number;
  totalRounds: number;
}

export interface RoomGamePlaylistItem extends INewsArticleData {
  roundOrder: number;
}

export interface IUserVoteState {
  vote: "reliable" | "unreliable" | "uncertain";
  pointsAwarded?: number;
  isCorrect?: boolean | null;
  officialAnswer?: "reliable" | "unreliable" | "uncertain" | null;
  reliabilityScore?: number;
  timeTakenSeconds?: number;
}

export interface IRoomPlayerState {
  userId: string;
  name: string;
  score: number;
  roundDelta: number;
  streak: number;
  isCorrect?: boolean;
  timeSeconds?: number;
  correctCount: number;
  avatar?: string;
}

export interface IRoomGameViewProps {
  room: RoomGameRoom;
  members: RoomGameMember[];
  playlistArticles: RoomGamePlaylistItem[];
  currentUserId: string;
  initialStage?: GameStage;
  initialVote?: IUserVoteState | null;
}

const FALLBACK_ARTICLE: INewsArticleData = {
  title: "Notícia em Verificação Editorial",
  description:
    "Esta notícia está sendo avaliada pelos investigadores da sala. Analise os fatos e submeta o seu veredito.",
  publisher: "Olimpo Fact-Checking",
  url: "https://olimpo.news",
  imageUrl: null,
};

export function RoomGameView({
  room,
  members,
  playlistArticles,
  currentUserId,
  initialStage,
  initialVote = null,
}: IRoomGameViewProps): React.ReactElement {
  const router = useRouter();

  // Determine starting stage
  const defaultStage: GameStage = React.useMemo(() => {
    if (initialStage) return initialStage;
    if (room.status === "finished") return "MATCH_FINALE";
    if (initialVote) return "WAITING";
    return "CHECKING";
  }, [initialStage, initialVote, room.status]);

  const [stage, setStage] = React.useState<GameStage>(defaultStage);
  const [currentRound, setCurrentRound] = React.useState<number>(room.currentRound || 1);
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(
    room.roundDurationSeconds || 30,
  );
  const [lastVote, setLastVote] = React.useState<IUserVoteState | null>(initialVote);
  const [votedCount, setVotedCount] = React.useState<number>(initialVote ? 1 : 0);
  const [isConnected, setIsConnected] = React.useState(true);

  // Maintain players scores and streaks
  const [players, setPlayers] = React.useState<IRoomPlayerState[]>(() =>
    members.map((m) => ({
      userId: m.userId,
      name: m.name,
      score: m.score,
      roundDelta: 0,
      streak: 0,
      correctCount: 0,
      avatar: m.avatar,
    })),
  );

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

  // Update leaderboard scores when server broadcasts
  const updateLeaderboardFromEntries = React.useCallback(
    (entries: Array<{ userId: string; score: number }>) => {
      setPlayers((prev) =>
        prev.map((player) => {
          const entry = entries.find((e) => e.userId === player.userId);
          if (!entry) return player;

          const delta = Math.max(0, entry.score - player.score);
          const scored = delta > 0;

          // For the current user, prefer our recorded vote details if available
          const isCurrentUser = player.userId === currentUserId;
          const isCorrect = isCurrentUser ? (lastVote?.isCorrect ?? scored) : scored;
          const earnedDelta = isCurrentUser ? (lastVote?.pointsAwarded ?? delta) : delta;

          return {
            ...player,
            score: entry.score,
            roundDelta: earnedDelta,
            streak: isCorrect ? player.streak + 1 : 0,
            isCorrect,
            correctCount: isCorrect ? player.correctCount + 1 : player.correctCount,
          };
        }),
      );
    },
    [currentUserId, lastVote],
  );

  // Round countdown timer (active only during CHECKING stage)
  React.useEffect(() => {
    if (stage !== "CHECKING" || timeRemaining === null || timeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, timeRemaining]);

  // Server-Sent Events listener
  React.useEffect(() => {
    const pin = encodeURIComponent(room.pin);
    const source = new EventSource(`/api/rooms/${pin}/events`);

    source.onopen = () => {
      setIsConnected(true);
    };

    source.onerror = () => {
      setIsConnected(false);
    };

    const handleRoundStarted = (event: Event): void => {
      try {
        const messageEvent = event as MessageEvent<string>;
        const data = JSON.parse(messageEvent.data) as RoomEvent<RoundStartedPayload>;
        const nextRound = data.payload?.currentRound ?? currentRound + 1;

        setCurrentRound(nextRound);
        setLastVote(null);
        setVotedCount(0);
        setTimeRemaining(room.roundDurationSeconds || 30);
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
        const messageEvent = event as MessageEvent<string>;
        const data = JSON.parse(messageEvent.data) as RoomEvent<RoundCompletedPayload>;
        if (data.payload?.leaderboard) {
          updateLeaderboardFromEntries(data.payload.leaderboard);
        }
        setVotedCount(members.length);
        setStage("ROUND_SCOREBOARD");

        toast.success("Rodada finalizada!", {
          description: "Confira o placar parcial e as sequências de acertos.",
        });
      } catch {
        setStage("ROUND_SCOREBOARD");
      }
    };

    const handleMatchFinished = (event: Event): void => {
      try {
        const messageEvent = event as MessageEvent<string>;
        const data = JSON.parse(messageEvent.data) as RoomEvent<MatchFinishedPayload>;
        if (data.payload?.leaderboard) {
          updateLeaderboardFromEntries(data.payload.leaderboard);
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
    currentRound,
    members.length,
    room.pin,
    room.roundDurationSeconds,
    updateLeaderboardFromEntries,
  ]);

  // Handle vote submission from NewsCheckStage
  const handleVoteSubmitted = React.useCallback(
    (data: {
      vote: "reliable" | "unreliable" | "uncertain";
      result: SubmitVoteActionResult;
      timeTakenSeconds: number;
    }): void => {
      if (data.result.success) {
        const voteState: IUserVoteState = {
          vote: data.vote,
          pointsAwarded: data.result.vote.pointsAwarded,
          isCorrect: data.result.vote.isCorrect,
          officialAnswer: data.result.analysis?.classification ?? null,
          reliabilityScore: data.result.analysis?.confidence ?? 85,
          timeTakenSeconds: data.timeTakenSeconds,
        };

        setLastVote(voteState);
        setStage("WAITING");
        setVotedCount((prev) => Math.min(members.length, prev + 1));

        // If everyone voted and round was completed on this action
        if (data.result.roundCompleted) {
          if (data.result.leaderboard) {
            updateLeaderboardFromEntries(data.result.leaderboard);
          }
          // Brief delay so player can absorb verdict feedback before advancing to scoreboard
          setTimeout(() => {
            setStage((curr) => (curr === "WAITING" ? "ROUND_SCOREBOARD" : curr));
          }, 2600);
        }
      } else {
        toast.error(data.result.error || "Não foi possível registrar o seu voto.");
      }
    },
    [members.length, updateLeaderboardFromEntries],
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

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-white selection:bg-amber-300 selection:text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-40 size-[30rem] rounded-full bg-sky-200/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12rem] bottom-1/4 size-[34rem] rounded-full bg-indigo-300/20 blur-3xl"
      />

      <Header
        className="relative z-20"
        logo={
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white transition-opacity hover:opacity-85 sm:text-xl"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-lg shadow-blue-950/20">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            Olimpo
          </Link>
        }
      >
        <button
          type="button"
          onClick={handleExitGame}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Sair da sala
        </button>
      </Header>

      {/* Offline warning badge if SSE disconnects */}
      {!isConnected && (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 shadow-lg backdrop-blur-md">
          <WifiOff className="h-3.5 w-3.5 animate-pulse" />
          <span>Reconectando à sala...</span>
        </div>
      )}

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-4 pb-12 sm:px-6 sm:pt-6">
        {/* Render active stage */}
        {stage === "CHECKING" && (
          <NewsCheckStage
            roomId={room.id}
            currentRound={currentRound}
            totalRounds={room.totalRounds}
            article={activeArticle}
            timeRemainingSeconds={timeRemaining}
            onVoteSubmitted={handleVoteSubmitted}
          />
        )}

        {stage === "WAITING" && (
          <VerdictWaitingStage
            userName={currentUserName}
            userVote={lastVote?.vote ?? "uncertain"}
            pointsAwarded={lastVote?.pointsAwarded ?? 0}
            timeTakenSeconds={lastVote?.timeTakenSeconds ?? 0}
            isCorrect={lastVote?.isCorrect ?? null}
            officialAnswer={lastVote?.officialAnswer ?? null}
            reliabilityScore={lastVote?.reliabilityScore ?? 85}
            votedCount={votedCount}
            totalPlayers={members.length}
          />
        )}

        {stage === "ROUND_SCOREBOARD" && (
          <RoundScoreboardStage
            roomId={room.id}
            currentRound={currentRound}
            totalRounds={room.totalRounds}
            isHost={isHost}
            leaderboard={scoreboardPlayers}
            onLeave={handleExitGame}
          />
        )}

        {stage === "MATCH_FINALE" && (
          <MatchScoreboardStage
            totalRounds={room.totalRounds}
            leaderboard={matchPlayers}
            onExit={handleExitGame}
          />
        )}
      </main>
    </div>
  );
}

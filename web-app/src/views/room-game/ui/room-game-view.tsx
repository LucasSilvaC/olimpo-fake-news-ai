"use client";

import { ArrowLeft, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { MatchScoreboardStage, type IMatchPlayer } from "./match-scoreboard-stage";
import { ModelAnalysisPanel } from "./model-analysis-panel";
import { NewsCheckStage, type INewsArticleData } from "./news-check-stage";
import { RoundScoreboardStage, type IScoreboardPlayer } from "./round-scoreboard-stage";
import { VerdictWaitingStage } from "./verdict-waiting-stage";

import { concludeRoundAction } from "@/app/api/news-voting/actions/conclude-round.action";
import type { SubmitVoteActionResult } from "@/app/api/news-voting/actions/submit-vote.action";
import type {
  MatchFinishedPayload,
  RoundCompletedPayload,
  RoundStartedPayload,
  RoomEvent,
  RoundCompletedLeaderboardEntry,
} from "@/app/api/realtime-events/entities/event.types";
import { PageShell } from "@/components/molecules/page-shell";
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
  correctCount?: number;
}

export interface RoomGameRoom {
  id: string;
  pin: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  roundDurationSeconds: number;
  roundStartedAt?: string;
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
  timeTakenSeconds?: number;
  isTimeout?: boolean;
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
  initialRoundClosed?: boolean;
}

const FALLBACK_ARTICLE: INewsArticleData = {
  title: "Notícia em Verificação Editorial",
  description:
    "Esta notícia está sendo avaliada pelos investigadores da sala. Analise os fatos e submeta o seu veredito.",
  publisher: "Olimpo Fact-Checking",
  url: "https://olimpo.news",
  imageUrl: null,
};

const ANSWER_LABELS = { reliable: "Verdadeiro", unreliable: "Falso", uncertain: "Incerto" };

function deadlineFor(startedAt: string | undefined, durationSeconds: number): number {
  const start = startedAt ? Date.parse(startedAt) : Number.NaN;
  return (Number.isFinite(start) ? start : Date.now()) + (durationSeconds || 30) * 1000;
}

function secondsUntil(deadline: number): number {
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

// Presentation mirrors the game's score only after its registered answer is disclosed.
function closedVoteResult(
  vote: IUserVoteState | null,
  answer: IUserVoteState["vote"] | null,
): {
  isCorrect: boolean;
  pointsAwarded: number;
} {
  if (!vote || vote.isTimeout || !answer) return { isCorrect: false, pointsAwarded: 0 };
  const isCorrect = vote.vote === answer;
  return { isCorrect, pointsAwarded: isCorrect ? 100 : vote.vote === "uncertain" ? 25 : 0 };
}

export function RoomGameView({
  room,
  members,
  playlistArticles,
  currentUserId,
  initialStage,
  initialVote = null,
  initialRoundClosed = false,
}: IRoomGameViewProps): React.ReactElement {
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
          const recordedVote = submittedVote ?? lastVote;
          const disclosedResult =
            player.userId === currentUserId ? closedVoteResult(recordedVote, officialAnswer) : null;
          const roundDelta =
            entry.roundDelta ??
            disclosedResult?.pointsAwarded ??
            Math.max(0, entry.score - player.score);
          const isCorrect = entry.isCorrect ?? disclosedResult?.isCorrect ?? roundDelta === 100;
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
        const result = closedVoteResult(vote, officialAnswer);
        return {
          vote: vote?.vote ?? "uncertain",
          officialAnswer,
          isCorrect: entry?.isCorrect ?? result.isCorrect,
          pointsAwarded: entry?.roundDelta ?? result.pointsAwarded,
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
    [currentRound, currentUserId, lastVote, members.length, room.roundDurationSeconds],
  );

  // Recompute from the server's deadline, including after suspended tabs or a reload.
  React.useEffect(() => {
    if (roundClosed || (stage !== "CHECKING" && stage !== "WAITING")) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = secondsUntil(roundDeadline);
      setTimeRemaining(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, roundDeadline, roundClosed]);

  // When round duration expires (timeRemaining === 0), force-conclude the round
  // (host concludes at 1.2s; participants have a fallback at 3.5s)
  React.useEffect(() => {
    if (timeRemaining !== 0 || roundClosed || (stage !== "CHECKING" && stage !== "WAITING")) {
      return;
    }

    const delay = isHost ? 1200 : 3500;
    const timeoutId = setTimeout(async () => {
      try {
        await concludeRoundAction({ roomId: room.id, round: currentRound });
      } catch {
        // Concurrent call or event stream handles conclusion
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [timeRemaining, stage, roundClosed, isHost, room.id, currentRound]);

  // Countdown timer for reading the official verdict (10 seconds)
  React.useEffect(() => {
    if (stage !== "WAITING" || verdictCountdown === null || verdictCountdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setVerdictCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setStage("ROUND_SCOREBOARD");
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, verdictCountdown]);

  const handleSkipVerdictCountdown = React.useCallback((): void => {
    setVerdictCountdown(null);
    setStage("ROUND_SCOREBOARD");
  }, []);

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
        if (nextRound <= currentRound) return;

        setCurrentRound(nextRound);
        setLastVote(null);
        setPlayers((prev) =>
          prev.map((player) => ({ ...player, roundDelta: 0, isCorrect: undefined })),
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
        const messageEvent = event as MessageEvent<string>;
        const data = JSON.parse(messageEvent.data) as RoomEvent<RoundCompletedPayload>;
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
        const messageEvent = event as MessageEvent<string>;
        const data = JSON.parse(messageEvent.data) as RoomEvent<MatchFinishedPayload>;
        if (data.payload?.leaderboard) {
          setPlayers((prev) =>
            prev.map((player) => {
              const entry = data.payload.leaderboard.find((e) => e.userId === player.userId);
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
  }, [applyRoundCompleted, currentRound, room.pin, room.roundDurationSeconds]);

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
            ...(officialAnswer ? closedVoteResult(voteState, officialAnswer) : {}),
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

  return (
    <PageShell className="overflow-x-hidden">
      <Header className="relative z-20">
        <button
          type="button"
          onClick={handleExitGame}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {stage === "MATCH_FINALE" ? "Voltar ao início" : "Sair da sala"}
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
            officialAnswer={roundClosed ? (lastVote?.officialAnswer ?? null) : null}
            verdictCountdownSeconds={verdictCountdown}
            onSkipCountdown={handleSkipVerdictCountdown}
            isTimeout={lastVote?.isTimeout ?? false}
            votedCount={votedCount}
            totalPlayers={members.length}
          />
        )}

        {roundClosed && stage !== "WAITING" && lastVote?.officialAnswer && (
          <section
            aria-label="Resultado do jogo"
            className="mt-6 w-full max-w-2xl rounded-3xl bg-white p-6 text-slate-800"
          >
            <h2 className="text-lg font-bold">Resultado do jogo</h2>
            <p className="mt-2 text-sm">
              Gabarito cadastrado: <strong>{ANSWER_LABELS[lastVote.officialAnswer]}</strong>
            </p>
            <p className="mt-1 text-sm">Seu voto: {ANSWER_LABELS[lastVote.vote]}</p>
          </section>
        )}

        {roundClosed && (
          <ModelAnalysisPanel
            key={`${room.id}:${currentRound}`}
            roomId={room.id}
            round={currentRound}
          />
        )}

        {stage === "ROUND_SCOREBOARD" && (
          <RoundScoreboardStage
            roomId={room.id}
            currentRound={currentRound}
            totalRounds={room.totalRounds}
            isHost={isHost}
            leaderboard={scoreboardPlayers}
          />
        )}

        {stage === "MATCH_FINALE" && (
          <MatchScoreboardStage totalRounds={room.totalRounds} leaderboard={matchPlayers} />
        )}
      </main>
    </PageShell>
  );
}

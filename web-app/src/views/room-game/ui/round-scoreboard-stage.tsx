"use client";

import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Loader2,
  LogOut,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { advanceRoundAction } from "@/app/api/news-voting/actions/advance-round.action";

export interface IScoreboardPlayer {
  userId: string;
  name: string;
  score: number;
  roundDelta?: number;
  streak?: number;
  isCorrect?: boolean;
  timeSeconds?: number;
  isCurrentUser?: boolean;
}

export interface IRoundScoreboardStageProps {
  roomId: string;
  currentRound: number;
  totalRounds: number;
  isHost: boolean;
  leaderboard: IScoreboardPlayer[];
  onAdvance?: () => void;
  onLeave?: () => void;
}

export function RoundScoreboardStage({
  roomId,
  currentRound,
  totalRounds,
  isHost,
  leaderboard,
  onAdvance,
  onLeave,
}: IRoundScoreboardStageProps): React.ReactElement {
  const [isAdvancing, setIsAdvancing] = React.useState(false);

  // Find player with the highest active streak
  const streakLeader = React.useMemo(() => {
    const withStreak = leaderboard.filter((p) => (p.streak ?? 0) >= 2);
    if (withStreak.length === 0) return null;
    return withStreak.reduce((max, cur) => ((cur.streak ?? 0) > (max.streak ?? 0) ? cur : max));
  }, [leaderboard]);

  const handleAdvance = async (): Promise<void> => {
    if (isAdvancing) return;
    setIsAdvancing(true);

    try {
      const result = await advanceRoundAction({ roomId });
      if (!result.success) {
        toast.error("Não foi possível avançar a rodada", {
          description: result.error,
        });
        setIsAdvancing(false);
        return;
      }

      toast.success("Avançando para a próxima rodada!");
      onAdvance?.();
    } catch {
      toast.error("Erro ao avançar rodada", {
        description: "Falha de conexão. Tente novamente.",
      });
      setIsAdvancing(false);
    }
  };

  return (
    <div
      className="flex w-full flex-col items-center py-2 text-slate-800"
      data-purpose="round-scoreboard-stage"
    >
      {/* Top Exit button if onLeave provided */}
      {onLeave && (
        <div className="mb-2 flex w-full max-w-2xl justify-end">
          <button
            type="button"
            onClick={onLeave}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            <span>Sair da Sala</span>
          </button>
        </div>
      )}

      {/* Top Announcement / Streak Spotlight Alert */}
      {streakLeader && (
        <div className="mb-4 flex w-full max-w-2xl items-center justify-between gap-3 rounded-2xl border border-white/25 bg-white/20 p-3 text-white shadow-md backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-sm">
              <Flame className="size-5 fill-amber-950 text-amber-950" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-sm leading-tight font-bold sm:text-base">
                  {streakLeader.name} está pegando fogo!
                </span>
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-amber-950 uppercase">
                  {streakLeader.streak}x em sequência
                </span>
              </div>
              <span className="truncate text-xs text-white/85">
                Acertou os fatos com precisão e lidera a sequência
              </span>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold sm:flex">
            <Sparkles className="size-3.5 text-amber-300" aria-hidden="true" />
            <span>Combo</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6 w-full max-w-2xl text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/20 px-3.5 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-sm backdrop-blur-sm">
          <Trophy className="size-3.5 text-amber-300" aria-hidden="true" />
          <span>Classificação Parcial</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-4xl">
          Placar da Rodada {currentRound}
        </h1>
        <p className="mt-1 text-xs text-white/90 sm:text-sm">
          {currentRound < totalRounds
            ? `Rodada ${currentRound} de ${totalRounds} concluída.`
            : "Última rodada concluída!"}{" "}
          {isHost
            ? "Clique em avançar para continuar o jogo."
            : "Aguardando o anfitrião avançar para a próxima rodada..."}
        </p>
      </div>

      {/* Leaderboard Stack */}
      <div className="mb-6 flex w-full max-w-2xl flex-col gap-2.5">
        {leaderboard.map((player, index) => {
          const rank = index + 1;
          const isFirst = rank === 1;
          const isSecond = rank === 2;
          const isThird = rank === 3;

          let rankBadgeBg = "bg-slate-100 text-slate-700";
          if (isFirst) rankBadgeBg = "bg-amber-400 text-amber-950 shadow-amber-400/30";
          else if (isSecond) rankBadgeBg = "bg-slate-200 text-slate-800";
          else if (isThird) rankBadgeBg = "bg-amber-100 text-amber-900";

          return (
            <div
              key={player.userId}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-3.5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                player.isCurrentUser ? "ring-2 ring-blue-500" : ""
              } ${isFirst ? "border border-amber-200 shadow-amber-500/10" : ""}`}
            >
              {/* Left side: Rank badge & User Info */}
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full text-base font-black shadow-sm ${rankBadgeBg}`}
                >
                  {rank}
                </div>
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-slate-900 sm:text-base">
                      {player.name}
                    </span>
                    {player.isCurrentUser && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700">
                        Você
                      </span>
                    )}
                    {(player.streak ?? 0) >= 2 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        <Flame className="size-3 fill-amber-500 text-amber-500" />
                        {player.streak}x
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {player.isCorrect !== undefined && (
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          player.isCorrect ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        {player.isCorrect ? (
                          <>
                            <CheckCircle2 className="size-3" /> Acertou
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3" /> Errou
                          </>
                        )}
                      </span>
                    )}
                    {player.timeSeconds && (
                      <>
                        <span>•</span>
                        <span>{player.timeSeconds}s</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: Points & Delta */}
              <div className="shrink-0 text-right">
                <span className="block text-base font-black text-slate-900 sm:text-lg">
                  {player.score.toLocaleString("pt-BR")}{" "}
                  <span className="text-[10px] font-bold text-slate-400 uppercase">pts</span>
                </span>
                {player.roundDelta !== undefined && (
                  <span
                    className={`text-xs font-extrabold ${
                      player.roundDelta > 0
                        ? "text-emerald-600"
                        : player.roundDelta < 0
                          ? "text-rose-500"
                          : "text-slate-400"
                    }`}
                  >
                    {player.roundDelta > 0 ? `+${player.roundDelta}` : player.roundDelta} nesta
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host-Exclusive Advance Button vs Participant Waiting Indicator */}
      <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-2">
        {isHost ? (
          <button
            type="button"
            disabled={isAdvancing}
            onClick={() => void handleAdvance()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 text-base font-extrabold text-amber-950 shadow-xl transition-all duration-200 hover:bg-amber-300 hover:shadow-2xl active:scale-95 disabled:opacity-60 sm:w-auto"
          >
            {isAdvancing ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Avançando rodada...</span>
              </>
            ) : (
              <>
                <span>
                  {currentRound < totalRounds
                    ? "Avançar para Próxima Rodada"
                    : "Ver Classificação Final"}
                </span>
                <ArrowRight className="size-5 stroke-[2.5]" aria-hidden="true" />
              </>
            )}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-amber-400" />
            </span>
            <span>Aguardando o líder da sala avançar...</span>
          </div>
        )}
      </div>
    </div>
  );
}

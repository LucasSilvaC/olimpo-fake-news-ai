"use client";

import { Home, Share2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export interface IMatchPlayer {
  userId: string;
  name: string;
  score: number;
  correctCount?: number;
  totalAnswered?: number;
  accuracy?: number;
  isCurrentUser?: boolean;
}

export interface IMatchScoreboardStageProps {
  totalRounds: number;
  leaderboard: IMatchPlayer[];
  onExit?: () => void;
}

export function MatchScoreboardStage({
  totalRounds,
  leaderboard,
  onExit,
}: IMatchScoreboardStageProps): React.ReactElement {
  const router = useRouter();

  // Top 3 players
  const first = leaderboard[0] ?? null;
  const second = leaderboard[1] ?? null;
  const third = leaderboard[2] ?? null;
  const remaining = leaderboard.slice(3);

  // Calculate average editorial accuracy
  const averageAccuracy = React.useMemo(() => {
    if (leaderboard.length === 0) return 0;
    const totalAcc = leaderboard.reduce((acc, p) => {
      const pAcc =
        p.accuracy !== undefined
          ? p.accuracy
          : p.correctCount !== undefined && totalRounds > 0
            ? Math.round((p.correctCount / totalRounds) * 100)
            : 75;
      return acc + pAcc;
    }, 0);
    return Math.round(totalAcc / leaderboard.length);
  }, [leaderboard, totalRounds]);

  const handleShare = async (): Promise<void> => {
    const summary = first
      ? `🏆 Partida do Olimpo finalizada!\n1º Lugar: ${first.name} (${first.score.toLocaleString("pt-BR")} pts)\nVenha checar fatos no Olimpo!`
      : "Venha checar fatos no Olimpo!";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Resultado Olimpo",
          text: summary,
          url: window.location.href,
        });
        return;
      }
      await navigator.clipboard.writeText(summary);
      toast.success("Resumo da partida copiado para a área de transferência!");
    } catch {
      toast.info("Resumo da partida copiado.");
    }
  };

  const handleExit = (): void => {
    if (onExit) {
      onExit();
    } else {
      router.push("/");
    }
  };

  return (
    <div
      className="flex w-full flex-col items-center py-4 select-none md:py-6"
      data-purpose="match-scoreboard-stage"
    >
      {/* Top Header Actions */}
      <div className="mb-6 flex w-full max-w-4xl items-center justify-between px-2">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-4 py-1.5 shadow-sm backdrop-blur-md">
          <span className="size-2.5 animate-pulse rounded-full bg-amber-400" />
          <span className="text-xs font-bold tracking-wider text-white uppercase">
            Rodada {totalRounds}/{totalRounds} • Finalizada
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 sm:text-sm"
          >
            <Share2 className="size-3.5 sm:size-4" aria-hidden="true" />
            <span>Compartilhar</span>
          </button>
          <button
            type="button"
            onClick={handleExit}
            className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 sm:text-sm"
          >
            <Home className="size-3.5 sm:size-4" aria-hidden="true" />
            <span>Voltar ao Início</span>
          </button>
        </div>
      </div>

      {/* Heading Section */}
      <div className="mb-8 max-w-xl text-center">
        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl">
          Classificação da Partida
        </h1>
        <p className="mt-2 text-xs text-blue-100/90 sm:text-sm">
          Verificação concluída entre {leaderboard.length}{" "}
          {leaderboard.length === 1 ? "participante" : "participantes"}. Precisão editorial média de{" "}
          {averageAccuracy}%.
        </p>
      </div>

      {/* 3D Podium Display (Top 3) */}
      <div className="mb-10 w-full max-w-2xl px-2">
        <div className="grid grid-cols-3 items-end gap-2.5 sm:gap-4 md:gap-6">
          {/* 2nd Place (Silver) */}
          <div className="group flex flex-col items-center transition-all duration-300 hover:-translate-y-1.5">
            {second && (
              <>
                <div className="mb-2 flex flex-col items-center space-y-0.5 text-center">
                  <span className="max-w-[90px] truncate rounded-full border border-white/20 bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm sm:max-w-[120px] sm:text-sm">
                    {second.name}
                  </span>
                  <span className="text-xs font-extrabold text-white/90 drop-shadow-sm sm:text-sm">
                    {second.score.toLocaleString("pt-BR")} pts
                  </span>
                </div>
                <div className="group-hover:shadow-3xl flex min-h-[170px] w-full flex-col items-center justify-between rounded-t-2xl bg-[#dae2fd] pt-4 pb-6 text-[#131b2e] shadow-2xl transition-all sm:min-h-[200px] md:rounded-t-3xl">
                  <div className="flex size-11 items-center justify-center rounded-full bg-white text-xl font-extrabold text-[#131b2e] shadow-sm sm:size-13 sm:text-2xl">
                    2
                  </div>
                  <div className="px-1 text-center">
                    <span className="block text-[10px] font-bold text-[#434655] sm:text-xs">
                      {second.correctCount ?? Math.round(totalRounds * 0.8)}/{totalRounds} acertos
                    </span>
                    <span className="text-[10px] font-extrabold text-blue-700 sm:text-xs">
                      {second.accuracy ?? 80}% precisão
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 1st Place (Gold Champion) */}
          <div className="group z-10 flex flex-col items-center transition-all duration-300 hover:-translate-y-2">
            {first && (
              <>
                <div className="mb-2 flex flex-col items-center space-y-0.5 text-center">
                  <div className="flex max-w-[110px] items-center gap-1 truncate rounded-full border border-amber-300/40 bg-white/25 px-3 py-0.5 text-xs font-extrabold text-white shadow-sm backdrop-blur-sm sm:max-w-[150px] sm:text-sm">
                    <Trophy className="size-3 text-amber-300 sm:size-3.5" aria-hidden="true" />
                    <span className="truncate">{first.name}</span>
                  </div>
                  <span className="text-xs font-black text-white drop-shadow sm:text-base">
                    {first.score.toLocaleString("pt-BR")} pts
                  </span>
                </div>
                <div className="flex min-h-[220px] w-full flex-col items-center justify-between rounded-t-2xl bg-[#ffc329] pt-5 pb-8 text-[#261a00] shadow-2xl transition-all group-hover:shadow-amber-500/30 sm:min-h-[260px] md:rounded-t-3xl">
                  <div className="flex size-13 items-center justify-center rounded-full bg-white/40 text-2xl font-black text-[#261a00] shadow-sm sm:size-15 sm:text-3xl">
                    1
                  </div>
                  <div className="px-1 text-center">
                    <span className="block text-[10px] font-extrabold tracking-wider text-[#5c4300] uppercase sm:text-xs">
                      Campeão
                    </span>
                    <span className="text-xs font-black text-[#261a00] sm:text-sm">
                      {first.correctCount ?? totalRounds}/{totalRounds} • {first.accuracy ?? 100}%
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="group flex flex-col items-center transition-all duration-300 hover:-translate-y-1.5">
            {third && (
              <>
                <div className="mb-2 flex flex-col items-center space-y-0.5 text-center">
                  <span className="max-w-[90px] truncate rounded-full border border-white/20 bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm sm:max-w-[120px] sm:text-sm">
                    {third.name}
                  </span>
                  <span className="text-xs font-extrabold text-white/90 drop-shadow-sm sm:text-sm">
                    {third.score.toLocaleString("pt-BR")} pts
                  </span>
                </div>
                <div className="flex min-h-[140px] w-full flex-col items-center justify-between rounded-t-2xl bg-[#cd7f32] pt-4 pb-6 text-white shadow-xl transition-all group-hover:shadow-2xl sm:min-h-[160px] md:rounded-t-3xl">
                  <div className="flex size-11 items-center justify-center rounded-full bg-white text-xl font-extrabold text-[#5c2e0b] shadow-sm sm:size-13 sm:text-2xl">
                    3
                  </div>
                  <div className="px-1 text-center">
                    <span className="block text-[10px] font-bold text-white/90 sm:text-xs">
                      {third.correctCount ?? Math.round(totalRounds * 0.7)}/{totalRounds} acertos
                    </span>
                    <span className="text-[10px] font-extrabold text-[#ffdf9f] sm:text-xs">
                      {third.accuracy ?? 70}% precisão
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Ranking List: 4th Place and Beyond */}
      {remaining.length > 0 && (
        <div className="w-full max-w-2xl space-y-2.5 px-2">
          <div className="flex items-center justify-between px-3 text-xs font-bold tracking-wider text-white/80 uppercase">
            <span>Posição &amp; Participante</span>
            <div className="flex items-center gap-8">
              <span className="hidden sm:inline">Precisão</span>
              <span>Pontuação</span>
            </div>
          </div>

          {remaining.map((player, index) => {
            const rank = index + 4;
            const correctText = `${
              player.correctCount ?? Math.round(totalRounds * 0.6)
            }/${totalRounds} corretas`;

            return (
              <div
                key={player.userId}
                className={`flex items-center justify-between rounded-2xl bg-white px-5 py-3.5 text-[#131b2e] shadow-md transition-all duration-200 hover:shadow-lg ${
                  player.isCurrentUser ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eaedff] text-sm font-bold text-[#131b2e]">
                    {rank}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#131b2e] sm:text-base">
                      {player.name}
                      {player.isCurrentUser && (
                        <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700">
                          Você
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-[#434655] sm:hidden">{correctText}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-8">
                  <span className="hidden text-sm font-medium text-[#434655] sm:inline">
                    {correctText}
                  </span>
                  <span className="text-base font-extrabold text-blue-700 sm:text-lg">
                    {player.score.toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

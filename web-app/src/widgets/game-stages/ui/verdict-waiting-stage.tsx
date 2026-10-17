"use client";

import { ArrowRight, Check, Clock, HelpCircle, X } from "lucide-react";
import * as React from "react";

export interface IVerdictWaitingStageProps {
  userName: string;
  userVote: "reliable" | "unreliable" | "uncertain";
  pointsAwarded?: number;
  timeTakenSeconds?: number;
  isCorrect?: boolean | null;
  officialAnswer?: "reliable" | "unreliable" | "uncertain" | null;
  votedCount: number;
  totalPlayers: number;
  verdictCountdownSeconds?: number | null;
  onSkipCountdown?: () => void;
  isTimeout?: boolean;
}

const VOTE_CONFIGS: Record<
  "reliable" | "unreliable" | "uncertain",
  {
    name: string;
    Icon: React.ComponentType<{ className?: string }>;
    userIconBox: string;
    officialIconBox: string;
    officialCardClass: string;
    officialSubtext: string;
  }
> = {
  reliable: {
    name: "VERDADEIRO",
    Icon: Check,
    userIconBox: "bg-emerald-100 text-emerald-600",
    officialIconBox: "bg-emerald-500 text-white",
    officialCardClass: "bg-emerald-50/70 border-emerald-200/80",
    officialSubtext: "text-emerald-700",
  },
  unreliable: {
    name: "FALSO",
    Icon: X,
    userIconBox: "bg-rose-100 text-rose-600",
    officialIconBox: "bg-rose-500 text-white",
    officialCardClass: "bg-rose-50/70 border-rose-200/80",
    officialSubtext: "text-rose-700",
  },
  uncertain: {
    name: "INCERTO",
    Icon: HelpCircle,
    userIconBox: "bg-amber-100 text-amber-700",
    officialIconBox: "bg-amber-500 text-white",
    officialCardClass: "bg-amber-50/70 border-amber-200/80",
    officialSubtext: "text-amber-700",
  },
};

export function VerdictWaitingStage({
  userVote,
  pointsAwarded = 0,
  timeTakenSeconds = 3,
  isCorrect,
  officialAnswer,
  votedCount,
  totalPlayers,
  verdictCountdownSeconds,
  onSkipCountdown,
  isTimeout = false,
}: IVerdictWaitingStageProps): React.ReactElement {
  const userVoteConfig = VOTE_CONFIGS[userVote] || VOTE_CONFIGS.unreliable;
  const officialConfig = officialAnswer ? VOTE_CONFIGS[officialAnswer] : null;

  const progressPercent = totalPlayers > 0 ? Math.round((votedCount / totalPlayers) * 100) : 0;

  return (
    <div
      className="relative z-10 flex w-full flex-1 flex-col items-center justify-center py-4 text-slate-100 md:py-6"
      data-purpose="waiting-state-container"
    >
      {/* Rocket Graphic & Header */}
      <div className="mb-5 flex flex-col items-center text-center">
        {/* Animated Rocket Artwork */}
        <div className="animate-float relative mb-2 flex size-28 items-center justify-center md:size-32">
          {/* Radial soft glow */}
          <div className="absolute inset-0 scale-90 rounded-full bg-blue-400/25 blur-2xl" />

          {/* Animated Rocket Vector Artwork */}
          <svg
            className="relative z-10 size-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.3)] select-none"
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="rocketBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#f1f5f9" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
              <linearGradient id="rocketNoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
              <linearGradient id="rocketFinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
              <linearGradient id="fireInnerGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <radialGradient id="windowGlass" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="70%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </radialGradient>
            </defs>

            {/* Propulsion Flame */}
            <g className="animate-pulse" transform="rotate(45 80 80)">
              <path
                d="M80 102 C70 125 72 146 80 156 C88 146 90 125 80 102 Z"
                fill="url(#fireInnerGrad)"
                opacity="0.8"
              />
              <path d="M80 102 C74 116 75 130 80 138 C85 130 86 116 80 102 Z" fill="#fef08a" />
            </g>

            {/* Stars */}
            <g opacity="0.8">
              <circle cx="32" cy="42" r="2.5" fill="#93c5fd" />
              <circle cx="134" cy="52" r="2" fill="#fde047" />
              <circle cx="126" cy="118" r="2.5" fill="#67e8f9" />
              <path
                d="M138 34 L140 39 L145 41 L140 43 L138 48 L136 43 L131 41 L136 39 Z"
                fill="#ffffff"
                opacity="0.85"
              />
            </g>

            {/* Main Rocket angled 45 degrees */}
            <g transform="rotate(45 80 80)">
              <path d="M73 98 L87 98 L85 104 L75 104 Z" fill="#475569" />
              <ellipse cx="80" cy="104" rx="5" ry="1.5" fill="#334155" />
              <path
                d="M66 84 C62 88 53 100 52 106 C58 105 67 101 70 96 Z"
                fill="url(#rocketFinGrad)"
                stroke="#9f1239"
                strokeWidth="1.5"
              />
              <path
                d="M94 84 C98 88 107 100 108 106 C102 105 93 101 90 96 Z"
                fill="url(#rocketFinGrad)"
                stroke="#9f1239"
                strokeWidth="1.5"
              />
              <path
                d="M80 24 C67 44 65 76 66 98 C72 101 88 101 94 98 C95 76 93 44 80 24 Z"
                fill="url(#rocketBodyGrad)"
                stroke="#94a3b8"
                strokeWidth="1.5"
              />
              <path
                d="M80 24 C74 34 71 45 70 52 C76 53.5 84 53.5 90 52 C89 45 86 34 80 24 Z"
                fill="url(#rocketNoseGrad)"
              />
              <circle cx="80" cy="65" r="11" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
              <circle cx="80" cy="65" r="8.5" fill="url(#windowGlass)" />
            </g>
          </svg>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md md:text-4xl">
          {officialAnswer ? "Veredito Revelado!" : "Veredito registrado!"}
        </h1>

        {/* Subheadline */}
        <p className="mt-1 text-sm font-medium text-blue-100/90 md:text-base">
          {officialAnswer
            ? "Confira o gabarito oficial da rodada e os pontos recebidos."
            : "Aguardando os outros jogadores..."}
        </p>

        {/* Prominent Countdown Banner when verdict is revealed */}
        {verdictCountdownSeconds !== null && verdictCountdownSeconds !== undefined && (
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/20 px-3.5 py-1 text-xs font-bold text-amber-200 backdrop-blur-md">
              <Clock className="size-3.5 animate-spin text-amber-300" aria-hidden="true" />
              <span>Avançando para o placar da rodada em {verdictCountdownSeconds}s</span>
            </div>
            {onSkipCountdown && (
              <button
                type="button"
                onClick={onSkipCountdown}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold text-amber-950 shadow-md transition-all hover:bg-amber-300 active:scale-95"
              >
                <span>Ver placar agora</span>
                <ArrowRight className="size-3 stroke-[2.5]" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Clean Unified Card */}
      <section
        className="flex w-full max-w-3xl flex-col gap-5 rounded-3xl border border-white/60 bg-white p-6 text-slate-800 shadow-2xl shadow-blue-950/25 md:p-7"
        data-purpose="verdict-summary-card"
      >
        {/* Verdict & Result Feedback Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Seu Veredito */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${userVoteConfig.userIconBox}`}
              >
                <userVoteConfig.Icon className="size-4 stroke-[3]" />
              </div>
              <div>
                <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  Seu Veredito
                </span>
                <span className="text-sm font-extrabold text-slate-800">{userVoteConfig.name}</span>
              </div>
            </div>
            {isTimeout ? (
              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                Tempo Esgotado
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400">{timeTakenSeconds}s</span>
            )}
          </div>

          {/* Gabarito Oficial */}
          {officialConfig ? (
            <div
              role="region"
              aria-label="Gabarito oficial da rodada"
              className={`flex items-center justify-between rounded-2xl border p-3.5 shadow-xs ${officialConfig.officialCardClass}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-xs ${officialConfig.officialIconBox}`}
                >
                  <officialConfig.Icon className="size-4 stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold tracking-wider uppercase ${officialConfig.officialSubtext}`}
                    >
                      Gabarito Oficial
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                    {officialConfig.name}
                    {isTimeout ? (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        Tempo Esgotado
                      </span>
                    ) : (
                      isCorrect !== null &&
                      isCorrect !== undefined && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            isCorrect
                              ? "bg-emerald-100/90 text-emerald-700"
                              : "bg-rose-100/90 text-rose-700"
                          }`}
                        >
                          {isCorrect ? "Você acertou!" : "Incorreto"}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-lg border border-amber-200 bg-amber-100/90 px-2 py-0.5 text-[11px] font-extrabold text-amber-600 shadow-xs">
                {isTimeout ? "0 pts" : `⚡ +${pointsAwarded} pts`}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-600">
                  <Clock className="size-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                    Gabarito Oficial
                  </span>
                  <span className="text-sm font-bold text-slate-600">Aguardando Revelação</span>
                </div>
              </div>
              <span className="rounded-md bg-blue-100/80 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                Ao Concluir
              </span>
            </div>
          )}
        </div>

        {/* Clean Room Progress Tracker (while waiting for other players) */}
        {!officialAnswer && (
          <div className="pt-0.5" data-purpose="room-progress-tracker">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="inline-block size-2 animate-pulse rounded-full bg-blue-600" />
                Progresso da sala
              </span>
              <span className="font-extrabold text-blue-600">
                {votedCount} de {totalPlayers} checadores concluíram ({progressPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-200/80 bg-slate-100 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Advance Button to allow players to proceed at their own pace */}
        {officialAnswer && onSkipCountdown && (
          <div className="mt-1 flex justify-center border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onSkipCountdown}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 text-base font-extrabold text-amber-950 shadow-xl transition-all duration-200 hover:bg-amber-300 hover:shadow-2xl active:scale-95 disabled:opacity-60 sm:w-auto"
            >
              <span>Ir para o Placar da Rodada</span>
              {verdictCountdownSeconds !== null && verdictCountdownSeconds !== undefined && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                  {verdictCountdownSeconds}s
                </span>
              )}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

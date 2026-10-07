"use client";

import { Check, HelpCircle, Users, X } from "lucide-react";
import * as React from "react";

import { SocraticReflection } from "./socratic-reflection";
import { VerometroGauge } from "./verometro-gauge";

export interface IVerdictWaitingStageProps {
  userName: string;
  userVote: "reliable" | "unreliable" | "uncertain";
  pointsAwarded?: number;
  timeTakenSeconds?: number;
  isCorrect?: boolean | null;
  officialAnswer?: "reliable" | "unreliable" | "uncertain" | null;
  reliabilityScore: number;
  votedCount: number;
  totalPlayers: number;
}

const VOTE_LABELS: Record<
  "reliable" | "unreliable" | "uncertain",
  {
    name: string;
    sublabel: string;
    bgClass: string;
    borderClass: string;
    iconBg: string;
    textColor: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  reliable: {
    name: "VERDADEIRO",
    sublabel: "Fato Verificado",
    bgClass: "bg-emerald-50/90",
    borderClass: "border-emerald-200/80",
    iconBg: "bg-emerald-600",
    textColor: "text-emerald-700",
    Icon: Check,
  },
  unreliable: {
    name: "FALSO",
    sublabel: "Fake News",
    bgClass: "bg-rose-50/90",
    borderClass: "border-rose-200/80",
    iconBg: "bg-rose-600",
    textColor: "text-rose-600",
    Icon: X,
  },
  uncertain: {
    name: "INCERTO",
    sublabel: "Sem Dados",
    bgClass: "bg-amber-50/90",
    borderClass: "border-amber-200/80",
    iconBg: "bg-amber-500",
    textColor: "text-amber-700",
    Icon: HelpCircle,
  },
};

export function VerdictWaitingStage({
  userName,
  userVote,
  pointsAwarded = 0,
  timeTakenSeconds = 3,
  isCorrect,
  officialAnswer,
  reliabilityScore,
  votedCount,
  totalPlayers,
}: IVerdictWaitingStageProps): React.ReactElement {
  const userVoteConfig = VOTE_LABELS[userVote] || VOTE_LABELS.unreliable;
  const officialConfig = officialAnswer ? VOTE_LABELS[officialAnswer] : null;

  const progressPercent = totalPlayers > 0 ? Math.round((votedCount / totalPlayers) * 100) : 0;

  return (
    <div
      className="flex w-full flex-col items-center justify-center py-4 text-slate-100 md:py-6"
      data-purpose="waiting-state-container"
    >
      {/* Floating Rocket Graphic & Hero Banner */}
      <div className="mb-6 flex flex-col items-center text-center">
        {/* Animated Olimpo Rocket Graphic */}
        <div className="relative mb-3 flex size-36 animate-[bounce_4s_infinite_ease-in-out] items-center justify-center md:size-44">
          {/* Radial soft glow */}
          <div className="absolute inset-0 scale-90 rounded-full bg-blue-400/25 blur-2xl" />

          {/* Animated Rocket Vector SVG */}
          <svg
            className="relative z-10 size-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.35)] select-none"
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
              <filter id="flameGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Flame Trail */}
            <g className="animate-pulse" transform="rotate(45 80 80)">
              <path
                d="M80 102 C70 125 72 146 80 156 C88 146 90 125 80 102 Z"
                fill="url(#fireInnerGrad)"
                opacity="0.7"
                filter="url(#flameGlow)"
              />
              <path d="M80 102 C74 116 75 130 80 138 C85 130 86 116 80 102 Z" fill="#fef08a" />
            </g>

            {/* Stars & Dust */}
            <g opacity="0.85">
              <circle cx="32" cy="42" r="2.5" fill="#93c5fd" className="animate-ping" />
              <circle cx="134" cy="52" r="2" fill="#fde047" />
              <circle cx="126" cy="118" r="2.5" fill="#67e8f9" className="animate-pulse" />
              <circle cx="28" cy="124" r="1.5" fill="#ffffff" opacity="0.6" />
              <path
                d="M138 34 L140 39 L145 41 L140 43 L138 48 L136 43 L131 41 L136 39 Z"
                fill="#ffffff"
                opacity="0.8"
              />
            </g>

            {/* Rocket Angled at 45deg */}
            <g transform="rotate(45 80 80)">
              <path d="M73 98 L87 98 L85 104 L75 104 Z" fill="#475569" />
              <ellipse cx="80" cy="104" rx="5" ry="1.5" fill="#334155" />
              <path
                d="M66 84 C62 88 53 100 52 106 C58 105 67 101 70 96 Z"
                fill="url(#rocketFinGrad)"
                stroke="#9f1239"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M94 84 C98 88 107 100 108 106 C102 105 93 101 90 96 Z"
                fill="url(#rocketFinGrad)"
                stroke="#9f1239"
                strokeWidth="1.5"
                strokeLinejoin="round"
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
              <path d="M79 84 L81 84 L81.5 100 L78.5 100 Z" fill="url(#rocketFinGrad)" />
              <circle cx="80" cy="65" r="11" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
              <circle cx="80" cy="65" r="8.5" fill="url(#windowGlass)" />
              <ellipse
                cx="78"
                cy="62"
                rx="4"
                ry="2"
                transform="rotate(-35 78 62)"
                fill="#ffffff"
                opacity="0.75"
              />
            </g>
          </svg>
        </div>

        {/* Current Player Pill */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-sm font-bold text-white shadow-sm backdrop-blur-md md:text-base">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
          </span>
          <span>{userName} (Você)</span>
        </div>

        {/* Headlines */}
        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-md md:text-5xl">
          Veredito registrado!
        </h1>
        <p className="mt-2 max-w-lg text-base font-medium text-blue-100/90 md:text-lg">
          Aguardando os outros checadores concluírem a análise dos fatos...
        </p>
      </div>

      {/* Main Verdict & Analysis Card */}
      <section
        className="w-full max-w-2xl rounded-3xl border border-white/40 bg-white p-6 text-slate-800 shadow-2xl shadow-blue-950/40 md:p-8"
        data-purpose="verdict-summary-card"
      >
        {/* User Verdict vs Official Answer Box */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* User Recorded Verdict */}
            <div
              className={`flex items-center justify-between rounded-xl border p-3 ${userVoteConfig.bgClass} ${userVoteConfig.borderClass}`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-base font-black text-white shadow-sm ${userVoteConfig.iconBg}`}
                >
                  <userVoteConfig.Icon className="size-5 stroke-[2.5]" />
                </div>
                <div>
                  <div
                    className={`text-[10px] font-extrabold tracking-wider uppercase ${userVoteConfig.textColor}`}
                  >
                    Seu Veredito
                  </div>
                  <div className="text-sm leading-tight font-black text-slate-900">
                    {userVoteConfig.name} ({userVoteConfig.sublabel})
                  </div>
                </div>
              </div>
              <div className="pl-2 text-right">
                <span className="block text-[10px] font-semibold text-slate-500">
                  {timeTakenSeconds}s
                </span>
                <span className="inline-flex items-center rounded bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                  ⚡ +{pointsAwarded} pts
                </span>
              </div>
            </div>

            {/* Official Answer */}
            {officialConfig ? (
              <div
                className={`flex items-center justify-between rounded-xl border p-3 ${officialConfig.bgClass} ${officialConfig.borderClass}`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-base font-black text-white shadow-sm ${officialConfig.iconBg}`}
                  >
                    <officialConfig.Icon className="size-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div
                      className={`text-[10px] font-extrabold tracking-wider uppercase ${officialConfig.textColor}`}
                    >
                      Gabarito Oficial
                    </div>
                    <div className="flex items-center gap-1.5 text-sm leading-tight font-black text-slate-900">
                      {officialConfig.name}
                      {isCorrect !== null && isCorrect !== undefined && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            isCorrect
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {isCorrect ? "Você acertou!" : "Incorreto"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pl-2 text-right">
                  <span className="block rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold tracking-wider text-slate-700 uppercase">
                    Confirmado
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                    <Check className="size-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold tracking-wider text-blue-700 uppercase">
                      Gabarito Oficial
                    </div>
                    <div className="text-sm font-bold text-slate-800">Aguardando Revelação</div>
                  </div>
                </div>
                <div className="pl-2 text-right">
                  <span className="block rounded-md bg-blue-100 px-2 py-1 text-[10px] font-bold tracking-wider text-blue-800 uppercase">
                    Ao Concluir
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Verômetro Gauge Integration */}
          <VerometroGauge reliabilityScore={reliabilityScore} />
        </div>

        {/* Live Room Progress Section */}
        <div className="mb-6" data-purpose="room-progress-tracker">
          <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-blue-600" aria-hidden="true" />
              Progresso da sala
            </span>
            <span className="font-extrabold text-blue-600">
              {votedCount} de {totalPlayers} checadores ({progressPercent}%)
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-3.5 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Socratic Reflection Section */}
        <SocraticReflection />
      </section>
    </div>
  );
}

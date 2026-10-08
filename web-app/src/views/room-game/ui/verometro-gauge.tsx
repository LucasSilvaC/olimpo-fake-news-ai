"use client";

import * as React from "react";

export interface IVerometroGaugeProps {
  /**
   * Reliability percentage from 0 to 100 (or 0.0 to 1.0 decimal).
   */
  reliabilityScore: number;
  marginOfError?: string;
  className?: string;
}

export function VerometroGauge({
  reliabilityScore,
  className = "",
}: IVerometroGaugeProps): React.ReactElement {
  // Normalize score to 0..100 integer range
  const normalizedScore = React.useMemo(() => {
    let raw = reliabilityScore;
    if (raw <= 1 && raw > 0) {
      raw = raw * 100;
    }
    return Math.max(0, Math.min(100, Math.round(raw)));
  }, [reliabilityScore]);

  // Determine current active zone and visual tokens
  const zone = React.useMemo(() => {
    if (normalizedScore <= 30) {
      return {
        statusTag: "FALSO",
        label: "Manipulado / Falso",
        pinBg: "bg-rose-600",
        ringColor: "ring-rose-600/50",
        badgeClass: "bg-rose-100 text-rose-600 border-rose-200/60",
      };
    }
    if (normalizedScore <= 70) {
      return {
        statusTag: "IMPRECISO",
        label: "Impreciso / Contexto Incompleto",
        pinBg: "bg-amber-500",
        ringColor: "ring-amber-500/50",
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200/60",
      };
    }
    return {
      statusTag: "FATO",
      label: "Autêntico / Verídico",
      pinBg: "bg-emerald-600",
      ringColor: "ring-emerald-600/50",
      badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200/60",
    };
  }, [normalizedScore]);

  // Clamp pin position for CSS left property to keep tooltips within view
  const pinLeftPercent = Math.max(4, Math.min(96, normalizedScore));

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 ${className}`}
      data-purpose="veracity-index-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black tracking-wider text-slate-700 uppercase">
            Índice de Confiabilidade da Notícia
          </span>
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${zone.badgeClass}`}
          >
            {normalizedScore}% de Autenticidade • {zone.label}
          </span>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          Alta precisão (IA + Checagem Coletiva)
        </span>
      </div>

      {/* Visual Spectrum & Floating Pin */}
      <div className="relative pt-5 pb-1">
        {/* Floating Pin Marker */}
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center transition-all duration-700 ease-out"
          style={{ left: `${pinLeftPercent}%` }}
        >
          <span
            className={`rounded-md px-1.5 py-0.5 text-[9px] leading-none font-black whitespace-nowrap text-white shadow-sm ${zone.pinBg}`}
          >
            {normalizedScore}% {zone.statusTag}
          </span>
          <span className={`-mt-0.5 size-1.5 rotate-45 ${zone.pinBg}`} />
        </div>

        {/* Gradient Spectrum Bar */}
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 shadow-inner">
          <div
            className={`absolute top-0 bottom-0 w-1 bg-white shadow-sm ring-2 ${zone.ringColor} transition-all duration-700 ease-out`}
            style={{ left: `${pinLeftPercent}%` }}
          />
        </div>

        {/* Gradient Boundary Labels */}
        <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1 font-extrabold text-rose-600">
            0% Falso / Desinformação
          </span>
          <span className="font-medium text-slate-400">50% Impreciso / Contexto Incompleto</span>
          <span className="flex items-center gap-1 font-extrabold text-emerald-600">
            100% Autêntico / Verídico
          </span>
        </div>
      </div>
    </div>
  );
}

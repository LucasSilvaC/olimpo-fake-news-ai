"use client";

import { BarChart3 } from "lucide-react";
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
  marginOfError = "±1.8%",
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

  // Determine current active zone
  const zone = React.useMemo(() => {
    if (normalizedScore <= 30) {
      return {
        id: "falso",
        label: "Manipulado",
        tag: "Falso / Desinformação",
        colorClass: "rose",
        pinBg: "bg-rose-600",
        pinText: "text-rose-600",
        badgeBg: "bg-rose-50",
        badgeBorder: "border-rose-200",
        borderClass: "border-rose-200/80",
        activeBg: "bg-rose-50",
        activeText: "text-rose-600",
        arrowColor: "border-t-rose-600",
        circleBorder: "border-rose-600",
      };
    }
    if (normalizedScore <= 70) {
      return {
        id: "impreciso",
        label: "Impreciso",
        tag: "Impreciso / Fora de Contexto",
        colorClass: "amber",
        pinBg: "bg-amber-500",
        pinText: "text-amber-700",
        badgeBg: "bg-amber-50",
        badgeBorder: "border-amber-200",
        borderClass: "border-amber-200/80",
        activeBg: "bg-amber-50",
        activeText: "text-amber-700",
        arrowColor: "border-t-amber-500",
        circleBorder: "border-amber-500",
      };
    }
    return {
      id: "fato",
      label: "Comprovado",
      tag: "Fato Verídico / Comprovado",
      colorClass: "emerald",
      pinBg: "bg-emerald-600",
      pinText: "text-emerald-700",
      badgeBg: "bg-emerald-50",
      badgeBorder: "border-emerald-200",
      borderClass: "border-emerald-200/80",
      activeBg: "bg-emerald-50",
      activeText: "text-emerald-700",
      arrowColor: "border-t-emerald-600",
      circleBorder: "border-emerald-600",
    };
  }, [normalizedScore]);

  // Clamp pin position for CSS left property to keep tooltips within view
  const pinLeftPercent = Math.max(5, Math.min(95, normalizedScore));

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
      data-purpose="verometro-gauge"
    >
      {/* Header: Title & Status Badge */}
      <div className="flex flex-col justify-between gap-2.5 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-sm ${zone.badgeBg} ${zone.badgeBorder} ${zone.pinText}`}
          >
            <BarChart3 className="size-4 stroke-[2.5]" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                Verômetro Olimpo
              </span>
              <span className={`inline-block size-1.5 rounded-full ${zone.pinBg}`} />
            </div>
            <h4 className="text-xs font-extrabold tracking-tight text-slate-800 md:text-sm">
              Índice de Veracidade Apurado
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black shadow-sm ${zone.badgeBg} ${zone.badgeBorder} ${zone.activeText}`}
          >
            {normalizedScore}% Autenticidade
          </span>
          <span
            className={`hidden rounded-md border px-2 py-1 text-[11px] font-extrabold sm:inline-block ${zone.badgeBg} ${zone.badgeBorder} ${zone.activeText}`}
          >
            {zone.label}
          </span>
        </div>
      </div>

      {/* Visual Spectrum & Floating Marker Pin */}
      <div className="relative px-1 pt-8 pb-2">
        {/* Floating Pin Pointer */}
        <div
          className="pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 flex-col items-center transition-all duration-700 ease-out"
          style={{ left: `${pinLeftPercent}%` }}
        >
          <span
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black tracking-tight whitespace-nowrap text-white shadow-md ${zone.pinBg}`}
          >
            <span>📍</span> {normalizedScore}% Detectado
          </span>
          <div
            className={`-mt-0.5 size-0 border-x-4 border-t-4 border-x-transparent ${zone.arrowColor}`}
          />
        </div>

        {/* Continuous Spectrum Gradient Bar */}
        <div className="relative flex h-3 w-full items-center overflow-visible rounded-full border border-slate-200 bg-slate-100 p-0.5 shadow-inner">
          <div
            className="h-full w-full rounded-full shadow-sm"
            style={{
              background: "linear-gradient(to right, #dc2626 0%, #f59e0b 50%, #10b981 100%)",
            }}
          />
          {/* Ring Marker */}
          <div
            className={`absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white shadow-md transition-all duration-700 ease-out ${zone.circleBorder}`}
            style={{ left: `${pinLeftPercent}%` }}
          />
        </div>
      </div>

      {/* 3 Segmented Zones */}
      <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-1 text-center">
        {/* Zone 1: 0% to 30% (Falso) */}
        <div
          className={`rounded-lg p-1.5 transition-all ${
            zone.id === "falso"
              ? "border border-rose-200/80 bg-rose-50 text-rose-600"
              : "border border-slate-100 bg-slate-50 text-slate-500"
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1 text-[10px] tracking-tight ${
              zone.id === "falso" ? "font-extrabold text-rose-600" : "font-bold text-slate-500"
            }`}
          >
            <span
              className={`inline-block size-1.5 rounded-full ${
                zone.id === "falso" ? "bg-rose-600" : "bg-slate-400"
              }`}
            />
            0% a 30%
          </div>
          <div
            className={`mt-0.5 text-[10px] leading-tight ${
              zone.id === "falso" ? "font-black text-rose-600" : "font-semibold text-slate-600"
            }`}
          >
            Falso / Desinformação
          </div>
        </div>

        {/* Zone 2: 31% to 70% (Impreciso) */}
        <div
          className={`rounded-lg p-1.5 transition-all ${
            zone.id === "impreciso"
              ? "border border-amber-200/80 bg-amber-50 text-amber-700"
              : "border border-slate-100 bg-slate-50 text-slate-500"
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1 text-[10px] tracking-tight ${
              zone.id === "impreciso" ? "font-extrabold text-amber-700" : "font-bold text-slate-500"
            }`}
          >
            <span
              className={`inline-block size-1.5 rounded-full ${
                zone.id === "impreciso" ? "bg-amber-500" : "bg-slate-400"
              }`}
            />
            31% a 70%
          </div>
          <div
            className={`mt-0.5 text-[10px] leading-tight ${
              zone.id === "impreciso" ? "font-black text-amber-700" : "font-semibold text-slate-600"
            }`}
          >
            Impreciso / Fora de Contexto
          </div>
        </div>

        {/* Zone 3: 71% to 100% (Fato) */}
        <div
          className={`rounded-lg p-1.5 transition-all ${
            zone.id === "fato"
              ? "border border-emerald-200/80 bg-emerald-50 text-emerald-700"
              : "border border-slate-100 bg-slate-50 text-slate-500"
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1 text-[10px] tracking-tight ${
              zone.id === "fato" ? "font-extrabold text-emerald-700" : "font-bold text-slate-500"
            }`}
          >
            <span
              className={`inline-block size-1.5 rounded-full ${
                zone.id === "fato" ? "bg-emerald-600" : "bg-slate-400"
              }`}
            />
            71% a 100%
          </div>
          <div
            className={`mt-0.5 text-[10px] leading-tight ${
              zone.id === "fato" ? "font-black text-emerald-700" : "font-semibold text-slate-600"
            }`}
          >
            Fato Verídico / Comprovado
          </div>
        </div>
      </div>

      {/* Technical Footer */}
      <div className="mt-2.5 flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] font-medium text-slate-400">
        <span className="text-slate-500">Avaliação assistida por IA</span>
        <span className="hidden font-bold text-slate-600 sm:inline-block">
          Margem de erro: {marginOfError}
        </span>
      </div>
    </div>
  );
}

"use client";

import type * as React from "react";

export interface IVerometroGaugeProps {
  /** Canonical 100 × P(fake), already in the 0–100 scale. */
  fakeScore: number;
  className?: string;
}

export function VerometroGauge({
  fakeScore,
  className = "",
}: IVerometroGaugeProps): React.ReactElement {
  return (
    <div className={`mt-4 rounded-2xl bg-slate-50 p-4 ${className}`}>
      <p className="text-sm font-semibold">Score de falsidade estimado pelo modelo</p>
      <p className="mt-1 text-3xl font-bold">
        {fakeScore.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}{" "}
        <span className="text-base font-normal">de 100</span>
      </p>
      <meter
        aria-label="Score de falsidade estimado pelo modelo"
        min={0}
        max={100}
        low={35}
        high={65}
        optimum={0}
        value={fakeScore}
        className="mt-2 h-4 w-full"
      />
      <div className="flex justify-between text-xs text-slate-600">
        <span>0</span>
        <span>100</span>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Quanto maior o score, maior a estimativa de falsidade. Esse número não é a pontuação do
        participante.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import { styles } from "./styles";

type TReveal = "up" | "scale" | "left" | "right";

const REVEAL_CLASS: Record<TReveal, string | undefined> = {
  up: styles.rv,
  scale: styles.rvScale,
  left: styles.rvLeft,
  right: styles.rvRight,
};

interface IRvProps {
  children: React.ReactNode;
  /** Passos de 90ms antes da animação começar. */
  d?: number;
  k?: TReveal;
  className?: string;
}

export function Rv({ children, d = 0, k = "up", className = "" }: IRvProps): React.ReactElement {
  return (
    <div
      className={`${REVEAL_CLASS[k] ?? ""} ${className}`}
      style={{ "--d": `${d * 90 + 150}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "glass",
}: {
  children: React.ReactNode;
  tone?: "glass" | "amber" | "white";
}): React.ReactElement {
  const tones = {
    glass: "bg-white/20 text-white ring-1 ring-white/30 backdrop-blur",
    amber: "bg-amber-400 text-blue-950",
    white: "bg-white text-blue-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-[22px] font-bold tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={`rounded-[32px] bg-white p-8 text-slate-800 shadow-[0_24px_60px_-20px_rgba(15,40,120,0.55)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SlideTitle({
  eyebrow,
  title,
  accent,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
}): React.ReactElement {
  return (
    <header className="mb-8 space-y-4">
      <Rv>
        <Pill>{eyebrow}</Pill>
      </Rv>
      <Rv d={1}>
        <h2 className="text-[68px] leading-[1.05] font-black tracking-tight text-white">
          {title} {accent ? <span className="text-amber-300">{accent}</span> : null}
        </h2>
      </Rv>
    </header>
  );
}

export function useCountUp(target: number, duration = 1400, decimals = 0, delay = 300): string {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let start = 0;
    const timer = window.setTimeout(
      () => {
        if (reduced) {
          setValue(target);
          return;
        }
        const tick = (now: number): void => {
          if (!start) start = now;
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(target * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      reduced ? 0 : delay,
    );
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay]);

  return value.toFixed(decimals).replace(".", ",");
}

export type TLight = "red" | "yellow" | "green";

const LAMPS: { key: TLight; on: string; off: string }[] = [
  { key: "red", on: "#ef4444", off: "#7f1d1d" },
  { key: "yellow", on: "#fbbf24", off: "#78350f" },
  { key: "green", on: "#22c55e", off: "#14532d" },
];

/** Semáforo que "varre" vermelho → amarelo → verde e assenta no nível final. */
export function TrafficLight({
  level,
  size = 96,
  sweep = true,
}: {
  level: TLight;
  size?: number;
  sweep?: boolean;
}): React.ReactElement {
  const [swept, setLit] = useState<TLight | null>(null);
  const lit = sweep ? swept : level;

  useEffect(() => {
    if (!sweep) return;
    const order: TLight[] = ["red", "yellow", "green", level];
    const timers = order.map((l, i) => window.setTimeout(() => setLit(l), 500 + i * 380));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [level, sweep]);

  return (
    <div
      role="img"
      aria-label={`Semáforo de confiabilidade: ${level === "red" ? "baixa" : level === "yellow" ? "média" : "alta"}`}
      className="flex flex-col gap-3 rounded-[28px] bg-slate-900 p-4 shadow-[0_16px_30px_-10px_rgba(15,23,42,0.7)]"
    >
      {LAMPS.map((l) => {
        const on = lit === l.key;
        return (
          <span
            key={l.key}
            className={`${styles.lamp} block rounded-full`}
            style={{
              width: size,
              height: size,
              background: on ? l.on : l.off,
              opacity: on ? 1 : 0.55,
              transform: on ? "scale(1.06)" : "scale(1)",
              boxShadow: on ? `0 0 40px 6px ${l.on}99` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

/** Verômetro em semicírculo com ponteiro animado. score ∈ [0, 100]. */
export function Gauge({ score }: { score: number }): React.ReactElement {
  const [angle, setAngle] = useState(-90);

  useEffect(() => {
    const t = window.setTimeout(() => setAngle(-90 + (score / 100) * 180), 250);
    return () => window.clearTimeout(t);
  }, [score]);

  return (
    <svg viewBox="0 0 400 230" className="w-full" role="img" aria-label={`Score ${score} de 100`}>
      <defs>
        <linearGradient id="gauge-g" x1="0" x2="1">
          <stop offset="0" stopColor="#ef4444" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path
        d="M 40 200 A 160 160 0 0 1 360 200"
        fill="none"
        stroke="url(#gauge-g)"
        strokeWidth="34"
        strokeLinecap="round"
      />
      <g className={styles.needle} style={{ transform: `rotate(${angle}deg)` }}>
        <path d="M 200 200 L 200 62" stroke="#1e3a8a" strokeWidth="8" strokeLinecap="round" />
      </g>
      <circle cx="200" cy="200" r="20" fill="#1e3a8a" />
      <circle cx="200" cy="200" r="8" fill="#fbbf24" />
    </svg>
  );
}

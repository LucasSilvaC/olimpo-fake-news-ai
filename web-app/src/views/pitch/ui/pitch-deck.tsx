"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SLIDES } from "./slides";
import { styles } from "./styles";

const STAGE_W = 1920;
const STAGE_H = 1080;

export function PitchDeck(): React.ReactElement {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [scale, setScale] = useState(0.5);
  const touchX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setIndex((cur) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
      if (clamped !== cur) setDir(clamped > cur ? 1 : -1);
      return clamped;
    });
  }, []);

  useEffect(() => {
    const fit = (): void =>
      setScale(Math.min(window.innerWidth / STAGE_W, (window.innerHeight - 56) / STAGE_H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        if (e.key === " " && (e.target as HTMLElement).tagName === "BUTTON") return;
        e.preventDefault();
        setIndex((c) => {
          const n = Math.min(SLIDES.length - 1, c + 1);
          if (n !== c) setDir(1);
          return n;
        });
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        setIndex((c) => {
          const n = Math.max(0, c - 1);
          if (n !== c) setDir(-1);
          return n;
        });
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(SLIDES.length - 1);
      else if (e.key.toLowerCase() === "f") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const { Component, title } = SLIDES[index] ?? SLIDES[0]!;

  return (
    <div
      className={`${styles.root} fixed inset-0 z-[60] overflow-hidden`}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div
        className={styles.orb}
        style={{ width: 700, height: 700, left: -200, top: -200, background: "#93c5fd" }}
      />
      <div
        className={styles.orb}
        style={{
          width: 600,
          height: 600,
          right: -150,
          bottom: -150,
          background: "#bfdbfe",
          animationDelay: "-6s",
        }}
      />

      <div
        className="absolute top-0 left-0 z-10 h-1.5 bg-amber-400 transition-all duration-500"
        style={{ width: `${((index + 1) / SLIDES.length) * 100}%` }}
      />

      <div className="absolute inset-x-0 top-0 bottom-14">
        <div
          className="absolute top-1/2 left-1/2 shrink-0"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <section
            key={index}
            aria-label={`Slide ${index + 1} de ${SLIDES.length}: ${title}`}
            className={`${dir === 1 ? styles.slide : styles.slideBack} absolute inset-0 flex flex-col justify-center px-[96px] pt-[48px] pb-[56px] text-white`}
          >
            <Component />
          </section>
        </div>
      </div>

      <nav
        aria-label="Navegação da apresentação"
        className="absolute inset-x-0 bottom-0 z-10 flex h-14 items-center justify-center gap-4 px-4"
      >
        <button
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Slide anterior"
          className="rounded-[12px] bg-white/20 px-4 py-1.5 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:opacity-40"
        >
          ←
        </button>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              onClick={() => go(i)}
              aria-label={`Ir para ${i + 1}: ${s.title}`}
              aria-current={i === index ? "step" : undefined}
              className={`h-2.5 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${i === index ? "w-8 bg-amber-400" : "w-2.5 bg-white/50 hover:bg-white"}`}
            />
          ))}
        </div>
        <span className="min-w-14 text-center text-sm font-bold text-white tabular-nums">
          {index + 1} / {SLIDES.length}
        </span>
        <button
          onClick={() => go(index + 1)}
          disabled={index === SLIDES.length - 1}
          aria-label="Próximo slide"
          className="rounded-[12px] bg-amber-400 px-4 py-1.5 text-sm font-extrabold text-slate-950 shadow-[0_8px_15px_-4px_rgba(251,191,36,0.5)] transition hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-40"
        >
          →
        </button>
        <span className="hidden text-xs text-white/70 md:inline">Setas navegam · F tela cheia</span>
      </nav>
    </div>
  );
}

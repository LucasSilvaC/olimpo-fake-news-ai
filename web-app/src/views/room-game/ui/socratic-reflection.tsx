"use client";

import * as React from "react";

export interface ISocraticCard {
  icon: string;
  category: string;
  question?: string;
  guidance: string;
  tag: string;
  bgClass: string;
  borderClass: string;
  hoverClass: string;
  iconBg: string;
  iconColor: string;
  tagColor: string;
}

export interface ISocraticReflectionProps {
  customCards?: ISocraticCard[];
  tip?: string;
  className?: string;
}

const DEFAULT_CARDS: ISocraticCard[] = [
  {
    icon: "🧭",
    category: "A Fonte e o Meio",
    guidance:
      "Quem ganha com a divulgação dessa narrativa? O canal possui histórico comprovado de responsabilidade editorial?",
    tag: "Origem & Motivação",
    bgClass: "bg-blue-50/50",
    borderClass: "border-blue-100/80",
    hoverClass: "hover:bg-blue-50/90",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-700",
    tagColor: "text-blue-600/80",
  },
  {
    icon: "⚡",
    category: "O Tom Emocional",
    guidance:
      "O conteúdo apela para indignação, urgência ou medo imediato? Distorções costumam acelerar o compartilhamento impulsivo.",
    tag: "Gatilhos Psicológicos",
    bgClass: "bg-amber-50/40",
    borderClass: "border-amber-100/80",
    hoverClass: "hover:bg-amber-50/80",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    tagColor: "text-amber-600/80",
  },
  {
    icon: "⚖️",
    category: "A Evidência",
    guidance:
      "Onde estão as fontes primárias e dados verificáveis? Alegações extraordinárias exigem evidências extraordinárias.",
    tag: "Fatos & Validação",
    bgClass: "bg-emerald-50/40",
    borderClass: "border-emerald-100/80",
    hoverClass: "hover:bg-emerald-50/80",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    tagColor: "text-emerald-600/80",
  },
];

export function SocraticReflection({
  customCards,
  className = "",
}: ISocraticReflectionProps): React.ReactElement {
  const cards = customCards && customCards.length > 0 ? customCards : DEFAULT_CARDS;

  return (
    <div
      className={`flex flex-col gap-3 border-t border-slate-100 pt-2 ${className}`}
      data-purpose="socratic-thinking-section"
    >
      <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-black tracking-wider text-blue-900 uppercase">
            🧠 REFLEXÃO SOCRÁTICA • O QUE QUESTIONAR?
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          Perguntas-chave para exercitar seu pensamento crítico enquanto aguarda a rodada
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.category}
            className={`flex flex-col justify-between rounded-2xl border p-3.5 transition-all ${card.bgClass} ${card.borderClass} ${card.hoverClass}`}
          >
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${card.iconBg} ${card.iconColor}`}
                >
                  {card.icon}
                </span>
                <h4 className="text-xs leading-tight font-bold text-slate-800">{card.category}</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">{card.guidance}</p>
            </div>
            <span
              className={`mt-2 block text-[9px] font-bold tracking-wider uppercase ${card.tagColor}`}
            >
              {card.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

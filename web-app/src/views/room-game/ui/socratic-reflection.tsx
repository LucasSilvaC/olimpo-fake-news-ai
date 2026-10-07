"use client";

import { ShieldCheck } from "lucide-react";
import * as React from "react";

export interface ISocraticCard {
  icon: string;
  category: string;
  question: string;
  guidance: string;
}

export interface ISocraticReflectionProps {
  customCards?: ISocraticCard[];
  tip?: string;
  className?: string;
}

const DEFAULT_CARDS: ISocraticCard[] = [
  {
    icon: "🔎",
    category: "A Fonte e o Meio",
    question: "Quem ganha com a divulgação dessa narrativa?",
    guidance:
      "Verifique se há interesse financeiro, político ou apelo a cliques fáceis. O veículo tem histórico comprovado de responsabilidade editorial ou é anônimo?",
  },
  {
    icon: "⚡",
    category: "O Tom Emocional",
    question: "O conteúdo apela para a indignação ou o medo?",
    guidance:
      "Mensagens construídas para gerar reações viscerais imediatas frequentemente mascaram distorções de fatos para acelerar o compartilhamento impulsivo.",
  },
  {
    icon: "⚖️",
    category: "A Evidência",
    question: "Onde estão os dados primários e fontes?",
    guidance:
      "Afirmações extraordinárias exigem evidências extraordinárias. Há citação direta de especialistas independentes ou apenas menções genéricas?",
  },
];

const DEFAULT_TIP =
  "Notícias alarmistas com títulos em letras maiúsculas e sem autoria clara têm 78% mais chances de serem desinformação.";

export function SocraticReflection({
  customCards,
  tip = DEFAULT_TIP,
  className = "",
}: ISocraticReflectionProps): React.ReactElement {
  const cards = customCards && customCards.length > 0 ? customCards : DEFAULT_CARDS;

  return (
    <div className={`flex flex-col gap-4 ${className}`} data-purpose="socratic-reflection-section">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-blue-100 bg-blue-50/80 px-2 py-0.5 text-xs font-bold tracking-wider text-blue-600 uppercase">
            Método Crítico
          </span>
          <h3 className="text-sm font-extrabold tracking-wider text-slate-800 uppercase">
            Reflexão Socrática: O que questionar?
          </h3>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          Questione as premissas antes da revelação do gabarito
        </p>
      </div>

      {/* 3 Critical Thinking Cards */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.category}
            className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/90 p-3 text-xs shadow-sm"
          >
            <div className="mb-1.5 inline-flex items-center gap-1.5 font-bold text-slate-700">
              <span className="text-sm" aria-hidden="true">
                {card.icon}
              </span>
              <span className="font-extrabold tracking-tight text-blue-900">{card.category}</span>
            </div>
            <p className="mb-1 leading-snug font-bold text-slate-900">{card.question}</p>
            <p className="text-[10px] leading-relaxed text-slate-600">{card.guidance}</p>
          </div>
        ))}
      </div>

      {/* Fact-checking Tip Box */}
      <div
        className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-slate-700 shadow-sm"
        data-purpose="fact-checking-tip"
      >
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
          <ShieldCheck className="size-4 stroke-[2.5]" aria-hidden="true" />
        </div>
        <div className="text-xs leading-relaxed text-slate-600">
          <strong className="mb-0.5 block text-sm font-extrabold text-blue-900">
            Dica do Olimpo:
          </strong>
          {tip}
        </div>
      </div>
    </div>
  );
}

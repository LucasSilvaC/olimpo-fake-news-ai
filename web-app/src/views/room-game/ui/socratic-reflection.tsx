"use client";

import { MessagesSquare } from "lucide-react";
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
    category: "Fonte",
    question: "Quem publicou esta informação e como podemos consultar a fonte?",
    guidance: "Procure a autoria, a data e o caminho até a publicação original.",
  },
  {
    icon: "📄",
    category: "Evidência",
    question: "Que evidências sustentam as principais afirmações?",
    guidance:
      "Localize documentos, dados ou relatos citados e examine o que eles permitem concluir.",
  },
  {
    icon: "💬",
    category: "Contexto",
    question: "Que informação adicional ajudaria a avaliar esta notícia?",
    guidance: "Compare datas, contexto e fontes independentes antes de decidir.",
  },
];

export function SocraticReflection({
  customCards,
  tip,
  className = "",
}: ISocraticReflectionProps): React.ReactElement {
  const cards = customCards ?? DEFAULT_CARDS;

  return (
    <section
      aria-label="Perguntas gerais de leitura crítica"
      className={`flex flex-col gap-3 ${className}`}
      data-purpose="socratic-reflection-section"
    >
      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <MessagesSquare className="size-4 text-blue-600" aria-hidden="true" />
          Perguntas gerais de leitura crítica
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Estas perguntas são sugestões de leitura; não são observações medidas pelo modelo.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {cards.slice(0, 3).map((card) => (
          <div
            key={card.category}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs"
          >
            <p className="mb-2 font-bold text-blue-900">
              <span aria-hidden="true">{card.icon} </span>
              {card.category}
            </p>
            <p className="font-semibold text-slate-900">{card.question}</p>
            <p className="mt-1 leading-relaxed text-slate-600">{card.guidance}</p>
          </div>
        ))}
      </div>
      {tip && <p className="text-xs leading-relaxed text-slate-600">{tip}</p>}
    </section>
  );
}

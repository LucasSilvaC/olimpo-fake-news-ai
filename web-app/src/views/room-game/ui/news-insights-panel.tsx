"use client";

import { Loader2, MessagesSquare } from "lucide-react";
import * as React from "react";

import type { NewsInsightsState } from "../hooks/use-news-insights";

import { SocraticReflection } from "./socratic-reflection";

import type { NewsInsightsAnalysis } from "@/lib/news-insights/types";

const STATUS_MESSAGES: Record<NewsInsightsAnalysis["analysisStatus"], string> = {
  ok: "Observe como o texto foi escrito e use as perguntas para investigar.",
  no_match:
    "Nenhum padrão do catálogo correspondeu ao trecho analisado. Isso não determina a veracidade da notícia.",
  invalid_text: "O texto recebido não contém material suficiente para observações linguísticas.",
  unavailable:
    "As observações do modelo estão indisponíveis nesta rodada. Você pode continuar a leitura e votar.",
};

const DENOMINATOR_LABELS: Record<string, string> = {
  tokens_lexical: "palavras e outros tokens sem pontuação",
  tokens_nonspace: "tokens sem espaços",
  regex_words: "palavras identificadas no trecho",
};

export function NewsInsightsPanel({ state }: { state: NewsInsightsState }): React.ReactElement {
  const analysis = state.status === "ready" ? state.response.analysis : null;
  const insights = analysis?.analysisStatus === "ok" ? analysis.insights.slice(0, 3) : [];

  return (
    <section
      aria-label="Apoio à investigação"
      aria-busy={state.status === "loading"}
      className="mb-6 w-full max-w-4xl rounded-3xl border border-white/40 bg-white p-5 text-slate-800 shadow-lg md:p-6"
      data-purpose="news-insights"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <MessagesSquare className="size-5 text-blue-600" aria-hidden="true" />
        Investigue antes de decidir
      </h2>
      <p role="status" className="mt-2 mb-4 text-sm leading-relaxed text-slate-600">
        {state.status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Extraindo o corpo da notícia e analisando o texto. Você já pode votar.
          </span>
        ) : (
          STATUS_MESSAGES[analysis?.analysisStatus ?? "unavailable"]
        )}
      </p>
      {insights.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {insights.map((insight) => (
            <article
              key={insight.patternId}
              className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4"
            >
              <h3 className="text-sm font-bold text-blue-900">{insight.observationTitle}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-700">{insight.observation}</p>
              {insight.reflectionQuestions.slice(0, 2).map((question) => (
                <p key={question} className="mt-3 text-sm font-semibold text-slate-900">
                  {question}
                </p>
              ))}
            </article>
          ))}
        </div>
      ) : (
        <SocraticReflection />
      )}
      {insights.length > 0 && (
        <p className="mt-3 text-xs text-slate-600">
          As observações descrevem a escrita do trecho e não determinam a veracidade dos fatos.
        </p>
      )}
      {analysis && analysis.analysisStatus !== "unavailable" && (
        <details className="mt-4 rounded-xl border border-slate-200 p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600">
            Ver o trecho analisado e as medições
          </summary>
          <p className="mt-3 text-slate-600">
            O modelo usa até os primeiros {analysis.characterLimit} caracteres do corpo, com
            normalização do texto. Padrões de escrita ajudam a formular perguntas; não verificam os
            fatos.
          </p>
          <blockquote className="mt-3 border-l-2 border-blue-300 pl-3 whitespace-pre-wrap text-slate-800">
            {analysis.analyzedText || "Nenhum trecho disponível para análise."}
          </blockquote>
          {analysis.quality.truncated && (
            <p className="mt-2 text-slate-600">O restante do corpo não entrou nesta análise.</p>
          )}
          {insights.map((insight) => (
            <div key={insight.patternId} className="mt-3">
              <p className="font-semibold text-slate-800">{insight.observationTitle}</p>
              <ul className="mt-1 space-y-1">
                {insight.measurements.map((measurement) => (
                  <li key={measurement.feature} className="text-slate-600">
                    {measurement.label}:{" "}
                    {measurement.value.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}{" "}
                    (limite {measurement.operator}{" "}
                    {measurement.threshold.toLocaleString("pt-BR", { maximumFractionDigits: 4 })};
                    base:{" "}
                    {DENOMINATOR_LABELS[measurement.denominator] ?? "unidades contadas no trecho"}
                    {measurement.count !== undefined && measurement.denominatorCount !== undefined
                      ? `; ${measurement.count} de ${measurement.denominatorCount}`
                      : ""}
                    ).
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}

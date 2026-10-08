"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Loader2, MessagesSquare, X } from "lucide-react";
import * as React from "react";

import type { NewsInsightsState } from "../hooks/use-news-insights";

import { SocraticReflection } from "./socratic-reflection";

import type { NewsInsightsAnalysis } from "@/lib/news-insights/types";

const STATUS_MESSAGES: Record<NewsInsightsAnalysis["analysisStatus"], string> = {
  ok: "Observe características da escrita deste trecho e compare com o conjunto estudado.",
  no_match:
    "Nenhum padrão do catálogo correspondeu ao trecho analisado. Isso não determina a veracidade da notícia.",
  invalid_text: "O texto recebido não contém material suficiente para observações linguísticas.",
  unavailable:
    "As observações do modelo estão indisponíveis nesta rodada. Você pode continuar a leitura e votar.",
};

const DENOMINATOR_LABELS: Record<string, string> = {
  tokens_lexical: "palavras, números e outras unidades de texto, sem pontuação",
  tokens_nonspace: "palavras, números e sinais de pontuação; espaços não são contados",
  regex_words: "palavras identificadas no trecho",
};

function formatFrequency(frequency: number): string {
  return frequency.toLocaleString("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1,
  });
}

export function NewsInsightsPanel({ state }: { state: NewsInsightsState }): React.ReactElement {
  const analysis = state.status === "ready" ? state.response.analysis : null;
  const insights = analysis?.analysisStatus === "ok" ? analysis.insights.slice(0, 3) : [];

  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label="Abrir observações sobre a escrita"
        title="Observe a escrita"
        className="fixed top-1/2 left-3 z-40 flex size-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-2xl border border-blue-200 bg-white text-blue-700 shadow-xl shadow-blue-950/20 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:left-5"
      >
        {state.status === "loading" ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <MessagesSquare className="size-5" aria-hidden="true" />
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm" />
        <Dialog.Popup className="fixed inset-y-3 left-3 z-50 flex w-[calc(100%_-_1.5rem)] max-w-4xl flex-col overflow-hidden rounded-3xl bg-white text-slate-800 shadow-2xl outline-none sm:inset-y-5 sm:left-5 sm:w-[calc(100%_-_2.5rem)]">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
            <Dialog.Title className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <MessagesSquare className="size-5 text-blue-600" aria-hidden="true" />
              Observe a escrita
            </Dialog.Title>
            <Dialog.Close
              aria-label="Fechar observações sobre a escrita"
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <section
            aria-label="Apoio à investigação"
            aria-busy={state.status === "loading"}
            className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-5 md:px-6 md:pb-6"
            data-purpose="news-insights"
          >
            <Dialog.Description
              role="status"
              className="mt-4 mb-4 text-sm leading-relaxed text-slate-600"
            >
              {state.status === "loading" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Extraindo o corpo da notícia e analisando o texto. Você já pode votar.
                </span>
              ) : (
                STATUS_MESSAGES[analysis?.analysisStatus ?? "unavailable"]
              )}
            </Dialog.Description>
            {insights.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {insights.map((insight) => (
                  <article
                    key={insight.patternId}
                    className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4"
                  >
                    <h3 className="text-sm font-bold text-blue-900">{insight.observationTitle}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-700">
                      {insight.observation}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-slate-600">
                      No conjunto estudado, esta combinação apareceu em:
                    </p>
                    <dl className="mt-2 space-y-2 text-xs text-slate-800">
                      <div className="flex items-start justify-between gap-2">
                        <dt>Notícias rotuladas como falsas</dt>
                        <dd className="shrink-0 font-semibold">
                          {formatFrequency(insight.comparison.fake.frequency)}
                        </dd>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <dt>Notícias rotuladas como verdadeiras</dt>
                        <dd className="shrink-0 font-semibold">
                          {formatFrequency(insight.comparison.true.frequency)}
                        </dd>
                      </div>
                    </dl>
                    <details className="mt-3 text-xs leading-relaxed text-slate-600">
                      <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-blue-600">
                        Ver contagens e referência
                      </summary>
                      <p className="mt-2">
                        Esta combinação foi encontrada em {insight.comparison.fake.count} de{" "}
                        {insight.comparison.fake.total} notícias rotuladas como falsas e em{" "}
                        {insight.comparison.true.count} de {insight.comparison.true.total} notícias
                        rotuladas como verdadeiras.
                      </p>
                      <p className="mt-2">
                        Referência: {insight.comparison.referenceDataset}, amostra de validação. As
                        contagens consideram todos os critérios do padrão juntos.
                      </p>
                    </details>
                  </article>
                ))}
              </div>
            ) : (
              <SocraticReflection />
            )}
            {insights.length > 0 && (
              <p className="mt-3 text-xs text-slate-600">
                A comparação descreve a escrita no conjunto estudado. Essas frequências não
                determinam a veracidade desta notícia.
              </p>
            )}
            {analysis && analysis.analysisStatus !== "unavailable" && (
              <details className="mt-4 rounded-xl border border-slate-200 p-3 text-xs">
                <summary className="cursor-pointer font-semibold text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600">
                  Ver o trecho analisado e os detalhes
                </summary>
                <p className="mt-3 text-slate-600">
                  O modelo usa até os primeiros {analysis.characterLimit} caracteres do corpo, com
                  normalização do texto. As observações se referem a esse trecho. Cada comparação
                  usa a combinação completa de características encontrada, sem verificar os fatos.
                </p>
                <blockquote className="mt-3 border-l-2 border-blue-300 pl-3 whitespace-pre-wrap text-slate-800">
                  {analysis.analyzedText || "Nenhum trecho disponível para análise."}
                </blockquote>
                {analysis.quality.truncated && (
                  <p className="mt-2 text-slate-600">
                    O restante do corpo não entrou nesta análise.
                  </p>
                )}
                {insights.map((insight) => (
                  <div key={insight.patternId} className="mt-3">
                    <p className="font-semibold text-slate-800">{insight.observationTitle}</p>
                    <ul className="mt-1 space-y-1">
                      {insight.measurements.map((measurement) => (
                        <li key={measurement.feature} className="text-slate-600">
                          {measurement.displayText && (
                            <span className="block text-slate-700">{measurement.displayText}</span>
                          )}
                          {measurement.displayLabel ?? measurement.label}:{" "}
                          {measurement.value.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}{" "}
                          (limite {measurement.operator}{" "}
                          {measurement.threshold.toLocaleString("pt-BR", {
                            maximumFractionDigits: 4,
                          })}
                          ; base:{" "}
                          {DENOMINATOR_LABELS[measurement.denominator] ??
                            "unidades contadas no trecho"}
                          {measurement.count !== undefined &&
                          measurement.denominatorCount !== undefined
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
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

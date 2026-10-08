"use client";

import { BrainCircuit } from "lucide-react";
import type * as React from "react";

import { useNewsPrediction } from "../hooks/use-news-prediction";

import { VerometroGauge } from "./verometro-gauge";

const CLASS_LABELS = {
  reliable: "Estimada como verdadeira",
  unreliable: "Estimada como falsa",
  uncertain: "Previsão inconclusiva",
};

export function ModelAnalysisPanel({
  roomId,
  round,
}: {
  roomId: string;
  round: number;
}): React.ReactElement {
  const { state, retry, canRetry } = useNewsPrediction(roomId, round);
  const analysis = state.status === "ready" ? state.analysis : null;
  const unavailable = state.status === "unavailable" || analysis?.analysisStatus === "unavailable";
  const score = analysis?.analysisStatus === "ok" ? analysis.fakeScore : null;

  return (
    <section
      aria-label="Análise do modelo"
      className="mt-6 w-full max-w-2xl rounded-3xl border border-white/40 bg-white p-6 text-slate-800 shadow-xl sm:p-8"
    >
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <BrainCircuit aria-hidden="true" className="size-5 text-blue-600" />
        Análise do modelo
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Esta previsão usa a escrita da notícia. O resultado do jogo segue o gabarito cadastrado.
      </p>
      <div role="status" aria-live="polite" className="mt-4">
        {state.status === "loading" && <p>Analisando o texto da rodada…</p>}
        {unavailable && <p>A análise do modelo está indisponível. Você pode continuar o jogo.</p>}
        {analysis?.analysisStatus === "insufficient_text" && (
          <p>Texto insuficiente para estimar o score.</p>
        )}
        {analysis?.analysisStatus === "invalid_text" && (
          <p>O corpo da notícia não contém texto válido para análise.</p>
        )}
        {analysis?.analysisStatus === "ok" && analysis.classification && (
          <>
            <p className="font-semibold">{CLASS_LABELS[analysis.classification]}</p>
            {analysis.classification === "uncertain" && (
              <p className="mt-1 text-sm text-slate-600">
                A estimativa ficou na faixa intermediária, entre 35 e 65.
              </p>
            )}
          </>
        )}
      </div>
      {score !== null && score !== undefined && <VerometroGauge fakeScore={score} />}
      {analysis?.analysisStatus === "ok" && analysis.reasons.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold">
            Termos que influenciaram o resultado e características da escrita
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {analysis.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-600">
            Essas contribuições não são provas sobre os fatos nem explicações causais.
          </p>
        </div>
      )}
      {unavailable && (state.status === "unavailable" ? state.retryable : canRetry) && (
        <button
          type="button"
          onClick={retry}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Tentar análise novamente
        </button>
      )}
      {analysis && (
        <details className="mt-4 rounded-xl border border-slate-200 p-3 text-sm">
          <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-blue-600">
            Preparo, versões e limitações
          </summary>
          <p className="mt-3 text-slate-600">
            O classificador Olimpo aprende padrões do Fake.br-Corpus. Ele não consulta fontes
            externas nem confirma acontecimentos; o desempenho em notícias novas pode ser diferente.
          </p>
          <p className="mt-2 text-slate-600">
            O corpo original é normalizado, os dígitos são substituídos por zero e o modelo usa até
            as primeiras {analysis.inputScope.wordLimit} palavras. Foram analisadas{" "}
            {analysis.inputScope.analyzedWordCount} palavras
            {analysis.inputScope.truncated ? "; o restante do texto ficou fora da análise" : ""}.
          </p>
          <dl className="mt-3 space-y-2 text-xs break-words text-slate-600">
            <div>
              <dt className="font-semibold">Modelo</dt>
              <dd>{analysis.modelVersion}</dd>
            </div>
            <div>
              <dt className="font-semibold">Política de decisão</dt>
              <dd>{analysis.policyVersion}</dd>
            </div>
            <div>
              <dt className="font-semibold">Inferência</dt>
              <dd>{analysis.inferenceVersion}</dd>
            </div>
            <div>
              <dt className="font-semibold">Artefato SHA-256</dt>
              <dd>{analysis.artifactSha256}</dd>
            </div>
          </dl>
        </details>
      )}
    </section>
  );
}

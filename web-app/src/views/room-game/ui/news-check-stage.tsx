"use client";

import { Clock, ExternalLink, Loader2, Newspaper } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "sonner";

import {
  submitVoteAction,
  type SubmitVoteActionResult,
} from "@/app/api/news-voting/actions/submit-vote.action";

export interface INewsArticleData {
  id?: string;
  title: string | null;
  description: string | null;
  publisher: string | null;
  authors?: string[];
  publishedAt?: string | null;
  imageUrl?: string | null;
  url: string;
  content?: string;
}

export interface INewsCheckStageProps {
  roomId?: string;
  currentRound: number;
  totalRounds: number;
  article: INewsArticleData;
  timeRemainingSeconds?: number | null;
  onCustomVote?: (
    vote: "reliable" | "unreliable" | "uncertain",
    isTimeout?: boolean,
  ) => Promise<SubmitVoteActionResult>;
  onVoteSubmitted: (data: {
    vote: "reliable" | "unreliable" | "uncertain";
    result: SubmitVoteActionResult;
    timeTakenSeconds: number;
    isTimeout?: boolean;
  }) => void;
}

export function NewsCheckStage({
  roomId,
  currentRound,
  totalRounds,
  article,
  timeRemainingSeconds,
  onCustomVote,
  onVoteSubmitted,
}: INewsCheckStageProps): React.ReactElement {
  const [selectedVote, setSelectedVote] = React.useState<
    "reliable" | "unreliable" | "uncertain" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const startTimeRef = React.useRef<number>(0);
  const hasAutoSubmittedRef = React.useRef(false);

  React.useEffect(() => {
    startTimeRef.current = Date.now();
    hasAutoSubmittedRef.current = false;
  }, [article.id]);

  // Extract friendly publisher tag or hostname fallback
  const publisherName = React.useMemo(() => {
    if (article.publisher && article.publisher.trim() !== "") {
      return article.publisher;
    }
    try {
      if (article.url) {
        const parsed = new URL(article.url);
        return parsed.hostname.replace(/^www\./, "");
      }
    } catch {
      // ignore
    }
    return "Portal de Notícias";
  }, [article.publisher, article.url]);

  const authorAndDate = React.useMemo(() => {
    const parts: string[] = [];
    if (article.authors && article.authors.length > 0) {
      parts.push(`Por ${article.authors.join(", ")}`);
    } else {
      parts.push("Redação");
    }

    if (article.publishedAt) {
      try {
        const d = new Date(article.publishedAt);
        if (!isNaN(d.getTime())) {
          parts.push(
            d.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        }
      } catch {
        // ignore date parse error
      }
    }

    return parts.join(" • ");
  }, [article.authors, article.publishedAt]);

  const handleVote = React.useCallback(
    async (vote: "reliable" | "unreliable" | "uncertain", isTimeout = false): Promise<void> => {
      if (isSubmitting) return;

      setSelectedVote(vote);
      setIsSubmitting(true);
      const timeTakenSeconds = isTimeout
        ? 30
        : Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      try {
        let result: SubmitVoteActionResult;
        if (onCustomVote) {
          result = await onCustomVote(vote, isTimeout);
        } else if (roomId) {
          result = await submitVoteAction({
            roomId,
            vote,
            isTimeout,
          });
        } else {
          result = {
            success: false,
            error: "Identificador da sala ou manipulador customizado não fornecido.",
          };
        }

        if (!result.success) {
          toast.error("Erro ao registrar voto", {
            description: result.error,
          });
          setIsSubmitting(false);
          setSelectedVote(null);
          return;
        }

        if (isTimeout) {
          toast.warning("Tempo esgotado!", {
            description: "Seu voto foi registrado como tempo esgotado (0 pontos).",
          });
        }

        onVoteSubmitted({
          vote,
          result,
          timeTakenSeconds,
          isTimeout,
        });
      } catch {
        toast.error("Erro ao registrar voto", {
          description: "Falha de conexão. Tente novamente.",
        });
        setIsSubmitting(false);
        setSelectedVote(null);
      }
    },
    [isSubmitting, onCustomVote, onVoteSubmitted, roomId],
  );

  // Automatically submit neutral timeout vote when round duration expires
  React.useEffect(() => {
    if (
      timeRemainingSeconds !== undefined &&
      timeRemainingSeconds !== null &&
      timeRemainingSeconds <= 0 &&
      !selectedVote &&
      !isSubmitting &&
      !hasAutoSubmittedRef.current
    ) {
      hasAutoSubmittedRef.current = true;
      void handleVote("uncertain", true);
    }
  }, [timeRemainingSeconds, selectedVote, isSubmitting, handleVote]);

  return (
    <div className="flex w-full flex-col items-center py-2" data-purpose="news-check-stage">
      {/* Top Status Bar: Round indicator & Countdown Timer */}
      <div className="mb-4 flex w-full max-w-4xl items-center justify-between px-2">
        <div
          className="rounded-full border border-white/25 bg-white/20 px-4 py-1.5 shadow-sm backdrop-blur-md transition-all"
          data-purpose="round-indicator"
        >
          <span className="text-xs font-bold tracking-wide text-white md:text-sm">
            Notícia {currentRound} de {totalRounds}
          </span>
        </div>

        {timeRemainingSeconds !== undefined && timeRemainingSeconds !== null && (
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold shadow-sm backdrop-blur-md transition-all ${
              timeRemainingSeconds <= 5
                ? "animate-pulse border-rose-400 bg-rose-500/30 text-rose-200"
                : "border-white/25 bg-white/20 text-white"
            }`}
          >
            <Clock
              className={`size-3.5 ${
                timeRemainingSeconds <= 5 ? "text-rose-300" : "text-amber-300"
              }`}
              aria-hidden="true"
            />
            <span>{timeRemainingSeconds}s</span>
          </div>
        )}
      </div>

      {/* Main Prompt */}
      <div className="mb-5 max-w-2xl px-2 text-center">
        <h1 className="text-2xl leading-tight font-extrabold tracking-tight text-white drop-shadow-sm sm:text-3xl md:text-4xl">
          Esta notícia é verdadeira, falsa ou incerta?
        </h1>
        <p className="mt-1 text-xs text-blue-100 sm:text-sm">
          Analise o veículo, a manchete e as evidências antes de votar.
        </p>
      </div>

      {/* News Article Card */}
      <article
        className="mb-6 w-full max-w-4xl rounded-3xl border border-white/40 bg-white p-5 text-slate-800 shadow-2xl transition-all duration-300 md:p-6"
        data-purpose="news-card"
      >
        {/* Card Header: Publisher Badge & Metadata */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-bold tracking-wider text-white uppercase shadow-sm">
              {publisherName}
            </span>
            <span className="font-semibold text-slate-600">Checagem de Fatos</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>{authorAndDate}</span>
            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline"
                title="Abrir matéria original"
              >
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {/* Headline */}
        <h2 className="mb-3.5 text-xl leading-snug font-extrabold tracking-tight text-slate-900 md:text-2xl lg:text-[26px]">
          {article.title || "Notícia selecionada para verificação"}
        </h2>

        {/* Featured Image or Visual Fallback */}
        <div className="relative mb-4 h-48 w-full overflow-hidden rounded-2xl bg-slate-100 sm:h-56 md:h-64">
          {article.imageUrl && !imageError ? (
            <div className="relative size-full">
              <Image
                src={article.imageUrl}
                alt={article.title || "Imagem da notícia"}
                fill
                className="object-cover object-center transition-transform duration-500 ease-out hover:scale-105"
                onError={() => setImageError(true)}
                unoptimized
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
              <Newspaper className="size-12 stroke-1" aria-hidden="true" />
              <span className="text-xs font-medium">Matéria original sem imagem</span>
            </div>
          )}
        </div>

        {/* Snippet / Description */}
        <p className="line-clamp-4 text-sm leading-relaxed text-slate-600 md:text-base">
          {article.description ||
            article.content?.slice(0, 320) ||
            "Leia com atenção os detalhes da publicação e pondere se os fatos relatados possuem respaldo em veículos de imprensa e fontes primárias idôneas."}
        </p>
      </article>

      {/* Answer Decision Buttons */}
      <div
        className="grid w-full max-w-4xl grid-cols-1 gap-3.5 sm:grid-cols-3 md:gap-5"
        data-purpose="voting-options"
      >
        {/* Option 1: Verdadeiro (reliable) */}
        <button
          type="button"
          disabled={
            isSubmitting ||
            (timeRemainingSeconds !== null &&
              timeRemainingSeconds !== undefined &&
              timeRemainingSeconds <= 0)
          }
          onClick={() => void handleVote("reliable")}
          aria-label="Classificar notícia como Verdadeira"
          className={`flex w-full items-center gap-3.5 rounded-2xl border border-white/60 bg-white p-3.5 text-slate-800 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-xl focus:ring-4 focus:ring-emerald-300 focus:outline-none active:translate-y-0.5 md:rounded-3xl md:p-4 ${
            selectedVote === "reliable" ? "ring-4 ring-emerald-400" : ""
          } ${isSubmitting && selectedVote !== "reliable" ? "opacity-50" : ""}`}
        >
          <span className="flex size-11 min-w-[44px] items-center justify-center rounded-full bg-emerald-500 text-xl font-extrabold text-white shadow-md shadow-emerald-500/25 md:size-13 md:text-2xl">
            {isSubmitting && selectedVote === "reliable" ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              "V"
            )}
          </span>
          <div className="text-left">
            <span className="block text-lg leading-tight font-bold text-slate-900 md:text-xl">
              Verdadeiro
            </span>
            <span className="text-xs font-medium text-slate-400">Fato verificado</span>
          </div>
        </button>

        {/* Option 2: Falso (unreliable) */}
        <button
          type="button"
          disabled={
            isSubmitting ||
            (timeRemainingSeconds !== null &&
              timeRemainingSeconds !== undefined &&
              timeRemainingSeconds <= 0)
          }
          onClick={() => void handleVote("unreliable")}
          aria-label="Classificar notícia como Falsa"
          className={`flex w-full items-center gap-3.5 rounded-2xl border border-white/60 bg-white p-3.5 text-slate-800 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-xl focus:ring-4 focus:ring-rose-300 focus:outline-none active:translate-y-0.5 md:rounded-3xl md:p-4 ${
            selectedVote === "unreliable" ? "ring-4 ring-rose-400" : ""
          } ${isSubmitting && selectedVote !== "unreliable" ? "opacity-50" : ""}`}
        >
          <span className="flex size-11 min-w-[44px] items-center justify-center rounded-full bg-rose-500 text-xl font-extrabold text-white shadow-md shadow-rose-500/25 md:size-13 md:text-2xl">
            {isSubmitting && selectedVote === "unreliable" ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              "F"
            )}
          </span>
          <div className="text-left">
            <span className="block text-lg leading-tight font-bold text-slate-900 md:text-xl">
              Falso
            </span>
            <span className="text-xs font-medium text-slate-400">Fake news / Incorreto</span>
          </div>
        </button>

        {/* Option 3: Incerto (uncertain) */}
        <button
          type="button"
          disabled={
            isSubmitting ||
            (timeRemainingSeconds !== null &&
              timeRemainingSeconds !== undefined &&
              timeRemainingSeconds <= 0)
          }
          onClick={() => void handleVote("uncertain")}
          aria-label="Classificar notícia como Incerta"
          className={`flex w-full items-center gap-3.5 rounded-2xl border border-white/60 bg-white p-3.5 text-slate-800 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-xl focus:ring-4 focus:ring-amber-300 focus:outline-none active:translate-y-0.5 md:rounded-3xl md:p-4 ${
            selectedVote === "uncertain" ? "ring-4 ring-amber-400" : ""
          } ${isSubmitting && selectedVote !== "uncertain" ? "opacity-50" : ""}`}
        >
          <span className="flex size-11 min-w-[44px] items-center justify-center rounded-full bg-amber-400 text-xl font-extrabold text-white shadow-md shadow-amber-400/25 md:size-13 md:text-2xl">
            {isSubmitting && selectedVote === "uncertain" ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              "?"
            )}
          </span>
          <div className="text-left">
            <span className="block text-lg leading-tight font-bold text-slate-900 md:text-xl">
              Incerto
            </span>
            <span className="text-xs font-medium text-slate-400">Sem dados suficientes</span>
          </div>
        </button>
      </div>
    </div>
  );
}

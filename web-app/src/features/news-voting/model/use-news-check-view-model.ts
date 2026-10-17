"use client";

import * as React from "react";
import { toast } from "sonner";

import type { INewsArticleData, VoteOption, VoteSubmission } from "./types";
import { useNewsInsights } from "./use-news-insights";

import { submitVoteAction } from "@/app/api/news-voting/actions/submit-vote.action";

interface UseNewsCheckViewModelInput {
  roomId?: string;
  currentRound: number;
  article: INewsArticleData;
  timeRemainingSeconds?: number | null;
  onCustomVote?: (
    vote: VoteOption,
    isTimeout?: boolean,
  ) => Promise<import("@/app/api/news-voting/actions/submit-vote.action").SubmitVoteActionResult>;
  onVoteSubmitted: (data: VoteSubmission) => void;
}

export function useNewsCheckViewModel({
  roomId,
  currentRound,
  article: initialArticle,
  timeRemainingSeconds,
  onCustomVote,
  onVoteSubmitted,
}: UseNewsCheckViewModelInput) {
  const insightsState = useNewsInsights(roomId, currentRound);
  const article: INewsArticleData =
    insightsState.status === "ready"
      ? { ...insightsState.response.article, id: initialArticle.id }
      : initialArticle;
  const [selectedVote, setSelectedVote] = React.useState<VoteOption | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const startTimeRef = React.useRef(0);
  const hasAutoSubmittedRef = React.useRef(false);
  const mountedRef = React.useRef(false);
  const voteInFlightRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    startTimeRef.current = Date.now();
    hasAutoSubmittedRef.current = false;
    return () => {
      mountedRef.current = false;
    };
  }, [initialArticle.id, currentRound, roomId]);

  const publisherName = React.useMemo(() => {
    if (article.publisher && article.publisher.trim() !== "") return article.publisher;
    try {
      if (article.url) return new URL(article.url).hostname.replace(/^www\./, "");
    } catch {
      // Fall back to a neutral label for malformed article URLs.
    }
    return "Portal de Notícias";
  }, [article.publisher, article.url]);

  const authorAndDate = React.useMemo(() => {
    const parts = [article.authors?.length ? `Por ${article.authors.join(", ")}` : "Redação"];
    if (article.publishedAt) {
      const date = new Date(article.publishedAt);
      if (Number.isFinite(date.getTime())) {
        parts.push(
          date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      }
    }
    return parts.join(" • ");
  }, [article.authors, article.publishedAt]);

  const handleVote = React.useCallback(
    async (vote: VoteOption, isTimeout = false): Promise<void> => {
      if (voteInFlightRef.current) return;
      voteInFlightRef.current = true;
      setSelectedVote(vote);
      setIsSubmitting(true);
      const timeTakenSeconds = isTimeout
        ? 30
        : Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      try {
        let result;
        if (onCustomVote) result = await onCustomVote(vote, isTimeout);
        else if (roomId) result = await submitVoteAction({ roomId, vote, isTimeout });
        else {
          result = {
            success: false as const,
            error: "Identificador da sala ou manipulador customizado não fornecido.",
          };
        }
        if (!mountedRef.current) return;
        if (!result.success) {
          toast.error("Erro ao registrar voto", { description: result.error });
          setIsSubmitting(false);
          setSelectedVote(null);
          voteInFlightRef.current = false;
          return;
        }

        if (isTimeout) {
          toast.warning("Tempo esgotado!", {
            description: "Seu voto foi registrado como tempo esgotado (0 pontos).",
          });
        }
        onVoteSubmitted({ vote, result, timeTakenSeconds, isTimeout });
      } catch {
        if (!mountedRef.current) return;
        toast.error("Erro ao registrar voto", {
          description: "Falha de conexão. Tente novamente.",
        });
        setIsSubmitting(false);
        setSelectedVote(null);
        voteInFlightRef.current = false;
      }
    },
    [onCustomVote, onVoteSubmitted, roomId],
  );

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

  return {
    article,
    insightsState,
    selectedVote,
    isSubmitting,
    imageError,
    setImageError,
    publisherName,
    authorAndDate,
    handleVote,
  };
}

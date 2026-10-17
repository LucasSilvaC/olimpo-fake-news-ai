"use client";

import { Clock } from "lucide-react";
import * as React from "react";

import type { INewsArticleData, VoteOption, VoteSubmission } from "../model/types";
import { useNewsCheckViewModel } from "../model/use-news-check-view-model";

import { NewsArticleCard } from "./news-article-card";
import { NewsInsightsPanel } from "./news-insights-panel";
import { NewsVoteOptions } from "./news-vote-options";

import type { SubmitVoteActionResult } from "@/app/api/news-voting/actions/submit-vote.action";

export type { INewsArticleData } from "../model/types";

export interface INewsCheckStageProps {
  roomId?: string;
  currentRound: number;
  totalRounds: number;
  article: INewsArticleData;
  timeRemainingSeconds?: number | null;
  onCustomVote?: (vote: VoteOption, isTimeout?: boolean) => Promise<SubmitVoteActionResult>;
  onVoteSubmitted: (data: VoteSubmission) => void;
}

export function NewsCheckStage(props: INewsCheckStageProps): React.ReactElement {
  return (
    <NewsCheckRound
      key={`${props.roomId}:${props.currentRound}:${props.article.id ?? props.article.url}`}
      {...props}
    />
  );
}

function NewsCheckRound({
  roomId,
  currentRound,
  totalRounds,
  article: initialArticle,
  timeRemainingSeconds,
  onCustomVote,
  onVoteSubmitted,
}: INewsCheckStageProps): React.ReactElement {
  const {
    article,
    insightsState,
    selectedVote,
    isSubmitting,
    imageError,
    setImageError,
    publisherName,
    authorAndDate,
    handleVote,
  } = useNewsCheckViewModel({
    roomId,
    currentRound,
    article: initialArticle,
    timeRemainingSeconds,
    onCustomVote,
    onVoteSubmitted,
  });
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

      <NewsArticleCard
        article={article}
        publisherName={publisherName}
        authorAndDate={authorAndDate}
        imageError={imageError}
        onImageError={() => setImageError(true)}
      />
      {roomId && <NewsInsightsPanel state={insightsState} />}

      <NewsVoteOptions
        selectedVote={selectedVote}
        isSubmitting={isSubmitting}
        disabled={
          timeRemainingSeconds !== undefined &&
          timeRemainingSeconds !== null &&
          timeRemainingSeconds <= 0
        }
        onVote={(vote) => void handleVote(vote)}
      />
    </div>
  );
}

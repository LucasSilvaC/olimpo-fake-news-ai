"use client";

import { AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import * as React from "react";

import type { IChallengeGameViewProps } from "../model/types";
import { useChallengeGameViewModel } from "../model/use-challenge-game-view-model";

import { PageShell } from "@/components/molecules/page-shell";
import { NewsCheckStage } from "@/features/news-voting";
import { Header } from "@/widgets/app-header";
import { MatchScoreboardStage, RoundScoreboardStage, VerdictWaitingStage } from "@/widgets/game-stages";


export type {
  ChallengeGameStage,
  IChallengeUser,
  IChallengeGameViewProps,
  IUserVoteState,
} from "../model/types";

export function ChallengeGameView(props: IChallengeGameViewProps): React.ReactElement {
  const { currentUser } = props;
  const {
    stage,
    currentRound,
    score,
    lastVote,
    verdictCountdown,
    totalChallenges,
    activeArticleData,
    handleCustomVote,
    handleVoteSubmitted,
    handleSkipVerdictCountdown,
    handleAdvance,
    handleExit,
    scoreboardPlayers,
    matchPlayers,
  } = useChallengeGameViewModel(props);  return (
    <PageShell className="overflow-x-hidden">
      <Header className="relative z-20">
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur-sm sm:flex">
            <Sparkles className="size-3.5 text-amber-300" aria-hidden="true" />
            <span>{score.toLocaleString("pt-BR")} XP ganhos</span>
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {stage === "MATCH_FINALE" ? "Voltar ao início" : "Sair do desafio"}
          </button>
        </div>
      </Header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-4 pb-12 sm:px-6 sm:pt-6">
        {totalChallenges === 0 ? (
          <div className="my-auto flex w-full max-w-lg flex-col items-center rounded-3xl border border-white/30 bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur-md">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/20 text-amber-300 shadow-inner">
              <AlertCircle className="size-8" aria-hidden="true" />
            </div>
            <h1 className="mb-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Nenhum desafio disponível
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-blue-100/90">
              Não encontramos desafios globais ativos no momento. Volte mais tarde para novas
              missões investigativas e checagens de fatos!
            </p>
            <button
              type="button"
              onClick={handleExit}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-extrabold text-amber-950 shadow-lg transition-transform hover:bg-amber-300 hover:shadow-xl active:scale-95"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar ao Início
            </button>
          </div>
        ) : (
          <>
            {stage === "CHECKING" && (
              <NewsCheckStage
                currentRound={currentRound}
                totalRounds={totalChallenges}
                article={activeArticleData}
                timeRemainingSeconds={null}
                onCustomVote={handleCustomVote}
                onVoteSubmitted={handleVoteSubmitted}
              />
            )}

            {stage === "WAITING" && lastVote && (
              <VerdictWaitingStage
                userName={currentUser.name}
                userVote={lastVote.vote}
                pointsAwarded={lastVote.pointsAwarded ?? 0}
                timeTakenSeconds={lastVote.timeTakenSeconds ?? 0}
                isCorrect={lastVote.isCorrect ?? null}
                officialAnswer={lastVote.officialAnswer ?? null}
                verdictCountdownSeconds={verdictCountdown}
                onSkipCountdown={handleSkipVerdictCountdown}
                isTimeout={lastVote.isTimeout ?? false}
                votedCount={1}
                totalPlayers={1}
              />
            )}

            {stage === "ROUND_SCOREBOARD" && (
              <RoundScoreboardStage
                currentRound={currentRound}
                totalRounds={totalChallenges}
                isHost={true}
                leaderboard={scoreboardPlayers}
                onAdvance={handleAdvance}
              />
            )}

            {stage === "MATCH_FINALE" && (
              <MatchScoreboardStage totalRounds={totalChallenges} leaderboard={matchPlayers} />
            )}
          </>
        )}
      </main>
    </PageShell>
  );
}

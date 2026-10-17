"use client";

import { ArrowLeft, WifiOff } from "lucide-react";
import * as React from "react";

import type { IRoomGameViewProps } from "../model/types";
import { useRoomGameViewModel } from "../model/use-room-game-view-model";

import { ModelAnalysisPanel } from "./model-analysis-panel";

import { PageShell } from "@/components/molecules/page-shell";
import { NewsCheckStage } from "@/features/news-voting";
import { Header } from "@/widgets/app-header";
import {
  MatchScoreboardStage,
  RoundScoreboardStage,
  VerdictWaitingStage,
} from "@/widgets/game-stages";


export type {
  GameStage,
  IRoomGameViewProps,
  RoomGameMember,
  RoomGameRoom,
  RoomGamePlaylistItem,
  IUserVoteState,
  IRoomPlayerState,
} from "../model/types";

export function RoomGameView(props: IRoomGameViewProps): React.ReactElement {
  const { room, members } = props;
  const {
    stage,
    currentRound,
    timeRemaining,
    lastVote,
    votedCount,
    isConnected,
    roundClosed,
    verdictCountdown,
    isHost,
    currentUserName,
    activeArticle,
    handleSkipVerdictCountdown,
    handleVoteSubmitted,
    scoreboardPlayers,
    matchPlayers,
    handleExitGame,
    handleAdvanceRound,
    answerLabels,
  } = useRoomGameViewModel(props);  return (
    <PageShell className="overflow-x-hidden">
      <Header className="relative z-20">
        <button
          type="button"
          onClick={handleExitGame}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {stage === "MATCH_FINALE" ? "Voltar ao início" : "Sair da sala"}
        </button>
      </Header>

      {/* Offline warning badge if SSE disconnects */}
      {!isConnected && (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 shadow-lg backdrop-blur-md">
          <WifiOff className="h-3.5 w-3.5 animate-pulse" />
          <span>Reconectando à sala...</span>
        </div>
      )}

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-4 pb-12 sm:px-6 sm:pt-6">
        {/* Render active stage */}
        {stage === "CHECKING" && (
          <NewsCheckStage
            roomId={room.id}
            currentRound={currentRound}
            totalRounds={room.totalRounds}
            article={activeArticle}
            timeRemainingSeconds={timeRemaining}
            onVoteSubmitted={handleVoteSubmitted}
          />
        )}

        {stage === "WAITING" && (
          <VerdictWaitingStage
            userName={currentUserName}
            userVote={lastVote?.vote ?? "uncertain"}
            pointsAwarded={lastVote?.pointsAwarded ?? 0}
            timeTakenSeconds={lastVote?.timeTakenSeconds ?? 0}
            isCorrect={lastVote?.isCorrect ?? null}
            officialAnswer={roundClosed ? (lastVote?.officialAnswer ?? null) : null}
            verdictCountdownSeconds={verdictCountdown}
            onSkipCountdown={handleSkipVerdictCountdown}
            isTimeout={lastVote?.isTimeout ?? false}
            votedCount={votedCount}
            totalPlayers={members.length}
          />
        )}

        {roundClosed && (
          <ModelAnalysisPanel
            key={`${room.id}:${currentRound}`}
            roomId={room.id}
            round={currentRound}
          />
        )}

        {roundClosed && stage !== "WAITING" && lastVote?.officialAnswer && (
          <section
            aria-label="Resultado do jogo"
            className="mt-6 w-full max-w-2xl rounded-3xl bg-white p-6 text-slate-800"
          >
            <h2 className="text-lg font-bold">Resultado do jogo</h2>
            <p className="mt-2 text-sm">
              Gabarito cadastrado: <strong>{answerLabels[lastVote.officialAnswer]}</strong>
            </p>
            <p className="mt-1 text-sm">Seu voto: {answerLabels[lastVote.vote]}</p>
          </section>
        )}

        {stage === "ROUND_SCOREBOARD" && (
          <RoundScoreboardStage
            currentRound={currentRound}
            totalRounds={room.totalRounds}
            isHost={isHost}
            leaderboard={scoreboardPlayers}
            onAdvance={handleAdvanceRound}
          />
        )}

        {stage === "MATCH_FINALE" && (
          <MatchScoreboardStage totalRounds={room.totalRounds} leaderboard={matchPlayers} />
        )}
      </main>
    </PageShell>
  );
}

"use client";

import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { answerGlobalChallengeAction } from "@/app/api/global-challenges/actions/answer-global-challenge.action";
import { getDefaultAnalysis } from "@/app/api/global-challenges/entities";
import type { ListedGlobalChallengeDTO } from "@/app/api/global-challenges/usecase/list-global-challenges.usecase";
import type { SubmitVoteActionResult } from "@/app/api/news-voting/actions/submit-vote.action";
import { PageShell } from "@/components/molecules/page-shell";
import type { AvatarConfig } from "@/lib/avatar";
import type { MLTargetType } from "@/server/shared/database/schemas/enums";
import {
  MatchScoreboardStage,
  type IMatchPlayer,
} from "@/views/room-game/ui/match-scoreboard-stage";
import { NewsCheckStage, type INewsArticleData } from "@/views/room-game/ui/news-check-stage";
import {
  RoundScoreboardStage,
  type IScoreboardPlayer,
} from "@/views/room-game/ui/round-scoreboard-stage";
import { VerdictWaitingStage } from "@/views/room-game/ui/verdict-waiting-stage";
import { Header } from "@/widgets/app-header";

export type ChallengeGameStage = "CHECKING" | "WAITING" | "ROUND_SCOREBOARD" | "MATCH_FINALE";

export interface IChallengeUser {
  id: string;
  name: string;
  avatar?: AvatarConfig;
  xp?: number;
}

export interface IUserVoteState {
  vote: "reliable" | "unreliable" | "uncertain";
  pointsAwarded?: number;
  isCorrect?: boolean | null;
  officialAnswer?: "reliable" | "unreliable" | "uncertain" | null;
  reliabilityScore?: number;
  timeTakenSeconds?: number;
  reasons?: string[];
  isTimeout?: boolean;
}

export interface IChallengeGameViewProps {
  challenges: ListedGlobalChallengeDTO[];
  currentUser: IChallengeUser;
}

export function ChallengeGameView({
  challenges,
  currentUser,
}: IChallengeGameViewProps): React.ReactElement {
  const router = useRouter();

  const [stage, setStage] = React.useState<ChallengeGameStage>("CHECKING");
  const [currentRound, setCurrentRound] = React.useState<number>(1);
  const [score, setScore] = React.useState<number>(0);
  const [streak, setStreak] = React.useState<number>(0);
  const [correctCount, setCorrectCount] = React.useState<number>(0);
  const [roundDelta, setRoundDelta] = React.useState<number>(0);
  const [lastIsCorrect, setLastIsCorrect] = React.useState<boolean>(false);
  const [lastTimeTakenSeconds, setLastTimeTakenSeconds] = React.useState<number>(0);
  const [lastVote, setLastVote] = React.useState<IUserVoteState | null>(null);
  const [verdictCountdown, setVerdictCountdown] = React.useState<number | null>(null);

  const totalChallenges = challenges.length;

  const activeChallenge = React.useMemo<ListedGlobalChallengeDTO | null>(() => {
    if (totalChallenges === 0) return null;
    return challenges[currentRound - 1] ?? null;
  }, [challenges, currentRound, totalChallenges]);

  const activeArticleData = React.useMemo<INewsArticleData>(() => {
    if (!activeChallenge) {
      return {
        title: "Desafio não encontrado",
        description: "Não foi possível carregar a notícia do desafio.",
        publisher: "Olimpo Fact-Checking",
        url: "https://olimpo.news",
        imageUrl: null,
      };
    }

    const { article } = activeChallenge.article;
    return {
      id: activeChallenge.id,
      title: article.title || activeChallenge.title,
      description: article.description,
      publisher: article.publisher,
      authors: article.authors,
      publishedAt: article.publishedAt,
      imageUrl: article.imageUrl,
      url: article.url,
      content: article.content,
    };
  }, [activeChallenge]);

  // Countdown timer for reading the official verdict
  React.useEffect(() => {
    if (stage !== "WAITING" || verdictCountdown === null || verdictCountdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setVerdictCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setStage("ROUND_SCOREBOARD");
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, verdictCountdown]);

  const handleSkipVerdictCountdown = React.useCallback((): void => {
    setVerdictCountdown(null);
    setStage("ROUND_SCOREBOARD");
  }, []);

  const handleCustomVote = React.useCallback(
    async (
      vote: "reliable" | "unreliable" | "uncertain",
      isTimeout = false,
    ): Promise<SubmitVoteActionResult> => {
      if (!activeChallenge) {
        return {
          success: false,
          error: "Nenhum desafio ativo selecionado.",
        };
      }

      const defaultAnalysis = getDefaultAnalysis(activeChallenge.article.targetClassification);
      const challengeAnalysis = activeChallenge.analysis ?? defaultAnalysis;

      const toAIAnalysisDTO = (
        analysis: { classification: MLTargetType; reasons: string[]; confidence: number },
        articleId: string,
      ) => ({
        id: crypto.randomUUID(),
        articleId,
        classification: analysis.classification,
        reasons: analysis.reasons,
        confidence: analysis.confidence,
        modelVersion: "mock-v1",
        createdAt: new Date(),
      });

      if (isTimeout) {
        return {
          success: true,
          roundCompleted: true,
          analysis: toAIAnalysisDTO(challengeAnalysis, activeChallenge.article.id),
          vote: {
            id: activeChallenge.id,
            roomId: "solo",
            userId: currentUser.id,
            playlistItemId: activeChallenge.id,
            vote: "uncertain",
            isCorrect: false,
            pointsAwarded: 0,
          },
        };
      }

      // If user already answered this challenge in a previous session
      if (activeChallenge.isAnswered) {
        const isCorrect = vote === activeChallenge.article.targetClassification;
        const reward = isCorrect ? activeChallenge.xpReward || 50 : 0;

        return {
          success: true,
          roundCompleted: true,
          analysis: toAIAnalysisDTO(challengeAnalysis, activeChallenge.article.id),
          vote: {
            id: activeChallenge.id,
            roomId: "solo",
            userId: currentUser.id,
            playlistItemId: activeChallenge.id,
            vote,
            isCorrect,
            pointsAwarded: reward,
          },
        };
      }

      const res = await answerGlobalChallengeAction({
        challengeId: activeChallenge.id,
        answer: vote,
      });

      if (!res.success) {
        if (res.error.toLowerCase().includes("already answered")) {
          const isCorrect = vote === activeChallenge.article.targetClassification;
          const reward = isCorrect ? activeChallenge.xpReward || 50 : 0;

          return {
            success: true,
            roundCompleted: true,
            analysis: toAIAnalysisDTO(challengeAnalysis, activeChallenge.article.id),
            vote: {
              id: activeChallenge.id,
              roomId: "solo",
              userId: currentUser.id,
              playlistItemId: activeChallenge.id,
              vote,
              isCorrect,
              pointsAwarded: reward,
            },
          };
        }

        return {
          success: false,
          error: res.error,
        };
      }

      return {
        success: true,
        roundCompleted: true,
        analysis: toAIAnalysisDTO(res.analysis ?? challengeAnalysis, activeChallenge.article.id),
        vote: {
          id: res.answer.id,
          roomId: "solo",
          userId: currentUser.id,
          playlistItemId: activeChallenge.id,
          vote,
          isCorrect: res.isCorrect,
          pointsAwarded: res.xpAwarded,
        },
      };
    },
    [activeChallenge, currentUser.id],
  );

  const handleVoteSubmitted = React.useCallback(
    (data: {
      vote: "reliable" | "unreliable" | "uncertain";
      result: SubmitVoteActionResult;
      timeTakenSeconds: number;
      isTimeout?: boolean;
    }): void => {
      if (!data.result.success) return;

      const isCorrect = Boolean(data.result.vote.isCorrect);
      const points = data.result.vote.pointsAwarded ?? 0;

      const defaultAnalysis = getDefaultAnalysis(
        activeChallenge?.article.targetClassification ?? "reliable",
      );
      const analysis = data.result.analysis ?? activeChallenge?.analysis ?? defaultAnalysis;

      const voteState: IUserVoteState = {
        vote: data.vote,
        pointsAwarded: points,
        isCorrect,
        officialAnswer: activeChallenge?.article.targetClassification ?? null,
        reliabilityScore: analysis.confidence,
        reasons: analysis.reasons,
        timeTakenSeconds: data.timeTakenSeconds,
        isTimeout: data.isTimeout,
      };

      setLastVote(voteState);
      setRoundDelta(points);
      setLastIsCorrect(isCorrect);
      setLastTimeTakenSeconds(data.timeTakenSeconds);
      setScore((prev) => prev + points);

      if (isCorrect) {
        setStreak((prev) => prev + 1);
        setCorrectCount((prev) => prev + 1);
      } else {
        setStreak(0);
      }

      setStage("WAITING");
      setVerdictCountdown(10);
    },
    [activeChallenge],
  );

  const handleAdvance = React.useCallback((): void => {
    if (currentRound < totalChallenges) {
      setCurrentRound((prev) => prev + 1);
      setLastVote(null);
      setVerdictCountdown(null);
      setStage("CHECKING");
    } else {
      setStage("MATCH_FINALE");
    }
  }, [currentRound, totalChallenges]);

  const handleExit = React.useCallback((): void => {
    router.push("/");
  }, [router]);

  const scoreboardPlayers: IScoreboardPlayer[] = React.useMemo(() => {
    return [
      {
        userId: currentUser.id,
        name: currentUser.name,
        score,
        roundDelta,
        streak,
        isCorrect: lastIsCorrect,
        timeSeconds: lastTimeTakenSeconds,
        isCurrentUser: true,
      },
    ];
  }, [
    currentUser.id,
    currentUser.name,
    score,
    roundDelta,
    streak,
    lastIsCorrect,
    lastTimeTakenSeconds,
  ]);

  const matchPlayers: IMatchPlayer[] = React.useMemo(() => {
    const accuracy = totalChallenges > 0 ? Math.round((correctCount / totalChallenges) * 100) : 0;

    return [
      {
        userId: currentUser.id,
        name: currentUser.name,
        score,
        correctCount,
        totalAnswered: totalChallenges,
        accuracy,
        isCurrentUser: true,
      },
    ];
  }, [totalChallenges, correctCount, currentUser.id, currentUser.name, score]);

  return (
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
                reliabilityScore={lastVote.reliabilityScore ?? 85}
                reasons={lastVote.reasons}
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

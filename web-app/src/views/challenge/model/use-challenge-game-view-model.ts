"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import type { ChallengeGameStage, IChallengeGameViewProps, IUserVoteState } from "./types";

import { answerGlobalChallengeAction } from "@/app/api/global-challenges/actions/answer-global-challenge.action";
import type { ListedGlobalChallengeDTO } from "@/app/api/global-challenges/contracts";
import type { SubmitVoteActionResult } from "@/app/api/news-voting/actions/submit-vote.action";
import type { INewsArticleData } from "@/features/news-voting";
import type { IMatchPlayer, IScoreboardPlayer } from "@/widgets/game-stages";

export function useChallengeGameViewModel({ challenges, currentUser }: IChallengeGameViewProps) {
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

      if (isTimeout) {
        return {
          success: true,
          roundCompleted: true,
          officialAnswer: activeChallenge.article.targetClassification,
          modelAnalysis: null,
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
        const savedAnswer = activeChallenge.userAnswer;
        const savedResult = activeChallenge.userIsCorrect;
        const savedXp = activeChallenge.userXpAwarded;
        if (savedAnswer === undefined || savedResult === undefined || savedXp === undefined) {
          return {
            success: false,
            error: "Resultado anterior indisponível. Atualize a página e tente novamente.",
          };
        }

        return {
          success: true,
          roundCompleted: true,
          officialAnswer: activeChallenge.article.targetClassification,
          modelAnalysis: null,
          vote: {
            id: activeChallenge.id,
            roomId: "solo",
            userId: currentUser.id,
            playlistItemId: activeChallenge.id,
            vote: savedAnswer,
            isCorrect: savedResult,
            pointsAwarded: savedXp,
          },
        };
      }

      const res = await answerGlobalChallengeAction({
        challengeId: activeChallenge.id,
        answer: vote,
      });

      if (!res.success) {
        if (res.error.toLowerCase().includes("already answered")) {
          router.refresh();
        }

        return {
          success: false,
          error: res.error,
        };
      }

      return {
        success: true,
        roundCompleted: true,
        officialAnswer: res.targetClassification,
        modelAnalysis: null,
        vote: {
          id: res.answer.id,
          roomId: "solo",
          userId: currentUser.id,
          playlistItemId: activeChallenge.id,
          vote: res.answer.answer,
          isCorrect: res.isCorrect,
          pointsAwarded: res.xpAwarded,
        },
      };
    },
    [activeChallenge, currentUser.id, router],
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

      const voteState: IUserVoteState = {
        vote: data.result.vote.vote,
        pointsAwarded: points,
        isCorrect,
        officialAnswer:
          data.result.officialAnswer ?? activeChallenge?.article.targetClassification ?? null,
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

  return {
    stage,
    currentRound,
    score,
    lastVote,
    verdictCountdown,
    totalChallenges,
    activeChallenge,
    activeArticleData,
    handleCustomVote,
    handleVoteSubmitted,
    handleSkipVerdictCountdown,
    handleAdvance,
    handleExit,
    scoreboardPlayers,
    matchPlayers,
  };
}

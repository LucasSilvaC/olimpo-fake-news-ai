"use client";

import { useEffect, useState } from "react";

import type { AIAnalysisDTO } from "@/app/api/ai-feedback/entities/ai-analysis.entity";

export interface DemonstrationDisclosure {
  explanation: string;
  sourceUrl: string | null;
  capturedAt: string;
}

export type NewsPredictionState =
  | { status: "loading" }
  | { status: "ready"; analysis: AIAnalysisDTO; demonstration?: DemonstrationDisclosure }
  | { status: "unavailable"; retryable: boolean };

const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 20_000;

export function useNewsPrediction(
  roomId: string,
  round: number,
): {
  state: NewsPredictionState;
  retry: () => void;
  canRetry: boolean;
} {
  const key = `${roomId}:${round}`;
  const [attempt, setAttempt] = useState({ key, count: 0 });
  const count = attempt.key === key ? attempt.count : 0;
  const requestKey = `${key}:${count}`;
  const [result, setResult] = useState<{ key: string; state: NewsPredictionState } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    async function load(): Promise<void> {
      let retryable = true;
      try {
        const response = await fetch("/api/news-prediction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, round }),
          signal: controller.signal,
          cache: "no-store",
        });
        retryable = response.status >= 500 || response.status === 429;
        if (!response.ok) throw new Error("Prediction unavailable");
        const data = (await response.json()) as {
          roomId: string;
          round: number;
          modelAnalysis: AIAnalysisDTO;
          demonstration?: DemonstrationDisclosure;
        };
        if (data.roomId !== roomId || data.round !== round || !data.modelAnalysis) {
          throw new Error("Unexpected round prediction");
        }
        if (active && !controller.signal.aborted) {
          setResult({
            key: requestKey,
            state: {
              status: "ready",
              analysis: data.modelAnalysis,
              demonstration: data.demonstration,
            },
          });
        }
      } catch {
        if (active) {
          setResult({ key: requestKey, state: { status: "unavailable", retryable } });
        }
      } finally {
        clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [requestKey, roomId, round]);

  const state: NewsPredictionState =
    result?.key === requestKey ? result.state : { status: "loading" };
  const canRetry = count + 1 < MAX_ATTEMPTS;
  return {
    state:
      state.status === "unavailable" ? { ...state, retryable: state.retryable && canRetry } : state,
    canRetry,
    retry: () => {
      if (canRetry && state.status !== "loading") {
        setAttempt({ key, count: count + 1 });
      }
    },
  };
}

"use client";

import { useEffect, useState } from "react";

import type { NewsInsightsResponse } from "@/lib/news-insights/types";

export type NewsInsightsState =
  | { status: "loading"; response?: never }
  | { status: "ready"; response: NewsInsightsResponse }
  | { status: "unavailable"; response?: never };

export function useNewsInsights(roomId: string, round: number): NewsInsightsState {
  const requestKey = `${roomId}:${round}`;
  const [result, setResult] = useState<{ key: string; state: NewsInsightsState } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load(): Promise<void> {
      try {
        const response = await fetch("/api/news-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, round }),
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Analysis unavailable");
        const data = (await response.json()) as NewsInsightsResponse;
        if (data.round !== round || !data.article || !data.analysis) {
          throw new Error("Unexpected analysis response");
        }
        if (active) setResult({ key: requestKey, state: { status: "ready", response: data } });
      } catch {
        if (active) setResult({ key: requestKey, state: { status: "unavailable" } });
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [requestKey, roomId, round]);

  return result?.key === requestKey ? result.state : { status: "loading" };
}

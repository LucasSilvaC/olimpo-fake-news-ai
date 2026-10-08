import { newsInsightsAnalysisSchema } from "@/lib/news-insights/schema";
import type { NewsInsightsAnalysis } from "@/lib/news-insights/types";

export interface INewsInsightsRepository {
  analyze(text: string): Promise<NewsInsightsAnalysis>;
}

export function analyzedExcerpt(text: string): string {
  return Array.from(text.normalize("NFKC").replace(/^\uFEFF+/, ""))
    .slice(0, 300)
    .join("");
}

export function unavailableAnalysis(text: string): NewsInsightsAnalysis {
  const normalized = text.normalize("NFKC").replace(/^\uFEFF+/, "");
  return {
    analysisStatus: "unavailable",
    catalogVersion: "unavailable",
    extractorVersion: "unavailable",
    analyzedText: analyzedExcerpt(text),
    characterLimit: 300,
    quality: {
      empty: normalized.trim().length === 0,
      noEligibleTokens: false,
      truncated: Array.from(normalized).length > 300,
    },
    insights: [],
  };
}

export class HttpNewsInsightsRepository implements INewsInsightsRepository {
  constructor(
    private readonly serviceUrl = process.env.NEWS_INSIGHTS_SERVICE_URL ?? "http://127.0.0.1:8010",
    private readonly fetchFn: typeof fetch = fetch,
    private readonly timeoutMs = 15_000,
  ) {}

  async analyze(text: string): Promise<NewsInsightsAnalysis> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      // Race also bounds custom fetch implementations that ignore AbortSignal.
      const deadline = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("News insights service timed out"));
        }, this.timeoutMs);
      });
      const work = async () => {
        const response = await this.fetchFn(`${this.serviceUrl.replace(/\/$/, "")}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
          cache: "no-store",
          signal: controller.signal,
        });
        const parsed = newsInsightsAnalysisSchema.parse(await response.json());
        if (
          !response.ok &&
          !(response.status === 400 && parsed.analysisStatus === "invalid_text")
        ) {
          throw new Error("News insights service failed");
        }
        if (parsed.analyzedText !== analyzedExcerpt(text)) {
          throw new Error("Service analyzed a different text");
        }
        const families = new Set<string>();
        const insights = parsed.insights.filter((insight) => {
          if (families.has(insight.redundancyFamily) || families.size >= 3) return false;
          families.add(insight.redundancyFamily);
          return true;
        });
        return {
          ...parsed,
          insights: parsed.analysisStatus === "ok" ? insights : [],
        };
      };
      return await Promise.race([work(), deadline]);
    } catch {
      return unavailableAnalysis(text);
    } finally {
      clearTimeout(timeout);
    }
  }
}

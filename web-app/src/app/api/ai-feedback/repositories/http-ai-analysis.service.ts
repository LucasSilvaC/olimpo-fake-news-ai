import type {
  AIAnalysisResult,
  IAIAnalysisService,
  SupervisedIdentity,
} from "./ai-analysis-service.interface";
import { supervisedAnalysisSchema, supervisedIdentitySchema } from "./supervised-contract";

export function unavailableSupervisedAnalysis(identity?: SupervisedIdentity): AIAnalysisResult {
  return {
    analysisStatus: "unavailable",
    classification: null,
    fakeProbability: null,
    fakeScore: null,
    scoreKind: "predicted_fake_probability",
    reasons: [],
    modelVersion: identity?.modelVersion ?? "unavailable",
    policyVersion: identity?.policyVersion ?? "olimpo-decision-policy-v1",
    artifactSha256: identity?.artifactSha256 ?? "unavailable",
    inferenceVersion: identity?.inferenceVersion ?? "unavailable",
    inputScope: { source: "article_body", wordLimit: 100, analyzedWordCount: 0, truncated: false },
  };
}
export class HttpAIAnalysisService implements IAIAnalysisService {
  constructor(
    private readonly serviceUrl = process.env.NEWS_PREDICTION_SERVICE_URL ??
      process.env.NEWS_INSIGHTS_SERVICE_URL ??
      "http://127.0.0.1:8010",
    private readonly fetchFn: typeof fetch = fetch,
    private readonly timeoutMs = Number(process.env.NEWS_PREDICTION_TIMEOUT_MS) || 15_000,
  ) {}
  private async request(path: string, text?: string): Promise<Response> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        this.fetchFn(`${this.serviceUrl.replace(/\/$/, "")}${path}`, {
          method: text === undefined ? "GET" : "POST",
          cache: "no-store",
          signal: controller.signal,
          ...(text === undefined
            ? {}
            : { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }),
        }).then(async (response) => {
          // Read the body within the deadline, including slow response streams.
          const body = await response.text();
          return new Response(body, { status: response.status });
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("Supervised service timed out"));
          }, this.timeoutMs);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  async getIdentity(): Promise<SupervisedIdentity> {
    const response = await this.request("/health/supervised");
    if (!response.ok) throw new Error("Supervised model unavailable");
    return supervisedIdentitySchema.parse(await response.json());
  }
  async analyze(text: string): Promise<AIAnalysisResult> {
    const response = await this.request("/supervised/analyze", text);
    const result = supervisedAnalysisSchema.parse(await response.json());
    if (!response.ok && !(response.status === 400 && result.analysisStatus === "invalid_text")) {
      throw new Error("Supervised inference failed");
    }
    return result;
  }
}
export const httpAIAnalysisService = new HttpAIAnalysisService();

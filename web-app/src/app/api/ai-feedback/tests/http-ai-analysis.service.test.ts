import { describe, expect, it, vi } from "vitest";

import { HttpAIAnalysisService } from "../repositories/http-ai-analysis.service";

import { prediction } from "./supervised-fixture";

describe("Real HTTP supervised adapter", () => {
  it("sends only text and validates model identity from health", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ ...prediction, status: "ok" }))
      .mockResolvedValueOnce(Response.json(prediction));
    const adapter = new HttpAIAnalysisService("http://motor:8010", fetchFn);
    expect((await adapter.getIdentity()).artifactSha256).toBe(prediction.artifactSha256);
    expect((await adapter.analyze("raw body")).fakeScore).toBe(18);
    expect(fetchFn).toHaveBeenLastCalledWith(
      "http://motor:8010/supervised/analyze",
      expect.objectContaining({ body: JSON.stringify({ text: "raw body" }), cache: "no-store" }),
    );
  });
  it("rejects contradictory score and arbitrary response fields", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ ...prediction, fakeScore: 99 }));
    await expect(
      new HttpAIAnalysisService("http://motor", fetchFn).analyze("body"),
    ).rejects.toThrow();
  });
  it("aborts an unavailable worker and bounds fetch ignoring abort", async () => {
    let signal: AbortSignal | null | undefined;
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      signal = init?.signal;
      return await new Promise<Response>(() => {});
    });
    await expect(
      new HttpAIAnalysisService("http://motor", fetchFn, 10).analyze("body"),
    ).rejects.toThrow("timed out");
    expect(signal?.aborted).toBe(true);
  });
  it("accepts explicit invalid text HTTP400 with null score", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          ...prediction,
          analysisStatus: "invalid_text",
          classification: null,
          fakeProbability: null,
          fakeScore: null,
        },
        { status: 400 },
      ),
    );
    expect(
      (await new HttpAIAnalysisService("http://motor", fetchFn).analyze("")).fakeScore,
    ).toBeNull();
  });
});

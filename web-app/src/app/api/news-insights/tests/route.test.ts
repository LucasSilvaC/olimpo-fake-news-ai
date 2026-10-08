// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { unavailableAnalysis } from "../repositories/news-insights.repository";
import { createNewsInsightsResponse } from "../response";
import { NewsInsightsAccessError } from "../usecase/get-news-insights.usecase";

import type { NewsInsightsResponse } from "@/lib/news-insights/types";

vi.mock("@/app/api/auth/usecase/get-session.usecase", () => ({
  getSessionUseCase: {
    execute: vi.fn(async () => {
      throw new Error("missing session");
    }),
  },
}));

function request(body: unknown = { roomId: "room-1", round: 1 }) {
  return new Request("http://localhost/api/news-insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST news insights", () => {
  it("requires a valid session", async () => {
    const execute = vi.fn();
    const response = await createNewsInsightsResponse(request(), { useCase: { execute } });
    expect(response.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and client URL or text", async () => {
    const getUserId = vi.fn(async () => "user-1");
    const execute = vi.fn();
    for (const body of [
      { roomId: "room-1", round: 1, url: "https://example.org" },
      { roomId: "room-1", round: 1, text: "forged" },
    ]) {
      expect(
        (await createNewsInsightsResponse(request(body), { getUserId, useCase: { execute } }))
          .status,
      ).toBe(400);
    }
    const malformed = new Request("http://localhost/api/news-insights", {
      method: "POST",
      body: "not JSON",
    });
    expect(
      (await createNewsInsightsResponse(malformed, { getUserId, useCase: { execute } })).status,
    ).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([403, 404, 409] as const)(
    "preserves authorization or round status %s",
    async (status) => {
      const execute = vi.fn(async () => {
        throw new NewsInsightsAccessError(status, "indisponível");
      });
      const response = await createNewsInsightsResponse(request(), {
        getUserId: async () => "user-1",
        useCase: { execute },
      });
      expect(response.status).toBe(status);
      expect(response.headers.get("cache-control")).toBe("no-store");
    },
  );

  it("returns a usable article and unavailable analysis with a successful response", async () => {
    const result: NewsInsightsResponse = {
      round: 1,
      playlistItemId: "playlist-1",
      article: {
        title: "Notícia",
        description: null,
        publisher: null,
        authors: [],
        publishedAt: null,
        imageUrl: null,
        url: "https://example.org",
        content: "Corpo",
      },
      analysis: unavailableAnalysis("Corpo"),
    };
    const execute = vi.fn(async () => result);
    const response = await createNewsInsightsResponse(request(), {
      getUserId: async () => "user-1",
      useCase: { execute },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(execute).toHaveBeenCalledWith({ roomId: "room-1", round: 1, userId: "user-1" });
  });
});

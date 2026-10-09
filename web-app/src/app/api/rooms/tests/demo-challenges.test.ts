// @vitest-environment node
import { createHash } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import { prediction } from "../../ai-feedback/tests/supervised-fixture";
import { GetNewsInsightsUseCase } from "../../news-insights/usecase/get-news-insights.usecase";
import { GetNewsPredictionUseCase } from "../../news-prediction/usecase/get-news-prediction.usecase";
import { LoadDemoNewsUseCase } from "../usecase/load-demo-news.usecase";

import { getDemoNewsFixture } from "@/server/demo/demo-news";
import { verifyDemoArticle } from "@/server/demo/replay";
import { databaseClient } from "@/server/shared/database/client";
import type { NewsArticle, Room } from "@/server/shared/database/schemas";
import { newsArticles, rooms, roomPlaylistItems } from "@/server/shared/database/schemas";

vi.mock("@/server/demo/demo-news", () => ({ getDemoNewsFixture: vi.fn() }));

function setup() {
  const article = {
    content: "Corpo preparado.",
    title: "Título",
    description: null,
    publisher: "Redação",
    authors: [],
    publishedAt: null,
    modifiedAt: null,
    imageUrl: "/image.webp",
    url: "https://example.test/news",
    canonicalUrl: null,
    language: "pt",
    extractionMethod: "local",
    usedFallback: false,
  } as NewsArticle["article"];
  const fixture = {
    id: "09c55b3f-abaf-4d44-9cca-1352159d8cc9",
    article,
    targetClassification: "unreliable" as const,
    prediction,
    insights: {
      analysisStatus: "no_match" as const,
      catalogVersion: "v1",
      extractorVersion: "v1",
      analyzedText: article.content,
      characterLimit: 300,
      quality: { empty: false, noEligibleTokens: false, truncated: false },
      insights: [],
    },
    explanation: "Ficção do exercício.",
    sourceUrl: null,
    capturedAt: "2026-10-08T00:00:00Z",
    bodySha256: createHash("sha256").update(article.content).digest("hex"),
  };
  vi.mocked(getDemoNewsFixture).mockImplementation((id) =>
    id === fixture.id ? fixture : undefined,
  );
  const saved = {
    id: fixture.id,
    article,
    targetClassification: fixture.targetClassification,
    createdAt: new Date(),
  };
  const room = {
    id: "room",
    hostId: "host",
    status: "in_progress",
    currentRound: 1,
    totalRounds: 1,
  } as Room;
  const rooms = {
    findById: vi.fn().mockResolvedValue(room),
    findMember: vi.fn().mockResolvedValue({ userId: "member" }),
    getPlaylistItems: vi
      .fn()
      .mockResolvedValue([{ id: "item", roomId: "room", articleId: fixture.id, roundOrder: 1 }]),
  };
  const articles = { findById: vi.fn().mockResolvedValue(saved) };
  const rounds = { isRoundCompleted: vi.fn().mockResolvedValue(false) };
  const model = { execute: vi.fn().mockRejectedValue(new Error("AI offline")) };
  const insights = { analyze: vi.fn().mockRejectedValue(new Error("AI offline")) };
  const parser = vi.fn().mockRejectedValue(new Error("Website offline"));
  const predictionUseCase = new GetNewsPredictionUseCase(rooms, rounds, model, articles);
  const insightsUseCase = new GetNewsInsightsUseCase(rooms, articles, insights, parser, rounds);
  return {
    fixture,
    saved,
    room,
    rooms,
    articles,
    rounds,
    model,
    insights,
    parser,
    predictionUseCase,
    insightsUseCase,
  };
}
const input = { roomId: "room", round: 1, userId: "member" };

describe("prepared challenge replay", () => {
  it("returns hints during voting without answers, prediction or explanation and without network inference", async () => {
    const f = setup();
    const result = await f.insightsUseCase.execute(input);
    expect(result.analysis).toEqual(f.fixture.insights);
    expect(result.article.content).toBe(f.fixture.article.content);
    for (const secret of ["targetClassification", "prediction", "explanation", "bodySha256"])
      expect(JSON.stringify(result)).not.toContain(secret);
    expect(f.insights.analyze).not.toHaveBeenCalled();
    expect(f.parser).not.toHaveBeenCalled();
  });
  it("keeps the saved prediction locked until collective closure and membership checks pass", async () => {
    const f = setup();
    await expect(f.predictionUseCase.execute(input)).rejects.toMatchObject({ status: 409 });
    expect(f.articles.findById).not.toHaveBeenCalled();
    f.rounds.isRoundCompleted.mockResolvedValue(true);
    f.rooms.findMember.mockResolvedValue(null);
    await expect(f.predictionUseCase.execute(input)).rejects.toMatchObject({ status: 403 });
  });
  it("reveals the saved real model result and educational explanation after closure while AI is offline", async () => {
    const f = setup();
    f.rounds.isRoundCompleted.mockResolvedValue(true);
    const result = await f.predictionUseCase.execute(input);
    expect(result.modelAnalysis).toMatchObject(f.fixture.prediction);
    expect(result.demonstration?.explanation).toBe(f.fixture.explanation);
    expect(f.model.execute).not.toHaveBeenCalled();
  });
  it("rejects mismatched stored text instead of replaying stale analyses", async () => {
    const f = setup();
    f.saved.article = { ...f.saved.article, content: "Texto alterado." };
    expect(() => verifyDemoArticle(f.saved)).toThrow(/conteúdo preparado mudou/);
    await expect(f.insightsUseCase.execute(input)).rejects.toThrow(/conteúdo preparado mudou/);
    expect(f.insights.analyze).not.toHaveBeenCalled();
  });
});

describe("prepared challenge loader authorization", () => {
  afterEach(() => vi.unstubAllEnvs());
  function loader(room: object | undefined) {
    const insert = vi.fn();
    const tx = {
      select: () => ({
        from: () => ({ where: () => ({ for: async () => (room ? [room] : []) }) }),
      }),
      insert,
    };
    const db = { transaction: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => work(tx)) };
    return { useCase: new LoadDemoNewsUseCase(db as unknown as typeof databaseClient), db, insert };
  }
  it.each([
    [undefined, /Sala não encontrada/],
    [{ id: "room", hostId: "another", status: "waiting" }, /Somente o anfitrião/],
    [{ id: "room", hostId: "host", status: "in_progress" }, /partida já começou/],
    [{ id: "room", hostId: "host", status: "finished" }, /partida já começou/],
  ])("rejects unauthorized room state before any writes", async (room, message) => {
    const f = setup();
    const l = loader(room);
    await expect(
      l.useCase.execute({ roomId: "room", hostId: "host", fixtureIds: [f.fixture.id] }),
    ).rejects.toThrow(message);
    expect(l.insert).not.toHaveBeenCalled();
  });
  it("respects the environment gate and rejects unknown IDs before opening a transaction", async () => {
    const f = setup();
    const l = loader(undefined);
    vi.stubEnv("DEMO_CHALLENGES_ENABLED", "false");
    await expect(
      l.useCase.execute({ roomId: "room", hostId: "host", fixtureIds: [f.fixture.id] }),
    ).rejects.toThrow(/desativados/);
    vi.stubEnv("DEMO_CHALLENGES_ENABLED", "true");
    await expect(
      l.useCase.execute({ roomId: "room", hostId: "host", fixtureIds: ["unknown"] }),
    ).rejects.toThrow(/não encontrado/);
    expect(l.db.transaction).not.toHaveBeenCalled();
  });

  it("loads from local records and a retry keeps the same playlist and total rounds", async () => {
    const f = setup();
    const playlist: Array<{ id: string; roomId: string; articleId: string; roundOrder: number }> =
      [];
    const waitingRoom = { ...f.room, status: "waiting", totalRounds: 0 };
    const insertedArticleIds: string[] = [];
    const tx = {
      select: () => ({
        from: (table: unknown) => ({
          where: () => {
            if (table === rooms) return { for: async () => [waitingRoom] };
            if (table === roomPlaylistItems) return { orderBy: async () => [...playlist] };
            return Promise.resolve([f.saved]);
          },
        }),
      }),
      insert: (table: unknown) => ({
        values: (record: (typeof playlist)[number] & { id: string }) => {
          if (table === newsArticles)
            return { onConflictDoNothing: async () => insertedArticleIds.push(record.id) };
          return {
            returning: async () => {
              playlist.push(record);
              return [record];
            },
          };
        },
      }),
      update: () => ({
        set: (values: { totalRounds: number }) => ({
          where: async () => {
            waitingRoom.totalRounds = values.totalRounds;
          },
        }),
      }),
    };
    const db = { transaction: async (work: (tx: unknown) => Promise<unknown>) => work(tx) };
    const useCase = new LoadDemoNewsUseCase(db as unknown as typeof databaseClient);
    const load = { roomId: "room", hostId: "host", fixtureIds: [f.fixture.id, f.fixture.id] };
    const initial = await useCase.execute(load);
    const retry = await useCase.execute(load);
    expect(initial.totalRounds).toBe(1);
    expect(retry).toEqual(initial);
    expect(playlist).toHaveLength(1);
    expect(waitingRoom.totalRounds).toBe(1);
    expect(insertedArticleIds).toEqual([f.fixture.id, f.fixture.id]);
  });
});

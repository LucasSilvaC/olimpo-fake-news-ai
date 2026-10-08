// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import {
  HttpNewsInsightsRepository,
  analyzedExcerpt,
  unavailableAnalysis,
} from "../repositories/news-insights.repository";
import { GetNewsInsightsUseCase } from "../usecase/get-news-insights.usecase";

import type { INewsArticle } from "@/lib/news/types";
import { newsInsightsRequestSchema } from "@/lib/news-insights/schema";
import type { NewsInsightsAnalysis } from "@/lib/news-insights/types";
import type {
  Room,
  RoomMember,
  RoomPlaylistItem,
  NewsArticle,
} from "@/server/shared/database/schemas";

const article: INewsArticle = {
  url: "https://example.org/noticia",
  canonicalUrl: null,
  title: "Título não deve ser analisado",
  description: null,
  authors: [],
  publishedAt: null,
  modifiedAt: null,
  content: "  Corpo preservado exatamente, incluindo espaços.  ",
  imageUrl: null,
  publisher: null,
  language: "pt",
  extractionMethod: "local",
  usedFallback: false,
};
const room: Room = {
  id: "room-1",
  pin: "123456",
  name: "Sala",
  hostId: "host-1",
  status: "in_progress",
  currentRound: 2,
  totalRounds: 3,
  roundDurationSeconds: 60,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const member: RoomMember = {
  id: "member-1",
  roomId: room.id,
  userId: "user-1",
  role: "participant",
  score: 0,
  joinedAt: new Date(),
};
const item: RoomPlaylistItem = {
  id: "playlist-2",
  roomId: room.id,
  articleId: "article-1",
  roundOrder: 2,
  createdAt: new Date(),
};

function setup() {
  const rooms = {
    findById: vi.fn(async (): Promise<Room | null> => ({ ...room })),
    findMember: vi.fn(async (): Promise<RoomMember | null> => member),
    getPlaylistItems: vi.fn(async () => [{ ...item }]),
  };
  const articles = {
    findById: vi.fn(async (): Promise<NewsArticle | null> => ({
      id: item.articleId,
      article: { ...article },
      targetClassification: "unreliable",
      createdAt: new Date(),
    })),
  };
  const insights = { analyze: vi.fn(async (text: string) => unavailableAnalysis(text)) };
  const parser = vi.fn(async () => ({
    ...article,
    title: "Título extraído",
    content: "Corpo extraído.",
  }));
  const rounds = { isRoundCompleted: vi.fn(async () => false) };
  const useCase = new GetNewsInsightsUseCase(rooms, articles, insights, parser, rounds);
  return { rooms, articles, insights, parser, rounds, useCase };
}
const input = { roomId: room.id, round: 2, userId: member.userId };

describe("news insights authorization and article resolution", () => {
  it("requires membership before resolving or analyzing any article", async () => {
    const deps = setup();
    deps.rooms.findMember.mockResolvedValue(null);
    await expect(deps.useCase.execute(input)).rejects.toMatchObject({ status: 403 });
    expect(deps.rooms.getPlaylistItems).not.toHaveBeenCalled();
    expect(deps.insights.analyze).not.toHaveBeenCalled();
  });

  it.each([0, 1, 3, 4])("rejects unavailable round %s", async (round) => {
    const deps = setup();
    await expect(deps.useCase.execute({ ...input, round })).rejects.toMatchObject({ status: 409 });
    expect(deps.insights.analyze).not.toHaveBeenCalled();
  });

  it("allows a previous completed round only when it belongs to this room", async () => {
    const deps = setup();
    deps.rounds.isRoundCompleted.mockResolvedValue(true);
    deps.rooms.getPlaylistItems.mockResolvedValue([{ ...item, roundOrder: 1 }]);
    const result = await deps.useCase.execute({ ...input, round: 1 });
    expect(result.round).toBe(1);
    expect(deps.rounds.isRoundCompleted).toHaveBeenCalledWith(room.id, 1);
    deps.rooms.getPlaylistItems.mockResolvedValue([
      { ...item, roundOrder: 1, roomId: "other-room" },
    ]);
    await expect(deps.useCase.execute({ ...input, round: 1 })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("rejects waiting rooms and permits completed games", async () => {
    const deps = setup();
    deps.rooms.findById.mockResolvedValue({ ...room, status: "waiting" });
    await expect(deps.useCase.execute(input)).rejects.toMatchObject({ status: 409 });
    deps.rooms.findById.mockResolvedValue({ ...room, status: "finished" });
    expect((await deps.useCase.execute(input)).round).toBe(2);
  });

  it("uses the exact saved body, keeps title separate, and omits target classification", async () => {
    const deps = setup();
    const result = await deps.useCase.execute(input);
    expect(deps.insights.analyze).toHaveBeenCalledWith(article.content);
    expect(deps.parser).not.toHaveBeenCalled();
    expect(result.article.content).toBe(article.content);
    expect(JSON.stringify(result)).not.toContain("targetClassification");
  });

  it("parses an empty body using the server-owned URL and returns the body even if the model fails", async () => {
    const deps = setup();
    deps.articles.findById.mockResolvedValue({
      id: item.articleId,
      article: { ...article, content: " " },
      targetClassification: "unreliable",
      createdAt: new Date(),
    });
    deps.insights.analyze.mockRejectedValue(new Error("model offline"));
    const result = await deps.useCase.execute(input);
    expect(deps.parser).toHaveBeenCalledWith(article.url);
    expect(deps.insights.analyze).toHaveBeenCalledWith("Corpo extraído.");
    expect(result.article.title).toBe("Título extraído");
    expect(result.article.content).toBe("Corpo extraído.");
    expect(result.analysis.analysisStatus).toBe("unavailable");
  });

  it("keeps the saved article available when parsing fails", async () => {
    const deps = setup();
    deps.articles.findById.mockResolvedValue({
      id: item.articleId,
      article: { ...article, content: "" },
      targetClassification: "unreliable",
      createdAt: new Date(),
    });
    deps.parser.mockRejectedValue(new Error("parser unavailable"));
    expect((await deps.useCase.execute(input)).article.content).toBe("");
  });

  it("rejects client-provided text, URL, classifications, and invalid rounds", () => {
    expect(newsInsightsRequestSchema.safeParse({ roomId: room.id, round: 2 }).success).toBe(true);
    for (const extra of [
      { text: "forged" },
      { url: "https://attacker.org" },
      { classification: "fake" },
    ]) {
      expect(
        newsInsightsRequestSchema.safeParse({ roomId: room.id, round: 2, ...extra }).success,
      ).toBe(false);
    }
    expect(newsInsightsRequestSchema.safeParse({ roomId: room.id, round: 1.5 }).success).toBe(
      false,
    );
  });
});

function serviceAnalysis(text: string): NewsInsightsAnalysis {
  return {
    ...unavailableAnalysis(text),
    analysisStatus: "ok",
    catalogVersion: "catalog-1",
    extractorVersion: "extractor-1",
    insights: [
      {
        patternId: "pattern-1",
        observationTitle: "Verbos",
        observation: "Há verbos no trecho.",
        reflectionQuestions: ["Quem realizou a ação?"],
        redundancyFamily: "verbs",
        comparison: {
          kind: "descriptive_corpus_frequency",
          referenceDataset: "Fake.br-Corpus",
          partition: "validation",
          authorScope: "all",
          sourceRun: "reference-run",
          variant: "sintaxe_ampliada",
          scope: "matched_pattern",
          fake: { count: 288, total: 720, frequency: 0.4 },
          true: { count: 252, total: 720, frequency: 0.35 },
        },
        measurements: [
          {
            feature: "verbs",
            label: "Verbos",
            value: 0.1,
            operator: "<=",
            threshold: 0.2,
            denominator: "tokens",
            displayLabel: "Uso de verbos",
            displayText: "Neste trecho, 1 de 10 palavras é um verbo.",
          },
        ],
      },
    ],
  };
}

describe("news insights HTTP service", () => {
  it("posts only the article body and removes forbidden and unknown fields at every level", async () => {
    const data = serviceAnalysis(article.content);
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        ...data,
        classification: "fake",
        confidence: 0.99,
        classes: ["Fake"],
        classComparison: { Fake: 90 },
        insights: data.insights.map((insight) => ({
          ...insight,
          classComparison: { Fake: 90 },
          comparison: {
            ...insight.comparison,
            classification: "fake",
            confidence: 0.99,
            fake: {
              ...insight.comparison.fake,
              composition: 0.9,
              confidence: 0.99,
              fakePercent: 90,
            },
          },
          measurements: insight.measurements.map((m) => ({ ...m, confidence: 0.99 })),
        })),
      }),
    );
    const repository = new HttpNewsInsightsRepository("http://model:8010/", fetchFn);
    const result = await repository.analyze(article.content);
    expect(result).toEqual(data);
    expect(fetchFn).toHaveBeenCalledWith(
      "http://model:8010/analyze",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: article.content }),
        cache: "no-store",
      }),
    );
  });

  it("preserves within-class frequencies and provenance without treating them as probabilities", async () => {
    const data = serviceAnalysis(article.content);
    data.insights[0]!.reflectionQuestions = [];
    const repository = new HttpNewsInsightsRepository(
      "http://model",
      vi.fn<typeof fetch>().mockResolvedValue(Response.json(data)),
    );
    const result = await repository.analyze(article.content);
    expect(result.insights[0]!.comparison).toEqual(data.insights[0]!.comparison);
    expect(result.insights[0]!.measurements[0]!.displayText).toBe(
      "Neste trecho, 1 de 10 palavras é um verbo.",
    );
    // Each class has its own denominator; these frequencies need not sum to one.
    expect(result.insights[0]!.comparison.fake.frequency).toBe(0.4);
    expect(result.insights[0]!.comparison.true.frequency).toBe(0.35);
    expect(result.insights[0]!.reflectionQuestions).toEqual([]);
  });

  it.each([
    { count: -1, total: 720, frequency: 0.4 },
    { count: 288.5, total: 720, frequency: 0.4 },
    { count: 288, total: 0, frequency: 0.4 },
    { count: 721, total: 720, frequency: 1 },
    { count: 288, total: 720, frequency: 40 },
    { count: 288, total: 720, frequency: -0.4 },
    { count: 288, total: 720, frequency: 0.9 },
    { count: 288, total: Number.MAX_SAFE_INTEGER + 1, frequency: 0.4 },
  ])("rejects invalid reference class statistics %j", async (invalidFrequency) => {
    for (const referenceClass of ["fake", "true"] as const) {
      const data = serviceAnalysis(article.content);
      data.insights[0]!.comparison[referenceClass] = invalidFrequency;
      const repository = new HttpNewsInsightsRepository(
        "http://model",
        vi.fn<typeof fetch>().mockResolvedValue(Response.json(data)),
      );
      expect(await repository.analyze(article.content)).toEqual(
        unavailableAnalysis(article.content),
      );
    }
  });

  it.each([
    { partition: "train" },
    { scope: "individual_feature" },
    { kind: "classification_probability" },
    { referenceDataset: "" },
    { sourceRun: "" },
  ])("rejects comparisons with ambiguous or unsupported provenance %j", async (override) => {
    const data = serviceAnalysis(article.content);
    const repository = new HttpNewsInsightsRepository(
      "http://model",
      vi.fn<typeof fetch>().mockResolvedValue(
        Response.json({
          ...data,
          insights: data.insights.map((insight) => ({
            ...insight,
            comparison: { ...insight.comparison, ...override },
          })),
        }),
      ),
    );
    expect(await repository.analyze(article.content)).toEqual(unavailableAnalysis(article.content));
  });

  it("requires both class references and rejects non-finite frequencies", async () => {
    for (const comparison of [
      undefined,
      { ...serviceAnalysis(article.content).insights[0]!.comparison, true: undefined },
      {
        ...serviceAnalysis(article.content).insights[0]!.comparison,
        fake: { count: 288, total: 720, frequency: Infinity },
      },
    ]) {
      const data = serviceAnalysis(article.content);
      const repository = new HttpNewsInsightsRepository(
        "http://model",
        vi.fn<typeof fetch>().mockResolvedValue(
          Response.json({
            ...data,
            insights: data.insights.map((insight) => ({ ...insight, comparison })),
          }),
        ),
      );
      expect(await repository.analyze(article.content)).toEqual(
        unavailableAnalysis(article.content),
      );
    }
  });

  it("returns at most three distinct observation families", async () => {
    const data = serviceAnalysis(article.content);
    data.insights = ["verbs", "verbs", "syntax", "nouns", "clauses"].map((family, index) => ({
      ...data.insights[0]!,
      patternId: `pattern-${index}`,
      redundancyFamily: family,
    }));
    const repository = new HttpNewsInsightsRepository(
      "http://model",
      vi.fn<typeof fetch>().mockResolvedValue(Response.json(data)),
    );
    expect(
      (await repository.analyze(article.content)).insights.map((i) => i.redundancyFamily),
    ).toEqual(["verbs", "syntax", "nouns"]);
  });

  it.each([
    new Response("service error", { status: 500 }),
    Response.json({ classification: "fake" }),
    Response.json({ ...serviceAnalysis(article.content), analyzedText: "different body" }),
  ])("degrades service errors and invalid responses to unavailable", async (response) => {
    const repository = new HttpNewsInsightsRepository(
      "http://model",
      vi.fn<typeof fetch>().mockResolvedValue(response),
    );
    expect(await repository.analyze(article.content)).toEqual(unavailableAnalysis(article.content));
  });

  it("bounds timeouts even if the fetch implementation ignores abort", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => {}));
    const repository = new HttpNewsInsightsRepository("http://model", fetchFn, 5);
    expect((await repository.analyze(article.content)).analysisStatus).toBe("unavailable");
    expect((fetchFn.mock.calls[0]?.[1]?.signal as AbortSignal).aborted).toBe(true);
  });

  it("normalizes Unicode and truncates by code points like the Python extractor", () => {
    expect(analyzedExcerpt("\uFEFF\uFEFF\uFF21" + "\u{1F600}".repeat(301))).toBe(
      "A" + "\u{1F600}".repeat(299),
    );
  });

  it("preserves the service's invalid_text result on a validated 400 response", async () => {
    const data = { ...unavailableAnalysis(""), analysisStatus: "invalid_text" as const };
    const repository = new HttpNewsInsightsRepository(
      "http://model",
      vi.fn<typeof fetch>().mockResolvedValue(Response.json(data, { status: 400 })),
    );
    expect((await repository.analyze("")).analysisStatus).toBe("invalid_text");
  });
});

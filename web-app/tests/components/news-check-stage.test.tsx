import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsInsightsResponse } from "@/lib/news-insights/types";
import { NewsCheckStage } from "@/views/room-game/ui/news-check-stage";

const mocks = vi.hoisted(() => ({ submitVote: vi.fn(), fetch: vi.fn() }));
vi.mock("@/app/api/news-voting/actions/submit-vote.action", () => ({
  submitVoteAction: mocks.submitVote,
}));

function responseFor(round = 1): NewsInsightsResponse {
  return {
    round,
    playlistItemId: `playlist-${round}`,
    article: {
      title: `Notícia extraída ${round}`,
      description: "Descrição extraída da publicação.",
      publisher: "Fonte original",
      authors: ["Autora"],
      publishedAt: null,
      imageUrl: null,
      url: "https://example.com/news",
      content: "Este é o trecho normalizado analisado. E este é o restante do corpo.",
    },
    analysis: {
      analysisStatus: "ok",
      catalogVersion: "catalog-test",
      extractorVersion: "extractor-test",
      analyzedText: "Este é o trecho normalizado analisado.",
      characterLimit: 300,
      quality: { empty: false, noEligibleTokens: false, truncated: true },
      insights: [
        {
          patternId: "pattern-1",
          observationTitle: "Estrutura das frases",
          observation: "O trecho reúne formas de conectar as frases.",
          reflectionQuestions: [
            "Como essas conexões ajudam a explicar a afirmação?",
            "Qual fonte permitiria conferir essa afirmação?",
            "Esta terceira pergunta não deve aparecer no cartão.",
          ],
          redundancyFamily: "structure",
          measurements: [
            {
              feature: "test_feature",
              label: "Conexões",
              value: 0.12,
              operator: ">=",
              threshold: 0.1,
              denominator: "tokens_lexical",
              count: 3,
              denominatorCount: 25,
            },
          ],
        },
      ],
    },
  };
}

function httpResponse(data: NewsInsightsResponse): Response {
  return new Response(JSON.stringify(data), { status: 200 });
}

const baseProps = {
  roomId: "room-test",
  currentRound: 1,
  totalRounds: 3,
  article: {
    id: "same-article",
    title: "Título inicial",
    description: "Resumo inicial",
    publisher: "Fonte",
    url: "https://example.com/news",
  },
  timeRemainingSeconds: 20,
  onVoteSubmitted: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal("fetch", mocks.fetch);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("investigação socrática durante a rodada", () => {
  it("requests the authoritative round article and keeps voting enabled during extraction", () => {
    mocks.fetch.mockReturnValue(new Promise(() => {}));
    render(<NewsCheckStage {...baseProps} />);
    expect(screen.getByRole("status")).toHaveTextContent("Extraindo o corpo da notícia");
    expect(
      screen.getByRole("button", { name: "Classificar notícia como Verdadeira" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("region", { name: "Perguntas gerais de leitura crítica" }),
    ).toBeVisible();
    expect(mocks.fetch).toHaveBeenCalledWith(
      "/api/news-insights",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ roomId: "room-test", round: 1 }),
        signal: expect.any(AbortSignal),
      }),
    );
    expect(document.body.textContent).not.toMatch(/78%|chances|alarmistas|indignação|medo/);
  });

  it("shows measured observations, the exact analyzed snippet and the extracted full body", async () => {
    mocks.fetch.mockResolvedValue(httpResponse(responseFor()));
    render(<NewsCheckStage {...baseProps} />);
    expect(await screen.findByRole("heading", { name: "Notícia extraída 1" })).toBeVisible();
    expect(screen.getByText("Como essas conexões ajudam a explicar a afirmação?")).toBeVisible();
    expect(screen.getByText("Qual fonte permitiria conferir essa afirmação?")).toBeVisible();
    expect(screen.queryByText("Esta terceira pergunta não deve aparecer no cartão.")).toBeNull();
    expect(
      screen.queryByRole("region", { name: "Perguntas gerais de leitura crítica" }),
    ).toBeNull();
    fireEvent.click(screen.getByText("Ver o trecho analisado e as medições"));
    expect(screen.getByText("Este é o trecho normalizado analisado.")).toBeVisible();
    expect(screen.getByText(/3 de 25/)).toBeVisible();
    expect(screen.getByText(/palavras e outros tokens sem pontuação/)).toBeVisible();
    expect(document.body.textContent).not.toContain("tokens_lexical");
    fireEvent.click(screen.getByText("Ler o corpo da notícia"));
    expect(screen.getByText(responseFor().article.content)).toBeVisible();
    expect(document.body.textContent).not.toMatch(/\d+%|confiança|probabilidade|78/);
  });

  it.each([
    ["tokens_nonspace", "tokens sem espaços"],
    ["regex_words", "palavras identificadas no trecho"],
  ])("explains the %s measurement base in readable language", async (denominator, label) => {
    const data = responseFor();
    data.analysis.insights[0]!.measurements[0]!.denominator = denominator!;
    mocks.fetch.mockResolvedValue(httpResponse(data));
    render(<NewsCheckStage {...baseProps} />);
    await screen.findByRole("heading", { name: "Notícia extraída 1" });
    fireEvent.click(screen.getByText("Ver o trecho analisado e as medições"));
    expect(screen.getByText(new RegExp(label!))).toBeVisible();
    expect(document.body.textContent).not.toContain(denominator);
  });

  it.each(["no_match", "invalid_text", "unavailable"] as const)(
    "keeps %s distinct from measured observations and leaves voting enabled",
    async (analysisStatus) => {
      const data = responseFor();
      data.analysis.analysisStatus = analysisStatus;
      data.analysis.insights = [];
      mocks.fetch.mockResolvedValue(httpResponse(data));
      render(<NewsCheckStage {...baseProps} />);
      await screen.findByRole("heading", { name: "Notícia extraída 1" });
      expect(screen.queryByText("Estrutura das frases")).toBeNull();
      expect(
        screen.getByRole("region", { name: "Perguntas gerais de leitura crítica" }),
      ).toBeVisible();
      expect(screen.getByText(/não são observações medidas pelo modelo/)).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Classificar notícia como Incerta" }),
      ).toBeEnabled();
    },
  );

  it("allows a vote after a network failure", async () => {
    mocks.fetch.mockRejectedValue(new Error("Network failed"));
    mocks.submitVote.mockResolvedValue({ success: false, error: "Tente novamente" });
    render(<NewsCheckStage {...baseProps} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("indisponíveis"));
    fireEvent.click(screen.getByRole("button", { name: "Classificar notícia como Incerta" }));
    expect(mocks.submitVote).toHaveBeenCalledWith({
      roomId: "room-test",
      vote: "uncertain",
      isTimeout: false,
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Classificar notícia como Incerta" }),
      ).toBeEnabled(),
    );
  });

  it("aborts old requests and ignores stale responses when the round changes with the same article id", async () => {
    let completeFirst!: (response: Response) => void;
    mocks.fetch
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          completeFirst = resolve;
        }),
      )
      .mockResolvedValueOnce(httpResponse(responseFor(2)));
    const { rerender, unmount } = render(<NewsCheckStage {...baseProps} />);
    const firstSignal = mocks.fetch.mock.calls[0]![1].signal as AbortSignal;
    rerender(<NewsCheckStage {...baseProps} currentRound={2} />);
    expect(firstSignal.aborted).toBe(true);
    expect(await screen.findByRole("heading", { name: "Notícia extraída 2" })).toBeVisible();
    await act(async () => {
      completeFirst(httpResponse(responseFor(1)));
    });
    expect(screen.queryByRole("heading", { name: "Notícia extraída 1" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Notícia extraída 2" })).toBeVisible();
    const secondSignal = mocks.fetch.mock.calls[1]![1].signal as AbortSignal;
    unmount();
    expect(secondSignal.aborted).toBe(true);
  });

  it("rejects results for a different round", async () => {
    mocks.fetch.mockResolvedValue(httpResponse(responseFor(2)));
    render(<NewsCheckStage {...baseProps} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("indisponíveis"));
    expect(screen.queryByRole("heading", { name: "Notícia extraída 2" })).toBeNull();
  });

  it("resets voting on a new round and discards completion of an old vote", async () => {
    let completeVote!: (result: unknown) => void;
    mocks.fetch.mockResolvedValue(httpResponse(responseFor()));
    mocks.submitVote.mockReturnValue(
      new Promise((resolve) => {
        completeVote = resolve;
      }),
    );
    const { rerender } = render(<NewsCheckStage {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Classificar notícia como Verdadeira" }));
    expect(
      screen.getByRole("button", { name: "Classificar notícia como Verdadeira" }),
    ).toBeDisabled();
    rerender(<NewsCheckStage {...baseProps} currentRound={2} />);
    expect(
      screen.getByRole("button", { name: "Classificar notícia como Verdadeira" }),
    ).toBeEnabled();
    await act(async () => {
      completeVote({ success: true, vote: { pointsAwarded: 100, isCorrect: true } });
    });
    expect(baseProps.onVoteSubmitted).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("indisponíveis"));
  });
});

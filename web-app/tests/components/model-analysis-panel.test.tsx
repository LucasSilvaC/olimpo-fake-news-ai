import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModelAnalysisPanel } from "@/views/room-game/ui/model-analysis-panel";

const mockFetch = vi.fn();
function responseFor(round = 1, overrides: Record<string, unknown> = {}): Response {
  return new Response(
    JSON.stringify({
      roomId: "room-1",
      round,
      modelAnalysis: {
        id: "analysis-1",
        articleId: "article-1",
        createdAt: "2026-10-08T12:00:00Z",
        analysisStatus: "ok",
        classification: "unreliable",
        fakeProbability: 0.8,
        fakeScore: 80,
        scoreKind: "predicted_fake_probability",
        reasons: ["Um termo contribuiu para a estimativa."],
        modelVersion: "model-test",
        policyVersion: "policy-test",
        artifactSha256: "a".repeat(64),
        inferenceVersion: "inference-test",
        inputScope: {
          source: "article_body",
          wordLimit: 100,
          analyzedWordCount: 100,
          truncated: true,
        },
        ...overrides,
      },
    }),
    { status: 200 },
  );
}

beforeEach(() => vi.stubGlobal("fetch", mockFetch));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("Análise do modelo após o encerramento", () => {
  it("loads through the authenticated web route and labels the fake score direction", async () => {
    mockFetch.mockResolvedValue(responseFor());
    render(<ModelAnalysisPanel roomId="room-1" round={1} />);
    expect(screen.getByRole("status")).toHaveTextContent("Analisando o texto");
    expect(await screen.findByText("Estimada como falsa")).toBeVisible();
    expect(screen.getByRole("meter")).toHaveAttribute("value", "80");
    expect(screen.getByText(/Quanto maior o score, maior a estimativa de falsidade/)).toBeVisible();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/news-prediction",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ roomId: "room-1", round: 1 }),
        signal: expect.any(AbortSignal),
      }),
    );
    expect(screen.getByText(/resultado do jogo segue o gabarito cadastrado/)).toBeVisible();
    fireEvent.click(screen.getByText("Preparo, versões e limitações"));
    expect(screen.getByText("model-test")).toBeVisible();
    expect(
      screen.getByText(/não consulta fontes externas nem confirma acontecimentos/),
    ).toBeVisible();
    expect(document.body.textContent).not.toMatch(/Autenticidade|100% de confiança|85/);
  });

  it("explains an intermediate prediction without changing the score meaning", async () => {
    mockFetch.mockResolvedValue(
      responseFor(1, { classification: "uncertain", fakeProbability: 0.5, fakeScore: 50 }),
    );
    render(<ModelAnalysisPanel roomId="room-1" round={1} />);
    expect(await screen.findByText("Previsão inconclusiva")).toBeVisible();
    expect(screen.getByRole("meter")).toHaveAttribute("value", "50");
    expect(screen.getByText(/faixa intermediária/)).toBeVisible();
  });

  it.each([
    ["insufficient_text", "Texto insuficiente para estimar o score."],
    ["invalid_text", "O corpo da notícia não contém texto válido para análise."],
    ["unavailable", "A análise do modelo está indisponível. Você pode continuar o jogo."],
  ])("does not invent a score for %s", async (analysisStatus, message) => {
    mockFetch.mockResolvedValue(
      responseFor(1, {
        analysisStatus,
        classification: analysisStatus === "insufficient_text" ? "uncertain" : null,
        fakeProbability: null,
        fakeScore: null,
      }),
    );
    render(<ModelAnalysisPanel roomId="room-1" round={1} />);
    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.queryByRole("meter")).toBeNull();
    expect(screen.queryByText("Previsão inconclusiva")).toBeNull();
  });

  it("limits transient retries to three attempts and never retries denied access", async () => {
    mockFetch.mockRejectedValue(new Error("Offline"));
    const { unmount } = render(<ModelAnalysisPanel roomId="room-1" round={1} />);
    fireEvent.click(await screen.findByRole("button", { name: "Tentar análise novamente" }));
    fireEvent.click(await screen.findByRole("button", { name: "Tentar análise novamente" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Tentar análise novamente" })).toBeNull(),
    );
    expect(mockFetch).toHaveBeenCalledTimes(3);
    unmount();
    mockFetch.mockResolvedValue(new Response("{}", { status: 403 }));
    render(<ModelAnalysisPanel roomId="room-1" round={2} />);
    await screen.findByText(/análise do modelo está indisponível/);
    expect(screen.queryByRole("button", { name: "Tentar análise novamente" })).toBeNull();
  });

  it("aborts the previous round and discards a delayed response", async () => {
    let completeFirst!: (response: Response) => void;
    mockFetch
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          completeFirst = resolve;
        }),
      )
      .mockResolvedValueOnce(
        responseFor(2, { fakeProbability: 0.18, fakeScore: 18, classification: "reliable" }),
      );
    const { rerender } = render(<ModelAnalysisPanel roomId="room-1" round={1} />);
    const oldSignal = mockFetch.mock.calls[0]![1].signal as AbortSignal;
    rerender(<ModelAnalysisPanel roomId="room-1" round={2} />);
    expect(oldSignal.aborted).toBe(true);
    expect(await screen.findByText("Estimada como verdadeira")).toBeVisible();
    await act(async () => completeFirst(responseFor(1)));
    expect(screen.queryByText("Estimada como falsa")).toBeNull();
    expect(screen.getByRole("meter")).toHaveAttribute("value", "18");
  });

  it("rejects a response for a different round", async () => {
    mockFetch.mockResolvedValue(responseFor(2));
    render(<ModelAnalysisPanel roomId="room-1" round={1} />);
    expect(await screen.findByText(/análise do modelo está indisponível/)).toBeVisible();
    expect(screen.queryByRole("meter")).toBeNull();
  });
});

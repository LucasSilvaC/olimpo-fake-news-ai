import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RoomGameView } from "@/views/room-game/ui/room-game-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/widgets/app-header", () => ({ Header: () => null }));
vi.mock("@/app/api/news-voting/actions/conclude-round.action", () => ({
  concludeRoundAction: vi.fn(),
}));
vi.mock("@/views/room-game/ui/news-check-stage", () => ({
  NewsCheckStage: ({ timeRemainingSeconds }: { timeRemainingSeconds: number | null }) => (
    <>
      <p>Leitura da notícia</p>
      <p aria-label="Tempo restante">{timeRemainingSeconds}</p>
    </>
  ),
}));
vi.mock("@/views/room-game/ui/round-scoreboard-stage", () => ({
  RoundScoreboardStage: () => <p>Placar da rodada</p>,
}));
vi.mock("@/views/room-game/ui/match-scoreboard-stage", () => ({
  MatchScoreboardStage: ({
    leaderboard,
  }: {
    leaderboard: Array<{ userId: string; correctCount?: number }>;
  }) => (
    <>
      <p>Placar final</p>
      <output aria-label="Acertos finais">{JSON.stringify(leaderboard)}</output>
    </>
  ),
}));

class MockEventSource {
  static latest: MockEventSource;
  onopen = null;
  onerror = null;
  listeners = new Map<string, EventListener>();
  constructor() {
    MockEventSource.latest = this;
  }
  addEventListener(type: string, listener: EventListener): void {
    this.listeners.set(type, listener);
  }
  removeEventListener(type: string): void {
    this.listeners.delete(type);
  }
  close(): void {}
  emit(type: string, payload: unknown): void {
    this.listeners.get(type)?.(new MessageEvent(type, { data: JSON.stringify({ type, payload }) }));
  }
}

const mockFetch = vi.fn();
const props = {
  room: {
    id: "room-1",
    pin: "123 456",
    name: "Sala",
    hostId: "host-1",
    status: "in_progress" as const,
    roundDurationSeconds: 30,
    currentRound: 1,
    totalRounds: 2,
  },
  members: [{ id: "member-1", userId: "host-1", name: "Ana", role: "host", score: 0 }],
  playlistArticles: [
    {
      roundOrder: 1,
      title: "Notícia",
      description: null,
      publisher: null,
      url: "https://example.com/news",
    },
  ],
  currentUserId: "host-1",
};

beforeEach(() => {
  vi.stubGlobal("EventSource", MockEventSource);
  vi.stubGlobal("fetch", mockFetch);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("prediction disclosure in the room", () => {
  it("applies duplicate completion events once and keeps partial points separate from correct answers", async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(
      <RoomGameView
        {...props}
        initialVote={{ vote: "uncertain" }}
        members={[
          ...props.members,
          { id: "member-2", userId: "user-2", name: "Bruno", role: "participant", score: 0 },
        ]}
      />,
    );
    const payload = {
      round: 1,
      officialAnswer: "reliable",
      leaderboard: [
        { userId: "host-1", score: 25, roundDelta: 25, isCorrect: false },
        { userId: "user-2", score: 100, roundDelta: 100, isCorrect: true },
      ],
    };
    await act(async () => MockEventSource.latest.emit("ROUND_COMPLETED", payload));
    await act(async () => MockEventSource.latest.emit("ROUND_COMPLETED", payload));
    await act(async () =>
      MockEventSource.latest.emit("MATCH_FINISHED", { leaderboard: payload.leaderboard }),
    );
    const entries = JSON.parse(screen.getByLabelText("Acertos finais").textContent!) as Array<{
      userId: string;
      correctCount: number;
    }>;
    expect(entries.find((entry) => entry.userId === "host-1")?.correctCount).toBe(0);
    expect(entries.find((entry) => entry.userId === "user-2")?.correctCount).toBe(1);
  });

  it("does not recount a restored closed round when its SSE completion is replayed", async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(
      <RoomGameView
        {...props}
        initialRoundClosed
        initialVote={{ vote: "reliable", officialAnswer: "reliable" }}
        members={props.members.map((member) => ({ ...member, score: 100, correctCount: 1 }))}
      />,
    );
    await act(async () =>
      MockEventSource.latest.emit("ROUND_COMPLETED", {
        round: 1,
        officialAnswer: "reliable",
        leaderboard: [{ userId: "host-1", score: 100, roundDelta: 100, isCorrect: true }],
      }),
    );
    expect(screen.getByText("Placar da rodada")).toBeVisible();
    await act(async () =>
      MockEventSource.latest.emit("MATCH_FINISHED", {
        leaderboard: [{ userId: "host-1", score: 100 }],
      }),
    );
    expect(screen.getByLabelText("Acertos finais")).toHaveTextContent('"correctCount":1');
  });

  it("restores only the remaining server duration and preserves its deadline on a score rerender", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T12:00:20Z"));
    const restoredRoom = { ...props.room, roundStartedAt: "2026-10-08T12:00:00Z" };
    const { rerender } = render(<RoomGameView {...props} room={restoredRoom} />);
    expect(screen.getByLabelText("Tempo restante")).toHaveTextContent("10");
    await act(async () => vi.advanceTimersByTimeAsync(3000));
    expect(screen.getByLabelText("Tempo restante")).toHaveTextContent("7");
    rerender(
      <RoomGameView
        {...props}
        room={{ ...restoredRoom }}
        members={props.members.map((member) => ({ ...member, score: 100 }))}
      />,
    );
    expect(screen.getByLabelText("Tempo restante")).toHaveTextContent("7");
    await act(async () => vi.advanceTimersByTimeAsync(7000));
    expect(screen.getByLabelText("Tempo restante")).toHaveTextContent("0");
  });

  it("keeps prediction inaccessible after only this user voted", () => {
    render(<RoomGameView {...props} initialVote={{ vote: "reliable" }} />);
    expect(screen.getByText("Aguardando Revelação")).toBeVisible();
    expect(screen.queryByRole("region", { name: "Análise do modelo" })).toBeNull();
    expect(document.body.textContent).not.toMatch(/pts|Você acertou|Incorreto/);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("uses the official answer separately from a contradictory model prediction", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          roomId: "room-1",
          round: 1,
          demonstration: {
            explanation: "Esta notícia foi criada para o desafio educativo.",
            sourceUrl: "https://example.com/verification",
            capturedAt: "2026-10-08T12:00:00Z",
          },
          modelAnalysis: {
            analysisStatus: "ok",
            classification: "unreliable",
            fakeProbability: 0.8,
            fakeScore: 80,
            reasons: [],
            modelVersion: "model-test",
            policyVersion: "policy-test",
            inferenceVersion: "inference-test",
            artifactSha256: "a".repeat(64),
            inputScope: { wordLimit: 100, analyzedWordCount: 100, truncated: false },
          },
        }),
        { status: 200 },
      ),
    );
    render(<RoomGameView {...props} initialVote={{ vote: "reliable" }} />);
    expect(screen.queryByText("Análise pré-calculada")).toBeNull();
    expect(screen.queryByText("Esta notícia foi criada para o desafio educativo.")).toBeNull();
    await act(async () =>
      MockEventSource.latest.emit("ROUND_COMPLETED", {
        round: 1,
        officialAnswer: "reliable",
        modelAnalysis: null,
      }),
    );
    expect(await screen.findByText("Estimada como falsa")).toBeVisible();
    expect(screen.getByText("Análise pré-calculada")).toBeVisible();
    expect(screen.getByText("Esta notícia foi criada para o desafio educativo.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Consultar a fonte" })).toHaveAttribute(
      "href",
      "https://example.com/verification",
    );
    const officialResult = screen.getByRole("region", { name: "Gabarito oficial da rodada" });
    expect(officialResult).toHaveTextContent("VERDADEIRO");
    expect(officialResult).not.toHaveTextContent("FALSO");
  });

  it("ignores old completion events after starting the next round", async () => {
    render(<RoomGameView {...props} />);
    await act(async () => MockEventSource.latest.emit("ROUND_STARTED", { currentRound: 2 }));
    await act(async () =>
      MockEventSource.latest.emit("ROUND_COMPLETED", { round: 1, officialAnswer: "unreliable" }),
    );
    expect(screen.getByText("Leitura da notícia")).toBeVisible();
    expect(screen.queryByRole("region", { name: "Análise do modelo" })).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("keeps the restored game answer visible separately from the model loading state", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(
      <RoomGameView
        {...props}
        initialRoundClosed
        initialVote={{ vote: "unreliable", officialAnswer: "reliable" }}
      />,
    );
    expect(screen.getByRole("region", { name: "Resultado do jogo" })).toHaveTextContent(
      "Gabarito cadastrado: Verdadeiro",
    );
    expect(screen.getByRole("region", { name: "Resultado do jogo" })).toHaveTextContent(
      "Seu voto: Falso",
    );
    expect(screen.getByRole("region", { name: "Análise do modelo" })).toHaveTextContent(
      "Analisando o texto",
    );
  });

  it.each([
    ["reliable", "reliable", false, 100],
    ["uncertain", "reliable", false, 25],
    ["reliable", "reliable", true, 0],
  ] as const)(
    "reveals awarded points only after completion (%s/%s)",
    async (vote, officialAnswer, isTimeout, pointsAwarded) => {
      mockFetch.mockReturnValue(new Promise(() => {}));
      render(
        <RoomGameView
          {...props}
          initialVote={{ vote, isCorrect: null, pointsAwarded: 0, isTimeout }}
        />,
      );
      expect(document.body.textContent).not.toMatch(/pts|Você acertou|Incorreto/);
      await act(async () =>
        MockEventSource.latest.emit("ROUND_COMPLETED", {
          round: 1,
          officialAnswer,
          leaderboard: [{ userId: "host-1", score: pointsAwarded }],
        }),
      );
      expect(screen.getByText(isTimeout ? "0 pts" : `⚡ +${pointsAwarded} pts`)).toBeVisible();
    },
  );
});

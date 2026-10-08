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
  MatchScoreboardStage: () => <p>Placar final</p>,
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
    await act(async () =>
      MockEventSource.latest.emit("ROUND_COMPLETED", {
        round: 1,
        officialAnswer: "reliable",
        modelAnalysis: null,
      }),
    );
    expect(await screen.findByText("Estimada como falsa")).toBeVisible();
    const officialLabel = screen.getByText("Gabarito Oficial");
    expect(officialLabel.parentElement).toHaveTextContent("VERDADEIRO");
    expect(officialLabel.parentElement).not.toHaveTextContent("FALSO");
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

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_AVATAR } from "@/lib/avatar";
import { RoomLobbyView, type RoomLobbyMember } from "@/views/room-lobby/ui/room-lobby-view";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  start: vi.fn(),
  loadPrepared: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/app/api/rooms/actions/start-game.action", () => ({ startGameAction: mocks.start }));
vi.mock("@/app/api/rooms/actions/join-room.action", () => ({ joinRoomAction: vi.fn() }));
vi.mock("@/app/api/rooms/actions/load-demo-news.action", () => ({
  loadDemoNewsAction: mocks.loadPrepared,
}));
vi.mock("@/app/api/rooms/actions/add-playlist-news.action", () => ({
  addPlaylistNewsAction: vi.fn(),
}));
vi.mock("@/components/atoms/avatar", () => ({ Avatar: () => null }));
vi.mock("sonner", () => ({
  toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

let events: EventTarget;
function mount(
  members: RoomLobbyMember[] = [],
  preparationNews: { id: string; title: string }[] = [],
  currentUserId = "host",
) {
  return render(
    <RoomLobbyView
      room={{
        id: "room",
        pin: "568 912",
        name: "Sala teste",
        hostId: "host",
        status: "waiting",
        roundDurationSeconds: 30,
        currentRound: 0,
        totalRounds: 1,
      }}
      members={members}
      playlistCount={1}
      newsPreviews={[]}
      currentUserId={currentUserId}
      preparationNews={preparationNews}
    />,
  );
}

describe("lobby landing transition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.start.mockResolvedValue({ success: true });
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal(
      "EventSource",
      class extends EventTarget {
        constructor() {
          super();
          // eslint-disable-next-line @typescript-eslint/no-this-alias -- expose the mock stream to dispatch server events
          events = this;
        }
        close() {}
      },
    );
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("automatically loads all prepared news and removes the activation parameter", async () => {
    mocks.loadPrepared.mockResolvedValue({ success: true, totalRounds: 3 });
    await act(async () => {
      mount(
        [],
        [
          { id: "cat", title: "Gato preso" },
          { id: "fiction", title: "Calçada" },
          { id: "fire", title: "Inc?ndio" },
        ],
      );
    });
    expect(mocks.loadPrepared).toHaveBeenCalledOnce();
    expect(mocks.loadPrepared).toHaveBeenCalledWith({
      roomId: "room",
      fixtureIds: ["cat", "fiction", "fire"],
    });
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText("Prepara??o da sala")).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith("/sala/568%20912", { scroll: false });
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Iniciar partida" })).toBeEnabled();
  });

  it("does not load prepared news for participants", () => {
    mount([], [{ id: "cat", title: "Gato preso" }], "guest");
    expect(mocks.loadPrepared).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("lands before navigating and deduplicates the server event", async () => {
    mount();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Iniciar partida" }));
    });
    expect(screen.getByText("Pouso autorizado!")).toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
    act(() => events.dispatchEvent(new Event("ROUND_STARTED")));
    act(() => vi.advanceTimersByTime(2200));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("stays in the lobby when starting fails", async () => {
    mocks.start.mockResolvedValue({ success: false, error: "Unavailable" });
    mount();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Iniciar partida" }));
    });
    act(() => vi.advanceTimersByTime(3000));
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Iniciar partida" })).toBeEnabled();
  });

  it("clears navigation on unmount", () => {
    const view = mount();
    act(() => events.dispatchEvent(new Event("ROUND_STARTED")));
    view.unmount();
    act(() => vi.advanceTimersByTime(3000));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("skips the delay for reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    mount();
    act(() => events.dispatchEvent(new Event("ROUND_STARTED")));
    act(() => vi.advanceTimersByTime(0));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("updates cards and count on departure and reconnection, preserving the host", () => {
    mount([
      {
        id: "host-member",
        userId: "host",
        name: "Anfitrião",
        role: "host",
        score: 0,
        avatar: DEFAULT_AVATAR,
      },
      {
        id: "player-member",
        userId: "player",
        name: "Jogador teste",
        role: "participant",
        score: 0,
        avatar: DEFAULT_AVATAR,
      },
    ]);
    const presence = (userIds: string[]) =>
      act(() =>
        events.dispatchEvent(
          new MessageEvent("PRESENCE_CHANGED", {
            data: JSON.stringify({ pin: "568 912", payload: { userIds } }),
          }),
        ),
      );
    presence(["host", "player"]);
    expect(screen.getByText("2 jogadores")).toBeInTheDocument();
    presence([]);
    expect(screen.queryByText("Jogador teste")).not.toBeInTheDocument();
    expect(screen.getByText("Anfitrião")).toBeInTheDocument();
    expect(screen.getByText("1 jogador")).toBeInTheDocument();
    presence(["player"]);
    expect(screen.getByText("Jogador teste")).toBeInTheDocument();
    expect(screen.getByText("2 jogadores")).toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("ignores malformed presence snapshots", () => {
    mount([
      {
        id: "player-member",
        userId: "player",
        name: "Jogador teste",
        role: "participant",
        score: 0,
        avatar: DEFAULT_AVATAR,
      },
    ]);
    act(() => events.dispatchEvent(new MessageEvent("PRESENCE_CHANGED", { data: "invalid" })));
    act(() =>
      events.dispatchEvent(
        new MessageEvent("PRESENCE_CHANGED", {
          data: JSON.stringify({ pin: "568 912", payload: { userIds: {} } }),
        }),
      ),
    );
    expect(screen.getByText("Jogador teste")).toBeInTheDocument();
  });
});

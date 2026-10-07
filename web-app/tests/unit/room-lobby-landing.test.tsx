import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RoomLobbyView } from "@/views/room-lobby/ui/room-lobby-view";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), start: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/app/api/rooms/actions/start-game.action", () => ({ startGameAction: mocks.start }));
vi.mock("@/app/api/rooms/actions/join-room.action", () => ({ joinRoomAction: vi.fn() }));
vi.mock("@/app/api/rooms/actions/add-playlist-news.action", () => ({
  addPlaylistNewsAction: vi.fn(),
}));
vi.mock("@/components/atoms/avatar", () => ({ Avatar: () => null }));
vi.mock("sonner", () => ({
  toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

let events: EventTarget;
function mount() {
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
      members={[]}
      playlistCount={1}
      newsPreviews={[]}
      currentUserId="host"
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
});

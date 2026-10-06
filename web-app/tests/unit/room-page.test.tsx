import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findByPin: vi.fn(),
  listMembers: vi.fn(async () => []),
  getPlaylistItems: vi.fn(async () => []),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/app/api/auth/usecase/get-session.usecase", () => ({
  getSessionUseCase: { execute: vi.fn(async () => ({ id: "host-1" })) },
}));
vi.mock("@/app/api/auth/repositories/drizzle-user.repository", () => ({
  drizzleUserRepository: {},
}));
vi.mock("@/app/api/rooms/repositories/drizzle-room.repository", () => ({
  drizzleRoomRepository: mocks,
}));
vi.mock("@/app/api/ai-feedback/repositories/drizzle-news-article.repository", () => ({
  drizzleNewsArticleRepository: { findById: vi.fn() },
}));
vi.mock("@/views/room-lobby", () => ({ RoomLobbyView: () => null }));

import RoomPage from "@/app/(protected)/sala/[codigo]/page";

describe("Room page PIN routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findByPin.mockResolvedValue({ id: "room-1", pin: "709 707" });
  });

  it.each(["709%20707", "709 707", "709707"])("loads the room for %s", async (codigo) => {
    const page = await RoomPage({ params: Promise.resolve({ codigo }) });
    expect(mocks.findByPin).toHaveBeenCalledWith("709 707");
    expect(page).toMatchObject({ props: { room: { pin: "709 707" } } });
  });

  it.each(["709%ZZ707", "invalid"])("returns not found for %s", async (codigo) => {
    await expect(RoomPage({ params: Promise.resolve({ codigo }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mocks.findByPin).not.toHaveBeenCalled();
  });

  it("returns not found when the room does not exist", async () => {
    mocks.findByPin.mockResolvedValue(null);
    await expect(RoomPage({ params: Promise.resolve({ codigo: "709%20707" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});

import type * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface MockPlaylistItem {
  id: string;
  roomId: string;
  articleId: string;
  roundOrder: number;
}

const mocks = vi.hoisted(() => ({
  findByPin: vi.fn(),
  listMembers: vi.fn(async () => []),
  getPlaylistItems: vi.fn(async (): Promise<MockPlaylistItem[]> => []),
  findArticleById: vi.fn(),
  findVote: vi.fn(),
  isRoundCompleted: vi.fn(async () => false),
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
  drizzleUserRepository: {
    findById: vi.fn(async () => ({ name: "Host Player" })),
    findAvatarByUserId: vi.fn(async () => null),
  },
}));
vi.mock("@/app/api/rooms/repositories/drizzle-room.repository", () => ({
  drizzleRoomRepository: mocks,
}));
vi.mock("@/app/api/ai-feedback/repositories/drizzle-news-article.repository", () => ({
  drizzleNewsArticleRepository: { findById: mocks.findArticleById },
}));
vi.mock("@/app/api/news-voting/repositories/drizzle-news-vote.repository", () => ({
  drizzleNewsVoteRepository: { findByParticipantAndPlaylistItem: mocks.findVote },
}));
vi.mock("@/app/api/news-voting/repositories/redis-vote.repository", () => ({
  redisVoteRepository: { isRoundCompleted: mocks.isRoundCompleted },
}));
vi.mock("@/views/room-lobby", () => ({
  RoomLobbyView: function MockRoomLobbyView() {
    return null;
  },
}));
vi.mock("@/views/room-game", () => ({
  RoomGameView: function MockRoomGameView() {
    return null;
  },
}));

import RoomPage from "@/app/(protected)/sala/[codigo]/page";

describe("Room page PIN routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findVote.mockResolvedValue(null);
    mocks.isRoundCompleted.mockResolvedValue(false);
    mocks.findByPin.mockResolvedValue({
      id: "room-1",
      pin: "709 707",
      name: "Sala de Teste",
      hostId: "host-1",
      status: "waiting",
      roundDurationSeconds: 30,
      currentRound: 0,
      totalRounds: 1,
    });
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

  it("renders RoomGameView when room status is in_progress", async () => {
    mocks.findByPin.mockResolvedValue({
      id: "room-1",
      pin: "709 707",
      name: "Sala em Jogo",
      hostId: "host-1",
      status: "in_progress",
      roundDurationSeconds: 30,
      currentRound: 1,
      totalRounds: 2,
    });
    mocks.getPlaylistItems.mockResolvedValue([
      { id: "item-1", roomId: "room-1", articleId: "art-1", roundOrder: 1 },
      { id: "item-2", roomId: "room-1", articleId: "art-2", roundOrder: 2 },
    ]);
    mocks.findArticleById.mockImplementation(async (id: string) => ({
      id,
      article: {
        title: `Artigo ${id}`,
        description: "Desc",
        publisher: "Folha",
        url: "https://example.com",
      },
      targetClassification: "reliable",
    }));

    const page = await RoomPage({ params: Promise.resolve({ codigo: "709 707" }) });
    const element = page as React.ReactElement<{ playlistArticles: unknown[] }>;
    const componentType = element.type as React.FC;
    expect(componentType.name).toBe("MockRoomGameView");
    expect(element.props.playlistArticles).toHaveLength(2);
    expect(element.props.playlistArticles[0]).toMatchObject({
      id: "item-1",
      roundOrder: 1,
      title: "Artigo art-1",
    });
  });

  it("renders RoomGameView when room status is finished", async () => {
    mocks.findByPin.mockResolvedValue({
      id: "room-1",
      pin: "709 707",
      name: "Sala Finalizada",
      hostId: "host-1",
      status: "finished",
      roundDurationSeconds: 30,
      currentRound: 2,
      totalRounds: 2,
    });

    const page = await RoomPage({ params: Promise.resolve({ codigo: "709 707" }) });
    const element = page as React.ReactElement;
    const componentType = element.type as React.FC;
    expect(componentType.name).toBe("MockRoomGameView");
  });

  it.each([false, true])(
    "restores the official answer only when the round marker is %s",
    async (closed) => {
      mocks.findByPin.mockResolvedValue({
        id: "room-1",
        pin: "709 707",
        name: "Sala em Jogo",
        hostId: "host-1",
        status: "in_progress",
        roundDurationSeconds: 30,
        currentRound: 1,
        totalRounds: 2,
      });
      mocks.getPlaylistItems.mockResolvedValue([
        { id: "item-1", roomId: "room-1", articleId: "art-1", roundOrder: 1 },
      ]);
      mocks.findArticleById.mockResolvedValue({
        article: { title: "Artigo", url: "https://example.com/news" },
        targetClassification: "reliable",
      });
      mocks.findVote.mockResolvedValue({ vote: "reliable", pointsAwarded: 100, isCorrect: true });
      mocks.isRoundCompleted.mockResolvedValue(closed);

      const page = await RoomPage({ params: Promise.resolve({ codigo: "709 707" }) });
      const element = page as React.ReactElement<{
        initialRoundClosed: boolean;
        initialVote: {
          officialAnswer: string | null;
          isCorrect: boolean | null;
          pointsAwarded: number;
        };
      }>;
      expect(mocks.isRoundCompleted).toHaveBeenCalledWith("room-1", 1);
      expect(element.props.initialRoundClosed).toBe(closed);
      expect(element.props.initialVote.officialAnswer).toBe(closed ? "reliable" : null);
      expect(element.props.initialVote.isCorrect).toBe(closed ? true : null);
      expect(element.props.initialVote.pointsAwarded).toBe(closed ? 100 : 0);
      expect(element.props.initialVote).not.toHaveProperty("reliabilityScore");
      expect(element.props.initialVote).not.toHaveProperty("reasons");
      expect(element.props).not.toHaveProperty("modelAnalysis");
    },
  );
});

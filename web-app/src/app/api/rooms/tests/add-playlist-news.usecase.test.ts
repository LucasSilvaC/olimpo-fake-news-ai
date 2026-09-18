import { beforeEach, describe, expect, it, vi } from "vitest";

import { IRoomRepository } from "../repositories/room.repository.interface";
import { AddPlaylistNewsUseCase } from "../usecase/add-playlist-news.usecase";

import { INewsArticleRepository } from "@/app/api/ai-feedback/repositories/news-article.repository.interface";
import { extractNews } from "@/lib/news/extract-news";
import {
  NewsArticle,
  NewNewsArticle,
  Room,
  RoomPlaylistItem,
  NewRoomPlaylistItem,
} from "@/server/shared/database/schemas";

describe("AddPlaylistNewsUseCase", () => {
  let mockRoomRepo: IRoomRepository;
  let mockNewsArticleRepo: INewsArticleRepository;
  let mockExtractNews: typeof extractNews;
  let useCase: AddPlaylistNewsUseCase;

  const sampleWaitingRoom: Room = {
    id: "room-1",
    pin: "123 456",
    name: "Sala Playlist",
    status: "waiting",
    roundDurationSeconds: 30,
    currentRound: 0,
    totalRounds: 0,
    hostId: "user-host-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleArticles: NewsArticle[] = [
    {
      id: "art-1",
      url: "https://example.com/news-1",
      title: "Notícia 1",
      content: "Conteúdo da notícia 1",
      source: "Exemplo",
      author: "Repórter",
      publishedAt: new Date(),
      targetClassification: "reliable",
      createdAt: new Date(),
    },
  ];

  const playlistStore: RoomPlaylistItem[] = [];

  beforeEach(() => {
    playlistStore.length = 0;

    mockRoomRepo = {
      findById: vi.fn(async (id: string) => (id === "room-1" ? sampleWaitingRoom : null)),
      findByPin: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(async (id, status, currentRound, totalRounds) => ({
        ...sampleWaitingRoom,
        totalRounds: totalRounds ?? 0,
      })),
      updateRoom: vi.fn(),
      addMember: vi.fn(),
      findMember: vi.fn(),
      listMembers: vi.fn(),
      countMembers: vi.fn(),
      addPlaylistItems: vi.fn(async (items: NewRoomPlaylistItem[]) => {
        const createdItems = items.map((it) => ({
          id: it.id,
          roomId: it.roomId,
          articleId: it.articleId,
          roundOrder: it.roundOrder,
          createdAt: new Date(),
        }));
        playlistStore.push(...createdItems);
        return createdItems;
      }),
      getPlaylistItems: vi.fn(async (roomId) => playlistStore.filter((p) => p.roomId === roomId)),
    };

    mockNewsArticleRepo = {
      findById: vi.fn(async (id: string) => sampleArticles.find((a) => a.id === id) ?? null),
      create: vi.fn(async (data: NewNewsArticle) => {
        const item: NewsArticle = {
          id: data.id,
          url: data.url,
          title: data.title,
          content: data.content,
          source: data.source ?? null,
          author: data.author ?? null,
          publishedAt: data.publishedAt ?? null,
          targetClassification: data.targetClassification ?? "uncertain",
          createdAt: new Date(),
        };
        sampleArticles.push(item);
        return item;
      }),
    };

    mockExtractNews = vi.fn(async (url: string) => ({
      url,
      canonicalUrl: null,
      title: "Extracted Title",
      description: null,
      authors: ["Extracted Author"],
      publishedAt: new Date().toISOString(),
      modifiedAt: null,
      content: "Extracted Content",
      imageUrl: null,
      publisher: "Extracted Source",
      language: "pt",
      extractionMethod: "local" as const,
      usedFallback: false,
    }));

    useCase = new AddPlaylistNewsUseCase(mockRoomRepo, mockNewsArticleRepo, mockExtractNews);
  });

  it("should add news articles to playlist by articleId and update total rounds", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      hostId: "user-host-1",
      news: [{ articleId: "art-1" }],
    });

    expect(result.playlistItems).toHaveLength(1);
    expect(result.playlistItems[0]?.articleId).toBe("art-1");
    expect(result.playlistItems[0]?.roundOrder).toBe(1);
    expect(result.totalRounds).toBe(1);

    expect(mockRoomRepo.updateStatus).toHaveBeenCalledWith("room-1", "waiting", 0, 1);
  });

  it("should extract news from URL, persist article and add to playlist", async () => {
    const result = await useCase.execute({
      roomId: "room-1",
      hostId: "user-host-1",
      news: [{ url: "https://news.org/test" }],
    });

    expect(mockExtractNews).toHaveBeenCalledWith("https://news.org/test");
    expect(mockNewsArticleRepo.create).toHaveBeenCalledOnce();
    expect(result.playlistItems).toHaveLength(1);
    expect(result.totalRounds).toBe(1);
  });

  it("should reject adding items by non-host", async () => {
    await expect(
      useCase.execute({
        roomId: "room-1",
        hostId: "user-intruder",
        news: [{ articleId: "art-1" }],
      }),
    ).rejects.toThrow("Only room host can modify the playlist");
  });

  it("should reject when news list is empty", async () => {
    await expect(
      useCase.execute({
        roomId: "room-1",
        hostId: "user-host-1",
        news: [],
      }),
    ).rejects.toThrow("At least one news item must be provided");
  });
});

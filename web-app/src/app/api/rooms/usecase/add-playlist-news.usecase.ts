import { PlaylistItemDTO, PlaylistItemEntity } from "../entities";
import { drizzleRoomRepository } from "../repositories/drizzle-room.repository";
import { IRoomRepository } from "../repositories/room.repository.interface";

import { drizzleNewsArticleRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-article.repository";
import { INewsArticleRepository } from "@/app/api/ai-feedback/repositories/news-article.repository.interface";
import { extractNews } from "@/lib/news/extract-news";
import { NewRoomPlaylistItem } from "@/server/shared/database/schemas";

export interface AddPlaylistItemInput {
  articleId?: string;
  url?: string;
}

export interface AddPlaylistNewsInput {
  roomId: string;
  hostId: string;
  news: AddPlaylistItemInput[];
}

export interface AddPlaylistNewsResult {
  playlistItems: PlaylistItemDTO[];
  totalRounds: number;
}

export class AddPlaylistNewsUseCase {
  constructor(
    private readonly roomRepository: IRoomRepository = drizzleRoomRepository,
    private readonly newsArticleRepository: INewsArticleRepository = drizzleNewsArticleRepository,
    private readonly extractNewsFn: typeof extractNews = extractNews,
  ) {}

  async execute(input: AddPlaylistNewsInput): Promise<AddPlaylistNewsResult> {
    const room = await this.roomRepository.findById(input.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.hostId !== input.hostId) {
      throw new Error("Only room host can modify the playlist");
    }

    if (room.status !== "waiting") {
      throw new Error("Cannot modify playlist of an active or finished room");
    }

    if (!input.news || input.news.length === 0) {
      throw new Error("At least one news item must be provided");
    }

    const existingItems = await this.roomRepository.getPlaylistItems(input.roomId);
    let currentOrder = existingItems.length;

    const itemsToInsert: NewRoomPlaylistItem[] = [];

    for (const item of input.news) {
      let resolvedArticleId = item.articleId;

      if (!resolvedArticleId && item.url) {
        // Extract news using parser and persist in database
        const extracted = await this.extractNewsFn(item.url);
        const createdArticle = await this.newsArticleRepository.create({
          id: crypto.randomUUID(),
          url: item.url,
          title: extracted.title || "Untitled News",
          content: extracted.content || "",
          source: extracted.publisher ?? null,
          author: extracted.authors?.length ? extracted.authors.join(", ") : null,
          publishedAt: extracted.publishedAt ? new Date(extracted.publishedAt) : null,
          targetClassification: "uncertain",
        });
        resolvedArticleId = createdArticle.id;
      }

      if (!resolvedArticleId) {
        throw new Error("Each playlist item must provide either an articleId or a valid URL");
      }

      // Verify article exists
      const article = await this.newsArticleRepository.findById(resolvedArticleId);
      if (!article) {
        throw new Error(`News article with id "${resolvedArticleId}" not found`);
      }

      currentOrder += 1;
      itemsToInsert.push({
        id: crypto.randomUUID(),
        roomId: room.id,
        articleId: resolvedArticleId,
        roundOrder: currentOrder,
      });
    }

    const inserted = await this.roomRepository.addPlaylistItems(itemsToInsert);
    const totalRounds = currentOrder;

    await this.roomRepository.updateStatus(room.id, room.status, room.currentRound, totalRounds);

    const allItems = [...existingItems, ...inserted].map((p) => new PlaylistItemEntity(p).toDTO());

    return {
      playlistItems: allItems,
      totalRounds,
    };
  }
}

export const addPlaylistNewsUseCase = new AddPlaylistNewsUseCase();

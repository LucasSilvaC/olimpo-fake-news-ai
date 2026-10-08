import {
  unavailableAnalysis,
  type INewsInsightsRepository,
} from "../repositories/news-insights.repository";

import type { INewsArticleRepository } from "@/app/api/ai-feedback/repositories/news-article.repository.interface";
import type { IRedisVoteRepository } from "@/app/api/news-voting/repositories/redis-vote.repository.interface";
import type { IRoomRepository } from "@/app/api/rooms/repositories/room.repository.interface";
import type { extractNews } from "@/lib/news/extract-news";
import type { INewsArticle } from "@/lib/news/types";
import type { NewsInsightsResponse } from "@/lib/news-insights/types";

export class NewsInsightsAccessError extends Error {
  constructor(
    public readonly status: 403 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}

export class GetNewsInsightsUseCase {
  constructor(
    private readonly roomRepository: Pick<
      IRoomRepository,
      "findById" | "findMember" | "getPlaylistItems"
    >,
    private readonly articleRepository: Pick<INewsArticleRepository, "findById">,
    private readonly insightsRepository: INewsInsightsRepository,
    private readonly extractNewsFn: typeof extractNews,
    private readonly roundRepository: Pick<IRedisVoteRepository, "isRoundCompleted">,
  ) {}

  async execute(input: {
    roomId: string;
    round: number;
    userId: string;
  }): Promise<NewsInsightsResponse> {
    const room = await this.roomRepository.findById(input.roomId);
    if (!room) throw new NewsInsightsAccessError(404, "Sala não encontrada.");
    const member = await this.roomRepository.findMember(room.id, input.userId);
    if (!member) throw new NewsInsightsAccessError(403, "Você não participa desta sala.");

    const inRange =
      input.round >= 1 && input.round <= room.currentRound && input.round <= room.totalRounds;
    const isCurrent = room.status === "in_progress" && input.round === room.currentRound;
    const isCompleted =
      inRange &&
      (room.status === "finished" ||
        (room.status === "in_progress" &&
          !isCurrent &&
          (await this.roundRepository.isRoundCompleted(room.id, input.round))));
    if (!inRange || (!isCurrent && !isCompleted)) {
      throw new NewsInsightsAccessError(409, "Esta rodada não está disponível para análise.");
    }

    const playlist = await this.roomRepository.getPlaylistItems(room.id);
    const item = playlist.find(
      (entry) => entry.roomId === room.id && entry.roundOrder === input.round,
    );
    if (!item) throw new NewsInsightsAccessError(409, "Notícia da rodada não encontrada.");
    const saved = await this.articleRepository.findById(item.articleId);
    if (!saved) throw new NewsInsightsAccessError(404, "Notícia não encontrada.");

    let article: INewsArticle = saved.article;
    if (!article.content.trim()) {
      try {
        article = await this.extractNewsFn(article.url);
      } catch {
        // Keep the saved article visible; parser failures must not block voting.
      }
    }
    let analysis;
    try {
      analysis = await this.insightsRepository.analyze(article.content);
    } catch {
      analysis = unavailableAnalysis(article.content);
    }

    return {
      round: input.round,
      playlistItemId: item.id,
      article: {
        title: article.title,
        description: article.description,
        publisher: article.publisher,
        authors: article.authors,
        publishedAt: article.publishedAt,
        imageUrl: article.imageUrl,
        url: article.url,
        content: article.content,
      },
      analysis,
    };
  }
}

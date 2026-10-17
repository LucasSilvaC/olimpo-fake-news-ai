import "server-only";


import { DrizzleLoadDemoNewsRepository } from "./repositories/drizzle-load-demo-news.repository";
import { drizzleRoomRepository } from "./repositories/drizzle-room.repository";
import { redisRoomRepository } from "./repositories/redis-room.repository";
import { AddPlaylistNewsUseCase } from "./usecase/add-playlist-news.usecase";
import { CreateRoomUseCase } from "./usecase/create-room.usecase";
import { JoinRoomUseCase } from "./usecase/join-room.usecase";
import { LoadDemoNewsUseCase } from "./usecase/load-demo-news.usecase";
import { StartGameUseCase } from "./usecase/start-game.usecase";

import { drizzleNewsArticleRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-article.repository";
import { redisEventPublisher } from "@/app/api/realtime-events";
import { extractNews } from "@/lib/news/extract-news";

export const createRoomUseCase = new CreateRoomUseCase(drizzleRoomRepository, redisRoomRepository);
export const joinRoomUseCase = new JoinRoomUseCase(
  drizzleRoomRepository,
  redisRoomRepository,
  redisEventPublisher,
);
export const startGameUseCase = new StartGameUseCase(
  drizzleRoomRepository,
  redisRoomRepository,
  redisEventPublisher,
);
export const addPlaylistNewsUseCase = new AddPlaylistNewsUseCase(
  drizzleRoomRepository,
  drizzleNewsArticleRepository,
  extractNews,
);
export const loadDemoNewsUseCase = new LoadDemoNewsUseCase(new DrizzleLoadDemoNewsRepository());

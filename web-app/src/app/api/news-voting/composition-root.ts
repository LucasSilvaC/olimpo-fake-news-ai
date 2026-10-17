import "server-only";


import { drizzleNewsVoteRepository } from "./repositories/drizzle-news-vote.repository";
import { redisVoteRepository } from "./repositories/redis-vote.repository";
import { AdvanceRoundUseCase } from "./usecase/advance-round.usecase";
import { ConcludeRoundUseCase } from "./usecase/conclude-round.usecase";
import { FinishMatchUseCase } from "./usecase/finish-match.usecase";
import { SubmitVoteUseCase } from "./usecase/submit-vote.usecase";

import { drizzleNewsArticleRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-article.repository";
import { drizzleUserRepository } from "@/app/api/auth/repositories/drizzle-user.repository";
import { redisEventPublisher } from "@/app/api/realtime-events";
import { drizzleRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { redisRoomRepository } from "@/app/api/rooms/repositories/redis-room.repository";

const finishMatchUseCase = new FinishMatchUseCase(
  drizzleRoomRepository,
  redisRoomRepository,
  drizzleUserRepository,
  redisEventPublisher,
  drizzleNewsVoteRepository,
);

export const advanceRoundUseCase = new AdvanceRoundUseCase(
  drizzleRoomRepository,
  finishMatchUseCase,
  redisEventPublisher,
  redisVoteRepository,
);

export const submitVoteUseCase = new SubmitVoteUseCase(
  drizzleNewsVoteRepository,
  redisVoteRepository,
  drizzleRoomRepository,
  redisRoomRepository,
  drizzleNewsArticleRepository,
  redisEventPublisher,
);

export const concludeRoundUseCase = new ConcludeRoundUseCase(
  drizzleNewsVoteRepository,
  redisVoteRepository,
  drizzleRoomRepository,
  redisRoomRepository,
  drizzleNewsArticleRepository,
  redisEventPublisher,
);

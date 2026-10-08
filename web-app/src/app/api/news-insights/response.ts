import { HttpNewsInsightsRepository } from "./repositories/news-insights.repository";
import {
  GetNewsInsightsUseCase,
  NewsInsightsAccessError,
} from "./usecase/get-news-insights.usecase";

import { drizzleNewsArticleRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-article.repository";
import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import { redisVoteRepository } from "@/app/api/news-voting/repositories/redis-vote.repository";
import { drizzleRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { extractNews } from "@/lib/news/extract-news";
import { newsInsightsRequestSchema } from "@/lib/news-insights/schema";

interface NewsInsightsRouteDependencies {
  getUserId?: () => Promise<string>;
  useCase?: Pick<GetNewsInsightsUseCase, "execute">;
}

const defaultUseCase = new GetNewsInsightsUseCase(
  drizzleRoomRepository,
  drizzleNewsArticleRepository,
  new HttpNewsInsightsRepository(),
  extractNews,
  redisVoteRepository,
);

export async function createNewsInsightsResponse(
  request: Request,
  dependencies: NewsInsightsRouteDependencies = {},
): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  let userId: string;
  try {
    userId = await (
      dependencies.getUserId ?? (async () => (await getSessionUseCase.execute()).id)
    )();
  } catch {
    return Response.json({ error: "Sessão necessária." }, { status: 401, headers });
  }
  let payload;
  try {
    payload = newsInsightsRequestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Informe apenas roomId e round válidos." },
      { status: 400, headers },
    );
  }
  try {
    const result = await (dependencies.useCase ?? defaultUseCase).execute({ ...payload, userId });
    return Response.json(result, { headers });
  } catch (error) {
    if (error instanceof NewsInsightsAccessError) {
      return Response.json({ error: error.message }, { status: error.status, headers });
    }
    return Response.json(
      { error: "Não foi possível carregar a análise desta rodada." },
      { status: 503, headers },
    );
  }
}

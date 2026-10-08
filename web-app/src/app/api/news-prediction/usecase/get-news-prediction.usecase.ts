import {
  getArticleAnalysisUseCase,
  type GetArticleAnalysisUseCase,
} from "../../ai-feedback/usecase/get-article-analysis.usecase";
import { redisVoteRepository } from "../../news-voting/repositories/redis-vote.repository";
import type { IRedisVoteRepository } from "../../news-voting/repositories/redis-vote.repository.interface";
import { drizzleRoomRepository } from "../../rooms/repositories/drizzle-room.repository";
import type { IRoomRepository } from "../../rooms/repositories/room.repository.interface";

export class NewsPredictionAccessError extends Error {
  constructor(
    public readonly status: 403 | 404 | 409,
    message: string,
  ) {
    super(message);
  }
}
export class GetNewsPredictionUseCase {
  constructor(
    private readonly rooms: Pick<
      IRoomRepository,
      "findById" | "findMember" | "getPlaylistItems"
    > = drizzleRoomRepository,
    private readonly rounds: Pick<IRedisVoteRepository, "isRoundCompleted"> = redisVoteRepository,
    private readonly analysis: Pick<
      GetArticleAnalysisUseCase,
      "execute"
    > = getArticleAnalysisUseCase,
  ) {}
  async execute(input: { roomId: string; round: number; userId: string }) {
    const room = await this.rooms.findById(input.roomId);
    if (!room) throw new NewsPredictionAccessError(404, "Sala não encontrada.");
    if (!(await this.rooms.findMember(room.id, input.userId)))
      throw new NewsPredictionAccessError(403, "Você não participa desta sala.");
    if (
      !["in_progress", "finished"].includes(room.status) ||
      input.round < 1 ||
      input.round > room.currentRound ||
      input.round > room.totalRounds ||
      !(await this.rounds.isRoundCompleted(room.id, input.round))
    ) {
      throw new NewsPredictionAccessError(
        409,
        "A previsão só está disponível após o encerramento coletivo da rodada.",
      );
    }
    const item = (await this.rooms.getPlaylistItems(room.id)).find(
      (entry) => entry.roomId === room.id && entry.roundOrder === input.round,
    );
    if (!item) throw new NewsPredictionAccessError(409, "Notícia da rodada não encontrada.");
    return {
      roomId: room.id,
      round: input.round,
      modelAnalysis: await this.analysis.execute({ articleId: item.articleId }),
    };
  }
}
export const getNewsPredictionUseCase = new GetNewsPredictionUseCase();

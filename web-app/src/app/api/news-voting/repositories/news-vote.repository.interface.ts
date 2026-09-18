import { NewNewsVote, NewsVote } from "@/server/shared/database/schemas";

export interface INewsVoteRepository {
  create(data: NewNewsVote): Promise<NewsVote>;
  findById(id: string): Promise<NewsVote | null>;
  findByParticipantAndPlaylistItem(
    playlistItemId: string,
    userId: string,
  ): Promise<NewsVote | null>;
  listByPlaylistItem(playlistItemId: string): Promise<NewsVote[]>;
  countByPlaylistItem(playlistItemId: string): Promise<number>;
  updateEvaluation(id: string, isCorrect: boolean, pointsAwarded: number): Promise<NewsVote>;
}

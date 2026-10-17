import type { NewsVoteDTO, NewsVoteEntityProps } from "../entities";

export interface INewsVoteRepository {
  create(data: NewsVoteEntityProps): Promise<NewsVoteDTO>;
  findById(id: string): Promise<NewsVoteDTO | null>;
  findByParticipantAndPlaylistItem(
    playlistItemId: string,
    userId: string,
  ): Promise<NewsVoteDTO | null>;
  listByPlaylistItem(playlistItemId: string): Promise<NewsVoteDTO[]>;
  listByRoomId(roomId: string): Promise<NewsVoteDTO[]>;
  countByPlaylistItem(playlistItemId: string): Promise<number>;
  updateEvaluation(id: string, isCorrect: boolean, pointsAwarded: number): Promise<NewsVoteDTO>;
}

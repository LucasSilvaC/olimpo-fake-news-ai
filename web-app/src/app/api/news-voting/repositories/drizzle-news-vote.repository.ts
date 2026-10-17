import { and, count, eq } from "drizzle-orm";

import type { NewsVoteDTO, NewsVoteEntityProps } from "../entities";
import { NewsVoteEntity } from "../entities";

import type { INewsVoteRepository } from "./news-vote.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import { newsVotes } from "@/server/shared/database/schemas";
import type { NewNewsVote, NewsVote } from "@/server/shared/database/schemas";

const toNewsVoteDTO = (row: NewsVote): NewsVoteDTO => new NewsVoteEntity(row).toDTO();

export class DrizzleNewsVoteRepository implements INewsVoteRepository {
  constructor(private readonly db = databaseClient) {}

  async create(props: NewsVoteEntityProps): Promise<NewsVoteDTO> {
    const data = new NewsVoteEntity(props);
    const values: NewNewsVote = {
      id: data.id,
      roomId: data.roomId,
      playlistItemId: data.playlistItemId,
      userId: data.userId,
      vote: data.vote,
      isCorrect: data.isCorrect,
      pointsAwarded: data.pointsAwarded,
    };
    const [created] = await this.db.insert(newsVotes).values(values).returning();
    if (!created) throw new Error("Failed to create news vote record");
    return toNewsVoteDTO(created);
  }

  async findById(id: string): Promise<NewsVoteDTO | null> {
    const [found] = await this.db.select().from(newsVotes).where(eq(newsVotes.id, id)).limit(1);
    return found ? toNewsVoteDTO(found) : null;
  }

  async findByParticipantAndPlaylistItem(
    playlistItemId: string,
    userId: string,
  ): Promise<NewsVoteDTO | null> {
    const [found] = await this.db
      .select()
      .from(newsVotes)
      .where(and(eq(newsVotes.playlistItemId, playlistItemId), eq(newsVotes.userId, userId)))
      .limit(1);
    return found ? toNewsVoteDTO(found) : null;
  }

  async listByPlaylistItem(playlistItemId: string): Promise<NewsVoteDTO[]> {
    const rows = await this.db.select().from(newsVotes).where(eq(newsVotes.playlistItemId, playlistItemId));
    return rows.map(toNewsVoteDTO);
  }

  async listByRoomId(roomId: string): Promise<NewsVoteDTO[]> {
    const rows = await this.db.select().from(newsVotes).where(eq(newsVotes.roomId, roomId));
    return rows.map(toNewsVoteDTO);
  }

  async countByPlaylistItem(playlistItemId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(newsVotes)
      .where(eq(newsVotes.playlistItemId, playlistItemId));
    return result ? Number(result.value) : 0;
  }

  async updateEvaluation(
    id: string,
    isCorrect: boolean,
    pointsAwarded: number,
  ): Promise<NewsVoteDTO> {
    const [updated] = await this.db
      .update(newsVotes)
      .set({ isCorrect, pointsAwarded })
      .where(eq(newsVotes.id, id))
      .returning();
    if (!updated) throw new Error(`News vote with id "${id}" not found`);
    return toNewsVoteDTO(updated);
  }
}

export const drizzleNewsVoteRepository = new DrizzleNewsVoteRepository();

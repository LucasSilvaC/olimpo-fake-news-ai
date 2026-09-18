import { and, count, eq } from "drizzle-orm";

import { INewsVoteRepository } from "./news-vote.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import { newsVotes, NewsVote, NewNewsVote } from "@/server/shared/database/schemas";

export class DrizzleNewsVoteRepository implements INewsVoteRepository {
  constructor(private readonly db = databaseClient) {}

  async create(data: NewNewsVote): Promise<NewsVote> {
    const [created] = await this.db.insert(newsVotes).values(data).returning();

    if (!created) {
      throw new Error("Failed to create news vote record");
    }

    return created;
  }

  async findById(id: string): Promise<NewsVote | null> {
    const [found] = await this.db.select().from(newsVotes).where(eq(newsVotes.id, id)).limit(1);

    return found ?? null;
  }

  async findByParticipantAndPlaylistItem(
    playlistItemId: string,
    userId: string,
  ): Promise<NewsVote | null> {
    const [found] = await this.db
      .select()
      .from(newsVotes)
      .where(and(eq(newsVotes.playlistItemId, playlistItemId), eq(newsVotes.userId, userId)))
      .limit(1);

    return found ?? null;
  }

  async listByPlaylistItem(playlistItemId: string): Promise<NewsVote[]> {
    return this.db.select().from(newsVotes).where(eq(newsVotes.playlistItemId, playlistItemId));
  }

  async countByPlaylistItem(playlistItemId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(newsVotes)
      .where(eq(newsVotes.playlistItemId, playlistItemId));

    return result ? Number(result.value) : 0;
  }

  async updateEvaluation(id: string, isCorrect: boolean, pointsAwarded: number): Promise<NewsVote> {
    const [updated] = await this.db
      .update(newsVotes)
      .set({
        isCorrect,
        pointsAwarded,
      })
      .where(eq(newsVotes.id, id))
      .returning();

    if (!updated) {
      throw new Error(`News vote with id "${id}" not found`);
    }

    return updated;
  }
}

export const drizzleNewsVoteRepository = new DrizzleNewsVoteRepository();

import "server-only";

import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { PlaylistItemEntity } from "../entities";

import { getDemoNewsFixture } from "@/server/demo/demo-news";
import { verifyDemoArticle } from "@/server/demo/replay";
import { databaseClient } from "@/server/shared/database/client";
import { newsArticles, rooms, roomPlaylistItems } from "@/server/shared/database/schemas";

export interface LoadDemoNewsInput {
  roomId: string;
  hostId: string;
  fixtureIds: string[];
}

export class LoadDemoNewsUseCase {
  constructor(private readonly db = databaseClient) {}

  async execute(input: LoadDemoNewsInput) {
    if (process.env.DEMO_CHALLENGES_ENABLED === "false") {
      throw new Error("Os exemplos preparados estão desativados neste ambiente.");
    }
    if (!input.fixtureIds.length || input.fixtureIds.length > 3) {
      throw new Error("Selecione entre um e três exemplos.");
    }
    const fixtures = [...new Set(input.fixtureIds)].map((id) => {
      const fixture = getDemoNewsFixture(id);
      if (!fixture) throw new Error("Exemplo preparado não encontrado.");
      return fixture;
    });
    return this.db.transaction(async (tx) => {
      // Serializes additions for the same room, including double clicks and retries.
      const [room] = await tx.select().from(rooms).where(eq(rooms.id, input.roomId)).for("update");
      if (!room) throw new Error("Sala não encontrada.");
      if (room.hostId !== input.hostId)
        throw new Error("Somente o anfitrião pode carregar exemplos.");
      if (room.status !== "waiting")
        throw new Error("A partida já começou; a lista não pode mudar.");
      const items = await tx
        .select()
        .from(roomPlaylistItems)
        .where(eq(roomPlaylistItems.roomId, room.id))
        .orderBy(asc(roomPlaylistItems.roundOrder));
      let order = items.reduce((max, item) => Math.max(max, item.roundOrder), 0);
      for (const fixture of fixtures) {
        await tx
          .insert(newsArticles)
          .values({
            id: fixture.id,
            article: fixture.article,
            targetClassification: fixture.targetClassification,
          })
          .onConflictDoNothing({ target: newsArticles.id });
        const [saved] = await tx.select().from(newsArticles).where(eq(newsArticles.id, fixture.id));
        if (!saved) throw new Error("Não foi possível salvar o exemplo preparado.");
        verifyDemoArticle(saved);
        if (items.some((item) => item.articleId === fixture.id)) continue;
        const [inserted] = await tx
          .insert(roomPlaylistItems)
          .values({
            id: randomUUID(),
            roomId: room.id,
            articleId: fixture.id,
            roundOrder: ++order,
          })
          .returning();
        if (!inserted) throw new Error("Não foi possível adicionar o exemplo à sala.");
        items.push(inserted);
      }
      await tx
        .update(rooms)
        .set({ totalRounds: order, updatedAt: new Date() })
        .where(eq(rooms.id, room.id));
      return {
        playlistItems: items.map((item) => new PlaylistItemEntity(item).toDTO()),
        totalRounds: order,
      };
    });
  }
}

export const loadDemoNewsUseCase = new LoadDemoNewsUseCase();

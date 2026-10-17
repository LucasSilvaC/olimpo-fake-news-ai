import "server-only";

import { randomUUID } from "node:crypto";

import { asc, eq } from "drizzle-orm";

import { PlaylistItemEntity } from "../entities";

import type {
  ILoadDemoNewsRepository,
  LoadDemoNewsRepositoryInput,
  LoadedDemoNews,
} from "./load-demo-news.repository.interface";

import { verifyDemoArticle } from "@/server/demo/replay";
import { databaseClient } from "@/server/shared/database/client";
import { newsArticles, rooms, roomPlaylistItems } from "@/server/shared/database/schemas";

export class DrizzleLoadDemoNewsRepository implements ILoadDemoNewsRepository {
  constructor(private readonly db = databaseClient) {}

  async load(input: LoadDemoNewsRepositoryInput): Promise<LoadedDemoNews> {
    return this.db.transaction(async (tx) => {
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

      for (const fixture of input.fixtures) {
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
          .values({ id: randomUUID(), roomId: room.id, articleId: fixture.id, roundOrder: ++order })
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

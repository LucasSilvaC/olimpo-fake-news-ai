"use server";

import { z } from "zod";

import { PlaylistItemDTO } from "../entities";
import { addPlaylistNewsUseCase } from "../usecase/add-playlist-news.usecase";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";

const playlistItemSchema = z
  .object({
    articleId: z.string().optional(),
    url: z.string().url("Invalid news URL").optional(),
  })
  .refine((data) => Boolean(data.articleId || data.url), {
    message: "Each news item must specify either an articleId or a valid URL",
  });

const addPlaylistNewsSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  news: z.array(playlistItemSchema).min(1, "At least one news item is required"),
});

export type AddPlaylistNewsActionInput = z.infer<typeof addPlaylistNewsSchema>;

export type AddPlaylistNewsActionResult =
  | { success: true; playlistItems: PlaylistItemDTO[]; totalRounds: number }
  | { success: false; error: string };

export async function addPlaylistNewsAction(
  input: AddPlaylistNewsActionInput,
): Promise<AddPlaylistNewsActionResult> {
  try {
    const session = await getSessionUseCase.execute();

    const parsed = addPlaylistNewsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid playlist data",
      };
    }

    const result = await addPlaylistNewsUseCase.execute({
      roomId: parsed.data.roomId,
      hostId: session.id,
      news: parsed.data.news,
    });

    return {
      success: true,
      playlistItems: result.playlistItems,
      totalRounds: result.totalRounds,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add news to playlist";
    return {
      success: false,
      error: message,
    };
  }
}

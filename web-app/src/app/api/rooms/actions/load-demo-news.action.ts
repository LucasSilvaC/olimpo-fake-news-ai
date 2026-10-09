"use server";

import { z } from "zod";

import type { PlaylistItemDTO } from "../entities";
import { loadDemoNewsUseCase } from "../usecase/load-demo-news.usecase";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";

const inputSchema = z
  .object({
    roomId: z.string().min(1).max(200),
    fixtureIds: z.array(z.string().uuid()).min(1).max(3),
  })
  .strict();

export type LoadDemoNewsActionInput = z.infer<typeof inputSchema>;
export type LoadDemoNewsActionResult =
  | { success: true; playlistItems: PlaylistItemDTO[]; totalRounds: number }
  | { success: false; error: string };

export async function loadDemoNewsAction(
  input: LoadDemoNewsActionInput,
): Promise<LoadDemoNewsActionResult> {
  try {
    const session = await getSessionUseCase.execute();
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Seleção de exemplos inválida." };
    const result = await loadDemoNewsUseCase.execute({ ...parsed.data, hostId: session.id });
    return { success: true, ...result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar os exemplos.",
    };
  }
}

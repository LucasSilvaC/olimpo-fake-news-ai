"use server";

import { getSessionUseCase } from "../usecase/get-session.usecase";
import { UpdateAvatarUseCase } from "../usecase/update-avatar.usecase";

import { avatarConfigSchema } from "@/lib/avatar";

export type UpdateAvatarActionResult = { success: true } | { success: false; error: string };

export async function updateAvatarAction(input: unknown): Promise<UpdateAvatarActionResult> {
  const parsed = avatarConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Confira as opções do avatar e tente novamente." };
  }

  try {
    const session = await getSessionUseCase.execute();
    await new UpdateAvatarUseCase().execute(session.id, parsed.data);
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && /unauthorized/i.test(error.message)) {
      return { success: false, error: "Sua sessão expirou. Entre novamente para salvar o avatar." };
    }

    return { success: false, error: "Não foi possível salvar seu avatar. Tente novamente." };
  }
}

"use server";

import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "../entities/jwt.helper";
import { LogoutUseCase } from "../usecase/logout.usecase";

export type LogoutActionResult = { success: true } | { success: false; error: string };

export async function logoutAction(): Promise<LogoutActionResult> {
  try {
    const logoutUseCase = new LogoutUseCase();
    await logoutUseCase.execute();

    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to log out";
    return { success: false, error: message };
  }
}

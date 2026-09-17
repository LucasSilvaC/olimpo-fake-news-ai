"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "../entities/jwt.helper";
import { UserDTO } from "../entities/user.entity";
import { LoginUseCase } from "../usecase/login.usecase";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginActionInput = z.infer<typeof loginSchema>;

export type LoginActionResult =
  | { success: true; user: UserDTO }
  | { success: false; error: string };

export async function loginAction(
  input: FormData | LoginActionInput,
): Promise<LoginActionResult> {
  try {
    const rawData =
      input instanceof FormData
        ? {
            email: input.get("email"),
            password: input.get("password"),
          }
        : input;

    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid login credentials format",
      };
    }

    const loginUseCase = new LoginUseCase();
    const result = await loginUseCase.execute(parsed.data);

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());

    return {
      success: true,
      user: result.user,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to log in";
    return {
      success: false,
      error: message,
    };
  }
}

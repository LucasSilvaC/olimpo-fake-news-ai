"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "../entities/jwt.helper";
import { UserDTO } from "../entities/user.entity";
import { RegisterUseCase } from "../usecase/register.usecase";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type RegisterActionInput = z.infer<typeof registerSchema>;

export type RegisterActionResult =
  { success: true; user: UserDTO } | { success: false; error: string };

export async function registerAction(
  input: FormData | RegisterActionInput,
): Promise<RegisterActionResult> {
  try {
    const rawData =
      input instanceof FormData
        ? {
            name: input.get("name"),
            email: input.get("email"),
            password: input.get("password"),
          }
        : input;

    const parsed = registerSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid registration data",
      };
    }

    const registerUseCase = new RegisterUseCase();
    const result = await registerUseCase.execute(parsed.data);

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());

    return {
      success: true,
      user: result.user,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to register user";
    return {
      success: false,
      error: message,
    };
  }
}

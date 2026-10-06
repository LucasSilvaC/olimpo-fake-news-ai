"use server";

import { z } from "zod";

import { UserDTO } from "../entities/user.entity";
import { RegisterUseCase } from "../usecase/register.usecase";

import { avatarConfigSchema } from "@/lib/avatar";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome ou apelido com pelo menos 2 caracteres."),
  email: z.string().trim().email("Digite um e-mail válido, como nome@exemplo.com."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  avatar: avatarConfigSchema.optional(),
});

function getRegisterErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (/already exists|duplicate|unique constraint/i.test(message)) {
    return "Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.";
  }
  if (/e-?mail/i.test(message)) {
    return "Verifique o e-mail informado e tente novamente.";
  }
  if (/password|senha/i.test(message)) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }
  if (/name|nome/i.test(message)) {
    return "Informe um nome ou apelido com pelo menos 2 caracteres.";
  }

  return "Não foi possível criar sua conta agora. Tente novamente.";
}

export type RegisterActionInput = z.infer<typeof registerSchema>;

export type RegisterActionResult =
  { success: true; user: UserDTO } | { success: false; error: string };

export async function registerAction(
  input: FormData | RegisterActionInput,
): Promise<RegisterActionResult> {
  try {
    const avatarField = input instanceof FormData ? input.get("avatar") : undefined;
    let formAvatar: unknown;
    if (avatarField !== undefined && avatarField !== null) {
      if (typeof avatarField !== "string") {
        return { success: false, error: "Confira as opções do seu avatar e tente novamente." };
      }
      try {
        formAvatar = JSON.parse(avatarField);
      } catch {
        return { success: false, error: "Confira as opções do seu avatar e tente novamente." };
      }
    }
    const rawData =
      input instanceof FormData
        ? {
            name: input.get("name"),
            email: input.get("email"),
            password: input.get("password"),
            avatar: formAvatar,
          }
        : input;

    const parsed = registerSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      if (firstIssue?.path[0] === "avatar") {
        return { success: false, error: "Confira as opções do seu avatar e tente novamente." };
      }
      const missingFieldMessage =
        firstIssue?.code === "invalid_type"
          ? firstIssue.path[0] === "name"
            ? "Informe seu nome ou apelido."
            : firstIssue.path[0] === "email"
              ? "Informe seu e-mail."
              : firstIssue.path[0] === "password"
                ? "Informe uma senha."
                : undefined
          : undefined;
      return {
        success: false,
        error: missingFieldMessage || firstIssue?.message || "Confira os dados e tente novamente.",
      };
    }

    const registerUseCase = new RegisterUseCase();
    const result = await registerUseCase.execute(parsed.data);

    return {
      success: true,
      user: result.user,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: getRegisterErrorMessage(error),
    };
  }
}

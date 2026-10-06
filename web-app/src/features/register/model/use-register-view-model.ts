"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { getPasswordStrength } from "./register-model";

import { registerAction } from "@/app/api/auth/actions/register.action";
import { DEFAULT_AVATAR, type AvatarConfig } from "@/lib/avatar";

type RegisterField = "name" | "email" | "password";
type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

const fieldIds: Record<RegisterField, string> = {
  name: "register-name",
  email: "register-email",
  password: "register-password",
};

const fieldOrder: RegisterField[] = ["name", "email", "password"];
const MAX_TOAST_DURATION = 7000;
const TOAST_EXIT_ANIMATION_BUFFER = 500;

const requiredFieldMessage: Record<RegisterField, string> = {
  name: "Informe seu nome ou apelido.",
  email: "Informe seu e-mail.",
  password: "Informe uma senha.",
};

function validateField(field: RegisterField, value: string): string | undefined {
  if (!value.trim()) return requiredFieldMessage[field];

  if (field === "name" && value.trim().length < 2) {
    return "Use pelo menos 2 caracteres.";
  }

  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return "Digite um e-mail válido, como nome@exemplo.com.";
  }

  if (field === "password" && value.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }
}

function dismissToastAfterMaximum(id: string | number) {
  // Sonner pauses its own timer while hovered; this hard limit still dismisses the toast.
  window.setTimeout(() => toast.dismiss(id), MAX_TOAST_DURATION - TOAST_EXIT_ANIMATION_BUFFER);
}

function showErrorToast(message: string, description?: string) {
  const id = toast.error(message, { description, duration: MAX_TOAST_DURATION });
  dismissToastAfterMaximum(id);
}

function showSuccessToast(message: string, description: string) {
  const id = toast.success(message, { description, duration: MAX_TOAST_DURATION });
  dismissToastAfterMaximum(id);
}

export function useRegisterViewModel() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<RegisterField, boolean>>>({});

  useEffect(() => {
    if (error) document.getElementById("register-error-summary")?.focus();
  }, [error]);

  function updateField(field: RegisterField, value: string) {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);

    if (touchedFields[field]) {
      setFieldErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    }
  }

  function touchField(field: RegisterField) {
    const values: Record<RegisterField, string> = { name, email, password };
    setTouchedFields((current) => ({ ...current, [field]: true }));
    setFieldErrors((current) => ({ ...current, [field]: validateField(field, values[field]) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);

    const values: Record<RegisterField, string> = { name, email, password };
    const nextFieldErrors: RegisterFieldErrors = {};
    for (const field of fieldOrder) {
      const fieldError = validateField(field, values[field]);
      if (fieldError) nextFieldErrors[field] = fieldError;
    }

    setTouchedFields({ name: true, email: true, password: true });
    setFieldErrors(nextFieldErrors);

    const firstInvalidField = fieldOrder.find((field) => nextFieldErrors[field]);
    if (firstInvalidField) {
      showErrorToast("Revise os campos destacados", nextFieldErrors[firstInvalidField]);
      document.getElementById(fieldIds[firstInvalidField])?.focus();
      return;
    }

    setPending(true);
    try {
      const result = await registerAction({
        name: name.trim(),
        email: email.trim(),
        password,
        avatar,
      });
      if (!result.success) {
        setError(result.error);
        showErrorToast(result.error);
        return;
      }

      showSuccessToast(
        "Conta criada com sucesso!",
        "Agora entre com seu e-mail e senha para começar.",
      );
      router.replace("/login");
    } catch {
      const message = "Não foi possível criar sua conta agora. Tente novamente.";
      setError(message);
      showErrorToast(message);
    } finally {
      setPending(false);
    }
  }

  return {
    name,
    email,
    password,
    avatar,
    pending,
    error,
    fieldErrors,
    strength: getPasswordStrength(password),
    setName: (value: string) => updateField("name", value),
    setEmail: (value: string) => updateField("email", value),
    setPassword: (value: string) => updateField("password", value),
    setAvatar,
    touchField,
    submit,
  };
}

export type RegisterViewModel = ReturnType<typeof useRegisterViewModel>;

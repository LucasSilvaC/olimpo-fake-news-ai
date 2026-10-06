"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { loginAction } from "@/app/api/auth/actions/login.action";

export function useLoginViewModel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [navigating, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || navigating) return;

    setPending(true);
    setError(null);
    try {
      const result = await loginAction({ email: email.trim(), password });
      if (!result.success) {
        setError(result.error);
        return;
      }

      startTransition(() => {
        router.replace("/");
        router.refresh();
      });
    } catch {
      setError("N\u00E3o foi poss\u00EDvel entrar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return {
    email,
    password,
    pending: pending || navigating,
    error,
    setEmail,
    setPassword,
    submit,
  };
}

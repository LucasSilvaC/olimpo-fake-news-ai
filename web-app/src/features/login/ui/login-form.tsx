"use client";

import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

import { useLoginViewModel } from "../model/use-login-view-model";

import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Loading } from "@/components/molecules/loading";

export function LoginForm() {
  const vm = useLoginViewModel();

  return (
    <form onSubmit={vm.submit} className="relative" aria-busy={vm.pending}>
      {vm.pending && <Loading variant="login" />}
      <fieldset disabled={vm.pending} className="min-w-0 space-y-5" inert={vm.pending}>
        <div>
          <Label htmlFor="login-email" className="mb-2 block font-bold text-slate-800">
            E-mail
          </Label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-500"
            />
            <Input
              id="login-email"
              name="email"
              type="email"
              variant="registration"
              placeholder="seu.email@exemplo.com"
              autoComplete="email"
              required
              value={vm.email}
              onChange={(event) => vm.setEmail(event.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="login-password" className="mb-2 block font-bold text-slate-800">
            Senha
          </Label>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-500"
            />
            <Input
              id="login-password"
              name="password"
              type="password"
              variant="registration"
              placeholder="Sua senha"
              autoComplete="current-password"
              required
              value={vm.password}
              onChange={(event) => vm.setPassword(event.target.value)}
            />
          </div>
        </div>

        {vm.error && (
          <p role="alert" className="text-sm text-red-600">
            {vm.error}
          </p>
        )}

        <Button type="submit" disabled={vm.pending}>
          {vm.pending ? "Entrando..." : "Entrar"}
          <ArrowRight aria-hidden="true" className="size-5" />
        </Button>
      </fieldset>
    </form>
  );
}

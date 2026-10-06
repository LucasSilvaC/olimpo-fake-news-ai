"use client";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";

import { useRegisterViewModel } from "../model/use-register-view-model";

import { PasswordStrength } from "./password-strength";
import { ProfileCustomizer } from "./profile-customizer";
import { RegistrationField } from "./registration-field";

import { Button } from "@/components/atoms/button";
export function RegisterForm() {
  const vm = useRegisterViewModel();
  return (
    <form onSubmit={vm.submit} className="space-y-5" aria-busy={vm.pending} noValidate>
      <ProfileCustomizer vm={vm} />
      <RegistrationField
        id="register-name"
        name="name"
        label="Nome ou Nickname"
        hint="Visível nas salas"
        icon={UserRound}
        placeholder="Ex: afor_digital ou Maria"
        autoComplete="nickname"
        required
        minLength={2}
        value={vm.name}
        onChange={(event) => vm.setName(event.target.value)}
        onBlur={() => vm.touchField("name")}
        error={vm.fieldErrors.name}
      />
      <RegistrationField
        id="register-email"
        name="email"
        type="email"
        label="E-mail"
        icon={Mail}
        placeholder="seu.email@exemplo.com"
        autoComplete="email"
        required
        value={vm.email}
        onChange={(event) => vm.setEmail(event.target.value)}
        onBlur={() => vm.touchField("email")}
        error={vm.fieldErrors.email}
      />
      <RegistrationField
        id="register-password"
        name="password"
        type={vm.passwordVisible ? "text" : "password"}
        label="Senha"
        hint="Mínimo de 8 caracteres"
        icon={LockKeyhole}
        placeholder="••••••••••••"
        autoComplete="new-password"
        required
        minLength={8}
        value={vm.password}
        onChange={(event) => vm.setPassword(event.target.value)}
        onBlur={() => vm.touchField("password")}
        error={vm.fieldErrors.password}
        trailing={
          <Button
            type="button"
            className="absolute inset-y-0 right-0 h-full cursor-pointer bg-transparent px-4 text-slate-500 hover:text-slate-700 hover:opacity-100"
            onClick={vm.togglePassword}
            aria-label={vm.passwordVisible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={vm.passwordVisible}
          >
            {vm.passwordVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </Button>
        }
      >
        <PasswordStrength strength={vm.strength} />
      </RegistrationField>
      <div
        id="register-error-summary"
        role="alert"
        aria-live="assertive"
        tabIndex={-1}
        className={
          vm.error
            ? "rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800"
            : "sr-only"
        }
      >
        {vm.error}
      </div>
      <Button type="submit" variant="registration-submit" disabled={vm.pending} aria-live="polite">
        {vm.pending ? "Criando sua conta…" : "Criar minha conta"}
        <ArrowRight aria-hidden="true" className="size-5" />
      </Button>
    </form>
  );
}

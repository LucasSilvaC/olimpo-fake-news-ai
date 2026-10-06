import Link from "next/link";
import type { ReactNode } from "react";

export function AuthCard({ mode, children }: { mode: "login" | "register"; children: ReactNode }) {
  const isLogin = mode === "login";
  return (
    <section
      aria-labelledby="auth-card-title"
      className="mx-auto w-full max-w-2xl rounded-[32px] border border-white/40 bg-white p-5 text-slate-900 shadow-2xl shadow-blue-950/20 sm:p-7 lg:p-8"
    >
      <div className="mb-5">
        <h2
          id="auth-card-title"
          className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl"
        >
          {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
          {isLogin
            ? "Entre na sua conta e continue no jogo."
            : "Personalize seu perfil e entre no jogo."}
        </p>
      </div>
      {children}
      <div className="mt-4 border-t border-slate-100 pt-4 text-center">
        <p className="text-xs text-slate-500 sm:text-sm">
          {isLogin ? "Ainda não tem uma conta?" : "Já tem uma conta cadastrada?"}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            scroll={false}
            className="font-bold text-blue-600 hover:text-blue-700 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            {isLogin ? "Cadastre-se" : "Entrar agora"}
          </Link>
        </p>
      </div>
    </section>
  );
}

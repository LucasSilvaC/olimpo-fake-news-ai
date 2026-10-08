"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AuthIntro } from "./auth-intro";
import styles from "./auth-layout.module.css";

import { buttonVariants } from "@/components/atoms/button";
import { PageShell } from "@/components/molecules/page-shell";
import { cn } from "@/lib/utils";
import { Header } from "@/widgets/app-header";

export function AuthLayout({ children }: { children: ReactNode }) {
  const isLogin = usePathname() === "/login";
  const href = isLogin ? "/register" : "/login";

  return (
    <PageShell className="overflow-x-clip">
      <Header>
        <Link
          href={href}
          scroll={false}
          className={cn(
            buttonVariants({ variant: "textonly", size: "unstyled" }),
            "text-md hidden w-max shrink-0 whitespace-nowrap focus-visible:ring-amber-300 sm:inline-flex",
          )}
        >
          {isLogin ? "Ainda não tem uma conta?" : "Já tem uma conta?"}
        </Link>
        <Link
          href={href}
          scroll={false}
          className={cn(
            buttonVariants(),
            "h-16 w-[180px] shrink-0 cursor-pointer rounded-full border border-white/20 bg-white/15 px-6 text-lg font-semibold whitespace-nowrap text-white shadow-sm backdrop-blur-sm hover:border-white/50 hover:bg-white/15 hover:opacity-100 focus-visible:ring-amber-300",
          )}
        >
          {isLogin ? "Criar conta" : "Entrar"}
        </Link>
      </Header>
      <main
        className={cn(
          styles.main,
          "mx-auto grid w-full max-w-[1400px] flex-1 items-center gap-6 px-4 py-5 sm:px-6 lg:grid-cols-2 lg:gap-[var(--panel-gap)] lg:px-10 lg:py-3",
        )}
        data-mode={isLogin ? "login" : "register"}
      >
        <div
          className={cn(
            styles.intro,
            "min-w-0 transition-transform duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0",
          )}
        >
          <AuthIntro isLogin={isLogin} />
        </div>
        <div
          className={cn(
            styles.form,
            "relative z-[1] min-w-0 transition-transform duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0",
          )}
        >
          {children}
        </div>
      </main>
    </PageShell>
  );
}

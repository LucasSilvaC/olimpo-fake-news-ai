"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AuthIntro } from "./auth-intro";
import styles from "./auth-layout.module.css";

import { buttonVariants } from "@/components/atoms/button";
import { cn } from "@/lib/utils";
import { Header } from "@/widgets/app-header";

export function AuthLayout({ children }: { children: ReactNode }) {
  const isLogin = usePathname() === "/login";
  const href = isLogin ? "/register" : "/login";

  return (
    <div className={styles.page}>
      <Header>
        <Link
          href={href}
          scroll={false}
          className={cn(
            buttonVariants({ variant: "textonly", size: "unstyled" }),
            "text-md hidden focus-visible:ring-amber-300 sm:inline-flex",
          )}
        >
          {isLogin ? "Ainda não tem uma conta?" : "Já tem uma conta?"}
        </Link>
        <Link
          href={href}
          scroll={false}
          className={cn(
            buttonVariants(),
            "h-12 cursor-pointer rounded-full border border-white/20 bg-white/15 px-6 text-lg font-semibold text-white shadow-sm backdrop-blur-sm hover:border-white/50 hover:bg-white/15 hover:opacity-100 focus-visible:ring-amber-300",
          )}
        >
          {isLogin ? "Criar conta" : "Entrar"}
        </Link>
      </Header>
      <main className={styles.main} data-mode={isLogin ? "login" : "register"}>
        <div className={styles.intro}>
          <AuthIntro isLogin={isLogin} />
        </div>
        <div className={styles.form}>{children}</div>
      </main>
    </div>
  );
}

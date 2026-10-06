"use client";

import { ArrowRight, Compass, House, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./not-found-page.module.css";

import { Header } from "@/widgets/app-header";

const REDIRECT_SECONDS = 8;

export function NotFoundPage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setSeconds(Math.max(0, REDIRECT_SECONDS - Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    const timeout = window.setTimeout(() => router.replace("/"), REDIRECT_SECONDS * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className={styles.page}>
      <Header>
        <Link href="/" replace className={styles.headerLink}>
          <House aria-hidden="true" className="size-4" /> Início
        </Link>
      </Header>
      <main className={styles.main}>
        <section className={styles.intro} aria-labelledby="not-found-title">
          <span className={styles.label}>
            <Sparkles aria-hidden="true" className="size-4 text-amber-300" /> Fora da rota
          </span>
          <h1 id="not-found-title">Até um olhar crítico pode se perder.</h1>
          <p>Essa página não foi encontrada. Mas o caminho de volta ao Olimpo está logo ali.</p>
          <div className={styles.scene} aria-hidden="true">
            <div className={styles.orbit} />
            <span className={styles.code}>
              4<Compass className={styles.compass} />4
            </span>
            <span className={styles.badge}>
              <Search className="size-5" /> Página não encontrada
            </span>
          </div>
        </section>
        <section className={styles.card} aria-labelledby="return-title">
          <span className={styles.icon}>
            <House aria-hidden="true" className="size-7" />
          </span>
          <span className={styles.errorLabel}>ERRO 404</span>
          <h2 id="return-title">Vamos voltar ao jogo?</h2>
          <p>
            O endereço pode ter mudado ou não existir. Volte para a página principal e continue sua
            jornada.
          </p>
          <Link href="/" replace className={styles.button}>
            Voltar para o início <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <p className={styles.countdown} role="status" aria-live="off">
            {seconds > 0 ? (
              <>
                Você será redirecionado em <strong>{seconds}s</strong>.
              </>
            ) : (
              "Voltando para o início…"
            )}
          </p>
          <div className={styles.progress} aria-hidden="true">
            <span />
          </div>
        </section>
      </main>
    </div>
  );
}

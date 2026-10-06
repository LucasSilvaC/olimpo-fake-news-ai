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
    <div className="flex min-h-svh flex-col overflow-x-clip bg-[radial-gradient(120%_120%_at_50%_20%,#1e40af_0%,#1d4ed8_45%,#1e40af_100%)] text-white">
      <Header>
        <Link
          href="/"
          replace
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-6 py-3 font-semibold outline-offset-4 focus-visible:outline-3 focus-visible:outline-amber-300"
        >
          <House aria-hidden="true" className="size-4" /> Início
        </Link>
      </Header>
      <main className="mx-auto grid w-full max-w-[1400px] flex-1 items-center gap-8 px-4 pt-8 pb-12 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <section
          className={`${styles.enter} min-w-0 text-center lg:text-left`}
          aria-labelledby="not-found-title"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-[0.8rem] py-[0.4rem] text-xs font-semibold">
            <Sparkles aria-hidden="true" className="size-4 text-amber-300" /> Fora da rota
          </span>
          <h1
            id="not-found-title"
            className="mx-auto my-4 max-w-[620px] text-[clamp(2rem,4.5vw,3.75rem)] leading-[1.12] font-black tracking-[-0.04em] lg:mx-0"
          >
            Até um olhar crítico pode se perder.
          </h1>
          <p className="mx-auto max-w-[500px] leading-[1.75] text-blue-50 lg:mx-0">
            Essa página não foi encontrada. Mas o caminho de volta ao Olimpo está logo ali.
          </p>
          <div
            className="relative mt-4 grid min-h-[250px] place-items-center lg:min-h-[300px]"
            aria-hidden="true"
          >
            <div
              className={`${styles.orbit} absolute size-[240px] rounded-full border border-dashed border-white/25 after:absolute after:top-[30px] after:left-[30px] after:size-3 after:rounded-full after:bg-amber-300 after:shadow-[0_0_25px_#fcd34d80] after:content-['']`}
            />
            <span
              className={`${styles.float} flex items-center gap-1 text-[clamp(6rem,20vw,9rem)] leading-none font-black [text-shadow:0_15px_40px_#17255440]`}
            >
              4<Compass className="size-[0.75em] text-amber-300 [stroke-width:1.5]" />4
            </span>
            <span className="absolute bottom-0 flex -rotate-4 items-center gap-2 rounded-2xl border border-white/25 bg-white px-4 py-[0.8rem] text-xs font-bold text-blue-700 shadow-[0_12px_30px_#17255420]">
              <Search className="size-5" /> Página não encontrada
            </span>
          </div>
        </section>
        <section
          className={`${styles.enterCard} mx-auto w-full max-w-[580px] rounded-[32px] border border-white/40 bg-white p-[clamp(1.5rem,4vw,3rem)] text-slate-900 shadow-[0_25px_60px_#17255433]`}
          aria-labelledby="return-title"
        >
          <span className="mb-6 grid size-16 place-items-center rounded-[20px] bg-blue-50 text-blue-600">
            <House aria-hidden="true" className="size-7" />
          </span>
          <span className="text-xs font-extrabold tracking-[0.15em] text-blue-600">ERRO 404</span>
          <h2
            id="return-title"
            className="my-3 text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.2] font-black tracking-[-0.04em]"
          >
            Vamos voltar ao jogo?
          </h2>
          <p className="text-[0.95rem] leading-[1.75] text-slate-500">
            O endereço pode ter mudado ou não existir. Volte para a página principal e continue sua
            jornada.
          </p>
          <Link
            href="/"
            replace
            className="mt-8 flex items-center justify-center gap-3 rounded-full bg-blue-600 p-4 font-bold text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-amber-300 motion-reduce:transition-none motion-reduce:hover:transform-none"
          >
            Voltar para o início <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <p className="mt-6 text-center text-[0.8rem]" role="status" aria-live="off">
            {seconds > 0 ? (
              <>
                Você será redirecionado em{" "}
                <strong className="text-blue-600 tabular-nums">{seconds}s</strong>.
              </>
            ) : (
              "Voltando para o início…"
            )}
          </p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-blue-50" aria-hidden="true">
            <span className={`${styles.countdown} block h-full origin-left bg-blue-600`} />
          </div>
        </section>
      </main>
    </div>
  );
}

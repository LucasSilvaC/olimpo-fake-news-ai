import { Check, Search, Sparkles, Trophy, Users, X } from "lucide-react";

import styles from "./auth-intro.module.css";

export function AuthIntro({ isLogin }: { isLogin: boolean }) {
  return (
    <section
      aria-labelledby="intro-title"
      className="mx-auto w-full max-w-xl text-center lg:text-left"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
        <Sparkles aria-hidden="true" className="size-3.5 text-amber-300" />
        {isLogin ? "Volte ao Olimpo" : "Conheça o Olimpo"}
      </span>
      <h1
        id="intro-title"
        className="mt-4 text-3xl leading-[1.12] font-black tracking-tight text-white sm:text-4xl lg:text-6xl"
      >
        {isLogin ? "Seu olhar crítico" : "A verdade entra"}
        <br className="hidden lg:block" /> {isLogin ? "volta ao jogo." : "em jogo."}
      </h1>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-blue-50 sm:text-base lg:mx-0 lg:text-lg">
        {isLogin
          ? "Novas manchetes, novos desafios. Continue de onde parou, teste seu olhar e suba no ranking combatendo a desinformação."
          : "Fato ou fake? Desafie seu olhar, descubra o que está por trás das manchetes e aprenda a combater a desinformação jogando."}
      </p>
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.orbit} />
        <div className={styles.backCard} />
        <div className={styles.newsCard}>
          <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.18em] text-blue-600">
            OLIMPO / DESAFIO <span className="size-2 rounded-full bg-amber-400" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Search className="size-7" />
            </div>
            <p className="text-2xl leading-tight font-extrabold text-slate-900">
              Nem tudo que
              <br />
              viraliza é verdade.
            </p>
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-2 rounded-full bg-slate-100" />
            <div className="h-2 w-3/4 rounded-full bg-slate-100" />
          </div>
          <div className="mt-5 flex gap-2 text-xs font-bold">
            <span className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-emerald-700">
              <Check className="size-4" /> Fato
            </span>
            <span className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-50 py-3 text-rose-700">
              <X className="size-4" /> Fake
            </span>
          </div>
        </div>
        <div className={styles.badge}>
          <Trophy className="size-6" />
          <span>
            Olhar crítico.
            <br />
            <strong>Nível elevado.</strong>
          </span>
        </div>
      </div>
      <div className="mt-2 hidden flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-blue-50 lg:flex">
        <span className="flex items-center gap-2">
          <Users aria-hidden="true" className="size-4 text-amber-300" /> Jogue solo ou com amigos
        </span>
        <span className="flex items-center gap-2">
          <Trophy aria-hidden="true" className="size-4 text-amber-300" /> Aprenda e suba no ranking
        </span>
      </div>
    </section>
  );
}

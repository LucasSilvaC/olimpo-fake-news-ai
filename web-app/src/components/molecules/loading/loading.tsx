import { Check, Search, X } from "lucide-react";

import styles from "./loading.module.css";

type LoadingProps = {
  variant?: "page" | "login";
};

export function Loading({ variant = "page" }: LoadingProps) {
  const isLogin = variant === "login";

  return (
    <div className={isLogin ? styles.login : styles.page} role="status" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.scene} aria-hidden="true">
          <div className={styles.orbit} />
          <div className={styles.backCard} />
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span>OLIMPO / EM JOGO</span>
              <span className={styles.spark} />
            </div>
            <div className={styles.headline}>
              <Search size={22} />
              <span>Fato ou fake?</span>
            </div>
            <div className={styles.lines}>
              <span />
              <span />
            </div>
            <div className={styles.answers}>
              <span className={styles.fact}>
                <Check size={16} /> Fato
              </span>
              <span className={styles.fake}>
                <X size={16} /> Fake
              </span>
            </div>
            <div className={styles.scan} />
          </div>
          <div className={styles.coin}>
            <span className={styles.coinFront}>
              <Check size={26} strokeWidth={3} />
            </span>
            <span className={styles.coinBack}>
              <X size={26} strokeWidth={3} />
            </span>
          </div>
        </div>
        <p className={styles.eyebrow}>A VERDADE ENTRA EM JOGO</p>
        <p className={styles.title}>
          {isLogin ? "Entrando no Olimpo" : "Preparando o próximo desafio"}
        </p>
        <p className={styles.description}>
          {isLogin ? "Seu próximo desafio está chegando." : "Aguce o olhar. Questione. Descubra."}
        </p>
        <div className={styles.progress} aria-hidden="true">
          <span />
        </div>
        <span className="sr-only">Carregando, aguarde.</span>
      </div>
    </div>
  );
}

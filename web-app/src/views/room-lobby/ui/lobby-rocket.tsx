import type { CSSProperties, ReactElement } from "react";

import styles from "./room-lobby.module.css";

export function LobbyRocket({ landing }: { landing: boolean }): ReactElement {
  return (
    <div className={styles.scene} data-landing={landing} aria-hidden="true">
      <div className={styles.halo} />
      <span className={styles.star}>✦</span>
      <span className={styles.starSmall}>✧</span>
      <div className={styles.platform}>
        <span>O</span>
      </div>
      <div className={styles.shadow} />
      <div className={styles.flight}>
        <div className={styles.rocket}>
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              className={styles.hull}
              style={
                {
                  "--slice": i,
                  "--shade": `${87 + Math.sin((i / 24) * Math.PI) * 13}%`,
                } as CSSProperties
              }
            />
          ))}
          <span className={styles.finLeft} />
          <span className={styles.finRight} />
          <span className={styles.window}>
            <span />
          </span>
          <span className={styles.stripe} />
          <span className={styles.engine} />
          <span className={styles.flame} />
        </div>
      </div>
      <div className={styles.dust} />
    </div>
  );
}

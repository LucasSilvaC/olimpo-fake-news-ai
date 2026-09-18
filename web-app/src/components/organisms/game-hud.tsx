import { Timer } from "lucide-react";
import * as React from "react";

import { ProgressBar } from "@/components/atoms/progress-bar";
import { cn } from "@/lib/utils";

export interface IGameHudProps extends React.HTMLAttributes<HTMLDivElement> {
  currentRound: number;
  totalRounds: number;
  score: number;
  timeLeft: number;
  totalTime?: number;
}

export function GameHud({
  className,
  currentRound,
  totalRounds,
  score,
  timeLeft,
  totalTime = 20,
  ...properties
}: IGameHudProps): React.ReactElement {
  const percent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  return (
    <div
      className={cn(
        "border-border flex flex-wrap items-center justify-between gap-3 border-b pb-3",
        className,
      )}
      {...properties}
    >
      <div>
        <span className="text-xs font-black tracking-wide uppercase">
          Rodada {currentRound} de {totalRounds}
        </span>
        <div className="text-muted-foreground text-[11px]">
          Sua Pontuação:{" "}
          <strong className="text-foreground">{score.toLocaleString("pt-BR")} pts</strong>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs font-bold">
        <span className="inline-flex items-center gap-1">
          <Timer className="text-muted-foreground h-3.5 w-3.5" />
          <span>{timeLeft}s</span>
        </span>
        <div className="w-28 sm:w-36">
          <ProgressBar value={percent} className="h-2" />
        </div>
      </div>
    </div>
  );
}

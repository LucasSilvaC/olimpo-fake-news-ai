import { Award, Crown } from "lucide-react";
import * as React from "react";

import { Avatar } from "@/components/atoms/avatar";
import { cn } from "@/lib/utils";

export interface IPodiumStepProps extends React.HTMLAttributes<HTMLDivElement> {
  place: 1 | 2 | 3;
  name: string;
  score: string;
  initials: string;
  medal: string;
  hasCrown?: boolean;
}

export function PodiumStep({
  className,
  place,
  name,
  score,
  initials,
  medal,
  hasCrown = false,
  ...properties
}: IPodiumStepProps): React.ReactElement {
  const heights = {
    1: "h-28 sm:h-32 border-t-4 border-primary",
    2: "h-22 sm:h-24",
    3: "h-16 sm:h-18",
  };

  const orders = {
    1: "order-2",
    2: "order-1",
    3: "order-3",
  };

  return (
    <div
      className={cn(
        "flex max-w-[140px] flex-1 flex-col items-center justify-end",
        orders[place],
        className,
      )}
      {...properties}
    >
      <div className="mb-2 flex flex-col items-center gap-1 text-center">
        {hasCrown ? (
          <Crown
            className="h-4 w-4 animate-bounce fill-amber-500 text-amber-500"
            aria-label="Líder"
          />
        ) : (
          <div className="h-4" />
        )}
        <Avatar
          size="lg"
          initials={initials}
          className={place === 1 ? "border-primary ring-primary/20 ring-2" : ""}
        />
        <span className="max-w-[100px] truncate text-xs font-bold">{name}</span>
        <span className="text-muted-foreground font-mono text-[10px] font-semibold">{score}</span>
      </div>

      <div
        className={cn(
          "border-border bg-card text-card-foreground flex w-full flex-col items-center justify-center rounded-t-lg border-2 border-b-0 py-2 shadow-xs transition-all",
          heights[place],
        )}
      >
        <span className="text-xl font-black">{place}º</span>
        <span className="text-muted-foreground flex items-center justify-center gap-1 text-[10px] font-extrabold tracking-wider uppercase">
          <Award className="h-3 w-3" />
          <span>{medal}</span>
        </span>
      </div>
    </div>
  );
}

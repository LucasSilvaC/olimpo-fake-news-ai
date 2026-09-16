import * as React from "react";

import { cn } from "@/lib/utils";

export interface IPollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  fakePercent: number;
  factPercent: number;
  labelFake?: string;
  labelFact?: string;
}

export function PollBar({
  className,
  fakePercent,
  factPercent,
  labelFake = "votaram Fake",
  labelFact = "caíram no blefe",
  ...properties
}: IPollBarProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col gap-1.5 text-xs", className)} {...properties}>
      <div className="border-border bg-muted flex h-5 w-full overflow-hidden rounded-md border text-[10px] font-bold">
        <div
          className="bg-primary text-primary-foreground flex items-center px-2 transition-all"
          style={{ width: `${fakePercent}%` }}
        >
          {fakePercent > 15 ? `${fakePercent}% FAKE` : `${fakePercent}%`}
        </div>
        <div
          className="bg-card text-card-foreground border-border flex items-center justify-end border-l px-2 transition-all"
          style={{ width: `${factPercent}%` }}
        >
          {factPercent > 15 ? `${factPercent}% FATO` : `${factPercent}%`}
        </div>
      </div>
      <div className="text-muted-foreground flex justify-between text-[11px]">
        <span>
          {fakePercent}% {labelFake}
        </span>
        <span>
          {factPercent}% {labelFact}
        </span>
      </div>
    </div>
  );
}

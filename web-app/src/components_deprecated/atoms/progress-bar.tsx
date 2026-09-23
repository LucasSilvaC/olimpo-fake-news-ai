import * as React from "react";

import { cn } from "@/lib/utils";

export interface IProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorClassName?: string;
}

export function ProgressBar({
  className,
  value,
  indicatorClassName,
  ...properties
}: IProgressBarProps): React.ReactElement {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "bg-muted border-border relative h-2.5 w-full overflow-hidden rounded-full border",
        className,
      )}
      {...properties}
    >
      <div
        className={cn(
          "bg-primary h-full w-full flex-1 transition-all duration-300 ease-linear",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - clampedValue}%)` }}
      />
    </div>
  );
}

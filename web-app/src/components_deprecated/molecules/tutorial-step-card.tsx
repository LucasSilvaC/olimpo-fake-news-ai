import * as React from "react";

import { cn } from "@/lib/utils";

export interface ITutorialStepCardProps extends React.HTMLAttributes<HTMLDivElement> {
  stepNumber: number;
  title: string;
  description: string;
}

export function TutorialStepCard({
  className,
  stepNumber,
  title,
  description,
  ...properties
}: ITutorialStepCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "border-border bg-card text-card-foreground flex items-start gap-3.5 rounded-xl border p-4 shadow-xs transition-colors",
        className,
      )}
      {...properties}
    >
      <div className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-base font-black">
        {stepNumber}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

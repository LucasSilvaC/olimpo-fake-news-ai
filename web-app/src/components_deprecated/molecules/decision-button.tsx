import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const decisionVariants = cva(
  "group relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-4 text-center transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0.5",
  {
    variants: {
      variant: {
        fake: "border-border bg-card text-card-foreground hover:border-destructive/80 hover:bg-destructive/10",
        fact: "border-border bg-card text-card-foreground hover:border-primary/80 hover:bg-primary/10",
        doubt:
          "col-span-2 border-border bg-card text-card-foreground hover:bg-muted/60 flex-row gap-2.5 py-3",
      },
    },
    defaultVariants: {
      variant: "fake",
    },
  },
);

export interface IDecisionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof decisionVariants> {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
}

export function DecisionButton({
  className,
  variant,
  icon,
  label,
  subtitle,
  ...properties
}: IDecisionButtonProps): React.ReactElement {
  return (
    <button type="button" className={cn(decisionVariants({ variant }), className)} {...properties}>
      <div className="flex items-center justify-center select-none" aria-hidden="true">
        {icon}
      </div>
      <div className="flex flex-col items-center">
        <span className="text-sm font-extrabold tracking-wide uppercase">{label}</span>
        {subtitle ? (
          <span className="text-muted-foreground text-[11px] font-medium">{subtitle}</span>
        ) : null}
      </div>
    </button>
  );
}

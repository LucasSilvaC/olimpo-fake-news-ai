import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        tag: "rounded border-border bg-primary text-primary-foreground font-mono text-[11px] uppercase tracking-wider",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface IBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...properties }: IBadgeProps): React.ReactElement {
  return <span className={cn(badgeVariants({ variant }), className)} {...properties} />;
}

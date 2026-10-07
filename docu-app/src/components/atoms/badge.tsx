import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold", {
  variants: {
    variant: {
      default: "border-white/40 bg-white/15 text-white",
      primary: "border-transparent bg-amber-400 text-slate-950",
      soft: "border-blue-100 bg-blue-50 text-blue-700",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface IBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...properties }: IBadgeProps): React.ReactElement {
  return <span className={cn(badgeVariants({ variant }), className)} {...properties} />;
}

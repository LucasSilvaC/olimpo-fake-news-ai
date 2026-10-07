import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-300 active:scale-[0.99]",
        outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-blue-50",
        ghost: "text-white hover:bg-white/15",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "min-h-14 px-6 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface IButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, size, variant, ...properties }: IButtonProps): React.ReactElement {
  return <button className={cn(buttonVariants({ size, variant }), className)} {...properties} />;
}

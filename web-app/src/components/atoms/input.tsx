import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
export const inputVariants = cva(
  "flex w-full border text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "h-10 rounded-md bg-background px-3 py-2 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
        registration:
          "h-14 rounded-2xl border-slate-500 bg-slate-50 px-4 py-4 pl-12 pr-12 text-base font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-500 focus-visible:border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
export interface IInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}
export function Input({ className, variant, ...properties }: IInputProps): React.ReactElement {
  return <input className={cn(inputVariants({ variant }), className)} {...properties} />;
}

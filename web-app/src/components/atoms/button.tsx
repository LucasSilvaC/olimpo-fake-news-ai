import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        textonly:
          "h-auto cursor-pointer rounded-none border-0 bg-transparent p-0 font-normal text-inherit underline underline-offset-4 shadow-none transition-[filter] hover:brightness-90",
        default:
          "register-submit-focus h-16 w-full gap-2.5 rounded-2xl bg-amber-400 text-lg font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-300 active:scale-[0.99]",
        cancel:
          "flex h-auto cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-100 px-[22px] py-3.5 text-[13px] font-extrabold text-slate-700 transition-[background,box-shadow,transform] duration-200 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-600 active:scale-[0.99] disabled:cursor-wait disabled:opacity-[0.65] max-[640px]:px-4 max-[640px]:py-[13px]",
        outline: "border bg-background hover:bg-muted",
      },
      size: { unstyled: "", default: "h-10 px-4 py-2", sm: "h-9 px-3", lg: "h-11 px-8" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface IButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  size,
  variant,
  ...properties
}: IButtonProps): React.ReactElement {
  return (
    <button
      className={cn(
        buttonVariants({ size, variant }),
        className,
      )}
      {...properties}
    />
  );
}

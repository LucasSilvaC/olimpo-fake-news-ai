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
        "registration-submit":
          "register-submit-focus h-16 w-full gap-2.5 rounded-2xl bg-amber-400 text-lg font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-300 active:scale-[0.99]",
        default: "bg-primary text-primary-foreground hover:opacity-90",
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
        buttonVariants({
          size:
            size ??
            (variant === "textonly" || variant === "registration-submit" ? "unstyled" : "default"),
          variant,
        }),
        className,
      )}
      {...properties}
    />
  );
}

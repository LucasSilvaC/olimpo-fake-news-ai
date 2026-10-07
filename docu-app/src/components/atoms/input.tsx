import * as React from "react";

import { cn } from "@/lib/utils";

export type IInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...properties }: IInputProps): React.ReactElement {
  return (
    <input
      className={cn("h-10 w-full rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-amber-300", className)}
      {...properties}
    />
  );
}

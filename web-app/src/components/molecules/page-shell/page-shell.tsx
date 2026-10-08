import * as React from "react";

import { cn } from "@/lib/utils";

export interface IPageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageShell({ children, className, ...props }: IPageShellProps): React.ReactElement {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col overflow-hidden bg-[#2563eb] text-white selection:bg-amber-400 selection:text-slate-900",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -left-32 -z-10 size-96 rounded-full bg-blue-300/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-1/4 -z-10 size-96 rounded-full bg-indigo-400/20 blur-3xl"
      />

      {children}
    </div>
  );
}

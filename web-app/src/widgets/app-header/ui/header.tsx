import * as React from "react";

import { cn } from "@/lib/utils";

interface IHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  logo?: React.ReactNode;
}

export function Header({
  className,
  children,
  logo,
  ...properties
}: IHeaderProps): React.ReactElement {
  return (
    <header className={cn("w-full bg-transparent p-3", className)} {...properties}>
      <div className="flex w-full items-center justify-between px-4 sm:px-6">
        <div className="flex shrink-0 items-center">
          {logo ?? <span aria-hidden="true" className="size-10 rounded-md bg-white/20" />}
        </div>
        {children ? <div className="flex items-center gap-6">{children}</div> : null}
      </div>
    </header>
  );
}

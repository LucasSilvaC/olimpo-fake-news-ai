import Image from "next/image";
import Link from "next/link";
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
          {logo ?? (
            <Link
              href="/"
              aria-label="Olimpo — página inicial"
              className="inline-flex items-center"
            >
              <Image
                src="/olimpo-logo.svg"
                alt="Olimpo"
                width={44}
                height={44}
                priority
                className="size-11 object-contain"
              />
            </Link>
          )}
        </div>
        {children ? <div className="flex items-center gap-6">{children}</div> : null}
      </div>
    </header>
  );
}

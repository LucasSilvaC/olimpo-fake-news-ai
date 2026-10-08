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
              className="group inline-flex items-center gap-2.5 rounded-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
            >
              <Image
                src="/olimpo-logo.png"
                alt=""
                width={40}
                height={40}
                priority
                className="size-10 object-contain"
              />
              <span className="text-xl font-black tracking-tight text-white drop-shadow-sm sm:text-2xl">
                Olimpo
              </span>
            </Link>
          )}
        </div>
        {children ? <div className="flex items-center gap-6">{children}</div> : null}
      </div>
    </header>
  );
}

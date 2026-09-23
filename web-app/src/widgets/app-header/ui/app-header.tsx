import { Gamepad2, Newspaper } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { ThemeToggle } from "@/components/molecules/theme-toggle";

export function AppHeader(): React.ReactElement {
  return (
    <header className="border-border bg-background sticky top-0 z-50 border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-xs font-bold tracking-wider uppercase transition-colors"
          >
            Acrux · El Dorado
          </Link>
          <nav aria-label="Navegação entre Módulos" className="flex items-center gap-2 text-xs">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors"
            >
              <Newspaper className="h-3.5 w-3.5" />
              <span>News Parser</span>
            </Link>
            <Link
              href="/olimpo"
              className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold transition-colors"
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              <span>Olimpo Game</span>
            </Link>
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

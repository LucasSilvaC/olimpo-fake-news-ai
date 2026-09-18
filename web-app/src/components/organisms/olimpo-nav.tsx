"use client";

import { BookOpen, Home, PlusCircle, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/atoms/badge";
import { cn } from "@/lib/utils";

interface INavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: INavItem[] = [
  { href: "/olimpo", label: "1. Início / Lobby", shortLabel: "Lobby", icon: Home },
  { href: "/olimpo/game", label: "2. Responder Notícias", shortLabel: "Partida", icon: Zap },
  { href: "/olimpo/ranking", label: "3. Ranking Gamificado", shortLabel: "Ranking", icon: Trophy },
  { href: "/olimpo/tutorial", label: "4. Tutorial", shortLabel: "Tutorial", icon: BookOpen },
  { href: "/olimpo/submit", label: "5. Enviar Notícia", shortLabel: "Enviar", icon: PlusCircle },
];

export function OlimpoNav(): React.ReactElement {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/olimpo") {
      return pathname === "/olimpo";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop & Tablet Top Bar */}
      <header className="border-border bg-card sticky top-0 z-30 border-b shadow-xs">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <Badge variant="tag">OLIMPO v1.0</Badge>
            <span className="text-xs font-black tracking-tight uppercase sm:text-sm">
              Fake-or-Fact // Kahoot
            </span>
          </div>

          {/* Screen Navigation Links */}
          <nav
            aria-label="Navegação das Telas do Olimpo"
            className="hidden items-center gap-1.5 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border-border text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-all",
                    active && "border-primary bg-primary text-primary-foreground shadow-xs",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Bar (Fixed) */}
      <nav
        aria-label="Navegação Inferior Mobile"
        className="border-border bg-card/95 supports-backdrop-filter:bg-card/85 fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t py-1.5 backdrop-blur-xs md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-muted-foreground flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold transition-colors",
                active && "text-foreground font-black",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

import { Radio, Users } from "lucide-react";
import type { Metadata } from "next";
import * as React from "react";

import { OlimpoNav } from "@/components/organisms/olimpo-nav";

export const metadata: Metadata = {
  title: "Olimpo — Fake-or-Fact // Kahoot de Fake News",
  description: "Jogo multiplayer gamificado e educativo de combate à desinformação.",
};

interface IOlimpoLayoutProps {
  children: React.ReactNode;
}

export default function OlimpoLayout({ children }: IOlimpoLayoutProps): React.ReactElement {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Top Navbar */}
      <OlimpoNav />

      {/* Main Responsive Canvas - Full width matching header (max-w-5xl) */}
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-3 px-4 py-6 pb-24 sm:px-6 md:pb-12">
        {/* Room Header Banner */}
        <div className="border-border bg-card text-muted-foreground flex items-center justify-between rounded-xl border px-4 py-2.5 font-mono text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
            <span className="text-foreground font-bold">SALA ATIVA: #404-891</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <Users className="h-3.5 w-3.5" />
            <span>6 JOGADORES CONECTADOS</span>
          </div>
        </div>

        {/* Screen View Container */}
        <div className="border-border bg-card rounded-xl border p-5 shadow-sm sm:p-7">
          {children}
        </div>
      </main>
    </div>
  );
}

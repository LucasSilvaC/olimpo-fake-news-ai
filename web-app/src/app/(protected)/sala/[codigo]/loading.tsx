import { LoaderCircle, Users } from "lucide-react";
import * as React from "react";

import { PageShell } from "@/components/molecules/page-shell";
import { Header } from "@/widgets/app-header";

export default function RoomLoading(): React.ReactElement {
  return (
    <PageShell>
      <Header className="relative z-20" />

      <main
        aria-busy="true"
        aria-live="polite"
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-6"
      >
        <div className="mb-5 flex size-20 items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-xl shadow-blue-950/20 backdrop-blur">
          <LoaderCircle className="size-10 animate-spin text-white" aria-hidden="true" />
        </div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white/95">
          <Users className="size-4" aria-hidden="true" />
          Preparando a sala
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Conectando você à partida...
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-blue-50 sm:text-base">
          Seu acesso foi confirmado. Estamos carregando os jogadores e as informações da sala.
        </p>
        <div className="mt-8 h-2 w-48 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-300" />
        </div>
      </main>
    </PageShell>
  );
}

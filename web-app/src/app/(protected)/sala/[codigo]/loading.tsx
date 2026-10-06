import { LoaderCircle, Radio, Users } from "lucide-react";
import * as React from "react";

export default function RoomLoading(): React.ReactElement {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-40 size-[30rem] rounded-full bg-sky-200/20 blur-3xl"
      />

      <header className="relative z-10 w-full bg-blue-800/15 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2.5 px-4 sm:px-6">
          <span className="flex size-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-lg shadow-blue-950/20">
            <Radio className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">Olimpo</span>
        </div>
      </header>

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
    </div>
  );
}

import { connection } from "next/server";
import * as React from "react";

import { CreateRoomCard } from "./parts/create-room-card";
import { HomeIntro } from "./parts/home-intro";
import { JoinMatchCard } from "./parts/join-match-card";
import { ModeCard } from "./parts/mode-card";

import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import { Header, ProfileProgress } from "@/widgets/app-header";

export async function OlimpoHomePage(): Promise<React.ReactElement> {
  await connection();
  const user = await getSessionUseCase.execute();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#2563eb] text-white selection:bg-amber-400 selection:text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -left-32 -z-10 size-96 rounded-full bg-blue-300/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-8rem] bottom-1/4 -z-10 size-96 rounded-full bg-indigo-400/20 blur-3xl"
      />

      <Header className="relative z-20">
        <ProfileProgress name={user.name} xp={user.xp} avatar={user.avatar} />
      </Header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 -translate-y-6 flex-col items-center justify-center px-4 py-12 sm:px-6 md:-translate-y-8 md:py-16">
        <HomeIntro />

        <section
          aria-label="Modos de jogo"
          className="grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3 md:gap-6"
        >
          <CreateRoomCard creatorName={user.name} />
          <JoinMatchCard />
          <ModeCard
            accent="emerald"
            badge="Treino Individual"
            description="Aprimore seu faro contra fake news com quizzes temáticos diários, missões investigativas e ranking global individual."
            footer="Modo Solo & Quizzes"
            title="Fazer desafios"
            href="/challenge"
          />
        </section>
      </main>
    </div>
  );
}

"use client";

import { ArrowLeft, Copy, Crown, Link2, LoaderCircle, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import type { IRoomLobbyViewProps } from "../model/types";
import { useRoomLobbyViewModel } from "../model/use-room-lobby-view-model";

import { LobbyMemberList } from "./lobby-member-list";
import { LobbyPlaylistPanel } from "./lobby-playlist-panel";
import { LobbyRocket } from "./lobby-rocket";

import { PageShell } from "@/components/molecules/page-shell";
import { Header } from "@/widgets/app-header";


export type { RoomLobbyMember } from "../model/types";

export function RoomLobbyView(props: IRoomLobbyViewProps): React.ReactElement {
  const {
    room,
    newsPreviews,
    currentUserId,
    newsUrl,
    setNewsUrl,
    rounds,
    isAddingNews,
    isLoadingPrepared,
    isStarting,
    isLanding,
    isJoining,
    joinError,
    joinAttemptedRef,
    visibleMembers,
    isHost,
    isMember,
    roomIsWaiting,
    joinRoom,
    copyText,
    copyInviteLink,
    handleAddNews,
    handleStartGame,
    statusLabel,
  } = useRoomLobbyViewModel(props);

  return (
    <PageShell>
      <Header className="relative z-20">
        <Link
          href="/"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar ao início
        </Link>
      </Header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-7 pb-12 sm:px-6 sm:pt-10">
        <section className="mb-7 flex w-full flex-col items-center text-center sm:mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-950/10 backdrop-blur-md">
            <span className="size-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,251,190,0.9)]" />
            <Crown className="size-[18px] fill-amber-300 text-amber-300" aria-hidden="true" />
            <span>
              {isHost ? "Anfitrião · você" : isMember ? "Investigador" : "Entrando na sala"}
            </span>
          </div>

          <LobbyRocket landing={isLanding} />

          <h1
            aria-live="polite"
            className="mt-1 max-w-2xl px-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            {isLanding
              ? "Pouso autorizado!"
              : isHost
                ? "Sua sala está pronta!"
                : "Você está na sala de espera"}
          </h1>
          <p className="mt-2 max-w-xl px-3 text-sm leading-relaxed text-blue-50 sm:text-base">
            {isLanding
              ? "Destino: primeira rodada. Prepare-se para investigar!"
              : isHost
                ? "Compartilhe o código com os investigadores e prepare o baralho para começar."
                : "Aguarde o anfitrião preparar as notícias e iniciar a partida."}
          </p>
        </section>

        <section
          aria-label="Detalhes da sala"
          className="flex w-full flex-col gap-6 rounded-3xl bg-white p-4 text-slate-900 shadow-2xl shadow-blue-950/25 sm:gap-7 sm:p-7"
        >
          <div className="flex flex-col gap-4 rounded-2xl bg-[#f2f4ff] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[155px]">
                <span className="block text-[11px] font-bold tracking-[0.16em] text-slate-500 uppercase">
                  Código de acesso
                </span>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-3xl font-black tracking-[0.12em] text-blue-700 select-all sm:text-4xl">
                    {room.pin}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(room.pin.replace(/\s/g, ""), "Código da sala copiado.")
                    }
                    aria-label="Copiar código da sala"
                    title="Copiar código"
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-white text-blue-700 shadow-sm transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-slate-200 sm:block" />

              <button
                type="button"
                onClick={() => void copyInviteLink()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              >
                <Link2 className="size-4" aria-hidden="true" />
                Copiar link
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-900">
                <span className="size-2 rounded-full bg-emerald-500" />
                {statusLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <Users className="size-4 text-blue-600" aria-hidden="true" />
                {visibleMembers.length} {visibleMembers.length === 1 ? "jogador" : "jogadores"}
              </span>
            </div>
          </div>

          {!isMember && !isHost ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-950">
              {!roomIsWaiting ? (
                <span className="font-semibold">
                  {room.status === "finished"
                    ? "Esta partida foi encerrada e não está aceitando novos jogadores."
                    : "Esta partida já começou e não está aceitando novos jogadores."}
                </span>
              ) : isJoining ? (
                <span className="inline-flex items-center gap-2 font-semibold">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  Entrando na sala...
                </span>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{joinError ?? "Entre na sala para aparecer na lista de jogadores."}</span>
                  <button
                    type="button"
                    onClick={() => {
                      joinAttemptedRef.current = true;
                      void joinRoom();
                    }}
                    className="cursor-pointer rounded-lg bg-blue-700 px-3 py-2 font-bold text-white transition-colors hover:bg-blue-800"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-extrabold tracking-[0.15em] text-slate-500 uppercase">
                  Investigadores na sala
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                  {room.name}
                </h2>
              </div>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-slate-500 uppercase">
                <span className="size-2 rounded-full bg-emerald-500" />
                {roomIsWaiting ? "Aguardando o anfitrião" : statusLabel}
              </span>
            </div>

            <LobbyMemberList
              members={visibleMembers}
              currentUserId={currentUserId}
              hostId={room.hostId}
            />
          </div>

          <LobbyPlaylistPanel
            room={room}
            isHost={isHost}
            roomIsWaiting={roomIsWaiting}
            rounds={rounds}
            newsUrl={newsUrl}
            setNewsUrl={setNewsUrl}
            isAddingNews={isAddingNews}
            isLoadingPrepared={isLoadingPrepared}
            isStarting={isStarting}
            isLanding={isLanding}
            newsPreviews={newsPreviews}
            handleAddNews={handleAddNews}
            handleStartGame={handleStartGame}
          />

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-center text-xs font-medium text-slate-400">
              Compartilhe o código para convidar mais jogadores
            </span>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

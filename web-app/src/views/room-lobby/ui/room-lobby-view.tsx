"use client";

import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  Crown,
  ExternalLink,
  Link2,
  LoaderCircle,
  Play,
  Plus,
  Radio,
  Rocket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { addPlaylistNewsAction } from "@/app/api/rooms/actions/add-playlist-news.action";
import { joinRoomAction } from "@/app/api/rooms/actions/join-room.action";
import { startGameAction } from "@/app/api/rooms/actions/start-game.action";
import type { RoomDTO, RoomMemberDTO } from "@/app/api/rooms/entities";
import { Avatar } from "@/components/atoms/avatar";
import type { AvatarConfig } from "@/lib/avatar";

export interface RoomLobbyMember {
  id: string;
  userId: string;
  name: string;
  role: RoomMemberDTO["role"];
  score: number;
  avatar: AvatarConfig;
}

interface IRoomLobbyViewProps {
  room: RoomDTO;
  members: RoomLobbyMember[];
  playlistCount: number;
  currentUserId: string;
}

const memberCardColors = [
  "border-blue-100 bg-blue-50",
  "border-violet-100 bg-violet-50",
  "border-emerald-100 bg-emerald-50",
  "border-amber-100 bg-amber-50",
] as const;

export function RoomLobbyView({
  room,
  members,
  playlistCount,
  currentUserId,
}: IRoomLobbyViewProps): React.ReactElement {
  const router = useRouter();
  const [newsUrl, setNewsUrl] = React.useState("");
  const [rounds, setRounds] = React.useState(playlistCount);
  const [isAddingNews, setIsAddingNews] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [isJoining, setIsJoining] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const joinAttempted = React.useRef(false);

  const isHost = room.hostId === currentUserId;
  const isMember = members.some((member) => member.userId === currentUserId);
  const roomIsWaiting = room.status === "waiting";

  const joinRoom = React.useCallback(async (): Promise<void> => {
    setIsJoining(true);
    setJoinError(null);

    try {
      const result = await joinRoomAction({ pin: room.pin });
      if (!result.success) {
        setJoinError(result.error);
        return;
      }

      router.refresh();
    } catch {
      setJoinError("Não foi possível entrar na sala. Tente novamente.");
    } finally {
      setIsJoining(false);
    }
  }, [room.pin, router]);

  React.useEffect(() => {
    if (isMember || !roomIsWaiting || joinAttempted.current) return;

    joinAttempted.current = true;
    void joinRoom();
  }, [isMember, joinRoom, roomIsWaiting]);

  React.useEffect(() => {
    const source = new EventSource("/api/rooms/" + encodeURIComponent(room.pin) + "/events");
    const refreshLobby = (): void => router.refresh();
    const openGame = (): void => router.push("/olimpo/game");

    source.addEventListener("MEMBER_JOINED", refreshLobby);
    source.addEventListener("ROUND_STARTED", openGame);

    return () => {
      source.removeEventListener("MEMBER_JOINED", refreshLobby);
      source.removeEventListener("ROUND_STARTED", openGame);
      source.close();
    };
  }, [room.pin, router]);

  const copyText = async (value: string, successMessage: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie o texto.");
    }
  };

  const copyInviteLink = async (): Promise<void> => {
    const inviteUrl = new URL(
      "/sala/" + encodeURIComponent(room.pin),
      window.location.origin,
    ).toString();
    await copyText(inviteUrl, "Link da sala copiado.");
  };

  const handleAddNews = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isAddingNews || !newsUrl.trim()) return;

    setIsAddingNews(true);
    try {
      const result = await addPlaylistNewsAction({
        roomId: room.id,
        news: [{ url: newsUrl.trim() }],
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setRounds(result.totalRounds);
      setNewsUrl("");
      toast.success("Notícia adicionada ao baralho.");
      router.refresh();
    } catch {
      toast.error("Não foi possível adicionar essa notícia. Tente novamente.");
    } finally {
      setIsAddingNews(false);
    }
  };

  const handleStartGame = async (): Promise<void> => {
    if (isStarting || rounds < 1) return;

    setIsStarting(true);
    try {
      const result = await startGameAction({ roomId: room.id });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      router.push("/olimpo/game");
    } catch {
      toast.error("Não foi possível iniciar a partida. Tente novamente.");
    } finally {
      setIsStarting(false);
    }
  };

  const statusLabel =
    room.status === "waiting"
      ? "Aguardando jogadores"
      : room.status === "in_progress"
        ? "Partida em andamento"
        : "Partida encerrada";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] text-white selection:bg-amber-300 selection:text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-40 size-[30rem] rounded-full bg-sky-200/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12rem] bottom-1/4 size-[34rem] rounded-full bg-indigo-300/20 blur-3xl"
      />

      <header className="sticky top-0 z-30 w-full bg-blue-800/15 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white transition-opacity hover:opacity-85"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-lg shadow-blue-950/20">
              <Radio className="size-5" aria-hidden="true" />
            </span>
            Olimpo
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-7 pb-12 sm:px-6 sm:pt-10">
        <section className="mb-7 flex w-full flex-col items-center text-center sm:mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-950/10 backdrop-blur-md">
            <span className="size-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,251,190,0.9)]" />
            <Crown className="size-[18px] fill-amber-300 text-amber-300" aria-hidden="true" />
            <span>
              {isHost ? "Anfitrião · você" : isMember ? "Investigador" : "Entrando na sala"}
            </span>
          </div>

          <div className="relative my-1 flex size-36 items-center justify-center sm:size-44">
            <div
              aria-hidden="true"
              className="absolute inset-2 rounded-full bg-white/25 blur-2xl"
            />
            <div className="relative flex size-28 items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-2xl shadow-blue-950/20 backdrop-blur sm:size-36">
              <Rocket
                className="size-16 -rotate-45 fill-white/15 text-white drop-shadow-lg sm:size-20"
                strokeWidth={1.3}
                aria-hidden="true"
              />
              <span className="absolute top-5 left-2 size-2 rounded-full bg-amber-200 shadow-[0_0_12px_rgba(255,223,159,0.9)]" />
              <span className="absolute right-1 bottom-7 size-2 rounded-full bg-emerald-200 shadow-[0_0_12px_rgba(111,251,190,0.9)]" />
              <span className="absolute right-7 bottom-1 size-1.5 rounded-full bg-white" />
            </div>
          </div>

          <h1 className="mt-1 max-w-2xl px-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {isHost ? "Sua sala está pronta!" : "Você está na sala!"}
          </h1>
          <p className="mt-2 max-w-xl px-3 text-sm leading-relaxed text-blue-50 sm:text-base">
            {isHost
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
                    className="inline-flex size-9 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm transition-colors hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-slate-200 sm:block" />

              <button
                type="button"
                onClick={() => void copyInviteLink()}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
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
                {members.length} {members.length === 1 ? "jogador" : "jogadores"}
              </span>
            </div>
          </div>

          {!isMember && !isHost ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-950">
              {!roomIsWaiting ? (
                <span className="font-semibold">
                  Esta partida já começou e não está aceitando novos jogadores.
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
                      joinAttempted.current = true;
                      void joinRoom();
                    }}
                    className="rounded-lg bg-blue-700 px-3 py-2 font-bold text-white transition-colors hover:bg-blue-800"
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((member, index) => {
                const isYou = member.userId === currentUserId;
                const isMemberHost = member.userId === room.hostId;
                const colorClass = memberCardColors[index % memberCardColors.length];

                return (
                  <div
                    key={member.id}
                    className={
                      "relative flex min-w-0 items-center gap-3 rounded-2xl border p-3 " +
                      colorClass
                    }
                  >
                    <Avatar
                      size="xl"
                      className="size-14 border-2 border-white shadow-sm"
                      skin={member.avatar.skin}
                      outfit={member.avatar.outfit}
                      headwear={member.avatar.headwear}
                      gender={member.avatar.gender}
                      label={"Avatar de " + member.name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-900">
                        {member.name}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        {isYou ? "Você" : isMemberHost ? "Anfitrião" : "Na sala"}
                      </p>
                    </div>
                    {isMemberHost ? (
                      <span className="absolute top-2 right-2" title="Anfitrião da sala">
                        <Crown
                          className="size-4 fill-amber-400 text-amber-500"
                          aria-label="Anfitrião da sala"
                        />
                      </span>
                    ) : null}
                    {isYou && !isMemberHost ? (
                      <span
                        className="absolute top-2 right-2 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                        title="Você está nesta sala"
                      />
                    ) : null}
                  </div>
                );
              })}

              {members.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-medium text-slate-500">
                  Os jogadores aparecerão aqui quando entrarem na sala.
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide text-slate-900 uppercase">
                    Baralho da partida
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {rounds} {rounds === 1 ? "notícia" : "notícias"} · {room.roundDurationSeconds}s
                    por rodada
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
                  <Clock3 className="size-3.5" aria-hidden="true" />
                  {room.roundDurationSeconds} segundos
                </span>
              </div>

              {isHost && roomIsWaiting ? (
                <form
                  onSubmit={(event) => void handleAddNews(event)}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <label className="sr-only" htmlFor="room-news-url">
                    URL de uma notícia para adicionar ao baralho
                  </label>
                  <div className="relative min-w-0 flex-1">
                    <ExternalLink
                      className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="room-news-url"
                      type="url"
                      value={newsUrl}
                      onChange={(event) => setNewsUrl(event.currentTarget.value)}
                      placeholder="Cole a URL de uma notícia"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingNews || !newsUrl.trim()}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-50 px-5 text-sm font-extrabold text-blue-800 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAddingNews ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Plus className="size-4" aria-hidden="true" />
                    )}
                    Adicionar notícia
                  </button>
                </form>
              ) : (
                <p className="text-sm text-slate-500">
                  {rounds > 0
                    ? "O anfitrião já preparou as notícias desta partida."
                    : "O anfitrião está preparando as notícias desta partida."}
                </p>
              )}
            </div>

            {isHost ? (
              <div className="flex flex-col gap-2 lg:min-w-64">
                <button
                  type="button"
                  onClick={() => void handleStartGame()}
                  disabled={!roomIsWaiting || rounds < 1 || isStarting}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 text-sm font-black tracking-wide text-slate-950 shadow-lg shadow-amber-400/30 transition-all hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                >
                  {isStarting ? (
                    <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                  ) : room.status === "in_progress" ? (
                    <Check className="size-5" aria-hidden="true" />
                  ) : (
                    <Play className="size-5 fill-current" aria-hidden="true" />
                  )}
                  {isStarting
                    ? "Iniciando..."
                    : room.status === "in_progress"
                      ? "Partida iniciada"
                      : "Iniciar partida"}
                </button>
                {roomIsWaiting && rounds < 1 ? (
                  <p className="text-center text-xs font-medium text-slate-500">
                    Adicione ao menos uma notícia para iniciar.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-2xl bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600 lg:min-w-64">
                <Radio className="mr-2 size-4 text-emerald-500" aria-hidden="true" />
                Esperando o anfitrião iniciar
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/olimpo/tutorial"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-700"
            >
              Como jogar
            </Link>
            <span className="text-center text-xs font-medium text-slate-400">
              Compartilhe o código para convidar mais jogadores
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

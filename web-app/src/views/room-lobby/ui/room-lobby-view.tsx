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
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { LobbyRocket } from "./lobby-rocket";
import styles from "./room-lobby.module.css";

import { addPlaylistNewsAction } from "@/app/api/rooms/actions/add-playlist-news.action";
import { joinRoomAction } from "@/app/api/rooms/actions/join-room.action";
import { startGameAction } from "@/app/api/rooms/actions/start-game.action";
import type { RoomDTO, RoomMemberDTO } from "@/app/api/rooms/entities";
import { Avatar } from "@/components/atoms/avatar";
import type { AvatarConfig } from "@/lib/avatar";
import { getJoinRoomErrorMessage } from "@/lib/room-messages";
import { Header } from "@/widgets/app-header";

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
  newsPreviews?: {
    id: string;
    roundOrder: number;
    title: string;
    description: string | null;
    publisher: string | null;
    url: string;
  }[];
  currentUserId: string;
}

const memberCardColors = [
  { "--tint": "#edf4ff", "--accent": "#8bb9ff" },
  { "--tint": "#f4efff", "--accent": "#c3abef" },
  { "--tint": "#eaf9f4", "--accent": "#88d7be" },
  { "--tint": "#fff7e8", "--accent": "#efca82" },
] as const;

export function RoomLobbyView({
  room,
  members,
  playlistCount,
  newsPreviews = [],
  currentUserId,
}: IRoomLobbyViewProps): React.ReactElement {
  const router = useRouter();
  const [newsUrl, setNewsUrl] = React.useState("");
  const [rounds, setRounds] = React.useState(playlistCount);
  const [isAddingNews, setIsAddingNews] = React.useState(false);
  const [isStarting, setIsStarting] = React.useState(false);
  const [isLanding, setIsLanding] = React.useState(false);
  const landingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const beginLanding = React.useCallback((): void => {
    if (landingTimer.current !== null) return;
    setIsLanding(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    landingTimer.current = setTimeout(() => router.push("/olimpo/game"), reducedMotion ? 0 : 2200);
  }, [router]);
  React.useEffect(
    () => () => {
      if (landingTimer.current !== null) clearTimeout(landingTimer.current);
    },
    [],
  );
  const [isJoining, setIsJoining] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const joinAttempted = React.useRef(false);
  const unavailableRoomNoticeShown = React.useRef(false);

  const isHost = room.hostId === currentUserId;
  const isMember = members.some((member) => member.userId === currentUserId);
  const roomIsWaiting = room.status === "waiting";

  React.useEffect(() => {
    if (isHost || isMember || roomIsWaiting || unavailableRoomNoticeShown.current) return;

    unavailableRoomNoticeShown.current = true;
    toast.warning(room.status === "finished" ? "Partida encerrada" : "Partida em andamento", {
      description:
        room.status === "finished"
          ? "Esta sala não está mais aceitando jogadores. Peça um novo PIN ao anfitrião."
          : "Esta sala não está aceitando novos jogadores neste momento.",
    });
  }, [isHost, isMember, room.status, roomIsWaiting]);

  const joinRoom = React.useCallback(async (): Promise<void> => {
    setIsJoining(true);
    setJoinError(null);
    const toastId = toast.loading("Conectando à sala...", {
      description: "Estamos confirmando seu acesso.",
    });

    try {
      const result = await joinRoomAction({ pin: room.pin });
      if (!result.success) {
        const message = getJoinRoomErrorMessage(result.error);
        setJoinError(message);
        toast.error("Não foi possível entrar na sala.", {
          id: toastId,
          description: message,
        });
        return;
      }

      toast.success(result.alreadyJoined ? "Você já está nesta sala." : "Você entrou na sala!", {
        id: toastId,
        description: "A lista de jogadores será atualizada agora.",
      });
      router.refresh();
    } catch {
      const message = "Não foi possível conectar à sala. Confira sua conexão e tente novamente.";
      setJoinError(message);
      toast.error("Não foi possível entrar na sala.", { id: toastId, description: message });
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
    const refreshLobby = (event: Event): void => {
      let joinedUserId: string | undefined;
      try {
        const roomEvent = JSON.parse((event as MessageEvent<string>).data) as {
          payload?: { member?: { userId?: string } };
        };
        joinedUserId = roomEvent.payload?.member?.userId;
      } catch {
        joinedUserId = undefined;
      }

      if (joinedUserId !== currentUserId) {
        toast.info("Um jogador entrou na sala.", {
          description: "A lista de participantes foi atualizada.",
        });
      }
      router.refresh();
    };
    const openGame = (): void => {
      if (!isHost) {
        toast.info("A partida começou!", { description: "Abrindo a primeira rodada..." });
      }
      beginLanding();
    };

    source.addEventListener("MEMBER_JOINED", refreshLobby);
    source.addEventListener("ROUND_STARTED", openGame);

    return () => {
      source.removeEventListener("MEMBER_JOINED", refreshLobby);
      source.removeEventListener("ROUND_STARTED", openGame);
      source.close();
    };
  }, [beginLanding, currentUserId, isHost, room.pin, router]);

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
    if (isAddingNews) return;

    const normalizedNewsUrl = newsUrl.trim();
    if (!normalizedNewsUrl) {
      toast.warning("Adicione uma notícia", {
        description: "Cole o link de uma notícia para incluí-la no baralho.",
      });
      return;
    }

    try {
      const parsedUrl = new URL(normalizedNewsUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Unsupported URL protocol");
      }
    } catch {
      toast.warning("Link inválido", {
        description: "Use o endereço completo de uma notícia, começando com http:// ou https://.",
      });
      return;
    }

    setIsAddingNews(true);
    try {
      const result = await addPlaylistNewsAction({
        roomId: room.id,
        news: [{ url: normalizedNewsUrl }],
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
    if (isStarting) return;
    if (rounds < 1) {
      toast.warning("O baralho está vazio", {
        description: "Adicione ao menos uma notícia antes de iniciar a partida.",
      });
      return;
    }

    setIsStarting(true);
    const toastId = toast.loading("Iniciando a partida...", {
      description: "Preparando a primeira rodada.",
    });

    try {
      const result = await startGameAction({ roomId: room.id });
      if (!result.success) {
        toast.error("Não foi possível iniciar a partida.", {
          id: toastId,
          description: result.error,
        });
        return;
      }

      toast.success("Partida iniciada!", {
        id: toastId,
        description: "Abrindo a primeira rodada...",
      });
      beginLanding();
    } catch {
      toast.error("Não foi possível iniciar a partida.", {
        id: toastId,
        description: "Confira sua conexão e tente novamente.",
      });
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

      <Header
        className="relative z-20"
        logo={
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white transition-opacity hover:opacity-85 sm:text-xl"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-blue-600 shadow-lg shadow-blue-950/20">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            Olimpo
          </Link>
        }
      >
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
                {members.length} {members.length === 1 ? "jogador" : "jogadores"}
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
                      joinAttempted.current = true;
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member, index) => {
                const isYou = member.userId === currentUserId;
                const isMemberHost = member.userId === room.hostId;
                const palette = memberCardColors[index % memberCardColors.length];

                return (
                  <div
                    key={member.id}
                    className={styles.member}
                    data-you={isYou}
                    style={palette as React.CSSProperties}
                  >
                    <div className={styles.portrait}>
                      <Avatar
                        size="xl"
                        part="face"
                        className={styles.avatar}
                        skin={member.avatar.skin}
                        outfit={member.avatar.outfit}
                        headwear={member.avatar.headwear}
                        gender={member.avatar.gender}
                        label={"Avatar de " + member.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-extrabold text-slate-900"
                        title={member.name}
                      >
                        {member.name}
                        {isYou ? <span className={styles.you}>VOCÊ</span> : null}
                      </p>
                      <p className={`${styles.role} ${isMemberHost ? styles.hostRole : ""}`}>
                        {isMemberHost ? (
                          <Crown className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Users className="size-3.5" aria-hidden="true" />
                        )}
                        {isMemberHost ? "Anfitrião da sala" : "Investigador"}
                      </p>
                    </div>
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
                  noValidate
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
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingNews}
                    className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-50 px-5 text-sm font-extrabold text-blue-800 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                  disabled={!roomIsWaiting || isStarting || isLanding}
                  className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 text-sm font-black tracking-wide text-slate-950 shadow-lg shadow-amber-400/30 transition-all hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
                >
                  {isStarting ? (
                    <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                  ) : room.status === "in_progress" ? (
                    <Check className="size-5" aria-hidden="true" />
                  ) : (
                    <Play className="size-5 fill-current" aria-hidden="true" />
                  )}
                  {isLanding
                    ? "Aterrissando..."
                    : isStarting
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

          {isHost ? (
            <section
              aria-label="Notícias adicionadas"
              className="space-y-3 border-t border-slate-100 pt-4"
            >
              <h3 className="text-sm font-bold text-slate-900">Notícias adicionadas</h3>
              {newsPreviews.length > 0 ? (
                <ol className="grid gap-3 sm:grid-cols-2">
                  {newsPreviews.map((news) => (
                    <li
                      key={news.id}
                      className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-extrabold text-blue-800">
                        {news.roundOrder}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 truncate text-xs text-slate-500">
                          {news.publisher ?? "Fonte da notícia"}
                        </p>
                        <a
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex cursor-pointer items-start gap-2 rounded text-sm font-bold text-slate-900 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
                        >
                          <span className="line-clamp-2">{news.title}</span>
                          <ExternalLink
                            className="mt-0.5 size-3.5 shrink-0 text-blue-600"
                            aria-hidden="true"
                          />
                          <span className="sr-only">(abre em uma nova aba)</span>
                        </a>
                        {news.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                            {news.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  As notícias adicionadas ao baralho aparecerão aqui.
                </p>
              )}
            </section>
          ) : null}

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-center text-xs font-medium text-slate-400">
              Compartilhe o código para convidar mais jogadores
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

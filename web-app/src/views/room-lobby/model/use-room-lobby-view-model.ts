"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import type { IRoomLobbyViewProps } from "./types";

import { addPlaylistNewsAction } from "@/app/api/rooms/actions/add-playlist-news.action";
import { joinRoomAction } from "@/app/api/rooms/actions/join-room.action";
import { loadDemoNewsAction } from "@/app/api/rooms/actions/load-demo-news.action";
import { startGameAction } from "@/app/api/rooms/actions/start-game.action";
import { getJoinRoomErrorMessage } from "@/lib/room-messages";


export function useRoomLobbyViewModel({
  room,
  members,
  playlistCount,
  newsPreviews = [],
  currentUserId,
  preparationNews = [],
}: IRoomLobbyViewProps) {
  const router = useRouter();
  const [newsUrl, setNewsUrl] = React.useState("");
  const [rounds, setRounds] = React.useState(playlistCount);
  const [isAddingNews, setIsAddingNews] = React.useState(false);
  const [isLoadingPrepared, setIsLoadingPrepared] = React.useState(false);
  const preparedAttempt = React.useRef<string | null>(null);
  const [isStarting, setIsStarting] = React.useState(false);
  const [isLanding, setIsLanding] = React.useState(false);
  const landingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const beginLanding = React.useCallback((): void => {
    if (landingTimer.current !== null) return;
    setIsLanding(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    landingTimer.current = setTimeout(() => router.refresh(), reducedMotion ? 0 : 2200);
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
  const [presenceSnapshot, setPresenceSnapshot] = React.useState<{
    pin: string;
    userIds: string[];
  } | null>(null);
  const visibleMembers =
    presenceSnapshot?.pin === room.pin
      ? members.filter(
          (member) =>
            member.userId === room.hostId || presenceSnapshot.userIds.includes(member.userId),
        )
      : members;

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
    const updatePresence = (event: Event): void => {
      try {
        const data = JSON.parse((event as MessageEvent<string>).data) as {
          pin?: string;
          payload?: { userIds?: unknown };
        };
        const userIds = data.payload?.userIds;
        if (
          data.pin !== room.pin ||
          !Array.isArray(userIds) ||
          !userIds.every((id): id is string => typeof id === "string")
        ) {
          return;
        }
        setPresenceSnapshot((previous) =>
          previous?.pin === room.pin &&
          previous.userIds.length === userIds.length &&
          previous.userIds.every((id, index) => id === userIds[index])
            ? previous
            : { pin: room.pin, userIds },
        );
      } catch {
        // Keep the last valid snapshot until the next heartbeat or reconnection.
      }
    };

    source.addEventListener("MEMBER_JOINED", refreshLobby);
    source.addEventListener("PRESENCE_CHANGED", updatePresence);
    source.addEventListener("ROUND_STARTED", openGame);

    return () => {
      source.removeEventListener("MEMBER_JOINED", refreshLobby);
      source.removeEventListener("PRESENCE_CHANGED", updatePresence);
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

  React.useEffect(() => {
    if (!isHost || !roomIsWaiting || !preparationNews.length || preparedAttempt.current === room.id)
      return;
    preparedAttempt.current = room.id;
    setIsLoadingPrepared(true);
    void (async () => {
      try {
        const result = await loadDemoNewsAction({
          roomId: room.id,
          fixtureIds: preparationNews.map((news) => news.id),
        });
        if (!result.success) {
          toast.error(result.error, { description: "Atualize a página para tentar novamente." });
          return;
        }
        setRounds(result.totalRounds);
        router.replace("/sala/" + encodeURIComponent(room.pin), { scroll: false });
        router.refresh();
      } catch {
        toast.error("Não foi possível carregar as notícias preparadas.", {
          description: "Atualize a página para tentar novamente.",
        });
      } finally {
        setIsLoadingPrepared(false);
      }
    })();
  }, [isHost, roomIsWaiting, preparationNews, room.id, room.pin, router]);

  const statusLabel =
    room.status === "waiting"
      ? "Aguardando jogadores"
      : room.status === "in_progress"
        ? "Partida em andamento"
        : "Partida encerrada";

  return {
    room,
    members,
    playlistCount,
    newsPreviews,
    currentUserId,
    preparationNews,
    newsUrl,
    setNewsUrl,
    rounds,
    isAddingNews,
    isLoadingPrepared,
    isStarting,
    isLanding,
    isJoining,
    joinError,
    joinAttemptedRef: joinAttempted,
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
  };
}

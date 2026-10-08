import { notFound } from "next/navigation";

import { drizzleNewsArticleRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-article.repository";
import { drizzleUserRepository } from "@/app/api/auth/repositories/drizzle-user.repository";
import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import { drizzleNewsVoteRepository } from "@/app/api/news-voting/repositories/drizzle-news-vote.repository";
import { redisVoteRepository } from "@/app/api/news-voting/repositories/redis-vote.repository";
import { RoomPin } from "@/app/api/rooms/entities/room-pin.vo";
import { drizzleRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import {
  RoomGameView,
  type IUserVoteState,
  type RoomGameMember,
  type RoomGamePlaylistItem,
} from "@/views/room-game";
import { RoomLobbyView, type RoomLobbyMember } from "@/views/room-lobby";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<React.ReactElement> {
  const [{ codigo }, user] = await Promise.all([params, getSessionUseCase.execute()]);
  let decodedCodigo: string;
  try {
    decodedCodigo = decodeURIComponent(codigo);
  } catch {
    notFound();
  }
  const pin = RoomPin.normalize(decodedCodigo);

  if (!RoomPin.isValid(pin)) {
    notFound();
  }

  const room = await drizzleRoomRepository.findByPin(pin);
  if (!room) {
    notFound();
  }

  const [roomMembers, playlistItems] = await Promise.all([
    drizzleRoomRepository.listMembers(room.id),
    drizzleRoomRepository.getPlaylistItems(room.id),
  ]);

  const members = await Promise.all(
    roomMembers.map(async (roomMember): Promise<RoomLobbyMember> => {
      const [profile, avatar] = await Promise.all([
        drizzleUserRepository.findById(roomMember.userId),
        drizzleUserRepository.findAvatarByUserId(roomMember.userId),
      ]);

      return {
        id: roomMember.id,
        userId: roomMember.userId,
        name: profile?.name ?? "Investigador",
        role: roomMember.role,
        score: roomMember.score,
        avatar: avatar ?? DEFAULT_AVATAR,
      };
    }),
  );

  if (room.status === "in_progress" || room.status === "finished") {
    const playlistArticles: RoomGamePlaylistItem[] = await Promise.all(
      playlistItems.map(async (item) => {
        const articleRecord = await drizzleNewsArticleRepository.findById(item.articleId);
        const article = articleRecord?.article;
        return {
          id: item.id,
          roundOrder: item.roundOrder,
          title: article?.title ?? "Notícia sem título",
          description: article?.description ?? null,
          publisher: article?.publisher ?? null,
          authors: article?.authors ?? [],
          publishedAt: article?.publishedAt ?? null,
          imageUrl: article?.imageUrl ?? null,
          url: article?.url ?? "",
          content: article?.content ?? "",
        };
      }),
    );

    const activeItem = playlistItems.find((item) => item.roundOrder === room.currentRound);
    const initialRoundClosed = activeItem
      ? await redisVoteRepository.isRoundCompleted(room.id, room.currentRound)
      : false;
    let initialVote: IUserVoteState | null = null;
    if (activeItem) {
      const existingVote = await drizzleNewsVoteRepository.findByParticipantAndPlaylistItem(
        activeItem.id,
        user.id,
      );
      if (existingVote) {
        const articleRecord = initialRoundClosed
          ? await drizzleNewsArticleRepository.findById(activeItem.articleId)
          : null;

        initialVote = {
          vote: existingVote.vote,
          pointsAwarded: initialRoundClosed ? existingVote.pointsAwarded : 0,
          isCorrect: initialRoundClosed ? existingVote.isCorrect : null,
          officialAnswer: articleRecord?.targetClassification ?? null,
        };
      }
    }

    const gameMembers: RoomGameMember[] = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.name,
      role: m.role,
      score: m.score,
    }));

    return (
      <RoomGameView
        room={{
          id: room.id,
          pin: room.pin,
          name: room.name,
          hostId: room.hostId,
          status: room.status,
          roundDurationSeconds: room.roundDurationSeconds,
          roundStartedAt: room.updatedAt?.toISOString(),
          currentRound: room.currentRound,
          totalRounds: room.totalRounds,
        }}
        members={gameMembers}
        playlistArticles={playlistArticles}
        currentUserId={user.id}
        initialVote={initialVote}
        initialRoundClosed={initialRoundClosed}
      />
    );
  }

  const newsPreviews =
    room.hostId === user.id
      ? await Promise.all(
          playlistItems.map(async (item) => {
            const article = await drizzleNewsArticleRepository.findById(item.articleId);
            return {
              id: item.id,
              roundOrder: item.roundOrder,
              title: article?.article.title ?? "Notícia sem título",
              description: article?.article.description ?? null,
              publisher: article?.article.publisher ?? null,
              url: article?.article.url ?? "",
            };
          }),
        )
      : [];

  return (
    <RoomLobbyView
      room={{
        id: room.id,
        pin: room.pin,
        name: room.name,
        hostId: room.hostId,
        status: room.status,
        roundDurationSeconds: room.roundDurationSeconds,
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
      }}
      members={members}
      playlistCount={playlistItems.length}
      newsPreviews={newsPreviews}
      currentUserId={user.id}
    />
  );
}

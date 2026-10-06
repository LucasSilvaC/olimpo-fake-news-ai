import { notFound } from "next/navigation";

import { drizzleNewsArticleRepository } from "@/app/api/ai-feedback/repositories/drizzle-news-article.repository";
import { drizzleUserRepository } from "@/app/api/auth/repositories/drizzle-user.repository";
import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";
import { RoomPin } from "@/app/api/rooms/entities/room-pin.vo";
import { drizzleRoomRepository } from "@/app/api/rooms/repositories/drizzle-room.repository";
import { DEFAULT_AVATAR } from "@/lib/avatar";
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

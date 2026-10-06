import { notFound } from "next/navigation";

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
  const pin = RoomPin.normalize(codigo);

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
      currentUserId={user.id}
    />
  );
}

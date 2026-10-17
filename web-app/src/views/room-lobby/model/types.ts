import type { RoomDTO, RoomMemberDTO } from "@/app/api/rooms/entities";
import type { AvatarConfig } from "@/lib/avatar";

export interface RoomLobbyMember {
  id: string;
  userId: string;
  name: string;
  role: RoomMemberDTO["role"];
  score: number;
  avatar: AvatarConfig;
}

export interface RoomLobbyNewsPreview {
  id: string;
  roundOrder: number;
  title: string;
  description: string | null;
  publisher: string | null;
  url: string;
}

export interface IRoomLobbyViewProps {
  room: RoomDTO;
  members: RoomLobbyMember[];
  playlistCount: number;
  newsPreviews?: RoomLobbyNewsPreview[];
  currentUserId: string;
  preparationNews?: { id: string; title: string }[];
}

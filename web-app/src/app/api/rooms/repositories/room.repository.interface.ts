import type { PlaylistItemDTO, PlaylistItemEntityProps, RoomDTO, RoomEntityProps, RoomMemberDTO, RoomMemberEntityProps } from "../entities";

import type { RoomStatus } from "@/server/shared/domain/game-vocabulary";

export interface IRoomRepository {
  findById(id: string): Promise<RoomDTO | null>;
  findByPin(pin: string): Promise<RoomDTO | null>;
  create(data: RoomEntityProps): Promise<RoomDTO>;
  updateStatus(
    id: string,
    status: RoomStatus,
    currentRound?: number,
    totalRounds?: number,
  ): Promise<RoomDTO>;
  updateRoom(id: string, data: Partial<RoomDTO>): Promise<RoomDTO>;
  addMember(data: RoomMemberEntityProps): Promise<RoomMemberDTO>;
  findMember(roomId: string, userId: string): Promise<RoomMemberDTO | null>;
  listMembers(roomId: string): Promise<RoomMemberDTO[]>;
  countMembers(roomId: string): Promise<number>;
  updateMemberScore(roomId: string, userId: string, scoreDelta: number): Promise<RoomMemberDTO>;
  addPlaylistItems(items: PlaylistItemEntityProps[]): Promise<PlaylistItemDTO[]>;
  getPlaylistItems(roomId: string): Promise<PlaylistItemDTO[]>;
}

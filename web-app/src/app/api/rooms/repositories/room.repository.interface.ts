import {
  Room,
  NewRoom,
  RoomMember,
  NewRoomMember,
  RoomPlaylistItem,
  NewRoomPlaylistItem,
  RoomStatus,
} from "@/server/shared/database/schemas";

export interface IRoomRepository {
  findById(id: string): Promise<Room | null>;
  findByPin(pin: string): Promise<Room | null>;
  create(data: NewRoom): Promise<Room>;
  updateStatus(
    id: string,
    status: RoomStatus,
    currentRound?: number,
    totalRounds?: number,
  ): Promise<Room>;
  updateRoom(id: string, data: Partial<NewRoom>): Promise<Room>;
  addMember(data: NewRoomMember): Promise<RoomMember>;
  findMember(roomId: string, userId: string): Promise<RoomMember | null>;
  listMembers(roomId: string): Promise<RoomMember[]>;
  countMembers(roomId: string): Promise<number>;
  addPlaylistItems(items: NewRoomPlaylistItem[]): Promise<RoomPlaylistItem[]>;
  getPlaylistItems(roomId: string): Promise<RoomPlaylistItem[]>;
}

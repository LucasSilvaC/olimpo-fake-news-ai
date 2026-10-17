import { and, asc, count, eq, sql } from "drizzle-orm";

import type {
  PlaylistItemDTO,
  PlaylistItemEntityProps,
  RoomDTO,
  RoomEntityProps,
  RoomMemberDTO,
  RoomMemberEntityProps,
} from "../entities";
import { PlaylistItemEntity, RoomEntity, RoomMemberEntity } from "../entities";

import type { IRoomRepository } from "./room.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import {
  roomMembers,
  roomPlaylistItems,
  rooms,
} from "@/server/shared/database/schemas";
import type {
  NewRoom,
  NewRoomMember,
  NewRoomPlaylistItem,
  Room,
  RoomMember,
  RoomPlaylistItem,
} from "@/server/shared/database/schemas";
import type { RoomStatus } from "@/server/shared/domain/game-vocabulary";

const toRoomEntity = (row: Room): RoomEntity => new RoomEntity(row);
const toRoomMemberEntity = (row: RoomMember): RoomMemberEntity => new RoomMemberEntity(row);
const toPlaylistItemEntity = (row: RoomPlaylistItem): PlaylistItemEntity =>
  new PlaylistItemEntity(row);

export class DrizzleRoomRepository implements IRoomRepository {
  constructor(private readonly db = databaseClient) {}

  async findById(id: string): Promise<RoomDTO | null> {
    const [found] = await this.db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return found ? toRoomEntity(found).toDTO() : null;
  }

  async findByPin(pin: string): Promise<RoomDTO | null> {
    const [found] = await this.db.select().from(rooms).where(eq(rooms.pin, pin)).limit(1);
    return found ? toRoomEntity(found).toDTO() : null;
  }

  async create(props: RoomEntityProps): Promise<RoomDTO> {
    const data = new RoomEntity(props);
    const values: NewRoom = {
      id: data.id,
      pin: data.pin,
      name: data.name,
      hostId: data.hostId,
      status: data.status,
      roundDurationSeconds: data.roundDurationSeconds,
      currentRound: data.currentRound,
      totalRounds: data.totalRounds,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    const [created] = await this.db.insert(rooms).values(values).returning();
    if (!created) throw new Error("Failed to create room record");
    return toRoomEntity(created).toDTO();
  }

  async updateStatus(
    id: string,
    status: RoomStatus,
    currentRound?: number,
    totalRounds?: number,
  ): Promise<RoomDTO> {
    const updateData: Partial<NewRoom> = { status, updatedAt: new Date() };
    if (currentRound !== undefined) updateData.currentRound = currentRound;
    if (totalRounds !== undefined) updateData.totalRounds = totalRounds;
    const [updated] = await this.db.update(rooms).set(updateData).where(eq(rooms.id, id)).returning();
    if (!updated) throw new Error(`Room with id "${id}" not found`);
    return toRoomEntity(updated).toDTO();
  }

  async updateRoom(id: string, data: Partial<RoomDTO>): Promise<RoomDTO> {
    const updateData: Partial<NewRoom> = {
      name: data.name,
      status: data.status,
      roundDurationSeconds: data.roundDurationSeconds,
      currentRound: data.currentRound,
      totalRounds: data.totalRounds,
      updatedAt: new Date(),
    };
    const [updated] = await this.db.update(rooms).set(updateData).where(eq(rooms.id, id)).returning();
    if (!updated) throw new Error(`Room with id "${id}" not found`);
    return toRoomEntity(updated).toDTO();
  }

  async addMember(props: RoomMemberEntityProps): Promise<RoomMemberDTO> {
    const data = new RoomMemberEntity(props);
    const values: NewRoomMember = {
      id: data.id,
      roomId: data.roomId,
      userId: data.userId,
      role: data.role,
      score: data.score,
      joinedAt: data.joinedAt,
    };
    const [created] = await this.db.insert(roomMembers).values(values).returning();
    if (!created) throw new Error("Failed to add member to room");
    return toRoomMemberEntity(created).toDTO();
  }

  async findMember(roomId: string, userId: string): Promise<RoomMemberDTO | null> {
    const [found] = await this.db
      .select()
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .limit(1);
    return found ? toRoomMemberEntity(found).toDTO() : null;
  }

  async listMembers(roomId: string): Promise<RoomMemberDTO[]> {
    const rows = await this.db.select().from(roomMembers).where(eq(roomMembers.roomId, roomId));
    return rows.map((row) => toRoomMemberEntity(row).toDTO());
  }

  async countMembers(roomId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(roomMembers)
      .where(eq(roomMembers.roomId, roomId));
    return result ? Number(result.value) : 0;
  }

  async updateMemberScore(
    roomId: string,
    userId: string,
    scoreDelta: number,
  ): Promise<RoomMemberDTO> {
    const [updated] = await this.db
      .update(roomMembers)
      .set({ score: sql`${roomMembers.score} + ${scoreDelta}` })
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .returning();
    if (!updated) throw new Error(`Member with userId "${userId}" in room "${roomId}" not found`);
    return toRoomMemberEntity(updated).toDTO();
  }

  async addPlaylistItems(items: PlaylistItemEntityProps[]): Promise<PlaylistItemDTO[]> {
    if (items.length === 0) return [];
    const values: NewRoomPlaylistItem[] = items.map((props) => {
      const item = new PlaylistItemEntity(props);
      return {
        id: item.id,
        roomId: item.roomId,
        articleId: item.articleId,
        roundOrder: item.roundOrder,
        createdAt: item.createdAt,
      };
    });
    const rows = await this.db.insert(roomPlaylistItems).values(values).returning();
    return rows.map((row) => toPlaylistItemEntity(row).toDTO());
  }

  async getPlaylistItems(roomId: string): Promise<PlaylistItemDTO[]> {
    const rows = await this.db
      .select()
      .from(roomPlaylistItems)
      .where(eq(roomPlaylistItems.roomId, roomId))
      .orderBy(asc(roomPlaylistItems.roundOrder));
    return rows.map((row) => toPlaylistItemEntity(row).toDTO());
  }
}

export const drizzleRoomRepository = new DrizzleRoomRepository();

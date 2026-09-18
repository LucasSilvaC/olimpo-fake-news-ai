import { and, asc, count, eq, sql } from "drizzle-orm";

import { IRoomRepository } from "./room.repository.interface";

import { databaseClient } from "@/server/shared/database/client";
import {
  rooms,
  roomMembers,
  roomPlaylistItems,
  Room,
  NewRoom,
  RoomMember,
  NewRoomMember,
  RoomPlaylistItem,
  NewRoomPlaylistItem,
  RoomStatus,
} from "@/server/shared/database/schemas";

export class DrizzleRoomRepository implements IRoomRepository {
  constructor(private readonly db = databaseClient) {}

  async findById(id: string): Promise<Room | null> {
    const [found] = await this.db.select().from(rooms).where(eq(rooms.id, id)).limit(1);

    return found ?? null;
  }

  async findByPin(pin: string): Promise<Room | null> {
    const [found] = await this.db.select().from(rooms).where(eq(rooms.pin, pin)).limit(1);

    return found ?? null;
  }

  async create(data: NewRoom): Promise<Room> {
    const [created] = await this.db.insert(rooms).values(data).returning();

    if (!created) {
      throw new Error("Failed to create room record");
    }

    return created;
  }

  async updateStatus(
    id: string,
    status: RoomStatus,
    currentRound?: number,
    totalRounds?: number,
  ): Promise<Room> {
    const updateData: Partial<NewRoom> = {
      status,
      updatedAt: new Date(),
    };

    if (currentRound !== undefined) {
      updateData.currentRound = currentRound;
    }

    if (totalRounds !== undefined) {
      updateData.totalRounds = totalRounds;
    }

    const [updated] = await this.db
      .update(rooms)
      .set(updateData)
      .where(eq(rooms.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Room with id "${id}" not found`);
    }

    return updated;
  }

  async updateRoom(id: string, data: Partial<NewRoom>): Promise<Room> {
    const [updated] = await this.db
      .update(rooms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Room with id "${id}" not found`);
    }

    return updated;
  }

  async addMember(data: NewRoomMember): Promise<RoomMember> {
    const [created] = await this.db.insert(roomMembers).values(data).returning();

    if (!created) {
      throw new Error("Failed to add member to room");
    }

    return created;
  }

  async findMember(roomId: string, userId: string): Promise<RoomMember | null> {
    const members = await this.db.select().from(roomMembers).where(eq(roomMembers.roomId, roomId));

    const found = members.find((m) => m.userId === userId);
    return found ?? null;
  }

  async listMembers(roomId: string): Promise<RoomMember[]> {
    return this.db.select().from(roomMembers).where(eq(roomMembers.roomId, roomId));
  }

  async countMembers(roomId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(roomMembers)
      .where(eq(roomMembers.roomId, roomId));

    return result ? Number(result.value) : 0;
  }

  async updateMemberScore(roomId: string, userId: string, scoreDelta: number): Promise<RoomMember> {
    const [updated] = await this.db
      .update(roomMembers)
      .set({
        score: sql`${roomMembers.score} + ${scoreDelta}`,
      })
      .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
      .returning();

    if (!updated) {
      throw new Error(`Member with userId "${userId}" in room "${roomId}" not found`);
    }

    return updated;
  }

  async addPlaylistItems(items: NewRoomPlaylistItem[]): Promise<RoomPlaylistItem[]> {
    if (items.length === 0) return [];
    return this.db.insert(roomPlaylistItems).values(items).returning();
  }

  async getPlaylistItems(roomId: string): Promise<RoomPlaylistItem[]> {
    return this.db
      .select()
      .from(roomPlaylistItems)
      .where(eq(roomPlaylistItems.roomId, roomId))
      .orderBy(asc(roomPlaylistItems.roundOrder));
  }
}

export const drizzleRoomRepository = new DrizzleRoomRepository();

import { eq, sql } from "drizzle-orm";

import { IUserRepository } from "./user.repository.interface";

import { AvatarConfig, avatarConfigSchema, DEFAULT_AVATAR } from "@/lib/avatar";
import { databaseClient } from "@/server/shared/database/client";
import { users, userAvatars, User, NewUser } from "@/server/shared/database/schemas";

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db = databaseClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const [result] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    return result ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const [result] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    return result ?? null;
  }

  async create(data: NewUser, avatar: AvatarConfig = DEFAULT_AVATAR): Promise<User> {
    const avatarConfig = avatarConfigSchema.parse(avatar);

    return this.db.transaction(async (transaction) => {
      const [created] = await transaction
        .insert(users)
        .values({
          ...data,
          email: data.email.toLowerCase().trim(),
          xp: data.xp ?? 0,
        })
        .returning();

      if (!created) {
        throw new Error("Failed to create user record");
      }

      await transaction.insert(userAvatars).values({ userId: created.id, ...avatarConfig });

      return created;
    });
  }

  async updateXp(id: string, xpDelta: number): Promise<User> {
    const [updated] = await this.db
      .update(users)
      .set({
        xp: sql`${users.xp} + ${xpDelta}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new Error(`User with id "${id}" not found`);
    }

    return updated;
  }
}

export const drizzleUserRepository = new DrizzleUserRepository();

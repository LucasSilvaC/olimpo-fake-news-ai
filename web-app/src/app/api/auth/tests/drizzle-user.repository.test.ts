import { describe, expect, it, vi } from "vitest";

import { DrizzleUserRepository } from "../repositories/drizzle-user.repository";

import { AvatarConfig, DEFAULT_AVATAR } from "@/lib/avatar";
import { databaseClient } from "@/server/shared/database/client";
import { NewUser, User, userAvatars, users } from "@/server/shared/database/schemas";

const newUser: NewUser = {
  id: "athena-id",
  name: "Athena",
  email: " ATHENA@EXAMPLE.COM ",
  passwordHash: "hashed-secret",
};
const createdUser: User = {
  ...newUser,
  email: "athena@example.com",
  role: "participant",
  xp: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createTransactionalDatabase(avatarInsertFails = false, userInsertEmpty = false) {
  const userValues = vi.fn(() => ({
    returning: vi.fn(async () => (userInsertEmpty ? [] : [createdUser])),
  }));
  const avatarValues = vi.fn(async () => {
    if (avatarInsertFails) throw new Error("Avatar persistence failed");
  });
  const insert = vi.fn((table) => ({ values: table === users ? userValues : avatarValues }));
  const transaction = vi.fn(async (callback) => callback({ insert }));
  const db = { transaction } as unknown as typeof databaseClient;
  return { db, transaction, insert, userValues, avatarValues };
}

describe("DrizzleUserRepository avatar persistence", () => {
  it("inserts the selected avatar and normalized user inside one transaction", async () => {
    const database = createTransactionalDatabase();
    const avatar: AvatarConfig = {
      gender: "female",
      skin: "#593d32",
      outfit: "armor",
      headwear: "helmet",
    };
    const result = await new DrizzleUserRepository(database.db).create(newUser, avatar);
    expect(result).toBe(createdUser);
    expect(database.transaction).toHaveBeenCalledOnce();
    expect(database.insert.mock.calls.map(([table]) => table)).toEqual([users, userAvatars]);
    expect(database.userValues).toHaveBeenCalledWith({
      ...newUser,
      email: "athena@example.com",
      xp: 0,
    });
    expect(database.avatarValues).toHaveBeenCalledWith({ userId: createdUser.id, ...avatar });
  });

  it("persists a default avatar for older repository callers", async () => {
    const database = createTransactionalDatabase();
    await new DrizzleUserRepository(database.db).create(newUser);
    expect(database.avatarValues).toHaveBeenCalledWith({
      userId: createdUser.id,
      ...DEFAULT_AVATAR,
    });
  });

  it("propagates avatar insertion failure out of the transaction so the database rolls back", async () => {
    const database = createTransactionalDatabase(true);
    await expect(new DrizzleUserRepository(database.db).create(newUser)).rejects.toThrow(
      "Avatar persistence failed",
    );
    await expect(database.transaction.mock.results[0]?.value).rejects.toThrow(
      "Avatar persistence failed",
    );
    expect(database.transaction).toHaveBeenCalledOnce();
  });

  it("does not insert an orphan avatar if user insertion returns no row", async () => {
    const database = createTransactionalDatabase(false, true);
    await expect(new DrizzleUserRepository(database.db).create(newUser)).rejects.toThrow(
      "Failed to create user record",
    );
    expect(database.avatarValues).not.toHaveBeenCalled();
  });

  it("rejects invalid avatar data before opening a transaction", async () => {
    const database = createTransactionalDatabase();
    await expect(
      new DrizzleUserRepository(database.db).create(newUser, {
        ...DEFAULT_AVATAR,
        headwear: "invalid",
      } as unknown as AvatarConfig),
    ).rejects.toThrow();
    expect(database.transaction).not.toHaveBeenCalled();
  });
});

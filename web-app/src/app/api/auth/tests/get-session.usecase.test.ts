import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetSessionUseCase } from "../usecase/get-session.usecase";
import { signSessionToken } from "../entities/jwt.helper";
import { IUserRepository } from "../repositories/user.repository.interface";
import { User } from "@/server/shared/database/schemas";

describe("GetSessionUseCase", () => {
  let mockUserRepo: IUserRepository;
  let getSessionUseCase: GetSessionUseCase;

  const validUser: User = {
    id: "user-session-123",
    name: "Hermes Olympus",
    email: "hermes@olympus.ai",
    passwordHash: "hash",
    xp: 350,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(async (id: string) => {
        return id === validUser.id ? validUser : null;
      }),
      create: vi.fn(),
      updateXp: vi.fn(),
    };

    getSessionUseCase = new GetSessionUseCase(mockUserRepo);
  });

  it("should resolve authenticated user session from valid token", async () => {
    const token = await signSessionToken({
      id: validUser.id,
      email: validUser.email,
      name: validUser.name,
    });

    const session = await getSessionUseCase.execute(token);

    expect(session).toBeDefined();
    expect(session.id).toBe(validUser.id);
    expect(session.name).toBe(validUser.name);
    expect(session.email).toBe(validUser.email);
    expect(session.xp).toBe(350);
  });

  it("should reject when token is missing", async () => {
    await expect(getSessionUseCase.execute(undefined as unknown as string)).rejects.toThrow(
      /unauthorized/i,
    );
    await expect(getSessionUseCase.execute("")).rejects.toThrow(/unauthorized/i);
  });

  it("should reject when token is invalid or corrupted", async () => {
    await expect(getSessionUseCase.execute("invalid.token.here")).rejects.toThrow(
      /unauthorized/i,
    );
  });

  it("should reject if the user record no longer exists in database", async () => {
    const token = await signSessionToken({
      id: "deleted-user-id",
      email: "deleted@olympus.ai",
      name: "Deleted User",
    });

    await expect(getSessionUseCase.execute(token)).rejects.toThrow(/unauthorized/i);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginUseCase } from "../usecase/login.usecase";
import { IUserRepository } from "../repositories/user.repository.interface";
import { UserEntity } from "../entities/user.entity";
import { User } from "@/server/shared/database/schemas";

describe("LoginUseCase", () => {
  let mockUserRepo: IUserRepository;
  let loginUseCase: LoginUseCase;

  const userPassword = "strongPassword123";
  let existingUser: User;

  beforeEach(async () => {
    const passwordHash = await UserEntity.hashPassword(userPassword);

    existingUser = {
      id: "user-zeus-1",
      name: "Zeus Olympus",
      email: "zeus@olympus.ai",
      passwordHash,
      xp: 250,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUserRepo = {
      findByEmail: vi.fn(async (email: string) => {
        if (email.toLowerCase().trim() === existingUser.email) {
          return existingUser;
        }
        return null;
      }),
      findById: vi.fn(async (id: string) => {
        return id === existingUser.id ? existingUser : null;
      }),
      create: vi.fn(),
      updateXp: vi.fn(),
    };

    loginUseCase = new LoginUseCase(mockUserRepo);
  });

  it("should successfully log in with valid credentials and return user DTO + token", async () => {
    const result = await loginUseCase.execute({
      email: "zeus@olympus.ai",
      password: userPassword,
    });

    expect(result.user).toEqual({
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      xp: 250,
    });
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");
  });

  it("should fail with generic invalid credentials error when email does not exist", async () => {
    await expect(
      loginUseCase.execute({
        email: "nonexistent@olympus.ai",
        password: userPassword,
      }),
    ).rejects.toThrow(/invalid credentials/i);
  });

  it("should fail with generic invalid credentials error when password is incorrect", async () => {
    await expect(
      loginUseCase.execute({
        email: "zeus@olympus.ai",
        password: "incorrectPassword",
      }),
    ).rejects.toThrow(/invalid credentials/i);
  });

  it("should reject empty or malformed inputs", async () => {
    await expect(
      loginUseCase.execute({
        email: "",
        password: userPassword,
      }),
    ).rejects.toThrow();

    await expect(
      loginUseCase.execute({
        email: "zeus@olympus.ai",
        password: "",
      }),
    ).rejects.toThrow();
  });
});

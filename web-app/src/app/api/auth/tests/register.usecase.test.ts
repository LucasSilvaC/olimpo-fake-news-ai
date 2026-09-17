import { beforeEach, describe, expect, it, vi } from "vitest";

import { IUserRepository } from "../repositories/user.repository.interface";
import { RegisterUseCase } from "../usecase/register.usecase";

import { User } from "@/server/shared/database/schemas";

describe("RegisterUseCase", () => {
  let mockUserRepo: IUserRepository;
  let registerUseCase: RegisterUseCase;

  const validProps = {
    name: "Athena Olympus",
    email: "athena@olympus.ai",
    password: "securePassword123",
  };

  beforeEach(() => {
    const usersStore: User[] = [];

    mockUserRepo = {
      findByEmail: vi.fn(async (email: string) => {
        return usersStore.find((u) => u.email === email.toLowerCase().trim()) ?? null;
      }),
      findById: vi.fn(async (id: string) => {
        return usersStore.find((u) => u.id === id) ?? null;
      }),
      create: vi.fn(async (data) => {
        const created: User = {
          id: data.id ?? "generated-id-1",
          name: data.name,
          email: data.email.toLowerCase().trim(),
          passwordHash: data.passwordHash,
          xp: data.xp ?? 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        usersStore.push(created);
        return created;
      }),
      updateXp: vi.fn(),
    };

    registerUseCase = new RegisterUseCase(mockUserRepo);
  });

  it("should register a new user successfully and return user DTO and session token", async () => {
    const result = await registerUseCase.execute(validProps);

    expect(result.user).toBeDefined();
    expect(result.user.name).toBe("Athena Olympus");
    expect(result.user.email).toBe("athena@olympus.ai");
    expect(result.user.xp).toBe(0);
    expect((result.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");

    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("athena@olympus.ai");
    expect(mockUserRepo.create).toHaveBeenCalledOnce();
  });

  it("should reject registration when email already exists", async () => {
    await registerUseCase.execute(validProps);

    await expect(registerUseCase.execute(validProps)).rejects.toThrow(
      /already exists|conflict/i,
    );
  });

  it("should reject registration with invalid email", async () => {
    await expect(
      registerUseCase.execute({
        ...validProps,
        email: "not-an-email",
      }),
    ).rejects.toThrow(/email/i);
  });

  it("should reject registration with short password", async () => {
    await expect(
      registerUseCase.execute({
        ...validProps,
        password: "123",
      }),
    ).rejects.toThrow(/password/i);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerAction } from "../actions/register.action";
import { loginAction } from "../actions/login.action";
import { logoutAction } from "../actions/logout.action";
import { AUTH_COOKIE_NAME } from "../entities/jwt.helper";
import { UserEntity } from "../entities/user.entity";

// Mock next/headers cookies
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

// Mock drizzle-user.repository
const inMemoryUsers = new Map<string, any>();

vi.mock("../repositories/drizzle-user.repository", () => ({
  drizzleUserRepository: {
    findByEmail: vi.fn(async (email: string) => {
      for (const u of inMemoryUsers.values()) {
        if (u.email === email.toLowerCase().trim()) return u;
      }
      return null;
    }),
    findById: vi.fn(async (id: string) => inMemoryUsers.get(id) ?? null),
    create: vi.fn(async (data: any) => {
      const user = { ...data, xp: data.xp ?? 0, createdAt: new Date(), updatedAt: new Date() };
      inMemoryUsers.set(user.id, user);
      return user;
    }),
    updateXp: vi.fn(),
  },
}));

describe("Auth Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inMemoryUsers.clear();
  });

  describe("registerAction", () => {
    it("should successfully register a user and set the session cookie", async () => {
      const formData = new FormData();
      formData.append("name", "Apollo Deity");
      formData.append("email", "apollo@olympus.ai");
      formData.append("password", "sunlight123");

      const response = await registerAction(formData);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.user.name).toBe("Apollo Deity");
        expect(response.user.email).toBe("apollo@olympus.ai");
      }

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
    });

    it("should reject invalid email via Zod validation", async () => {
      const formData = new FormData();
      formData.append("name", "Apollo");
      formData.append("email", "invalid-email");
      formData.append("password", "sunlight123");

      const response = await registerAction(formData);
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toMatch(/email/i);
      }
    });

    it("should reject short password via Zod validation", async () => {
      const formData = new FormData();
      formData.append("name", "Apollo");
      formData.append("email", "apollo@olympus.ai");
      formData.append("password", "123");

      const response = await registerAction(formData);
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toMatch(/password/i);
      }
    });
  });

  describe("loginAction", () => {
    beforeEach(async () => {
      const passwordHash = await UserEntity.hashPassword("aresPassword123");
      inMemoryUsers.set("ares-id", {
        id: "ares-id",
        name: "Ares War",
        email: "ares@olympus.ai",
        passwordHash,
        xp: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it("should successfully log in and set auth cookie", async () => {
      const formData = new FormData();
      formData.append("email", "ares@olympus.ai");
      formData.append("password", "aresPassword123");

      const response = await loginAction(formData);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.user.id).toBe("ares-id");
        expect(response.user.name).toBe("Ares War");
      }

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        AUTH_COOKIE_NAME,
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
        }),
      );
    });

    it("should reject invalid password without leaking details", async () => {
      const formData = new FormData();
      formData.append("email", "ares@olympus.ai");
      formData.append("password", "wrongPassword");

      const response = await loginAction(formData);
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toMatch(/invalid credentials/i);
      }
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });
  });

  describe("logoutAction", () => {
    it("should delete session cookie and return success", async () => {
      const response = await logoutAction();

      expect(response.success).toBe(true);
      expect(mockCookieStore.delete).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
    });
  });
});

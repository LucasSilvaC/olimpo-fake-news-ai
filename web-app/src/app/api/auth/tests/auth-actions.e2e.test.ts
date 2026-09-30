import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginAction } from "../actions/login.action";
import { logoutAction } from "../actions/logout.action";
import { registerAction } from "../actions/register.action";
import { AUTH_COOKIE_NAME } from "../entities/jwt.helper";
import { UserEntity } from "../entities/user.entity";

import { User, NewUser } from "@/server/shared/database/schemas";
import {
  ActionTestLogger,
  createActionTestLogger,
  createMockCookieStore,
  MockCookieStore,
} from "@/server/shared/logger/action-test-logger";

let currentLogger: ActionTestLogger | null = null;
let currentCookieStore: MockCookieStore;

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => currentCookieStore),
}));

const inMemoryUsers = new Map<string, User>();

vi.mock("../repositories/drizzle-user.repository", () => ({
  drizzleUserRepository: {
    findByEmail: vi.fn(async (email: string) => {
      const normalized = email.toLowerCase().trim();
      currentLogger?.persistence("SELECT users WHERE email = $1", { email: normalized });
      for (const u of inMemoryUsers.values()) {
        if (u.email === normalized) return u;
      }
      return null;
    }),
    findById: vi.fn(async (id: string) => {
      currentLogger?.persistence("SELECT users WHERE id = $1", { id });
      return inMemoryUsers.get(id) ?? null;
    }),
    create: vi.fn(async (data: NewUser) => {
      const user: User = {
        ...data,
        xp: data.xp ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryUsers.set(user.id, user);
      currentLogger?.stateTransformation({
        message: "Entity created with hashed password and initialized XP",
        userId: user.id,
        xp: user.xp,
      });
      currentLogger?.persistence("INSERT INTO users", {
        id: user.id,
        email: user.email,
        name: user.name,
      });
      return user;
    }),
    updateXp: vi.fn(async (id: string, xpDelta: number) => {
      const user = inMemoryUsers.get(id);
      if (!user) throw new Error(`User with id "${id}" not found`);
      user.xp += xpDelta;
      user.updatedAt = new Date();
      currentLogger?.persistence("UPDATE users SET xp = xp + $1", { id, xpDelta, newXp: user.xp });
      return user;
    }),
  },
}));

describe("Auth Server Actions E2E Simulation (Pino Observability)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inMemoryUsers.clear();
    currentLogger = null;
    currentCookieStore = createMockCookieStore();
  });

  describe("registerAction - FormData Submissions", () => {
    it("should successfully register a valid user, persist record, and issue session cookie", async () => {
      const logger = createActionTestLogger("registerAction");
      currentLogger = logger;
      currentCookieStore = createMockCookieStore(logger);

      const formData = new FormData();
      formData.append("name", "Zeus Thunder");
      formData.append("email", "zeus@olympus.ai");
      formData.append("password", "lightning123");

      logger.inputReceived(formData);

      const response = await registerAction(formData);

      logger.validation(
        response.success,
        response.success ? { user: response.user } : { error: response.error },
      );
      logger.result(response);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.user.name).toBe("Zeus Thunder");
        expect(response.user.email).toBe("zeus@olympus.ai");
        expect(response.user.xp).toBe(0);
        expect(response.user.id).toBeDefined();

        const savedUser = inMemoryUsers.get(response.user.id);
        expect(savedUser).toBeDefined();
        expect(savedUser?.email).toBe("zeus@olympus.ai");
      }

      expect(currentCookieStore.has(AUTH_COOKIE_NAME)).toBe(true);
      const authCookie = currentCookieStore.get(AUTH_COOKIE_NAME);
      expect(authCookie?.value).toBeDefined();
      expect(authCookie?.value.length).toBeGreaterThan(20);
    });

    it("should reject registration when email already exists", async () => {
      const logger = createActionTestLogger("registerAction");
      currentLogger = logger;
      currentCookieStore = createMockCookieStore(logger);

      const existingPasswordHash = await UserEntity.hashPassword("existingSecret123");
      inMemoryUsers.set("existing-zeus-id", {
        id: "existing-zeus-id",
        name: "Zeus Original",
        email: "zeus@olympus.ai",
        passwordHash: existingPasswordHash,
        xp: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const formData = new FormData();
      formData.append("name", "Zeus Imposter");
      formData.append("email", "zeus@olympus.ai");
      formData.append("password", "someNewPassword123");

      logger.inputReceived(formData);

      const response = await registerAction(formData);

      logger.validation(response.success, response.success ? undefined : { error: response.error });
      logger.result(response);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toMatch(/already exists/i);
      }
      expect(currentCookieStore.has(AUTH_COOKIE_NAME)).toBe(false);
    });

    it("should reject registration when email format is invalid", async () => {
      const logger = createActionTestLogger("registerAction");
      currentLogger = logger;
      currentCookieStore = createMockCookieStore(logger);

      const formData = new FormData();
      formData.append("name", "Apollo Sun");
      formData.append("email", "not-a-valid-email-address");
      formData.append("password", "chariotPassword123");

      logger.inputReceived(formData);

      const response = await registerAction(formData);

      logger.validation(response.success, response.success ? undefined : { error: response.error });
      logger.result(response);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toMatch(/email/i);
      }
      expect(currentCookieStore.has(AUTH_COOKIE_NAME)).toBe(false);
    });

    it("should reject registration when password is less than 6 characters", async () => {
      const logger = createActionTestLogger("registerAction");
      currentLogger = logger;
      currentCookieStore = createMockCookieStore(logger);

      const formData = new FormData();
      formData.append("name", "Hermes Runner");
      formData.append("email", "hermes@olympus.ai");
      formData.append("password", "12345");

      logger.inputReceived(formData);

      const response = await registerAction(formData);

      logger.validation(response.success, response.success ? undefined : { error: response.error });
      logger.result(response);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toMatch(/password/i);
      }
      expect(currentCookieStore.has(AUTH_COOKIE_NAME)).toBe(false);
    });
  });

  describe("loginAction - FormData Submissions", () => {
    it("should successfully log in with valid credentials and issue session cookie", async () => {
      const logger = createActionTestLogger("loginAction");
      currentLogger = logger;
      currentCookieStore = createMockCookieStore(logger);

      const passwordHash = await UserEntity.hashPassword("heraQueenPass123");
      inMemoryUsers.set("hera-user-id", {
        id: "hera-user-id",
        name: "Hera Queen",
        email: "hera@olympus.ai",
        passwordHash,
        xp: 250,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const formData = new FormData();
      formData.append("email", "hera@olympus.ai");
      formData.append("password", "heraQueenPass123");

      logger.inputReceived(formData);

      const response = await loginAction(formData);

      logger.validation(
        response.success,
        response.success ? { user: response.user } : { error: response.error },
      );
      logger.result(response);

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.user.id).toBe("hera-user-id");
        expect(response.user.name).toBe("Hera Queen");
        expect(response.user.email).toBe("hera@olympus.ai");
        expect(response.user.xp).toBe(250);
      }

      expect(currentCookieStore.has(AUTH_COOKIE_NAME)).toBe(true);
      const authCookie = currentCookieStore.get(AUTH_COOKIE_NAME);
      expect(authCookie?.value).toBeDefined();
      expect(authCookie?.value.length).toBeGreaterThan(20);
    });

    it("should reject login when password is invalid without leaking sensitive details", async () => {
      const logger = createActionTestLogger("loginAction");
      currentLogger = logger;
      currentCookieStore = createMockCookieStore(logger);

      const passwordHash = await UserEntity.hashPassword("aresRealPassword123");
      inMemoryUsers.set("ares-user-id", {
        id: "ares-user-id",
        name: "Ares War",
        email: "ares@olympus.ai",
        passwordHash,
        xp: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const formData = new FormData();
      formData.append("email", "ares@olympus.ai");
      formData.append("password", "wrongSecretGuess");

      logger.inputReceived(formData);

      const response = await loginAction(formData);

      logger.validation(response.success, response.success ? undefined : { error: response.error });
      logger.result(response);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toMatch(/invalid credentials/i);
      }
      expect(currentCookieStore.has(AUTH_COOKIE_NAME)).toBe(false);
    });

    it("should reject login when user does not exist", async () => {
      const logger = createActionTestLogger("loginAction");
      currentLogger = logger;
      currentCookieStore = createMockCookieStore(logger);

      const formData = new FormData();
      formData.append("email", "nonexistent@olympus.ai");
      formData.append("password", "somePassword123");

      logger.inputReceived(formData);

      const response = await loginAction(formData);

      logger.validation(response.success, response.success ? undefined : { error: response.error });
      logger.result(response);

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error).toMatch(/invalid credentials/i);
      }
      expect(currentCookieStore.has(AUTH_COOKIE_NAME)).toBe(false);
    });
  });

  describe("logoutAction", () => {
    it("should delete session cookie on logout and confirm success", async () => {
      const logger = createActionTestLogger("logoutAction");
      currentLogger = logger;
      currentCookieStore = createMockCookieStore(logger);

      currentCookieStore.set(AUTH_COOKIE_NAME, "mock-jwt-active-session-token", {
        httpOnly: true,
        path: "/",
      });
      expect(currentCookieStore.has(AUTH_COOKIE_NAME)).toBe(true);

      logger.inputReceived({}, "Initiating logout action");

      const response = await logoutAction();

      logger.result(response);

      expect(response.success).toBe(true);
      expect(currentCookieStore.has(AUTH_COOKIE_NAME)).toBe(false);
    });
  });
});

import { describe, expect, it } from "vitest";

import { UserEntity } from "../entities/user.entity";

describe("UserEntity", () => {
  describe("validateEmail", () => {
    it("should accept valid email addresses", () => {
      expect(UserEntity.validateEmail("user@example.com")).toBe(true);
      expect(UserEntity.validateEmail("test.user+alias@domain.co.uk")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(UserEntity.validateEmail("invalid-email")).toBe(false);
      expect(UserEntity.validateEmail("")).toBe(false);
      expect(UserEntity.validateEmail("missing@domain")).toBe(false);
      expect(UserEntity.validateEmail("@domain.com")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should accept passwords with 6 or more characters", () => {
      expect(UserEntity.validatePassword("123456")).toBe(true);
      expect(UserEntity.validatePassword("strongPassword!@#123")).toBe(true);
    });

    it("should reject passwords shorter than 6 characters", () => {
      expect(UserEntity.validatePassword("")).toBe(false);
      expect(UserEntity.validatePassword("12345")).toBe(false);
    });
  });

  describe("hashPassword and verifyPassword", () => {
    it("should securely hash a password with at least 10 salt rounds", async () => {
      const password = "mySecretPassword123";
      const hash = await UserEntity.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$10\$/);
    });

    it("should verify correct password against hash", async () => {
      const password = "mySecretPassword123";
      const hash = await UserEntity.hashPassword(password);

      const isValid = await UserEntity.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password against hash", async () => {
      const password = "mySecretPassword123";
      const hash = await UserEntity.hashPassword(password);

      const isValid = await UserEntity.verifyPassword("wrongPassword", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("Entity instantiation and toDTO", () => {
    it("should instantiate a valid user entity and return safe DTO without passwordHash", () => {
      const user = new UserEntity({
        id: "user-123",
        name: "Olympus User",
        email: "user@olympus.ai",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890",
        xp: 150,
      });

      expect(user.id).toBe("user-123");
      expect(user.name).toBe("Olympus User");
      expect(user.email).toBe("user@olympus.ai");
      expect(user.xp).toBe(150);

      const dto = user.toDTO();
      expect(dto).toEqual({
        id: "user-123",
        name: "Olympus User",
        email: "user@olympus.ai",
        xp: 150,
      });
      expect((dto as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    });
  });
});

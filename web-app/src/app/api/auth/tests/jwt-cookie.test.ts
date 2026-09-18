import { describe, expect, it } from "vitest";

import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  signSessionToken,
  verifySessionToken,
} from "../entities/jwt.helper";

describe("JWT and Cookie Helpers", () => {
  const sampleUser = {
    id: "user-abc-123",
    email: "test@olympus.ai",
    name: "Test Olympus",
  };

  describe("signSessionToken and verifySessionToken", () => {
    it("should generate a valid JWT token that can be decoded and verified", async () => {
      const token = await signSessionToken(sampleUser);

      expect(typeof token).toBe("string");
      expect(token.split(".").length).toBe(3);

      const payload = await verifySessionToken(token);
      expect(payload.id).toBe(sampleUser.id);
      expect(payload.email).toBe(sampleUser.email);
      expect(payload.name).toBe(sampleUser.name);
    });

    it("should reject an invalid or tampered JWT token", async () => {
      const token = await signSessionToken(sampleUser);
      const tamperedToken = token.slice(0, -5) + "abcde";

      await expect(verifySessionToken(tamperedToken)).rejects.toThrow();
    });

    it("should reject malformed token strings", async () => {
      await expect(verifySessionToken("not.a.valid.jwt")).rejects.toThrow();
      await expect(verifySessionToken("")).rejects.toThrow();
    });
  });

  describe("Cookie configuration", () => {
    it("should provide security-compliant cookie options", () => {
      expect(AUTH_COOKIE_NAME).toBe("auth_token");

      const options = getAuthCookieOptions();
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe("lax");
      expect(options.path).toBe("/");
      expect(options.maxAge).toBe(7 * 24 * 60 * 60);
    });
  });
});

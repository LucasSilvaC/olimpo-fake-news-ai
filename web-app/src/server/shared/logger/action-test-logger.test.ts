import { describe, expect, it, vi } from "vitest";

import {
  ActionTestLogger,
  createActionTestLogger,
  createMockCookieStore,
} from "./action-test-logger";

describe("ActionTestLogger", () => {
  it("should create logger and emit lifecycle events without throwing", () => {
    const logger = createActionTestLogger("testAction");

    expect(logger.actionName).toBe("testAction");
    expect(logger.raw).toBeDefined();

    // Verify all lifecycle methods execute safely
    expect(() => {
      logger.inputReceived({ username: "Zeus", password: "secretPassword" });
      logger.validation(true, { schema: "UserRegistrationSchema" });
      logger.validation(false, { issue: "Password too short" });
      logger.stateTransformation({ hash: "$2a$10$abc...", id: "uuid-123" });
      logger.persistence("INSERT INTO users", { id: "uuid-123" });
      logger.sessionCookie("set", "auth_token", { path: "/" });
      logger.sessionCookie("delete", "auth_token");
      logger.result({ success: true, user: { id: "uuid-123" } });
      logger.result({ success: false, error: "Invalid credentials" });
      logger.logPhase("INPUT_RECEIVED", { custom: 123 });
    }).not.toThrow();
  });

  it("should redact password fields when processing FormData inputs", () => {
    const logger = new ActionTestLogger("formAction", { level: "silent" });
    const spy = vi.spyOn(logger.raw, "info");

    const formData = new FormData();
    formData.append("email", "athena@olympus.ai");
    formData.append("password", "superSecret123");

    logger.inputReceived(formData);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: "INPUT_RECEIVED",
        input: {
          email: "athena@olympus.ai",
          password: "[REDACTED]",
        },
      }),
      expect.any(String),
    );
  });

  it("should correctly manage mock cookie store operations and notify logger", () => {
    const logger = new ActionTestLogger("cookieAction", { level: "silent" });
    const cookieSpy = vi.spyOn(logger, "sessionCookie");

    const cookieStore = createMockCookieStore(logger);

    cookieStore.set("auth_session", "jwt.token.here", { httpOnly: true });
    expect(cookieStore.has("auth_session")).toBe(true);
    expect(cookieStore.get("auth_session")).toEqual({
      name: "auth_session",
      value: "jwt.token.here",
    });
    expect(cookieStore.getAll()).toHaveLength(1);

    expect(cookieSpy).toHaveBeenCalledWith("set", "auth_session", expect.any(Object));
    expect(cookieSpy).toHaveBeenCalledWith("get", "auth_session", expect.any(Object));

    cookieStore.delete("auth_session");
    expect(cookieStore.has("auth_session")).toBe(false);
    expect(cookieSpy).toHaveBeenCalledWith("delete", "auth_session", expect.any(Object));

    cookieStore.clear();
    expect(cookieStore.getAll()).toHaveLength(0);
  });
});

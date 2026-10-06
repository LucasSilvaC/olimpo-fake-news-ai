// @vitest-environment node
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { AUTH_COOKIE_NAME, signSessionToken } from "@/app/api/auth/entities/jwt.helper";
import { config, proxy } from "@/proxy";

const user = { id: "user-1", email: "user@example.com", name: "User" };

function request(token?: string) {
  return new NextRequest("https://olimpo.example/olimpo/game", {
    headers: token ? { cookie: `${AUTH_COOKIE_NAME}=${token}` } : {},
  });
}

describe("authentication proxy", () => {
  it.each([
    "/",
    "/olimpo",
    "/olimpo/game",
    "/olimpo/tutorial",
    "/olimpo/submit",
    "/olimpo/ranking",
    "/extrair",
    "/dev/sandbox",
  ])("protects %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
  });

  it.each([
    "/register",
    "/login",
    "/registrar",
    "/registrar/",
    "/api/auth",
    "/_next/static/app.js",
    "/favicon.ico",
    "/teste/avatar",
    "/teste/avatar/",
    "/nova-rota",
    "/registrar-extra",
    "/olimpo/nao-existe",
    "/login/nao-existe",
  ])("leaves %s accessible", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
  });

  it("redirects a missing session to login", async () => {
    const response = await proxy(request());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://olimpo.example/login");
  });

  it("rejects invalid, expired and tampered tokens", async () => {
    const valid = await signSessionToken(user);
    const expired = await signSessionToken(user, "-1s");
    const tampered = `${valid.split(".").slice(0, 2).join(".")}.invalid`;
    for (const token of ["invalid-token", expired, tampered]) {
      expect((await proxy(request(token))).status).toBe(307);
    }
  });

  it("allows a signed active session", async () => {
    const response = await proxy(request(await signSessionToken(user)));
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("location")).toBeNull();
  });
});

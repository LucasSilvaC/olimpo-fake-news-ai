import { jwtVerify, SignJWT } from "jose";

export const AUTH_COOKIE_NAME = "auth_token";

const DEFAULT_SECRET = "olimpo-fake-news-ai-session-secret-key-at-least-32-chars!";

async function getSecretKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET || DEFAULT_SECRET;
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export interface SessionTokenPayload {
  id: string;
  email: string;
  name: string;
}

export async function signSessionToken(
  payload: SessionTokenPayload,
  expiresIn = "7d",
): Promise<string> {
  const key = await getSecretKey();
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload> {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token");
  }

  const key = await getSecretKey();
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
  });

  return {
    id: (payload.id as string) || (payload.sub as string),
    email: payload.email as string,
    name: payload.name as string,
  };
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

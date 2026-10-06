import { AUTH_COOKIE_NAME, verifySessionToken } from "@/app/api/auth/entities/jwt.helper";

interface AuthCookieStore {
  get(name: string): { value: string } | undefined;
}

/** Accepts both request.cookies (Proxy) and cookies() (Server Components). */
export async function hasActiveSession(cookieStore: AuthCookieStore): Promise<boolean> {
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const session = await verifySessionToken(token);
    return typeof session.id === "string" && session.id.length > 0;
  } catch {
    return false;
  }
}

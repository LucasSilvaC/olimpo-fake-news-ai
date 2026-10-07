import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/app/api/auth/entities/jwt.helper";

export function GET(request: Request): NextResponse {
  const response = NextResponse.redirect(new URL("/register", request.url));
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

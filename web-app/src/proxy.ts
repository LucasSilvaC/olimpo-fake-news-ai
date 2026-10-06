import { NextRequest, NextResponse } from "next/server";

import { hasActiveSession } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  if (await hasActiveSession(request.cookies)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/",
    "/extrair",
    "/dev/sandbox",
    "/olimpo",
    "/olimpo/game",
    "/olimpo/tutorial",
    "/olimpo/submit",
    "/olimpo/ranking",
  ],
};

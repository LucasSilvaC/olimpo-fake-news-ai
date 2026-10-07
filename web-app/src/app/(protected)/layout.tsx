import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME } from "@/app/api/auth/entities/jwt.helper";
import { getSessionUseCase } from "@/app/api/auth/usecase/get-session.usecase";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/register");
  }

  try {
    await getSessionUseCase.execute(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("Unauthorized:")) {
      redirect("/api/auth/clear-session");
    }

    throw error;
  }

  return children;
}

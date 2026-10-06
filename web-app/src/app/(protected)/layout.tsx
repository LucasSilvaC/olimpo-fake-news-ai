import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasActiveSession } from "@/lib/auth/session";
import { AppHeader } from "@/widgets/app-header";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasActiveSession(await cookies()))) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}

import type { ReactNode } from "react";

import { AuthLayout } from "@/widgets/auth-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}

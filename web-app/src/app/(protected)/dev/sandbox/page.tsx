import { notFound } from "next/navigation";

import { DevSandboxPage } from "@/views/dev-sandbox";

export default function SandboxRoute(): React.ReactElement {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DevSandboxPage />;
}

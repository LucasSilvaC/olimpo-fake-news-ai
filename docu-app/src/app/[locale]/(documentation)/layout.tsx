import { DocumentationShell } from "@/widgets/documentation-shell";

export default function DocumentationLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <DocumentationShell>{children}</DocumentationShell>;
}

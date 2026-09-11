import type { Metadata } from "next";

import { ThemeProvider } from "@/components/organisms/theme-provider";
import { AppHeader } from "@/widgets/app-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "News Parser · PoC",
  description: "Extraia o conteúdo e os metadados de uma notícia pública.",
};

interface IRootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: IRootLayoutProps): React.ReactElement {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <ThemeProvider>
          <AppHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

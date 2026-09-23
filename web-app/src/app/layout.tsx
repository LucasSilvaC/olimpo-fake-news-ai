import type { Metadata } from "next";

import { ThemeProvider } from "@/components/organisms/theme-provider";
import { AppHeader } from "@/widgets/app-header";

import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "News Parser · PoC",
  description: "Extraia o conteúdo e os metadados de uma notícia pública.",
};

interface IRootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: IRootLayoutProps): React.ReactElement {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <ThemeProvider>
          <AppHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

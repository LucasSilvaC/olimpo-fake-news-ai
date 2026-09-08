import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "News Parser · PoC", description: "Extraia o conteúdo e os metadados de uma notícia pública." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

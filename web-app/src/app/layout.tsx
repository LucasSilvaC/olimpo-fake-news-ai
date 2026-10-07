import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

import { Toaster } from "@/components/atoms/sonner";
import { ThemeProvider } from "@/components/organisms/theme-provider";
import { VlibrasWidget } from "@/components/organisms/vlibras-widget";
import { Footer } from "@/widgets/footer";

import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Olimpo Fake News",
  description: "Extraia o conteúdo e os metadados de uma notícia pública.",
};

interface IRootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: IRootLayoutProps): React.ReactElement {
  return (
    <html lang="pt-BR" className={montserrat.variable} suppressHydrationWarning>
      <body className={`${montserrat.className} min-h-screen antialiased`}>
        <ThemeProvider>
          {children}
          <Footer />
          <VlibrasWidget />
          <Toaster position="top-center" richColors duration={7000} />
        </ThemeProvider>
      </body>
    </html>
  );
}

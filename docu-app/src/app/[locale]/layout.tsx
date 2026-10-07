import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Montserrat } from "next/font/google";

import { hasLocale, routing } from "@/i18n/routing";
import "../globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export function generateStaticParams(): Array<{ locale: string }> {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: {
      default: t("title"),
      template: t("titleTemplate"),
    },
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps): Promise<React.ReactElement> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return (
    <html lang={locale} className={montserrat.variable}>
      <body className={`${montserrat.className} min-h-screen antialiased`}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

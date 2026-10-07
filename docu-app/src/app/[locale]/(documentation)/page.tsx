import { HomePage } from "@/views/home";
import { hasLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";

export default async function Home({ params }: { params: Promise<{ locale: string }> }): Promise<React.ReactElement> {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  return <HomePage locale={locale} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDocumentationCatalog } from "@/entities/documentation";
import { hasLocale } from "@/i18n/routing";
import { DocumentPage } from "@/views/document";

export function generateStaticParams(): Array<{ slug: string }> {
  return getDocumentationCatalog("pt-BR").pages.filter((page) => page.href !== "/").map((page) => ({ slug: page.slug }));
}

type DocumentRouteProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: DocumentRouteProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();

  const page = getDocumentationCatalog(locale).pages.find((item) => item.slug === slug);
  if (!page || page.href === "/") notFound();

  return { title: page.title, description: page.summary };
}

export default async function DocumentRoute({ params }: DocumentRouteProps): Promise<React.ReactElement> {
  const { locale, slug } = await params;
  if (!hasLocale(locale)) notFound();

  const catalog = getDocumentationCatalog(locale);
  const page = catalog.pages.find((item) => item.slug === slug);

  if (!page || page.href === "/") notFound();

  return <DocumentPage page={page} catalog={catalog} />;
}

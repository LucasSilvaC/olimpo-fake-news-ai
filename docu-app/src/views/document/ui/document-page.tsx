import { ArrowLeft, ArrowRight, BookOpen, Clock3, ExternalLink, Info, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/atoms/badge";
import { Card, CardContent, CardHeader } from "@/components/atoms/card";
import { documentationIcons } from "@/entities/documentation";
import type { DocumentationBlock, DocumentationCatalog, IDocumentationPage } from "@/entities/documentation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function BlockContent({ block }: { block: DocumentationBlock }): React.ReactElement {
  switch (block.type) {
    case "paragraph":
      return <p className="text-sm leading-7 text-slate-600 sm:text-[15px]">{block.text}</p>;
    case "callout": {
      const Icon = block.tone === "warning" ? TriangleAlert : Info;
      return (
        <aside
          aria-label={block.title}
          className={cn(
            "flex gap-3 rounded-2xl border px-4 py-4 sm:px-5",
            block.tone === "warning" ? "border-amber-200 bg-amber-50" : "border-blue-100 bg-blue-50",
          )}
        >
          <Icon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", block.tone === "warning" ? "text-amber-700" : "text-blue-700")} />
          <span>
            <span className="block text-sm font-extrabold text-slate-900">{block.title}</span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">{block.text}</span>
          </span>
        </aside>
      );
    }
    case "cards":
      return (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {block.items.map((item) => {
            const Icon = documentationIcons[item.icon];
            return (
              <li key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <span className="mb-3 grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <p className="text-sm font-extrabold text-slate-900">{item.title}</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p>
              </li>
            );
          })}
        </ul>
      );
    case "steps":
      return (
        <ol className="grid gap-3 md:grid-cols-2">
          {block.items.map((item, index) => (
            <li key={item.title} className="flex gap-3 rounded-2xl border border-slate-200 p-4 sm:p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-sm font-extrabold text-slate-900">{item.title}</span>
                <span className="mt-1.5 block text-sm leading-6 text-slate-600">{item.description}</span>
              </span>
            </li>
          ))}
        </ol>
      );
    case "figure": {
      const isVector = block.src.endsWith(".svg");
      return (
        <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
          <div className={cn("relative aspect-[16/8] min-h-[220px] w-full sm:aspect-[16/7]", isVector ? "p-2 sm:p-4" : "")}>
            <Image
              src={block.src}
              alt={block.alt}
              fill
              sizes="(min-width: 1280px) 900px, (min-width: 640px) 75vw, 100vw"
              className={isVector ? "object-contain" : "object-cover"}
            />
          </div>
          <figcaption className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="text-xs leading-5 text-slate-600">{block.caption}</span>
            {block.credit && (
              <span className="text-[10px] font-medium text-slate-500 sm:shrink-0">
                {block.creditHref ? (
                  <a href={block.creditHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-blue-700">
                    {block.credit} <ExternalLink aria-hidden="true" className="size-3" />
                  </a>
                ) : block.credit}
              </span>
            )}
          </figcaption>
        </figure>
      );
    }
    case "code":
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <p className="text-xs font-bold text-white/85">{block.label}</p>
            <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[10px] text-white/60">{block.language}</span>
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-6 text-blue-100 sm:p-5 sm:text-sm"><code>{block.code}</code></pre>
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-extrabold text-slate-700">
              <tr>{block.headers.map((header) => <th className="border-b border-slate-200 px-4 py-3" key={header} scope="col">{header}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr className="align-top odd:bg-white even:bg-slate-50/60" key={`${rowIndex}-${row[0]}`}>
                  {row.map((cell, cellIndex) => <td className="border-b border-slate-100 px-4 py-3 leading-6 text-slate-600 last:border-b-0" key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "references":
      return (
        <ul className="grid gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer" className="group flex h-full items-start gap-3 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700">
                  <ExternalLink aria-hidden="true" className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-slate-900">{item.label}</span>
                  {item.description && <span className="mt-1 block text-xs leading-5 text-slate-600">{item.description}</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      );
  }
}

export function DocumentPage({ page, catalog }: { page: IDocumentationPage; catalog: DocumentationCatalog }): React.ReactElement {
  const t = useTranslations("document");
  const groupPages = catalog.pages.filter((item) => item.group === page.group);
  const currentIndex = groupPages.findIndex((item) => item.slug === page.slug);
  const previousPage = groupPages[currentIndex - 1];
  const nextPage = groupPages[currentIndex + 1];
  const group = catalog.groups.find((item) => item.id === page.group);
  const groupTitle = group?.title ?? t("defaultGroup");
  const PageIcon = documentationIcons[page.icon];

  return (
    <article className="space-y-5 sm:space-y-6">
      <Card>
        <CardHeader className="border-b border-slate-100 pb-6 sm:pb-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="soft" className="gap-1.5">
              <PageIcon aria-hidden="true" className="size-3.5" />
              {page.category}
            </Badge>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Clock3 aria-hidden="true" className="size-3.5" /> {page.readingTime}
            </span>
          </div>
          <h1 className="pt-3 text-2xl leading-tight font-black tracking-tight text-slate-900 sm:text-4xl">{page.title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{page.summary}</p>
          <span className="inline-flex items-center gap-2 pt-1 text-xs font-semibold text-slate-500">
            <BookOpen aria-hidden="true" className="size-4 text-blue-600" /> {t("areaLabel")} {groupTitle}
          </span>
        </CardHeader>

        {page.sections.length > 1 && (
          <nav aria-label={t("onThisPage")} className="flex flex-wrap gap-2 border-b border-slate-100 px-6 py-4 sm:px-8">
            {page.sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                {section.title}
              </a>
            ))}
          </nav>
        )}

        <CardContent className="space-y-9 pt-6 sm:space-y-11 sm:pt-8">
          {page.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8 space-y-4">
              <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                <span aria-hidden="true" className="h-5 w-1 rounded-full bg-amber-400" />
                {section.title}
              </h2>
              {section.blocks.map((block, index) => <BlockContent block={block} key={`${section.id}-${block.type}-${index}`} />)}
            </section>
          ))}
        </CardContent>
      </Card>

      {(previousPage || nextPage) && (
        <nav aria-label={t("guideNavigation", { group: groupTitle })} className="grid gap-3 sm:grid-cols-2">
          {previousPage ? (
            <Link href={previousPage.href} className="group rounded-2xl border border-white/25 bg-white/10 p-4 text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
              <span className="flex items-center gap-2 text-xs font-semibold text-white/70"><ArrowLeft aria-hidden="true" className="size-3.5" /> {t("previousGuide", { group: groupTitle })}</span>
              <span className="mt-2 block text-sm font-extrabold">{previousPage.title}</span>
            </Link>
          ) : <span />}
          {nextPage && (
            <Link href={nextPage.href} className="group rounded-2xl border border-white/25 bg-white/10 p-4 text-right text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">
              <span className="flex items-center justify-end gap-2 text-xs font-semibold text-white/70">{t("nextGuide", { group: groupTitle })} <ArrowRight aria-hidden="true" className="size-3.5" /></span>
              <span className="mt-2 block text-sm font-extrabold">{nextPage.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}

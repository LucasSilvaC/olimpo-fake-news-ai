import { ArrowRight, BookOpen, ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/atoms/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { buttonVariants } from "@/components/atoms/button";
import { getDocumentationCatalog, documentationIcons } from "@/entities/documentation";
import type { AppLocale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const photoSource = "https://commons.wikimedia.org/wiki/File:Reading_the_Newspaper_(31997783335).jpg";

export function HomePage({ locale }: { locale: AppLocale }): React.ReactElement {
  const t = useTranslations("home");
  const { groups, pages } = getDocumentationCatalog(locale);
  const guideCount = pages.length - 1;

  return (
    <div className="space-y-7 sm:space-y-9">
      <section className="overflow-hidden rounded-[28px] bg-white text-slate-900 shadow-[0_25px_55px_-20px_rgba(16,39,91,0.35)]">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col items-start justify-center p-6 sm:p-9 lg:p-11">
            <Badge variant="soft" className="gap-2">
              <Sparkles aria-hidden="true" className="size-3.5" />
              {t("badge")}
            </Badge>
            <h1 className="mt-5 max-w-xl text-3xl leading-tight font-black tracking-tight text-slate-950 sm:text-4xl xl:text-[2.75rem]">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              {t("description")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/docs/salas-e-partidas" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
                {t("primaryAction")} <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href="/docs/arquitetura" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                {t("secondaryAction")}
              </Link>
            </div>
            <div className="mt-7 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <BookOpen aria-hidden="true" className="size-4 text-blue-600" />
              {t("guideCount", { count: guideCount })}
            </div>
          </div>

          <figure className="relative min-h-[270px] overflow-hidden bg-blue-100 sm:min-h-[350px] lg:min-h-full">
            <Image
              src="/reading-the-newspaper.jpg"
              alt={t("photoAlt")}
              fill
              preload
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/5 to-transparent" />
            <figcaption className="absolute right-4 bottom-4 left-4 rounded-2xl border border-white/15 bg-slate-950/55 p-3 text-white backdrop-blur-sm sm:right-6 sm:bottom-6 sm:left-6 sm:p-4">
              <span className="block text-sm font-extrabold">{t("photoCaption")}</span>
              <span className="mt-1 block text-[11px] leading-5 text-white/75">
                {t("photoCredit")} Michael Kuhn (kuhnmi) · CC BY 2.0 ·{" "}
                <a href={photoSource} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-white/40 underline-offset-2 hover:decoration-white">
                  {t("photoSource")} <ExternalLink aria-hidden="true" className="size-3" />
                </a>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="guide-groups-title" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.18em] text-white/65 uppercase">{t("groupsEyebrow")}</p>
            <h2 id="guide-groups-title" className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">{t("groupsTitle")}</h2>
          </div>
          <span className="text-xs font-semibold text-white/70">{t("articleCount", { count: guideCount })}</span>
        </div>

        <div className="space-y-6">
          {groups.map((group) => {
            const GroupIcon = documentationIcons[group.icon];
            const groupPages = pages.filter((page) => page.group === group.id && page.href !== "/");
            return (
              <section key={group.id} aria-labelledby={`group-${group.id}`} className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <span className="grid size-9 place-items-center rounded-xl border border-white/20 bg-white/10 text-amber-200">
                    <GroupIcon aria-hidden="true" className="size-4.5" />
                  </span>
                  <div>
                    <h3 id={`group-${group.id}`} className="text-base font-extrabold text-white">{group.title}</h3>
                    <p className="text-xs text-white/65">{group.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groupPages.map((page) => {
                    const PageIcon = documentationIcons[page.icon];
                    return (
                      <Card key={page.slug} className="group h-full transition-transform hover:-translate-y-0.5">
                        <CardHeader className="flex h-full flex-col p-5 sm:p-6">
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant="soft" className="w-fit">{page.category}</Badge>
                            <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-amber-100 group-hover:text-amber-800">
                              <PageIcon aria-hidden="true" className="size-4.5" />
                            </span>
                          </div>
                          <CardTitle className="pt-2 text-lg">{page.title}</CardTitle>
                          <CardDescription className="flex-1">{page.summary}</CardDescription>
                          <Link href={page.href} className="mt-3 inline-flex w-fit items-center gap-2 text-sm font-extrabold text-blue-700 hover:text-blue-900 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-blue-600">
                            {t("openGuide")} <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <aside className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-amber-200">
            <BookOpen aria-hidden="true" className="size-4.5" />
          </span>
          <div>
            <p className="text-sm font-extrabold">{t("traceableTitle")}</p>
            <p className="mt-1 text-xs leading-5 text-white/75">{t("traceableDescription")}</p>
          </div>
        </div>
        <Link href="/docs/manter-documentacao" className="inline-flex items-center gap-2 self-start text-xs font-bold text-amber-200 hover:text-amber-100 sm:self-center">
          {t("updateGuides")} <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </aside>
    </div>
  );
}

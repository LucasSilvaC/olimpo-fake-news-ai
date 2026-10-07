"use client";

import { ChevronDown, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Input } from "@/components/atoms/input";
import { getDocumentationCatalog, documentationIcons } from "@/entities/documentation";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ISidebarNavigationProps {
  activeSlug: string;
  onNavigate?: () => void;
}

export function SidebarNavigation({ activeSlug, onNavigate }: ISidebarNavigationProps): React.ReactElement {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("sidebar");
  const [query, setQuery] = useState("");
  const catalog = getDocumentationCatalog(locale);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const visiblePages = useMemo(
    () => catalog.pages.filter((page) =>
      `${page.title} ${page.category} ${page.summary}`.toLocaleLowerCase(locale).includes(normalizedQuery),
    ),
    [catalog.pages, locale, normalizedQuery],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-3 px-3 text-[10px] font-extrabold tracking-[0.18em] text-white/65 uppercase">{t("searchTitle")}</p>
        <label className="relative block">
          <Search aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-4 text-white/60" />
          <Input
            aria-label={t("searchLabel")}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchPlaceholder")}
            value={query}
            className="pl-9"
          />
        </label>
      </div>

      <nav aria-label={t("navigationLabel")} className="space-y-4">
        <p className="px-3 text-[10px] font-extrabold tracking-[0.18em] text-white/65 uppercase">{t("areasTitle")}</p>
        {catalog.groups.map((group) => {
          const pages = visiblePages.filter((page) => page.group === group.id);
          if (pages.length === 0) return null;

          const GroupIcon = documentationIcons[group.icon];
          const groupIsActive = pages.some((page) => page.slug === activeSlug || page.href === pathname);

          return (
            <details
              key={group.id}
              className="group/nav rounded-2xl border border-white/10 bg-white/[0.04] open:bg-white/[0.08]"
              open={normalizedQuery.length > 0 || groupIsActive}
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-3 py-3 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-amber-300 [&::-webkit-details-marker]:hidden">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/10 text-amber-200">
                  <GroupIcon aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-5 font-extrabold text-white">{group.title}</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-white/60">{group.description}</span>
                </span>
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-white/60 transition-transform group-open/nav:rotate-180" />
              </summary>
              <ul className="mx-4 mb-3 space-y-1 border-l border-white/20 pl-3">
                {pages.map((page) => {
                  const PageIcon = documentationIcons[page.icon];
                  const isActive = page.slug === activeSlug || page.href === pathname;

                  return (
                    <li key={page.slug}>
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300",
                          isActive && "bg-white text-blue-800 shadow-sm hover:bg-white hover:text-blue-800",
                        )}
                        href={page.href}
                        onClick={onNavigate}
                      >
                        <PageIcon aria-hidden="true" className={cn("mt-0.5 size-4 shrink-0", isActive ? "text-blue-600" : "text-white/70")} />
                        <span className="min-w-0">
                          <span className="block leading-5">{page.title}</span>
                          <span className={cn("mt-0.5 block text-[10px] font-medium", isActive ? "text-slate-500" : "text-white/55")}>
                            {page.category}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
        {visiblePages.length === 0 && <p className="px-3 text-sm leading-6 text-white/70">{t("noResults")}</p>}
      </nav>

      <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-4">
        <p className="text-xs font-bold text-white">{t("repoGuidesTitle")}</p>
        <p className="mt-1 text-xs leading-5 text-white/65">{t("repoGuidesDescription")}</p>
      </div>
    </div>
  );
}

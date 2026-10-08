"use client";

import { BookOpen, Menu, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Badge } from "@/components/atoms/badge";
import { Breadcrumb } from "@/components/atoms/breadcrumb";
import { Button } from "@/components/atoms/button";
import { CountryFlag, type CountryFlagName } from "@/components/atoms/country-flag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { SidebarNavigation } from "@/features/documentation-navigation/ui/sidebar-navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { hasLocale } from "@/i18n/routing";
import { getDocumentationCatalog } from "@/entities/documentation";

const languageOptions: ReadonlyArray<{
  country: CountryFlagName;
  label: string;
  value: "pt-BR" | "en" | "es";
}> = [
  { country: "brazil", label: "Português", value: "pt-BR" },
  { country: "united-states", label: "English", value: "en" },
  { country: "spain", label: "Español", value: "es" },
];

export function DocumentationShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tHeader = useTranslations("header");
  const tSidebar = useTranslations("sidebar");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const catalog = getDocumentationCatalog(locale);
  const activePage = catalog.pages.find((page) => page.href === pathname) ?? catalog.pages[0];
  const activeSlug = activePage?.slug ?? "visao-geral";

  function changeLocale(nextLocale: string | null): void {
    if (!nextLocale) return;
    if (!hasLocale(nextLocale)) return;

    router.replace(pathname, { locale: nextLocale });
  }

  useEffect(() => {
    if (!mobileNavigationOpen) return;

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") setMobileNavigationOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavigationOpen]);

  return (
    <div className="min-h-screen w-full px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" onClick={() => setMobileNavigationOpen(false)} className="group inline-flex items-center gap-2 rounded-xl text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 sm:gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 shadow-lg shadow-blue-950/15 transition-transform group-hover:-rotate-3 sm:size-12">
            <Image
              src="/olimpo-logo.png"
              alt=""
              aria-hidden="true"
              width={36}
              height={36}
              className="size-9 object-contain sm:size-[42px]"
              priority
            />
          </span>
          <span className="text-lg font-black tracking-tight">Olimpo <span className="hidden font-medium text-white/70 sm:inline">/ docs</span></span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Select
            id="documentation-language"
            items={languageOptions.map(({ label, value }) => ({ label, value }))}
            aria-label={tHeader("languageSelector")}
            onValueChange={changeLocale}
            value={locale}
          >
            <SelectTrigger aria-label={tHeader("languageSelector")}>
              <SelectValue>
                {(value: string | null) => {
                  const selectedLanguage = languageOptions.find((option) => option.value === value);
                  if (!selectedLanguage) return null;

                  return (
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <CountryFlag country={selectedLanguage.country} />
                      <span className="truncate">{selectedLanguage.label}</span>
                    </span>
                  );
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <CountryFlag country={option.country} />
                  <span>{option.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden items-center gap-3 xl:flex">
            <span className="text-xs font-semibold text-white/75">{tHeader("tagline")}</span>
            <Badge>{tHeader("sourceGuides")}</Badge>
          </div>

          <Button
            aria-expanded={mobileNavigationOpen}
            aria-label={mobileNavigationOpen ? tHeader("closeNavigation") : tHeader("openNavigation")}
            className="lg:hidden"
            onClick={() => setMobileNavigationOpen((open) => !open)}
            size="icon"
            variant="ghost"
          >
            {mobileNavigationOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </Button>
        </div>
      </header>

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 lg:mt-9 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden self-start lg:sticky lg:top-8 lg:block" aria-label={tSidebar("navigationLabel")}>
          <SidebarNavigation activeSlug={activeSlug} />
        </aside>

        {mobileNavigationOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label={tHeader("closeNavigation")}
              className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]"
              onClick={() => setMobileNavigationOpen(false)}
              type="button"
            />
            <aside aria-label={tSidebar("navigationLabel")} aria-modal="true" className="relative h-full w-[min(88vw,360px)] overflow-y-auto bg-[#3478ed] p-5 shadow-2xl" role="dialog">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-extrabold tracking-wide text-white">{tHeader("mobileNavigationTitle")}</span>
                <Button aria-label={tHeader("closeNavigation")} onClick={() => setMobileNavigationOpen(false)} size="icon" variant="ghost">
                  <X aria-hidden="true" className="size-5" />
                </Button>
              </div>
              <SidebarNavigation activeSlug={activeSlug} onNavigate={() => setMobileNavigationOpen(false)} />
            </aside>
          </div>
        )}

        <div className="min-w-0">
          <div className="mb-5 flex min-h-10 items-center justify-between gap-4">
            <Breadcrumb currentPage={activePage?.title ?? tCommon("home")} />
            <span className="hidden items-center gap-2 text-xs font-semibold text-white/70 md:inline-flex">
              <BookOpen aria-hidden="true" className="size-4" />
              {tCommon("documentation")}
            </span>
          </div>
          {children}
          <footer className="mt-8 flex flex-col gap-1 border-t border-white/20 pt-5 text-center text-xs font-medium text-white/70 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <span>{tCommon("footerTitle")}</span>
            <span>{tCommon("footerDescription")}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

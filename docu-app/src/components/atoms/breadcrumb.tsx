import { ChevronRight, House } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export function Breadcrumb({ currentPage }: { currentPage: string }): React.ReactElement {
  const t = useTranslations("common");

  return (
    <nav aria-label={t("breadcrumbLabel")} className="flex min-w-0 items-center gap-2 text-xs font-semibold text-white/75 sm:text-sm">
      <Link href="/" className="inline-flex shrink-0 items-center gap-2 transition-colors hover:text-white focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">
        <House aria-hidden="true" className="size-3.5" />
        <span>{t("documentation")}</span>
      </Link>
      <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-white/50" />
      <span aria-current="page" className="truncate text-white">{currentPage}</span>
    </nav>
  );
}

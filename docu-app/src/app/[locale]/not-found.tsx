import { useTranslations } from "next-intl";

import { buttonVariants } from "@/components/atoms/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function NotFound(): React.ReactElement {
  const t = useTranslations("errors");

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12 text-center text-white">
      <div className="max-w-lg">
        <p className="text-sm font-extrabold tracking-[0.2em] text-amber-200">404</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{t("notFoundTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-white/75">{t("notFoundDescription")}</p>
        <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
          {t("homeAction")}
        </Link>
      </div>
    </main>
  );
}

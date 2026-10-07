import { ArrowRight, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import * as React from "react";

type Accent = "amber" | "emerald";

interface IModeCardProps {
  accent: Accent;
  badge: string;
  description: string;
  footer: string;
  title: string;
  href?: string;
}

const accentStyles: Record<
  Accent,
  { bar: string; badge: string; icon: string; action: string; titleHover: string }
> = {
  amber: {
    bar: "from-amber-400 to-amber-500",
    badge: "bg-amber-100 text-amber-800",
    icon: "border-amber-100 bg-amber-50 text-amber-500 group-hover:bg-amber-100/70",
    action:
      "bg-amber-400 text-slate-900 shadow-amber-400/30 group-hover:bg-amber-500 group-hover:text-slate-900",
    titleHover: "group-hover:text-amber-600",
  },
  emerald: {
    bar: "from-emerald-400 to-teal-500",
    badge: "bg-emerald-100 text-emerald-800",
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100/70",
    action:
      "bg-emerald-500 text-white shadow-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white",
    titleHover: "group-hover:text-emerald-600",
  },
};

export function ModeCard({
  accent,
  badge,
  description,
  footer,
  title,
  href,
}: IModeCardProps): React.ReactElement {
  const styles = accentStyles[accent];
  const Icon = accent === "amber" ? Plus : ShieldCheck;

  const cardContent = (
    <>
      <span className={`absolute inset-x-0 top-0 h-2 bg-linear-to-r ${styles.bar}`} />

      <div>
        <span
          className={`mb-6 flex size-12 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:scale-110 ${styles.icon}`}
        >
          <Icon className="size-6" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span
          className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${styles.badge}`}
        >
          {badge}
        </span>
        <h2
          className={`mb-2.5 text-2xl font-extrabold tracking-tight text-slate-900 transition-colors ${styles.titleHover}`}
        >
          {title}
        </h2>
        <p className="text-sm leading-relaxed font-medium text-slate-500">{description}</p>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
        <span className="text-sm font-semibold text-slate-600">{footer}</span>
        <span
          className={`inline-flex size-10 items-center justify-center rounded-full shadow-md transition-all group-hover:translate-x-1 ${styles.action}`}
          aria-hidden="true"
        >
          <ArrowRight className="size-5" strokeWidth={2.5} />
        </span>
      </div>
    </>
  );

  const containerClassName =
    "group relative flex min-h-88.75 w-full max-w-105 cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-white bg-white p-6 text-slate-800 shadow-xl shadow-blue-950/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-950/30 sm:p-7";

  if (href) {
    return (
      <Link href={href} className={containerClassName}>
        {cardContent}
      </Link>
    );
  }

  return <article className={containerClassName}>{cardContent}</article>;
}

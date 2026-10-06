import { ArrowRight, BadgeCheck, Plus } from "lucide-react";
import Link from "next/link";

type Accent = "amber" | "emerald";
type ModeIcon = "create" | "challenge";

interface IModeCardProps {
  accent: Accent;
  badge: string;
  description: string;
  footer: string;
  href: string;
  icon: ModeIcon;
  title: string;
}

const accentStyles: Record<Accent, { bar: string; badge: string; icon: string; action: string }> = {
  amber: {
    bar: "from-amber-400 to-amber-500",
    badge: "bg-amber-100 text-amber-800",
    icon: "border-amber-100 bg-amber-50 text-amber-500 group-hover:bg-amber-100/70",
    action:
      "bg-amber-400 text-slate-900 shadow-amber-400/30 group-hover:bg-amber-500 group-hover:text-slate-900",
  },
  emerald: {
    bar: "from-emerald-400 to-teal-500",
    badge: "bg-emerald-100 text-emerald-800",
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100/70",
    action:
      "bg-emerald-500 text-white shadow-emerald-500/30 group-hover:bg-emerald-600 group-hover:text-white",
  },
};

export function ModeCard({
  accent,
  badge,
  description,
  footer,
  href,
  icon,
  title,
}: IModeCardProps): React.ReactElement {
  const styles = accentStyles[accent];
  const Icon = icon === "create" ? Plus : BadgeCheck;

  return (
    <Link
      href={href}
      className="group relative flex min-h-[350px] flex-col justify-between overflow-hidden rounded-3xl border border-white bg-white p-6 text-slate-800 shadow-xl shadow-blue-950/20 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-950/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300 sm:p-7"
    >
      <span className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${styles.bar}`} />

      <div>
        <span
          className={`mb-6 flex size-14 items-center justify-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:scale-110 ${styles.icon}`}
        >
          <Icon className="size-7" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span
          className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${styles.badge}`}
        >
          {badge}
        </span>
        <h2 className="mb-2.5 text-2xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
          {title}
        </h2>
        <p className="text-base leading-relaxed font-medium text-slate-500">{description}</p>
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
    </Link>
  );
}

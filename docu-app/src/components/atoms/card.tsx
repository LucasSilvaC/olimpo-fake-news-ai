import * as React from "react";

import { cn } from "@/lib/utils";

type ICardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...properties }: ICardProps): React.ReactElement {
  return <div className={cn("rounded-[28px] border border-white/70 bg-white text-slate-900 shadow-[0_25px_50px_-12px_rgba(23,37,84,0.2)]", className)} {...properties} />;
}

export function CardHeader({ className, ...properties }: ICardProps): React.ReactElement {
  return <div className={cn("space-y-2 p-6 sm:p-8", className)} {...properties} />;
}

export function CardContent({ className, ...properties }: ICardProps): React.ReactElement {
  return <div className={cn("p-6 pt-0 sm:p-8 sm:pt-0", className)} {...properties} />;
}

export function CardTitle({ className, ...properties }: ICardProps): React.ReactElement {
  return <h2 className={cn("text-xl font-extrabold tracking-tight sm:text-2xl", className)} {...properties} />;
}

export function CardDescription({ className, ...properties }: ICardProps): React.ReactElement {
  return <p className={cn("text-sm leading-7 text-slate-600", className)} {...properties} />;
}

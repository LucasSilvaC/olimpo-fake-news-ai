import * as React from "react";

import { cn } from "@/lib/utils";

type ICardProps = React.HTMLAttributes<HTMLDivElement>;
export function Card({ className, ...properties }: ICardProps): React.ReactElement {
  return (
    <div
      className={cn("bg-card text-card-foreground rounded-xl border shadow-sm", className)}
      {...properties}
    />
  );
}
export function CardHeader({ className, ...properties }: ICardProps): React.ReactElement {
  return <div className={cn("space-y-1.5 p-6", className)} {...properties} />;
}
export function CardContent({ className, ...properties }: ICardProps): React.ReactElement {
  return <div className={cn("p-6 pt-0", className)} {...properties} />;
}
export function CardTitle({ className, ...properties }: ICardProps): React.ReactElement {
  return (
    <h2 className={cn("leading-none font-semibold tracking-tight", className)} {...properties} />
  );
}
export function CardDescription({ className, ...properties }: ICardProps): React.ReactElement {
  return <p className={cn("text-muted-foreground text-sm", className)} {...properties} />;
}

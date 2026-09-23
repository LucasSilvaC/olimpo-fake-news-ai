import { Info } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface IAnnotationCalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
}

export function AnnotationCallout({
  className,
  icon,
  title,
  children,
  ...properties
}: IAnnotationCalloutProps): React.ReactElement {
  return (
    <aside
      className={cn(
        "border-border/80 bg-muted/60 text-foreground flex items-start gap-2.5 rounded-lg border p-3 text-xs leading-relaxed shadow-xs",
        className,
      )}
      {...properties}
    >
      <span className="shrink-0 select-none" aria-hidden="true">
        {icon ?? <Info className="text-muted-foreground mt-0.5 h-4 w-4" />}
      </span>
      <div className="space-y-0.5">
        {title ? <span className="font-bold tracking-tight">{title} </span> : null}
        <span className="text-muted-foreground">{children}</span>
      </div>
    </aside>
  );
}

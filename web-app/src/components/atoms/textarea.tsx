import * as React from "react";

import { cn } from "@/lib/utils";

export type ITextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...properties }: ITextareaProps): React.ReactElement {
  return (
    <textarea
      className={cn(
        "bg-background placeholder:text-muted-foreground focus-visible:ring-ring border-border flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...properties}
    />
  );
}

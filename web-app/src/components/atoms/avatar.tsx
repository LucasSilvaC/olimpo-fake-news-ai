import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "inline-flex items-center justify-center rounded-full border-2 border-border bg-card font-bold text-card-foreground select-none shrink-0 shadow-xs",
  {
    variants: {
      size: {
        sm: "h-6 w-6 text-[10px]",
        md: "h-8 w-8 text-xs",
        lg: "h-11 w-11 text-sm",
        xl: "h-14 w-14 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface IAvatarProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  initials?: string;
}

export function Avatar({
  className,
  size,
  initials,
  children,
  ...properties
}: IAvatarProps): React.ReactElement {
  return (
    <div className={cn(avatarVariants({ size }), className)} {...properties}>
      {initials ?? children}
    </div>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

export type ILabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...properties }: ILabelProps): React.ReactElement {
  return <label className={cn("text-sm leading-none font-medium", className)} {...properties} />;
}

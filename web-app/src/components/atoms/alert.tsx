import * as React from "react";

import { cn } from "@/lib/utils";

type IAlertProps = React.HTMLAttributes<HTMLDivElement>;
export function Alert({ className, ...properties }: IAlertProps): React.ReactElement {
  return (
    <div className={cn("rounded-md border p-3 text-sm", className)} role="status" {...properties} />
  );
}

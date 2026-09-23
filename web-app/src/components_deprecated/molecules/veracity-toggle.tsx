import { CheckCircle2, XCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface IVeracityToggleProps {
  value?: "fake" | "fact";
  onChange?: (value: "fake" | "fact") => void;
  className?: string;
}

export function VeracityToggle({
  value = "fake",
  onChange,
  className,
}: IVeracityToggleProps): React.ReactElement {
  return (
    <div className={cn("grid grid-cols-2 gap-2.5", className)} role="radiogroup">
      <button
        type="button"
        role="radio"
        aria-checked={value === "fake"}
        onClick={() => onChange?.("fake")}
        className={cn(
          "border-border bg-card text-card-foreground focus-visible:ring-ring flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 text-xs font-bold transition-all select-none focus-visible:ring-2 focus-visible:outline-none",
          value === "fake"
            ? "border-primary bg-primary text-primary-foreground shadow-xs"
            : "hover:bg-muted",
        )}
      >
        <XCircle className="h-3.5 w-3.5" />
        <span>É FAKE NEWS (Blefe)</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === "fact"}
        onClick={() => onChange?.("fact")}
        className={cn(
          "border-border bg-card text-card-foreground focus-visible:ring-ring flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 text-xs font-bold transition-all select-none focus-visible:ring-2 focus-visible:outline-none",
          value === "fact"
            ? "border-primary bg-primary text-primary-foreground shadow-xs"
            : "hover:bg-muted",
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>É FATO REAL (Verídico)</span>
      </button>
    </div>
  );
}

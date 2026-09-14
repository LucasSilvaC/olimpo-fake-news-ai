import { Crown } from "lucide-react";
import * as React from "react";

import { Avatar } from "@/components/atoms/avatar";
import { cn } from "@/lib/utils";

export interface IPlayerChipProps extends React.HTMLAttributes<HTMLDivElement> {
  initials: string;
  name: string;
  isYou?: boolean;
  isLeader?: boolean;
  statusText?: string;
}

export function PlayerChip({
  className,
  initials,
  name,
  isYou = false,
  isLeader = false,
  statusText,
  ...properties
}: IPlayerChipProps): React.ReactElement {
  return (
    <div
      className={cn(
        "border-border bg-card text-card-foreground flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold shadow-xs transition-colors",
        isYou && "border-primary/60 bg-muted/80 ring-primary/30 ring-1",
        className,
      )}
      {...properties}
    >
      <Avatar size="sm" initials={initials} />
      <span className="truncate">{name}</span>
      {statusText ? (
        <span className="text-muted-foreground ml-auto text-[10px] font-medium">{statusText}</span>
      ) : null}
      {isLeader ? (
        <span className="ml-auto" title="Líder da Sala">
          <Crown className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-label="Líder da Sala" />
        </span>
      ) : null}
    </div>
  );
}

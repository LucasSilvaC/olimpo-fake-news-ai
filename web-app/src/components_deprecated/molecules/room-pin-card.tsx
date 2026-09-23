import { Copy, RefreshCw } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";

export interface IRoomPinCardProps extends React.HTMLAttributes<HTMLDivElement> {
  pin: string;
  onCopy?: () => void;
  onRefresh?: () => void;
}

export function RoomPinCard({
  className,
  pin,
  onCopy,
  onRefresh,
  ...properties
}: IRoomPinCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "border-border bg-card text-card-foreground flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 text-center shadow-xs",
        className,
      )}
      {...properties}
    >
      <span className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
        Código PIN da Sala
      </span>
      <div className="font-mono text-3xl font-black tracking-widest sm:text-4xl">{pin}</div>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="gap-1.5 text-xs font-semibold"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Copiar Link de Convite</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Novo PIN</span>
        </Button>
      </div>
    </div>
  );
}

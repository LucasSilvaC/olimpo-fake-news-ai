import { Award, Flame, Sparkles } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/atoms/badge";
import { cn } from "@/lib/utils";

export interface ILeaderboardEntry {
  rank: number;
  name: string;
  badge?: string;
  hits: string;
  bluffs: string;
  points: number;
  isYou?: boolean;
}

export interface ILeaderboardTableProps extends React.HTMLAttributes<HTMLDivElement> {
  entries: ILeaderboardEntry[];
}

export function LeaderboardTable({
  className,
  entries,
  ...properties
}: ILeaderboardTableProps): React.ReactElement {
  return (
    <div
      className={cn(
        "border-border bg-card text-card-foreground w-full overflow-hidden rounded-xl border shadow-xs",
        className,
      )}
      {...properties}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="border-border text-muted-foreground bg-muted/40 border-b font-mono text-[10px] tracking-wider uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">#</th>
              <th className="px-4 py-3 font-bold">Jogador</th>
              <th className="px-4 py-3 text-center font-bold">Acertos</th>
              <th className="px-4 py-3 text-center font-bold">Blefes</th>
              <th className="px-4 py-3 text-right font-bold">Pontos</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {entries.map((entry) => (
              <tr
                key={entry.name}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  entry.isYou && "bg-muted/60 font-semibold",
                )}
              >
                <td className="px-4 py-3 font-mono font-bold">
                  {entry.rank === 1 ? (
                    <span className="inline-flex items-center gap-1 font-black text-amber-500">
                      <Award className="h-4 w-4" /> 1
                    </span>
                  ) : entry.rank === 2 ? (
                    <span className="inline-flex items-center gap-1 font-black text-slate-400">
                      <Award className="h-4 w-4" /> 2
                    </span>
                  ) : entry.rank === 3 ? (
                    <span className="inline-flex items-center gap-1 font-black text-amber-700">
                      <Award className="h-4 w-4" /> 3
                    </span>
                  ) : (
                    entry.rank
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span>{entry.name}</span>
                    {entry.isYou ? (
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                        Você
                      </Badge>
                    ) : null}
                    {entry.badge === "streak" ? (
                      <span className="border-border bg-muted/80 inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold text-orange-500">
                        <Flame className="h-3 w-3" /> x4
                      </span>
                    ) : entry.badge === "bluff" ? (
                      <span className="border-border bg-muted/80 text-primary inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold">
                        <Sparkles className="h-3 w-3" /> Blefador
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono">{entry.hits}</td>
                <td className="text-muted-foreground px-4 py-3 text-center font-mono">
                  {entry.bluffs}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold">
                  {entry.points.toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

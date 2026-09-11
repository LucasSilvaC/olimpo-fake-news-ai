import type { IExampleEntity } from "../model/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { cn } from "@/lib/utils";

interface IExampleCardProps {
  entity: IExampleEntity;
  className?: string;
}

const statusColorMap: Record<IExampleEntity["status"], string> = {
  draft: "border-muted-foreground/30 text-muted-foreground",
  published: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  archived: "border-amber-500/40 text-amber-600 dark:text-amber-400",
};

export function ExampleCard({ entity, className }: IExampleCardProps): React.ReactElement {
  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{entity.title}</CardTitle>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-medium tracking-wide uppercase",
            statusColorMap[entity.status],
          )}
        >
          {entity.status}
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <CardDescription>{entity.description}</CardDescription>
        <p className="text-muted-foreground text-xs">Criado em: {entity.createdAt}</p>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { cn } from "@/lib/utils";

interface IExampleEntity {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: "draft" | "published" | "archived";
}

const statusColorMap: Record<IExampleEntity["status"], string> = {
  draft: "border-muted-foreground/30 text-muted-foreground",
  published: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
  archived: "border-amber-500/40 text-amber-600 dark:text-amber-400",
};

interface IExampleWidgetProps {
  title?: string;
  items?: IExampleEntity[];
}

const defaultItems: IExampleEntity[] = [
  {
    id: "1",
    title: "Exemplo de Entidade no Widget",
    description: "Widgets combinam entidades, features e átomos em blocos maiores de UI.",
    createdAt: "2026-09-11",
    status: "published",
  },
];

export function ExampleWidget({
  title = "Widget de Exemplo",
  items = defaultItems,
}: IExampleWidgetProps): React.ReactElement {
  return (
    <Card className="space-y-4 p-6">
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {items.map((item) => (
          <Card key={item.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-medium tracking-wide uppercase",
                  statusColorMap[item.status],
                )}
              >
                {item.status}
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardDescription>{item.description}</CardDescription>
              <p className="text-muted-foreground text-xs">Criado em: {item.createdAt}</p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

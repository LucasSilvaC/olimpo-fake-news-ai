import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card";
import { ExampleCard, type IExampleEntity } from "@/entities/example";

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
          <ExampleCard key={item.id} entity={item} />
        ))}
      </CardContent>
    </Card>
  );
}

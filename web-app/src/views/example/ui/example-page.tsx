import { ExampleWidget } from "@/widgets/example";

export function ExamplePage(): React.ReactElement {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Página de Exemplo</h1>
        <p className="text-muted-foreground text-sm">
          Demonstração de composição de página em Feature-Sliced Design.
        </p>
      </header>
      <ExampleWidget />
    </main>
  );
}

import { ThemeToggle } from "@/components/molecules/theme-toggle";

export function AppHeader(): React.ReactElement {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Acrux · El Dorado
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}

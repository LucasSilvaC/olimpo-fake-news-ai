# Contributing

Use a lowercase kebab-case branch: `feat/<short-description>`, `fix/<short-description>`, or `chore/<short-description>`. Changes require a pull request and review before merge.

Before opening a PR, run `pnpm check`. Commits follow `type(scope): description`, entirely in lowercase. Never commit secrets. Prefer small, focused changes, add meaningful tests, and include versioned Drizzle migrations for schema changes. The author owns verifying migration safety and rollback.

---

## Diretrizes de Frontend e Estilização

### 1. Sistema de Temas (Dark / Light Mode Automático)

O web-app utiliza **`next-themes`** em conjunto com **Tailwind CSS v4** e variáveis CSS em espaço de cor `oklch`.

- O tema padrão é `system` (respeita a preferência do SO do usuário) e permite alternância manual via `ThemeToggle`.
- A alternância insere/remove a classe `.dark` no elemento `<html>` e persiste a escolha no `localStorage`.

### 2. Regra de Ouro: Sem Cores Fixas / Literais

Para que **qualquer novo componente herde o modo claro/escuro automaticamente**, é **estritamente proibido** usar cores literais estáticas para superfícies e textos essenciais (ex.: `bg-white`, `bg-[#121212]`, `text-black`, `bg-gray-100`).

Sempre utilize os **tokens semânticos** configurados no design system:

| Token Semântico              | Classes Tailwind                         | Uso Recomendado                                       |
| :--------------------------- | :--------------------------------------- | :---------------------------------------------------- |
| **Fundo da Página**          | `bg-background` / `text-foreground`      | Superfície principal da aplicação e cor de texto base |
| **Cartões / Painéis**        | `bg-card` / `text-card-foreground`       | Containers, modais, cards, popovers                   |
| **Ação Principal**           | `bg-primary` / `text-primary-foreground` | Botões de destaque, badges principais                 |
| **Neutros / Desabilitados**  | `bg-muted` / `text-muted-foreground`     | Subtítulos, textos de apoio, fundos secundários       |
| **Bordas e Divisores**       | `border-border` ou apenas `border`       | Linhas separadoras (já herdadas no seletor base)      |
| **Foco e Acessibilidade**    | `ring-ring` / `focus-visible:ring-ring`  | Anéis de foco em inputs e botões                      |
| **Erros e Alertas Críticos** | `bg-destructive` / `text-destructive`    | Mensagens de validação, botões de ação destrutiva     |

### 3. Novas Cores ou Tokens

Se um componente exigir uma nova categoria de cor (ex.: `accent`, `warning`, `info`):

1. **Nunca** aplique uma cor arbitrária solta no JSX.
2. Adicione a variável semântica correspondente tanto em `:root` (modo claro) quanto em `.dark` (modo escuro) em `src/app/globals.css`.
3. Mapeie a cor na seção `@theme inline` para disponibilizá-la ao Tailwind.

### 4. Construção de Novos Componentes

- **Organização**: Siga a hierarquia de pastas estabelecida:
  - `src/components/atoms/`: Elementos primitivos reutilizáveis (`Button`, `Input`, `Card`, etc.).
  - `src/components/molecules/`: Combinações simples (`ThemeToggle`, inputs com ícone).
  - `src/components/organisms/`: Estruturas orquestradoras (`ThemeProvider`).
  - `src/widgets/` e `src/features/`: Componentes orientados a domínio/funcionalidade.
- **Composição de Classes**: Utilize o helper `cn()` (`clsx` + `tailwind-merge`) para permitir extensibilidade via propriedade `className`.
- **Variantes de Estado**: Use `class-variance-authority` (`cva`) para componentes que possuem múltiplos tamanhos ou variantes visuais.
- **Acessibilidade**: Garanta atributos ARIA adequados (`role`, `aria-label`, `aria-live`) e contraste visual nos modos claro e escuro.

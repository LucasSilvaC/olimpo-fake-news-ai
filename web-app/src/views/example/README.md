# Camada Views (Pages) — Padrão FSD no Next.js App Router

Em aplicações Next.js que utilizam o **App Router** (`src/app/`), a pasta `pages/` é uma palavra reservada pelo Next.js (Pages Router legado). Por convenção padrão do ecossistema FSD em projetos Next.js modernos, a camada de páginas do FSD é nomeada **`views/`** (ou `screens/`).

## Responsabilidades de uma View/Page:

1. Compor blocos prontos (`widgets`, `features`, `entities`).
2. Definir o layout global daquela visualização (espaçamento, container principal, títulos).
3. Não concentra lógica de mutação direta ou chamadas de fetch sem ViewModel.

## Regras de Dependência:

- ✅ Pode importar de `widgets/`, `features/`, `entities/` e `shared/`.
- ❌ Não deve ser importada por nenhuma camada abaixo dela (`widgets`, `features`, `entities`, `shared`).
- O arquivo `src/app/**/page.tsx` serve exclusivamente de ponto de entrada/roteamento e delega a renderização para uma slice em `src/views/**`.

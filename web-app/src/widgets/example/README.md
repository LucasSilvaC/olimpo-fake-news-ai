# Camada Widgets — Padrão FSD

Um **Widget** é um bloco grande e autônomo de interface, frequentemente reutilizável entre páginas.

## Exemplos de Widgets:

- Header global ou Sidebar de navegação.
- Painel complexo de filtros.
- Painel de orquestração de um fluxo (ex: `NewsExtractor` compondo form e preview do artigo).
- Tabela de dados com paginação e toolbar.

## Regras de Dependência:

- ✅ Pode importar de `features/`, `entities/` e `shared/` (`components/atoms`, etc.).
- ❌ **NUNCA** pode importar de outros `widgets/` irmãos (evite dependência lateral).
- ❌ **NUNCA** pode importar de `pages/` ou `app/`.
- Cada widget deve ter seu próprio `index.ts` expondo sua Public API.

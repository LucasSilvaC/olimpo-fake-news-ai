# Camada Entities — Padrão FSD

Uma **Entity** representa um conceito central de domínio no frontend (o **substantivo** do produto).

## O que pertence a uma Entity:

1. `model/types.ts`: Tipos TypeScript que definem a estrutura de dados do domínio.
2. `ui/`: Componentes visuais de apresentação da entidade (ex: cards, linhas de tabela, avatares, metadados).
3. `lib/` ou `api/` (opcional): Mappers e queries dedicadas de leitura da entidade.
4. `index.ts`: Public API exportando componentes e tipos reutilizáveis.

## Regras de Dependência:

- ✅ Pode depender de `shared/` (ex: `components/atoms`, `lib/utils`).
- ❌ **NUNCA** pode importar de `features/`, `widgets/` ou `pages/`.
- ❌ Não contém fluxos de mutação ou lógica de orquestração de usuário (isso pertence a `features/`).

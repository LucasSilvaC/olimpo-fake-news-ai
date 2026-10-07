# Olimpo · documentação

Aplicação de documentação do Olimpo, construída com Next.js, TypeScript, Tailwind CSS v4 e ícones Lucide.

## Desenvolvimento

Requisitos: Node.js 24 e pnpm 11.10 ou superior.

```powershell
pnpm install
pnpm dev
```

Abra <http://127.0.0.1:3000>. A documentação não precisa de PostgreSQL, Redis ou arquivo de variáveis de ambiente.

## Conteúdo

Os guias descrevem o produto, o fluxo de salas e partidas, o extrator de notícias, a arquitetura técnica e a manutenção do projeto. A navegação reúne os artigos em três áreas macro: **Produto**, **Engenharia** e **Desenvolvimento**.

O conteúdo usa como fontes o README principal, as especificações OpenSpec, o documento de arquitetura em `../docs/arquitetura.pdf`, o README do `web-app` e este próprio README. Os artigos apontam para suas fontes. Regras de produto são descritas a partir das especificações; telas com valores e nomes de exemplo não são tratadas como dados reais.

## Como manter os artigos

- `src/entities/documentation/data/documentation-pages.ts`: páginas, grupos macro, seções, conteúdo e referências.
- `src/entities/documentation/model/types.ts`: contrato dos artigos e dos blocos disponíveis.
- `src/entities/documentation/model/icon-map.ts`: associação entre nomes tipados e ícones Lucide.
- `src/features/documentation-navigation/ui/sidebar-navigation.tsx`: busca e hierarquia da sidebar.
- `src/views/document/ui/document-page.tsx`: apresentação dos artigos.
- `public/`: imagens com crédito e diagramas SVG do projeto.

Cada guia deve ter uma área macro, um ícone, seções curtas e links para as fontes relevantes. Figuras precisam de texto alternativo; imagens externas devem exibir autor, licença e link de origem.

## Verificações disponíveis

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

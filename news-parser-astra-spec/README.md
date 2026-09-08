# News Parser PoC — documentação para implementação

Este pacote descreve a primeira etapa de uma PoC de análise de notícias.

## Objetivo

O usuário informa a URL pública de uma notícia e o sistema deve:

1. validar a URL;
2. baixar o HTML quando possível;
3. extrair os dados estruturados disponíveis;
4. extrair o conteúdo principal da notícia;
5. combinar os resultados em um único contrato;
6. usar o Jina Reader apenas como fallback quando a extração local não for suficiente;
7. retornar o artigo normalizado em JSON;
8. exibir o resultado em uma interface mínima para teste.

## Fora do escopo

Nesta etapa NÃO implementar:

- LLM;
- limpeza com IA;
- classificação da notícia;
- detecção de fake news;
- análise de confiabilidade;
- banco de dados;
- autenticação;
- filas;
- crawling de múltiplas páginas;
- Playwright/Puppeteer;
- scraping específico por portal.

A entrega termina no parser.

## Stack esperada

- Next.js com App Router
- TypeScript
- Node.js runtime
- `fetch`
- `jsdom`
- `@mozilla/readability`
- `zod`

## Ordem de leitura

1. `00-project-context.md`
2. `01-target-architecture.md`
3. `02-parser-specification.md`
4. `03-api-contract.md`
5. `04-security-and-jina-fallback.md`
6. `05-implementation-checklist.md`

Se outro agente for implementar o projeto inteiro de uma vez, use diretamente:

- `astra-master-prompt.md`

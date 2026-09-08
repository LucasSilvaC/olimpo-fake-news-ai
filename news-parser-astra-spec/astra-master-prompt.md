# Prompt mestre — implementar News Parser PoC em Next.js

Implemente esta funcionalidade de ponta a ponta no projeto Next.js atual.

Não apenas descreva a solução: modifique/crie os arquivos necessários, instale as dependências necessárias e valide o resultado.

## Objetivo

Criar uma PoC onde o usuário informa a URL pública de uma notícia e recebe o conteúdo principal e os metadados extraídos.

O escopo TERMINA no parser.

Não utilizar LLM.

## Tecnologias

Use:

```text
Next.js App Router
TypeScript
Node.js runtime
fetch
jsdom
@mozilla/readability
zod
```

Não usar:

```text
Playwright
Puppeteer
LLM
banco de dados
fila
scraping específico por portal
```

## Pipeline obrigatório

Implementar:

```text
URL
 ↓
validação de segurança
 ↓
fetch local
 ↓
HTML
 ↓
├── JSON-LD
├── meta tags / Open Graph
└── Mozilla Readability
 ↓
merge
 ↓
resultado suficiente?
 ├── sim → retornar
 └── não → Jina Reader
              ↓
         converter resposta
              ↓
           merge final
              ↓
            retornar
```

## Endpoint

Criar:

```text
POST /api/news/extract
```

Body:

```json
{
  "url": "https://example.com/news/article"
}
```

## Contrato final

Use:

```ts
type ExtractionMethod = "local" | "jina";

interface INewsArticle {
  url: string;
  canonicalUrl: string | null;
  title: string | null;
  description: string | null;
  authors: string[];
  publishedAt: string | null;
  modifiedAt: string | null;
  content: string;
  imageUrl: string | null;
  publisher: string | null;
  language: string | null;
  extractionMethod: ExtractionMethod;
  usedFallback: boolean;
}
```

## Estrutura sugerida

Não overengineer.

```text
app/
├── api/
│   └── news/
│       └── extract/
│           └── route.ts
├── page.tsx

src/
└── lib/
    └── news/
        ├── types.ts
        ├── schemas.ts
        ├── extract-news.ts
        ├── fetch-page.ts
        ├── parse-json-ld.ts
        ├── parse-metadata.ts
        ├── parse-readability.ts
        ├── merge-extraction.ts
        ├── jina-reader.ts
        └── validate-url.ts
```

Pode adaptar a estrutura se o projeto atual já tiver convenções claras.

Priorize funcionar.

## Parsing local

### JSON-LD

Ler:

```html
<script type="application/ld+json">
```

Suportar:

```text
NewsArticle
Article
BlogPosting
```

Suportar:

- objeto direto;
- arrays;
- `@graph`;
- `@type` como string;
- `@type` como array.

Extrair quando disponível:

```text
headline
description
articleBody
author
datePublished
dateModified
image
publisher
inLanguage
mainEntityOfPage
```

### Metadata

Ler pelo menos:

```text
<title>
link[rel=canonical]

meta[name=author]
meta[name=description]

og:title
og:description
og:image
og:site_name

article:published_time
article:modified_time
article:author

twitter:title
twitter:description
twitter:image
```

### Readability

Usar `JSDOM` com a URL da página.

Não habilitar execução de scripts.

Extrair:

```text
title
byline
textContent
excerpt
siteName
lang
publishedTime
```

Use `textContent` como principal conteúdo textual extraído pelo Readability.

## Merge

Aplicar precedência simples.

### title

```text
JSON-LD
→ Open Graph
→ Readability
→ <title>
```

### description

```text
JSON-LD
→ Open Graph
→ Readability excerpt
→ meta description
```

### authors

```text
JSON-LD
→ metadata
→ Readability byline
```

### publishedAt

```text
JSON-LD
→ article:published_time
→ Readability publishedTime
```

### modifiedAt

```text
JSON-LD
→ article:modified_time
```

### content

Use o melhor conteúdo disponível entre:

```text
JSON-LD articleBody
Readability textContent
```

Se `articleBody` estiver curto ou incompleto e Readability retornar conteúdo substancial, prefira Readability.

### imageUrl

```text
JSON-LD
→ og:image
→ twitter:image
```

### publisher

```text
JSON-LD publisher
→ og:site_name
→ Readability siteName
```

### language

```text
JSON-LD inLanguage
→ Readability lang
→ html[lang]
```

## Critério de sucesso local

Criar algo equivalente a:

```ts
function isExtractionUsable(article: INewsArticle): boolean
```

Para esta PoC:

```text
content.trim().length >= 300
```

e existir pelo menos um:

```text
title
publisher
authors
```

Se o conteúdo for insuficiente, usar Jina.

Ausência apenas de autor, imagem, data ou descrição NÃO deve acionar fallback.

## Jina Reader

Jina é fallback, não mecanismo principal.

Quando necessário, solicitar:

```text
https://r.jina.ai/<URL_ORIGINAL>
```

Exemplo conceitual:

```text
https://r.jina.ai/https://example.com/news/article
```

Enviar:

```http
Accept: application/json
```

Suportar opcionalmente:

```env
JINA_API_KEY=
```

Não depender obrigatoriamente de chave para desenvolvimento se o Reader estiver acessível sem ela.

Configurar timeout próprio para Jina, aproximadamente 15 segundos.

Não fazer múltiplos retries.

Se houver extração local parcial útil, preservar os metadados locais e usar Jina para completar principalmente o conteúdo.

Quando Jina for utilizado:

```json
{
  "extractionMethod": "jina",
  "usedFallback": true
}
```

## Segurança mínima obrigatória

O endpoint faz requests a URLs fornecidas pelo usuário, portanto implemente proteção mínima contra SSRF.

Aceitar apenas:

```text
http
https
```

Bloquear:

```text
localhost
127.0.0.1
::1
faixas privadas
link-local
metadata endpoints
destinos internos
```

Resolver DNS antes do request e rejeitar IP privado/especial.

Validar novamente redirects.

Máximo:

```text
3 redirects
```

Fetch local:

```text
timeout ≈ 8 segundos
HTML máximo ≈ 3 MB
```

Não executar JavaScript recebido.

Aceitar somente conteúdo HTML nesta etapa.

## UI mínima

Criar interface funcional na página principal ou em uma página simples.

Precisa ter:

```text
input URL
botão Extract
loading
erro
resultado
```

Mostrar:

```text
title
authors
publishedAt
publisher
description
imageUrl
content
extractionMethod
usedFallback
```

Adicionar um bloco `<pre>` com o JSON completo para debugging.

Não gastar tempo com design sofisticado.

## Erros HTTP

Usar aproximadamente:

```text
400 INVALID_URL
400 UNSAFE_URL
404 quando realmente for possível identificar not found
422 EXTRACTION_FAILED
500 INTERNAL_ERROR
```

Não enviar stack trace para o frontend.

## Restrições de implementação

Não crie abstrações que não sejam necessárias.

Não transforme esta PoC em Clean Architecture completa.

Não crie banco.

Não crie autenticação.

Não crie testes excessivos antes do fluxo funcionar.

Primeiro faça o caminho completo funcionar.

Depois valide manualmente.

## Validação obrigatória antes de concluir

Teste:

1. notícia pública SSR;
2. notícia com JSON-LD;
3. página onde fallback Jina seja necessário, se conseguir encontrar/testar uma;
4. URL inválida;
5. localhost;
6. IP privado;
7. página não-artigo.

Confirme que:

```text
local extraction funciona
fallback funciona
endpoint funciona
UI funciona
SSRF básico está bloqueado
nenhuma LLM foi adicionada
```

Se alguma URL pública bloquear scraping, isso não é motivo para reescrever toda a solução: deixe Jina tentar.

Não implementar lógica específica para um portal apenas para fazer um teste passar.

## Definição de pronto

Considere pronto quando eu puder:

```text
rodar o Next.js
colar uma URL de notícia
clicar em Extract
ver os dados do artigo
ver o conteúdo principal
ver se foi local ou Jina
```

O escopo desta entrega termina aqui.

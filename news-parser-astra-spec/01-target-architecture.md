# Arquitetura alvo

## Estrutura sugerida

Manter a implementação simples.

```text
app/
├── api/
│   └── news/
│       └── extract/
│           └── route.ts
├── page.tsx
└── ...

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

Não criar Clean Architecture completa para esta PoC.

A separação acima existe somente para impedir que todo o parser fique dentro do Route Handler.

## Responsabilidades

### `route.ts`

Responsável por:

1. receber `POST`;
2. validar body;
3. chamar `extractNews`;
4. mapear erro para HTTP;
5. retornar JSON.

Não colocar lógica de parsing diretamente aqui.

---

### `extract-news.ts`

Orquestrador principal.

Fluxo:

```text
validateUrl
 ↓
fetchPage
 ↓
parseJsonLd
parseMetadata
parseReadability
 ↓
mergeExtraction
 ↓
isExtractionUsable?
 ├─ true  → return
 └─ false → readWithJina
                 ↓
            merge/normalize
                 ↓
               return
```

Também deve acionar Jina quando o fetch ou parser local falhar por um erro recuperável.

---

### `fetch-page.ts`

Responsável por fazer o HTTP request da página.

Requisitos:

- aceitar apenas HTML;
- timeout;
- limitar redirects;
- usar `User-Agent` de navegador razoável;
- não executar JavaScript;
- retornar:
  - HTML;
  - URL final após redirects;
  - `content-type`.

---

### `parse-json-ld.ts`

Extrair blocos:

```html
<script type="application/ld+json">
```

Suportar principalmente:

- `NewsArticle`
- `Article`
- `BlogPosting`

Também considerar objetos dentro de:

```json
{
  "@graph": []
}
```

Extrair quando disponível:

- `headline`
- `description`
- `articleBody`
- `author`
- `datePublished`
- `dateModified`
- `image`
- `publisher`
- `inLanguage`
- `mainEntityOfPage`

Não assumir que `author` sempre é string.

Pode ser:

```json
{
  "@type": "Person",
  "name": "John Doe"
}
```

ou:

```json
[
  {
    "@type": "Person",
    "name": "John Doe"
  }
]
```

---

### `parse-metadata.ts`

Ler:

```text
<title>
<link rel="canonical">

meta[name="author"]
meta[name="description"]

meta[property="og:title"]
meta[property="og:description"]
meta[property="og:image"]
meta[property="og:site_name"]

meta[property="article:published_time"]
meta[property="article:modified_time"]
meta[property="article:author"]

meta[name="twitter:title"]
meta[name="twitter:description"]
meta[name="twitter:image"]
```

Usar Open Graph como complemento, não como conteúdo principal.

---

### `parse-readability.ts`

Criar DOM usando `jsdom`.

Importante: passar a URL original/final ao `JSDOM` para que URLs relativas possam ser resolvidas.

Executar Mozilla Readability e capturar:

- `title`
- `byline`
- `content`
- `textContent`
- `excerpt`
- `siteName`
- `lang`
- `publishedTime`

O `textContent` deve ser a principal fonte do campo final `content`.

Nesta etapa o sistema não precisa preservar o HTML limpo do artigo.

Se quiser preservar por conveniência, usar um campo interno, mas não é obrigatório no contrato público.

Não executar scripts do HTML no `jsdom`.

---

### `merge-extraction.ts`

Combinar as fontes.

Não precisa criar um motor sofisticado de scoring.

Aplicar precedência simples por campo.

#### Title

```text
JSON-LD headline
→ Open Graph title
→ Readability title
→ <title>
```

#### Description

```text
JSON-LD description
→ Open Graph description
→ Readability excerpt
→ meta description
```

#### Authors

```text
JSON-LD author
→ meta/article author
→ Readability byline
```

#### Published date

```text
JSON-LD datePublished
→ article:published_time
→ Readability publishedTime
```

#### Modified date

```text
JSON-LD dateModified
→ article:modified_time
```

#### Content

```text
JSON-LD articleBody, se realmente possuir conteúdo substancial
→ Readability textContent
```

Recomendação prática:

Preferir Readability para conteúdo quando o `articleBody` do JSON-LD for muito curto.

#### Image

```text
JSON-LD image
→ og:image
→ twitter:image
```

#### Publisher

```text
JSON-LD publisher.name
→ og:site_name
→ Readability siteName
```

#### Language

```text
JSON-LD inLanguage
→ Readability lang
→ <html lang>
```

---

## Critério de extração local válida

Criar função:

```ts
isExtractionUsable(article)
```

Para a PoC, considerar utilizável quando:

```text
content.trim().length >= 300
```

e existir ao menos um destes:

```text
title
publisher
authors
```

Não deixar o threshold excessivamente alto porque existem notícias curtas.

Se o resultado ficar abaixo do threshold, usar Jina.

---

## Não implementar agora

Não adicionar:

- adapters complexos;
- repository;
- banco;
- Redis;
- queue;
- cache distribuído;
- cron;
- background workers;
- browser automation;
- LLM.

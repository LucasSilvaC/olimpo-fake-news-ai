# Especificação do parser

## Entrada

```ts
interface IExtractNewsInput {
  url: string;
}
```

## Saída

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

## Regras de normalização determinística

Esta normalização NÃO utiliza LLM.

### Strings

Aplicar apenas limpeza simples:

```text
trim
normalizar múltiplos espaços
remover strings vazias
```

Não tentar reescrever títulos.

Não tentar remover nomes de portais do título usando heurísticas agressivas.

Exemplo:

```text
"Governo anuncia medida | Example News"
```

pode permanecer exatamente assim nesta etapa.

### Authors

Converter diferentes formatos para:

```ts
string[]
```

Exemplos.

Entrada:

```json
"John Doe"
```

Saída:

```json
["John Doe"]
```

Entrada:

```json
{
  "@type": "Person",
  "name": "John Doe"
}
```

Saída:

```json
["John Doe"]
```

Entrada:

```json
[
  {
    "@type": "Person",
    "name": "John Doe"
  },
  {
    "@type": "Person",
    "name": "Jane Doe"
  }
]
```

Saída:

```json
["John Doe", "Jane Doe"]
```

Remover duplicados exatos.

Não tentar semanticamente remover prefixos como:

```text
Por
By
Reportagem de
```

a menos que seja uma limpeza óbvia e segura.

### Datas

Quando a origem já fornecer ISO 8601, preservar.

Quando o valor não puder ser convertido de forma segura com `Date`, retornar o texto apenas internamente e colocar `null` no contrato final.

Não tentar interpretar linguagem natural complexa como:

```text
Atualizado há 2 horas
Ontem às 15h
```

nesta etapa.

### URLs

Resolver URLs relativas para absolutas sempre que existir uma base confiável.

Exemplo:

```text
/images/article.jpg
```

deve virar:

```text
https://example.com/images/article.jpg
```

quando a origem da página for:

```text
https://example.com/news/article
```

### Conteúdo

O contrato final deve retornar texto puro.

Exemplo:

```text
First paragraph.

Second paragraph.

Third paragraph.
```

Não retornar:

- menus;
- rodapé;
- cookie banner;
- scripts;
- CSS;
- comentários HTML;
- navegação;
- anúncios quando Readability conseguir removê-los.

Não criar heurísticas específicas de portal nesta etapa.

## JSON-LD

O parser deve ser tolerante.

Casos que devem ser tratados:

### Objeto direto

```json
{
  "@type": "NewsArticle"
}
```

### Array

```json
[
  {
    "@type": "Organization"
  },
  {
    "@type": "NewsArticle"
  }
]
```

### Graph

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization"
    },
    {
      "@type": "NewsArticle"
    }
  ]
}
```

### `@type` como array

```json
{
  "@type": ["Article", "NewsArticle"]
}
```

O parser deve selecionar candidatos cujo tipo contenha:

```text
NewsArticle
Article
BlogPosting
```

Preferência:

```text
NewsArticle
→ Article
→ BlogPosting
```

Se houver múltiplos candidatos, escolher o candidato com mais informações úteis.

Não precisa construir scoring complexo.

Uma soma simples de presença dos campos abaixo é suficiente:

```text
headline
articleBody
author
datePublished
description
image
publisher
```

## Readability

Usar:

```text
@mozilla/readability
jsdom
```

Não ativar execução de scripts.

A página já deve ter sido baixada antes de criar o DOM.

Não usar browser headless nesta etapa.

## Resultado parcial

Se o parser encontrar:

```json
{
  "title": "Article",
  "content": "conteúdo suficiente..."
}
```

mas não encontrar autor ou data, isso ainda deve ser considerado sucesso.

O objetivo é retornar o máximo possível, não exigir que todos os campos existam.

## Quando usar fallback

Usar Jina se:

1. fetch local falhar por bloqueio/erro recuperável;
2. HTML não possuir conteúdo utilizável;
3. Readability retornar `null`;
4. conteúdo final tiver menos de 300 caracteres;
5. parser lançar erro inesperado sobre uma página válida;
6. página depender de renderização que o fetch simples não conseguiu capturar.

Não usar Jina apenas porque:

- autor não foi encontrado;
- imagem não foi encontrada;
- `modifiedAt` não foi encontrado;
- descrição não foi encontrada.

Se o artigo principal foi extraído, o parser local cumpriu seu papel.

# Contexto do projeto

## Problema

O projeto precisa receber links de notícias publicadas na web e transformar páginas heterogêneas em uma representação estruturada.

Diferentes portais apresentam conteúdo de maneiras diferentes:

- HTML semântico;
- JSON-LD;
- Open Graph;
- meta tags;
- conteúdo server-side rendered;
- conteúdo parcialmente carregado por JavaScript;
- layouts com banners, navegação, anúncios e blocos irrelevantes.

O objetivo desta etapa não é compreender semanticamente a notícia.

O objetivo é somente obter os dados mais úteis de forma previsível.

## Resultado esperado

Dada uma URL como:

```text
https://example.com/news/some-article
```

o sistema deve tentar produzir:

```json
{
  "url": "https://example.com/news/some-article",
  "canonicalUrl": "https://example.com/news/some-article",
  "title": "Article title",
  "description": "Article description",
  "authors": ["Author Name"],
  "publishedAt": "2026-09-08T14:30:00-03:00",
  "modifiedAt": null,
  "content": "Main article text...",
  "imageUrl": "https://example.com/image.jpg",
  "publisher": "Example News",
  "language": "pt-BR",
  "extractionMethod": "local",
  "usedFallback": false
}
```

Os campos que não puderem ser encontrados podem ser `null` ou arrays vazios.

O único campo que deve necessariamente existir em uma extração considerada válida é um conteúdo textual minimamente útil.

## Estratégia

A extração local deve ser a primeira opção.

```text
URL
 ↓
validação
 ↓
fetch HTML
 ↓
DOM
 ├─ JSON-LD
 ├─ meta tags / Open Graph
 └─ Mozilla Readability
 ↓
merge
 ↓
resultado suficiente?
 ├─ sim → retornar
 └─ não → Jina Reader
              ↓
         normalizar resposta
              ↓
            retornar
```

## Princípio principal

Não criar seletores específicos para G1, CNN, UOL, BBC, Folha ou qualquer portal.

A PoC precisa ser genérica.

Não tentar fazer scraping visual com seletores como:

```text
.article-title
.news-author
.post-content
```

como mecanismo principal.

Isso é frágil e não escala entre sites.

## Prioridades

Para esta etapa:

1. funcionar;
2. suportar vários portais;
3. ser simples de executar localmente;
4. retornar informações úteis;
5. falhar de maneira compreensível;
6. ter proteção mínima contra URLs perigosas.

Não é necessário criar uma arquitetura excessivamente abstrata.

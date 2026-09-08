# Contrato HTTP e interface mínima

## Endpoint

Implementar:

```text
POST /api/news/extract
```

## Body

```json
{
  "url": "https://example.com/news/article"
}
```

## Validação

Usar Zod.

Exemplo conceitual:

```ts
const extractNewsSchema = z.object({
  url: z.string().url(),
});
```

A validação de segurança da URL deve ocorrer separadamente.

## Resposta de sucesso

HTTP:

```text
200
```

Body:

```json
{
  "url": "https://example.com/news/article",
  "canonicalUrl": "https://example.com/news/article",
  "title": "Article title",
  "description": "Description",
  "authors": ["John Doe"],
  "publishedAt": "2026-09-08T14:30:00-03:00",
  "modifiedAt": null,
  "content": "Full extracted article content...",
  "imageUrl": "https://example.com/image.jpg",
  "publisher": "Example News",
  "language": "en",
  "extractionMethod": "local",
  "usedFallback": false
}
```

Quando Jina for utilizado:

```json
{
  "...": "...",
  "extractionMethod": "jina",
  "usedFallback": true
}
```

## Erros

### URL inválida

```text
400
```

```json
{
  "error": "INVALID_URL",
  "message": "The provided URL is invalid."
}
```

### URL bloqueada por segurança

```text
400
```

```json
{
  "error": "UNSAFE_URL",
  "message": "The provided URL cannot be accessed."
}
```

### Página não encontrada

```text
404
```

quando for possível determinar claramente que o recurso não existe.

### Extração impossível

```text
422
```

```json
{
  "error": "EXTRACTION_FAILED",
  "message": "Unable to extract useful article content from this URL."
}
```

### Erro interno

```text
500
```

```json
{
  "error": "INTERNAL_ERROR",
  "message": "Unexpected error while extracting the article."
}
```

Não retornar stack trace para o browser.

## Runtime

Forçar Node.js no Route Handler se necessário.

Não usar Edge Runtime porque `jsdom` e o fluxo de parsing são orientados ao ambiente Node.

## Interface mínima

Criar uma página simples para validar a PoC.

A página deve conter:

```text
[ URL da notícia                           ]

[ Extrair notícia ]
```

Durante execução:

```text
Extraindo...
```

Depois:

```text
Título
Autor(es)
Data de publicação
Publisher
Imagem, se houver
Conteúdo
Método de extração: local | jina
Fallback utilizado: sim | não
```

Não gastar tempo com design elaborado.

Objetivo da página:

1. testar URLs rapidamente;
2. visualizar erros;
3. verificar se o conteúdo foi extraído;
4. saber quando Jina foi utilizado.

## Comportamento da página

- impedir submit vazio;
- mostrar erro retornado pela API;
- desabilitar botão enquanto estiver carregando;
- permitir testar outra URL sem refresh completo;
- exibir o conteúdo em bloco legível;
- exibir também o JSON retornado em um `<pre>` opcional, útil para debugging.

## Não usar Server Action como mecanismo principal

Nesta PoC, preferir Route Handler porque a extração representa uma operação de backend independente da UI.

A página pode simplesmente fazer:

```text
POST /api/news/extract
```

# Checklist de implementação e aceite

O agente deve considerar a tarefa concluída somente depois de implementar e validar os itens abaixo.

## Dependências

Instalar:

```bash
npm install @mozilla/readability jsdom zod
```

Se TypeScript exigir tipos adicionais para `jsdom`, instalar os tipos correspondentes.

Não adicionar Puppeteer ou Playwright.

## Backend

- [ ] criar contrato `INewsArticle`;
- [ ] criar schema de request com Zod;
- [ ] criar validação de URL;
- [ ] bloquear protocolos não HTTP/HTTPS;
- [ ] bloquear localhost;
- [ ] resolver DNS;
- [ ] bloquear IPs privados/loopback/link-local;
- [ ] validar redirects;
- [ ] limitar redirects;
- [ ] implementar timeout;
- [ ] limitar tamanho do HTML;
- [ ] criar `fetchPage`;
- [ ] criar parser de JSON-LD;
- [ ] suportar `@graph`;
- [ ] suportar `@type` como string e array;
- [ ] extrair NewsArticle;
- [ ] extrair Article;
- [ ] extrair BlogPosting;
- [ ] criar parser de meta tags;
- [ ] criar parser Readability;
- [ ] criar merge;
- [ ] criar `isExtractionUsable`;
- [ ] criar fallback Jina;
- [ ] mesclar informações locais com Jina;
- [ ] criar `POST /api/news/extract`;
- [ ] mapear erros HTTP.

## Frontend

- [ ] input para URL;
- [ ] botão de extração;
- [ ] loading;
- [ ] tratamento de erro;
- [ ] resultado;
- [ ] conteúdo completo;
- [ ] indicação `local` ou `jina`;
- [ ] indicação se fallback foi usado;
- [ ] JSON para debugging.

## Testes manuais mínimos

Testar pelo menos:

### Caso A — notícia simples SSR

Uma notícia pública cujo HTML já contenha o artigo.

Esperado:

```text
extractionMethod = local
usedFallback = false
content >= 300 caracteres
```

### Caso B — JSON-LD

Uma notícia que exponha `NewsArticle`.

Verificar se pelo menos alguns destes campos são preenchidos:

```text
title
authors
publishedAt
publisher
imageUrl
```

### Caso C — página com conteúdo ruim para fetch simples

Testar uma página onde o parser local não obtenha conteúdo suficiente.

Esperado:

```text
usedFallback = true
extractionMethod = jina
```

### Caso D — URL inválida

Exemplo:

```text
abc
```

Esperado:

```text
400 INVALID_URL
```

### Caso E — localhost

Exemplo:

```text
http://localhost:3000
```

Esperado:

```text
400 UNSAFE_URL
```

### Caso F — IP privado

Exemplo:

```text
http://192.168.0.1
```

Esperado:

```text
400 UNSAFE_URL
```

### Caso G — página não-artigo

Testar uma homepage ou página praticamente sem conteúdo editorial.

Resultado aceitável:

```text
422 EXTRACTION_FAILED
```

ou fallback Jina seguido de `422` se ainda não houver conteúdo suficiente.

## Critério de sucesso da PoC

A tarefa está concluída quando:

1. eu consigo abrir a aplicação;
2. coloco uma URL pública de notícia;
3. clico em extrair;
4. recebo conteúdo textual principal;
5. recebo o máximo possível de metadados;
6. consigo identificar se foi local ou Jina;
7. URLs internas perigosas são recusadas;
8. páginas que falham localmente tentam Jina;
9. nenhuma LLM é utilizada.

## O que NÃO deve bloquear a entrega

Não gastar tempo tentando resolver perfeitamente:

- paywalls;
- login;
- CAPTCHA;
- Cloudflare avançado;
- todos os portais existentes;
- datas escritas em linguagem natural;
- nomes de autores inconsistentes;
- título contendo nome do portal;
- conteúdo de redes sociais;
- PDF;
- vídeos;
- páginas sem artigo.

São limitações aceitáveis para a PoC.

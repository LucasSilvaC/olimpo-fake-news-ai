# Segurança mínima e fallback Jina

Este projeto é uma PoC, mas o endpoint recebe uma URL arbitrária e faz requests do servidor.

Isso cria risco de SSRF.

Não precisa construir uma solução enterprise, mas algumas proteções são obrigatórias.

# Validação de URL

Aceitar somente:

```text
http:
https:
```

Preferencialmente, para URLs fornecidas diretamente pelo usuário, aceitar somente HTTPS quando possível.

Bloquear protocolos como:

```text
file:
ftp:
data:
javascript:
gopher:
```

## Bloquear hosts locais

Bloquear:

```text
localhost
*.localhost
```

e equivalentes óbvios.

## Bloquear endereços privados e especiais

Depois de resolver DNS, não permitir destinos dentro de faixas privadas, loopback ou link-local.

Exemplos que devem ser rejeitados:

```text
127.0.0.1
::1

10.0.0.0/8
172.16.0.0/12
192.168.0.0/16

169.254.0.0/16
fe80::/10
```

Também bloquear endereços não roteáveis/especiais que não façam sentido para uma notícia pública.

O ponto principal é impedir acesso a:

```text
localhost
rede interna
metadata endpoints
serviços internos
```

## DNS

Não validar apenas o hostname textual.

Resolver o hostname e conferir os IPs antes de realizar a requisição.

## Redirects

Redirect também pode levar para um destino privado.

Para a PoC:

- usar redirect manual ou controlar cada redirect;
- limitar a 3 redirects;
- validar novamente cada URL de destino.

Não seguir redirects indefinidamente.

# Fetch local

Configuração recomendada:

```text
timeout: 8 segundos
max redirects: 3
max HTML: aproximadamente 3 MB
```

Definir um `User-Agent` razoável.

Exemplo conceitual:

```text
Mozilla/5.0 (...) NewsParserPoC/1.0
```

Aceitar respostas cujo `content-type` seja compatível com HTML.

Exemplos:

```text
text/html
application/xhtml+xml
```

Para esta etapa, não processar:

```text
PDF
imagem
vídeo
ZIP
arquivo binário
```

# Jina Reader

O Jina NÃO é o primeiro mecanismo de extração.

É fallback.

Fluxo:

```text
fetch local
 ↓
parser local
 ↓
resultado insuficiente?
 ├─ não → retornar local
 └─ sim → Jina Reader
```

## Request

O Reader recebe uma URL pública ao prefixá-la com:

```text
https://r.jina.ai/
```

Conceitualmente:

```ts
const readerUrl = `https://r.jina.ai/${targetUrl}`;
```

Para obter resposta JSON, enviar:

```http
Accept: application/json
```

Se existir:

```text
JINA_API_KEY
```

enviar também a autenticação esperada pela API.

A chave deve ser opcional para desenvolvimento quando a API permitir uso sem chave.

Exemplo de `.env.local`:

```env
JINA_API_KEY=
```

Não versionar chave real.

## Resposta Jina

A integração deve ser defensiva.

A documentação do Reader informa que o modo JSON contém informações como:

```text
URL
title
content
timestamp, quando disponível
```

Não assumir que a resposta do terceiro sempre possui todos os campos.

Criar um parser específico para converter a resposta Jina em `INewsArticle`.

O Jina pode não fornecer:

- authors;
- publisher;
- modifiedAt;
- imageUrl.

Nesses casos retornar `null` ou `[]`.

Não inventar informações.

## Merge com extração parcial local

Se houver dados locais úteis e depois o Jina for acionado, não jogar tudo fora.

Exemplo:

extração local:

```json
{
  "title": "Correct title",
  "authors": ["John Doe"],
  "content": ""
}
```

Jina:

```json
{
  "title": "Correct title",
  "content": "Full article..."
}
```

Resultado:

```json
{
  "title": "Correct title",
  "authors": ["John Doe"],
  "content": "Full article...",
  "extractionMethod": "jina",
  "usedFallback": true
}
```

Regra:

```text
preservar metadados locais úteis
+
usar Jina principalmente para preencher o que faltou
```

Para `content`, se Jina foi necessário porque o conteúdo local era insuficiente, preferir o conteúdo do Jina.

## Timeout do fallback

Não deixar o request do Jina travar indefinidamente.

Usar timeout independente.

Sugestão para PoC:

```text
15 segundos
```

## Erro do Jina

Se:

```text
local extraction failed
+
Jina failed
```

retornar:

```text
422 EXTRACTION_FAILED
```

Não fazer retry infinito.

No máximo:

```text
1 tentativa local
1 tentativa Jina
```

é suficiente para a primeira versão.

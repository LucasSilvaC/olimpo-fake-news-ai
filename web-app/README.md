# News Parser PoC

Aplicação Next.js que recebe uma URL pública e extrai texto e metadados. O fluxo usa JSON-LD, Open Graph/meta tags e Mozilla Readability. Se a extração local for insuficiente, tenta o Jina Reader uma vez. Sem LLM, banco, fila, autenticação ou seletores específicos por portal.

## Executar no Windows

Node **24.15 ou superior compatível com `engines`** (também suporta Node 22.22.2+). As dependências já foram instaladas nesta entrega.

```powershell
Set-Location -LiteralPath 'C:\Users\CUL7CA\Desktop\ElDorado\app\web-app'
npm ci
npm run dev
```

Abra <http://127.0.0.1:3000>, cole uma notícia pública e clique em **Extract**. Se a porta estiver ocupada, use `npm run dev -- --port 3001`.

Para executar a versão compilada:

```powershell
npm run build
npm start
```

`JINA_API_KEY` é opcional. Para configurá-la, copie `.env.example` para `.env.local` e preencha a chave somente nesse arquivo local. Reinicie o servidor depois de alterar a variável. Não use prefixo `NEXT_PUBLIC_` nem envie a chave pelo formulário.

## API

`POST /api/news/extract`, com JSON `{ "url": "https://site.com/noticia" }`. Retorna o contrato `INewsArticle`, incluindo `extractionMethod` (`local` ou `jina`) e `usedFallback`.

```powershell
$newsRequest = @{ url = 'https://www.nasa.gov/missions/webb/nasa-documentary-cosmic-dawn-reveals-untold-story-of-james-webb-space-telescope/' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/news/extract' -Method Post -ContentType 'application/json' -Body $newsRequest
```

Erros: `400 INVALID_URL`, `400 UNSAFE_URL`, `404 NOT_FOUND`, `422 EXTRACTION_FAILED`, `500 INTERNAL_ERROR`. O frontend recebe apenas código e mensagem, sem stack trace.

## Comportamento e limites

- Sucesso: texto com ao menos 300 caracteres e título, publisher ou autor. Ausência de imagem/data/autor não aciona fallback se o resultado já for suficiente.
- JSON-LD: objeto, array, `@graph`, `@type` simples/array; `NewsArticle` → `Article` → `BlogPosting`, escolhendo o candidato mais completo dentro do mesmo tipo.
- Metadados locais têm prioridade no fallback. Readability completa `articleBody` truncado. Conteúdo e JSON são exibidos como texto com escaping do React; a imagem é apresentada como link.
- HTTP/HTTPS, portas padrão, sem credenciais. Bloqueia hosts internos, loopback, redes privadas, metadata endpoints e IPs especiais IPv4/IPv6; valida todos os resultados DNS, fixa a conexão nos IPs aprovados e revalida até 3 redirects.
- Request local: 8 s incluindo DNS/redirects/leitura, até 3 MiB descomprimidos, somente HTML. Body da API: até 8 KiB. JSDOM sem execução de scripts ou carregamento de recursos externos.
- Jina: 15 s, uma chamada, JSON com texto (`data.text` ou `data.content`), chave opcional; sem modos generativos. A URL é revalidada antes de ser enviada. Redirects internos e resolução DNS executados pelo serviço remoto dependem das proteções do próprio Jina.
- Paywalls, CAPTCHA e páginas protegidas podem continuar falhando. O threshold mede suficiência textual; não garante que uma homepage longa seja uma notícia. A PoC não faz classificação semântica.
- O servidor dos scripts `dev`/`start` escuta apenas em `127.0.0.1`. Não foi publicado nem dimensionado para uso público concorrente.

## Validação

```powershell
npm run validate:changed
node scripts/verify-live.mjs
npx tsx scripts/verify-fallback.ts
```

`validate:changed` executa **lint + typecheck + todos os testes + build** do único pacote. É um fallback integral explícito: a pasta original não tinha Git nem baseline; o comando não calcula um diff. `npm run validate` executa a mesma verificação.

Os testes são executados em Node, com DOM do jsdom e mocks somente nas fronteiras de rede. Não instalam nem executam Playwright/Puppeteer. Os scripts de rede exigem conexão; `verify-live` exige a aplicação rodando e aceita `NEWS_PARSER_BASE_URL`. O teste de fallback simula somente HTML local insuficiente e acessa o Reader real. Relatórios guardam metadados/contagens, sem o texto completo das notícias.

Resultados e limitações: [relatório de validação](validation/REPORT.md), [resultados HTTP](validation/live-results.json), [fallback real](validation/fallback-results.json).

## DVC

O DVC controla o pipeline de validação dos arquivos JSON em `validation/`. O comando `dvc repro` valida esses arquivos e gera um manifesto com seus hashes; o `dvc.lock` registra as versões usadas. Após merges em `dev` ou `main`, o GitHub Actions executa `dvc repro` e `dvc status` para verificar a reprodutibilidade. O FakeCorpus BR continua sendo importado e versionado no Google Drive pelo Colab; ele ainda não faz parte do pipeline DVC deste repositório.

## Referências

- [Especificação e plano fornecidos](../news-parser-astra-spec/implementation-plan.md)
- [Jina Reader: parâmetros oficiais](https://github.com/jina-ai/reader#using-request-headers)
- [Undici: fetch e dispatcher](https://github.com/nodejs/undici)
- Documentação da versão instalada do Next.js: `node_modules/next/dist/docs/`.

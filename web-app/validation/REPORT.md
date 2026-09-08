# Validação — News Parser PoC

Data: 2026-09-08. Ambiente: Windows, Node 24.15.0, Next.js 16.3.4. Aplicação em `C:\Users\CUL7CA\Desktop\ElDorado\app\web-app`.

## Resultado e gates

Implementação entregue. T0–T3 aprovados: lint, typecheck, 27 testes e build de produção. T4 parcial: HTTP real e integração com Jina verificados; inspeção visual em navegador pendente porque Computer Use retornou `apps: []` e `browsers: []`. Portanto, o gate de validação visual completa não está aprovado.

O prompt mestre e os documentos 00–05 fornecem o escopo/contrato/arquitetura autorizados. O [plano de execução](../../news-parser-astra-spec/implementation-plan.md) documenta as decisões e exceções de processo. Não houve publicação, migração ou alteração do contrato.

## Comandos e evidências

`npm run validate:changed` → `npm run validate`: **exit 0**, lint limpo, typecheck limpo, **27/27 testes**, build com `/` estática e `POST /api/news/extract` dinâmico em Node.

Modo: integral para o único pacote, sem base Git. Não havia repositório, código ou testes preexistentes; não é possível alegar comparação contra um baseline executável anterior. O script `validate:changed` faz fallback integral explícito.

`npm audit --omit=dev`: **0 vulnerabilidades**. A instalação completa também reportou 0 vulnerabilidades.

O processo de desenvolvimento foi encerrado; a versão compilada foi iniciada em um processo novo com `npm start -- --port 3000`. `node scripts/verify-live.mjs` executou os casos abaixo contra esse processo, sem mocks. [Resultado completo](live-results.json).

| Caso | HTTP | Resultado |
| --- | --- | --- |
| Notícia NASA | 200 | local, 4.796 caracteres, autor, data, publisher e imagem |
| Notícia JPL | 200 | local, 6.379 caracteres; campos ausentes preservados como null |
| Notícia AP News | 200 | local, 988 caracteres, autor, data, publisher e imagem |
| `abc` | 400 | INVALID_URL |
| `http://localhost:3000` | 400 | UNSAFE_URL |
| `http://192.168.0.1` | 400 | UNSAFE_URL |
| `https://example.com/` | 422 | EXTRACTION_FAILED |

A página da NASA contém um bloco JSON-LD com `BlogPosting`, `VideoObject` e entidades relacionadas; ver [inspeção do HTML público](json-ld-source.json). JSON-LD `NewsArticle`, `Article` e `BlogPosting`, em objeto, array e graph, também estão cobertos por testes determinísticos.

## Fallback Jina

`npx tsx scripts/verify-fallback.ts`: **exit 0**. O Reader público retornou 6.222 caracteres. O pipeline retornou `extractionMethod: jina`, `usedFallback: true` e preservou título e autor locais. [Evidência](fallback-results.json).

Escopo exato: somente a resposta HTML local foi simulada como insuficiente; DNS e chamada ao Jina foram reais. A chamada direta ao Reader também foi bem-sucedida. Não foi encontrada, nesta rodada, uma notícia pública que falhasse naturalmente no local e tivesse fallback completo: AP funcionou localmente; a página Reuters `/world/` terminou em 422. Não se afirma E2E de fallback natural em portal bloqueado.

A verificação real identificou `data.text` no modo `X-Respond-With: text`. Adicionado suporte a esse formato e ao formato `data.content`, com regressão RED → GREEN. Respostas inválidas, HTTP de origem com erro e conteúdo insuficiente continuam produzindo falha compreensível.

## Revisões

- **Segurança:** revisados input/body, DNS/IP/redirects, limites de rede, scripts/XSS e segredos. Corrigido bloqueio de IPv6 fora de global unicast e remoção de scripts/estilos quando JSON-LD `articleBody` inclui HTML; ambos reproduzidos em testes RED → GREEN. Conexões locais usam Agent com DNS fixado, sem nova resolução entre validação e conexão. Nenhum bloqueador remanescente identificado dentro do escopo local da PoC.
- **Arquitetura:** Route Handler fino; parser em funções de `src/lib/news`; dependências Node apenas no backend; frontend importa contrato/schema. Sem abstrações de persistência, filas, serviços generativos ou seletores por portal.
- **UX:** teste de DOM do componente real confirmou submit vazio desabilitado, loading, erro anunciado, preservação da URL, nova tentativa, resultado, método/fallback e JSON. Conteúdo com `<script>` permanece texto, sem execução. HTML servido pelo Next.js retornou 200 com input, botão e assets. Layout, foco e comportamento visual em navegador real permanecem sem inspeção.

## Limitações remanescentes

- Redirects e DNS executados dentro do Jina dependem do provedor.
- O critério de 300 caracteres mais metadado é suficiência textual, não classificação semântica. A homepage da BBC retornou conteúdo local suficiente; isso não a transforma em notícia.
- Paywalls, CAPTCHA e anti-bot podem impedir ambas as tentativas.
- Sem teste de carga, hardening de publicação ou validação visual em navegador. Nenhuma publicação solicitada ou realizada.

## Relatório estruturado

- **Overlays/skills, em ordem:** Acrux triagem/guardrails → refinamento/roteamento e Adaptive SDD → critérios de TDD (fluxo primeiro, conforme prompt) → segurança/UX/arquitetura → React best practices → Computer Use (tentativa sem superfície) → gate pós-implementação.
- **Artefatos:** aplicação completa em `web-app`, lockfile, 4 arquivos de testes, 2 scripts de verificação, README e relatórios; plano em `news-parser-astra-spec/implementation-plan.md`. `AGENTS.md` e `CLAUDE.md` locais foram gerados automaticamente pelo Next.js.
- **Validação:** T0–T3 completos; HTTP real contra build de produção; Jina real com origem local simulada; auditoria de dependências.
- **Bloqueios/omitidos:** navegador indisponível, T4 visual pendente, fallback natural de portal bloqueado não demonstrado, sem deploy/teste de carga.

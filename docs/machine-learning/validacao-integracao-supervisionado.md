# Validação da integração supervisionada

Implementação e validação em 8 de outubro de 2026. As três frentes de agentes
implementaram o motor, API/persistência e interface; a integração principal
conferiu a execução real com serviços descartáveis.

## Comportamento entregue

- Artefato Olimpo já treinado empacotado em `model-engine/`, com fontes congeladas,
  compatibilidade dos imports do pickle, SHA-256 e versões verificadas antes da carga.
- Modelo calibrado persistente em `POST /supervised/analyze`, recebendo somente
  o corpo. Não há treinamento ou consulta externa para verificar fatos.
- Score canônico `100 × P(Fake)`, política `olimpo-decision-policy-v1`, estados
  explícitos e valores nulos para texto insuficiente e falhas.
- Adaptador real no web app, migração `0005_supervised_analysis_identity`,
  cache por conteúdo/artefato/código/política e coordenação local e PostgreSQL.
- `POST /api/news-prediction` exige sessão, participação e encerramento real.
  Voto individual, avanço antecipado e conclusão antecipada não liberam a previsão.
- Votos, placar e SSE encerram sem chamar o modelo; `officialAnswer` vem do
  gabarito e a previsão fica em `modelAnalysis`.
- Painel após encerramento, escala 0–100, razões aprendidas, limitações e versões
  expansíveis. Requisições antigas são abortadas/descartadas na troca de rodada.
- `/analyze`, `/health` e observações do não supervisionado preservados, com saúde
  específica de cada modelo e falhas independentes.

## Integração posterior da interface e do pitch

A integração de `fix/ui-improvements` mantém o contrato supervisionado e a rota
`/pitch`. O veredito usa o gabarito cadastrado; o score `100 × P(Fake)` permanece
no painel de previsão após o encerramento. O painel linguístico continua usando
as perguntas gerais de `SocraticReflection`, removidas apenas do veredito.

`ROUND_COMPLETED` e respostas de ações incluem `roundDelta` e `isCorrect` nas
entradas do placar. O cliente aplica cada encerramento uma vez, mesmo recebendo
ação e SSE, e ignora eventos antigos ou já restaurados. A conclusão da partida
e o recarregamento usam os acertos persistidos, sem converter pontos parciais
em acertos. Os resultados de validação abaixo registram a implementação original;
os testes de integração da interface estão em
`web-app/tests/components/room-game-prediction.test.tsx`.

## Ambiente e identidade

Motor Linux Docker: Python 3.14.2, scikit-learn 1.9.1, NumPy 2.5.3, SciPy 1.18.1,
pandas 3.0.6, spaCy 3.8.16, pt_core_news_sm 3.8.0 e joblib 1.6.0.
Web app: Node 24.15.0, pnpm 11.10.0 na imagem, Next.js 16.3.8.

SHA-256 do artefato:
`123763864725531f12aa0503530edce432ca6e59853d36ef472559790207df27`.

Identidade do código de inferência:
`1b552c7bd1a07e12e6323c50f1a81e8095f3a6cf326ea01394f4af6a94b6b97b`.

O contexto distribuído do motor contém somente `model-engine/`. Testes de
equivalência montam as fontes de pesquisa como leitura para comparação; o
contêiner de serviço é iniciado sem essa montagem. As fontes congeladas têm EOL
LF controlado, para seus hashes sobreviverem ao checkout Windows/Linux.

## Verificações realizadas

Web app: suíte Vitest completa com **419 testes aprovados** e cinco testes
condicionais ignorados; suíte legada do parser com **25 testes aprovados**.
TypeScript e ESLint passaram. Os builds de produção do Next.js e das duas imagens
Docker passaram, e o Compose foi validado com `docker compose config --quiet`.
O teste integrado foi executado também com Next.js, PostgreSQL, Redis e motor
em contêineres Linux isolados.

Suíte Python completa na imagem Linux: **20 testes passaram**, incluindo os 13
testes existentes do não supervisionado. Preparo/features reproduzem o original
com tolerância absoluta `1e-15`; probabilidade e contribuições, `1e-12`.
São cobertos limites 0,35/0,65, 29/30 e 100/101 palavras, hashes adulterados,
versões incompatíveis, calibração/rótulos, ausência de `fit`, contrato HTTP,
independência de saúde, fila esgotada e espera limitada.

O teste PostgreSQL com duas instâncias independentes do caso de uso e quatro
consultas concorrentes produziu **uma inferência e um registro**. Um registro mock
histórico foi preservado; mudar a versão do código gerou nova análise.

`web-app/scripts/check-news-prediction.ts` usa explicitamente banco e Redis
descartáveis, parser real de HTML e corpo persistido, motor real e Chromium com
duas sessões. Verifica anonimato/membro externo, recusa de texto arbitrário,
bloqueio antes do fechamento coletivo, observações durante leitura, votos e
placar pelo gabarito, cinco consultas concorrentes com um registro, recarga,
desktop/celular, próxima rodada sem resultado antigo, falha induzida só no
supervisionado e encerramento da partida apesar da falha. Não testa extração de
uma URL externa ao vivo; o parser HTTP/SSRF tem sua suíte própria.

Evidências: `web-app/validation/news-prediction/`, com `result.json`, screenshots
desktop/celular/falha e logs dos testes. A migração foi aplicada somente no banco
isolado; dados de partidas existentes não foram alterados.

## Medição do motor

Uma execução local Linux Docker, com texto congelado e 20 análises aquecidas:

| Medida                            | Resultado                     |
| --------------------------------- | ----------------------------- |
| Carga e aquecimento               | 8,329 s                       |
| Mediana                           | 140,55 ms                     |
| p95                               | 188,32 ms                     |
| Pico RSS do processo do benchmark | 437,82 MiB                    |
| Oito solicitações simultâneas     | 3 concluídas; 5 indisponíveis |

O benchmark mede o supervisionado em processo próprio; não representa o consumo
somado dos dois modelos nem um teste de carga de produção. A configuração inicial
mantém uma execução e duas vagas de espera. Reproduza com
`model-engine/tools/benchmark_supervised.py` no runtime fixado.

## Operação e limites

Execute `docker compose up --build` em `web-app/` para o ambiente de desenvolvimento;
o serviço migrador aplica a nova migração antes do app. Para um Next.js externo ao
Compose, aplique `pnpm db:migrate` no banco destinado ao app e configure
`NEWS_PREDICTION_SERVICE_URL` e `NEWS_INSIGHTS_SERVICE_URL` somente no servidor.
O motor supervisionado rejeita patches de Python diferentes de 3.14.2;
o Python local 3.14.4 não foi considerado equivalente para servir.

O marcador de encerramento Redis existente expira em 24 horas. Sem esse marcador,
a rota bloqueia a previsão mesmo para uma partida finalizada. Persistir o fechamento
duravelmente é uma evolução operacional; não há fallback que libere previsões com
base apenas no status da sala. O placar total legado continua disponível nos dados
da sala; as respostas parciais ocultam os campos de acerto/pontos do voto.

As métricas internas do modelo não são uma avaliação independente do artefato
final nem garantem transferência a notícias novas. Nenhum fato externo foi
verificado e a previsão não substitui o gabarito cadastrado.

## Atualização do ambiente em uso

Após o relato de indisponibilidade, verificou-se que o contêiner
`web-app-news-insights-1` ainda executava a imagem anterior: `/health` respondia
200, mas `/health/supervised` retornava 404. O serviço foi reconstruído e recriado
com a versão atual. A partir do contêiner do web app, a saúde supervisionada passou
a responder 200/`ok` com a identidade esperada, e uma inferência de texto de teste
retornou 200/`ok` com probabilidade e score consistentes. A migração foi então
aplicada também ao banco do app pelo comando `docker compose exec -T app pnpm db:migrate`.
Os testes anteriores permaneceram em serviços isolados; essa atualização operacional
não alterou registros de votos ou o conteúdo das partidas.

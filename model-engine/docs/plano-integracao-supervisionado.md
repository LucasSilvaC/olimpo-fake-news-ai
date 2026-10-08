# Integração do modelo supervisionado ao motor e ao jogo

Plano elaborado em 8 de outubro de 2026. Este documento planeja a implementação; não altera o serviço em execução, o banco ou a interface.

Implementação executada em 8 de outubro de 2026 com agentes para motor, API/persistência
e interface, seguida de integração com o web app. As entregas A, B e C estão
implementadas. Resultados, evidências e limites operacionais estão no
[relatório de validação](../../docs/machine-learning/validacao-integracao-supervisionado.md). A migração foi
testada em banco isolado e será aplicada ao ambiente escolhido pelo migrador do Compose.

## 1. Resultado esperado

Executar o modelo Olimpo supervisionado em `model-engine/`, junto ao não supervisionado, usando o corpo obtido pelo parser. Entregar classificação estimada, score e explicação das características que influenciaram a previsão.

Os modelos mantêm funções e saídas próprias:

| Componente          | Função                                                                     | Apresentação no jogo                                             |
| ------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Não supervisionado  | Identificar combinações de escrita e mostrar suas frequências no corpus    | Painel lateral “Observe a escrita”, disponível durante a leitura |
| Supervisionado      | Estimar a classe da notícia a partir do texto, com probabilidade calibrada | “Análise do modelo”, após o encerramento da rodada               |
| Gabarito cadastrado | Referência utilizada pela regra de pontuação                               | Resultado do jogo, identificado separadamente da previsão        |

A decisão deste plano é revelar o supervisionado depois que todos votarem ou o tempo terminar. A previsão não fica acessível aos jogadores que ainda estão votando. A pontuação do participante continua seguindo o gabarito cadastrado; o score da notícia não é pontuação do jogador.

O classificador analisa texto. Ele não consulta fontes externas nem confirma acontecimentos. A interface usa “previsão do modelo” e “estimativa”, sem apresentar a classificação como fato verificado.

## 2. Estado atual verificado

### Modelo e artefato

Fontes: [documentação do modelo](../../machine-learning/supervised-learning/docs/modelos/modelo-olimpo.md), [implementação](../../machine-learning/supervised-learning/modelo_olimpo.py), [features spaCy](../../machine-learning/supervised-learning/metadados_spacy.py) e [exportador](../../machine-learning/supervised-learning/exportar_modelo.py).

- Pipeline M2: TF-IDF de palavras/caracteres → χ² com 10.000 atributos → SVD com 500 componentes → normalização, combinado com 24 atributos spaCy de peso `0,03`.
- Classificador `LinearSVC(C=1, class_weight="balanced")`, calibrado por sigmoide, cinco folds e `ensemble=False`.
- Versão: `svm-spacy-chi2k10k-svd500-v1`.
- O corpo bruto é normalizado, os dígitos são substituídos por zero e as primeiras 100 palavras são utilizadas.
- Artefato existente: `machine-learning/supervised-learning/modelos/olimpo-svm-spacy-chi2k10k-svd500-v1.joblib`, com 21.414.887 bytes, aproximadamente 20,4 MiB.
- Manifesto existente: [JSON do artefato](../../machine-learning/supervised-learning/modelos/olimpo-svm-spacy-chi2k10k-svd500-v1.json).
- SHA-256 conferido e igual ao manifesto: `123763864725531f12aa0503530edce432ca6e59853d36ef472559790207df27`.
- O artefato final foi ajustado em `X_tr + X_te`, totalizando 7.200 notícias. As métricas internas registradas foram obtidas com outro ajuste, treinado somente em `X_tr`; não constituem um teste independente desse artefato final.
- A documentação registra F1 macro calibrado interno de `0,9208` e AUC externo exploratório em títulos de `0,6774`. A transferência para notícias novas deve ser avaliada separadamente.

Não é necessário treinar novamente para iniciar a integração. `joblib` passa a ser necessário para carregar este pipeline já ajustado; o não supervisionado continua usando seu catálogo JSON.

### Integração web existente

- O parser já salva o corpo em `news_articles.article.content` ao adicionar a URL à playlist.
- `GetArticleAnalysisUseCase` ainda usa `mockAIAnalysisService` por padrão e reutiliza qualquer análise encontrada por `articleId`, sem conferir versão ou conteúdo.
- O mock recebe `targetClassification` e pode devolver o próprio gabarito como previsão. Esse campo não deve chegar ao modelo real.
- `SubmitVoteUseCase` e `ConcludeRoundUseCase` solicitam análise durante o encerramento. Uma falha nessa chamada pode interromper a devolução/publicação do resultado mesmo depois de votos terem sido gravados.
- `news_analyses` possui classificação, razões, `confidence` com duas casas e versão. Não possui probabilidade de Fake, estado de execução, hash do texto ou identidade do artefato.
- O estado de `RoomGameView` ainda converte `confidence` em `reliabilityScore`, usa valores padrão de `85` e, em alguns caminhos, trata a previsão como `officialAnswer`. A interface atual já deixou de exibir esses scores, mas os caminhos internos precisam ser corrigidos.

## 3. Definição do score

O score canônico será **`fakeScore = 100 × fakeProbability`**, em escala de 0 a 100. Quanto maior, maior a probabilidade de Fake estimada pelo classificador. A interface pode chamá-lo de “Score de falsidade estimado pelo modelo”. Não usar o mesmo número como score de confiabilidade.

`fakeProbability` vem da saída calibrada para a classe `1`, conferida em `classes_` e no manifesto. Não usar o score bruto da SVM nem extrair números do texto de `reasons`. Arredondar apenas na apresentação; persistir a probabilidade com precisão suficiente.

| Condição                                                      | Classificação estimada                  | Score                                                 |
| ------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| Texto válido, pelo menos 30 palavras, `P(fake) ≤ 0,35`        | `reliable`                              | Calculado a partir de `P(fake)`                       |
| Texto válido, pelo menos 30 palavras, `0,35 < P(fake) < 0,65` | `uncertain`                             | Calculado, com indicação de resultado inconclusivo    |
| Texto válido, pelo menos 30 palavras, `P(fake) ≥ 0,65`        | `unreliable`                            | Calculado a partir de `P(fake)`                       |
| Menos de 30 palavras após o preparo                           | `uncertain`, estado `insufficient_text` | `null`; não representar ausência de análise como zero |
| Entrada inválida ou serviço indisponível                      | `null`, com estado explícito            | `null`                                                |

Os limites são uma política do produto, versionada separadamente do artefato. O recorte de 100 palavras também permanece independente dos 300 caracteres do não supervisionado.

O `confidence` legado tem significados diferentes: usa `P(fake)` para `unreliable`, `1-P(fake)` para `reliable` e `1-2×abs(P(fake)-0,5)` para `uncertain`. Assim, pode chegar a 1 quando a previsão está exatamente no meio. Não reaproveitar esse campo como score ou “certeza” na nova UI.

## 4. Arquitetura proposta

```text
model-engine/
├── service.py
├── models/
│   ├── unsupervised/                 # Módulo atual, preservado
│   └── supervised/
│       ├── engine.py                 # Carregamento, inferência e contrato
│       ├── pipeline.py               # Código congelado do pipeline
│       ├── linguistic_features.py    # Extração própria do supervisionado
│       └── assets/
│           ├── olimpo-svm-spacy-chi2k10k-svd500-v1.joblib
│           ├── olimpo-svm-spacy-chi2k10k-svd500-v1.json
│           └── serving_manifest.json # Hashes do código e política de decisão
├── modelo_olimpo.py                  # Compatibilidade com o pickle existente
├── metadados_spacy.py                # Compatibilidade com imports existentes
├── tools/
│   └── import_supervised_artifact.py # Empacotamento offline, sem treino
├── tests/
│   └── test_supervised.py
├── requirements.txt
└── Dockerfile
```

O `.joblib` referencia `modelo_olimpo.*`, e o módulo original importa `metadados_spacy`. A migração precisa conservar esses nomes importáveis, com módulos de compatibilidade que reexportem as implementações congeladas. O teste de recarga decidirá a forma exata desses módulos. Mover apenas o binário para outra pasta não resolve essa dependência.

`machine-learning/` permanece responsável por pesquisa e exportação. A ferramenta offline copia o artefato, o manifesto e as fontes necessárias para `model-engine/`, registra seus hashes e verifica a recarga. O serviço distribuído não precisa de notebooks, corpus, arquivos de treino ou imports da pasta de pesquisa.

Os dois modelos recebem o mesmo corpo original e aplicam seus preparos independentemente. Não passar ao supervisionado o trecho de 300 caracteres já normalizado pelo não supervisionado, nem reutilizar suas taxas: os denominadores e atributos são diferentes.

## 5. Fases de implementação

### Fase 1 — Empacotamento e compatibilidade

1. Criar `models/supervised/`, a ferramenta de importação e os módulos de compatibilidade.
2. Conferir o SHA-256 antes de carregar o `.joblib`. Carregar somente o artefato controlado da distribuição, sem aceitar caminhos ou uploads fornecidos por jogadores.
3. Fixar as dependências registradas no manifesto:

| Dependência     | Versão do artefato |
| --------------- | ------------------ |
| Python          | `3.14.2`           |
| scikit-learn    | `1.9.1`            |
| NumPy           | `2.5.3`            |
| SciPy           | `1.18.1`           |
| pandas          | `3.0.6`            |
| spaCy           | `3.8.16`           |
| pt_core_news_sm | `3.8.0`            |
| joblib          | `1.6.0`            |

4. Resolver explicitamente a diferença com o Docker atual, baseado em Python 3.12. A proposta é testar uma imagem com Python 3.14 e patch fixado, preservando as bibliotecas do manifesto. A mudança só passa após reproduzir os resultados do artefato e os testes do não supervisionado em Linux. Não pressupor compatibilidade entre versões de Python.
5. Comparar a cópia de execução com a implementação original em amostras congeladas: preparo, features, probabilidades, classificação e contribuições. Não executar `fit` na integração.

**Saída da fase:** artefato carregável a partir de `model-engine/` sozinho e imagem capaz de executar os dois modelos com equivalência verificada. Se um ambiente comum não funcionar, manter os dois workers sob `model-engine/` em imagens independentes; a separação lógica do produto permanece a mesma.

### Fase 2 — Inferência persistente e contrato Python

1. Carregar o classificador uma vez por processo. Aquecer o spaCy e os caches necessários antes da primeira análise.
2. Manter os extratores de cada modelo independentes. Compartilhar uma instância spaCy somente se a equivalência de configuração e a concorrência forem verificadas; isso não é requisito da primeira entrega.
3. Criar `POST /supervised/analyze`, recebendo somente `{ "text": "corpo bruto" }`. Conservar `/analyze` para o não supervisionado, sem mudar seu DTO.
4. Usar estados `ok`, `insufficient_text`, `invalid_text` e `unavailable`. Texto insuficiente recebe HTTP 200 com score nulo; entrada inválida, HTTP 400; indisponibilidade, HTTP 503. Reaproveitar os controles existentes de tamanho, JSON e timeout.
5. Expor `fakeProbability` numericamente no adaptador, mantendo o pipeline e a calibração intactos. Validar que o classificador carregado é calibrado e conferir a ordem das classes; rejeitar o fallback que aplica uma sigmoide ao score bruto de um modelo não calibrado. Preparar o texto uma única vez e usar esse mesmo resultado na previsão e na explicação.
6. Restringir as razões a contribuições aprendidas e características medidas. Não gerar afirmações de que fontes foram verificadas ou de que eventos ocorreram.
7. Aplicar limite de concorrência às inferências e às explicações, com fila limitada e resposta explícita quando esgotada. Medir latência e memória antes de decidir a quantidade de workers.

Exemplo ilustrativo do novo contrato, não uma previsão de notícia real:

```json
{
  "analysisStatus": "ok",
  "classification": "reliable",
  "fakeProbability": 0.18,
  "fakeScore": 18,
  "scoreKind": "predicted_fake_probability",
  "modelVersion": "svm-spacy-chi2k10k-svd500-v1",
  "policyVersion": "olimpo-decision-policy-v1",
  "artifactSha256": "123763864725531f12aa0503530edce432ca6e59853d36ef472559790207df27",
  "reasons": ["Características do texto que contribuíram para a previsão."],
  "inputScope": {
    "source": "article_body",
    "wordLimit": 100,
    "analyzedWordCount": 100,
    "truncated": true
  }
}
```

Para `insufficient_text`, retornar `classification: uncertain`, `fakeProbability: null` e `fakeScore: null`. Para `invalid_text` e `unavailable`, classificação e scores são nulos. A chave de identidade do conteúdo acompanha o resultado no servidor, sem precisar expor o corpo em logs.

**Saída da fase:** HTTP real com classificação e score consistentes, sem treino online e sem misturar as estatísticas descritivas do FP-Growth.

### Fase 3 — Persistência, cache e substituição do mock

1. Implementar um adaptador HTTP real de `IAIAnalysisService` e alterar a composição de `GetArticleAnalysisUseCase`. O adaptador envia apenas o corpo; gabarito, voto, título, autoria e veículo não são atributos do classificador.
2. Atualizar `AIAnalysisResult`, `AIAnalysisDTO` e a entidade para estados explícitos, score nulo quando não calculado e campos do novo contrato. Remover a dependência de `confidence` como dado obrigatório da previsão.
3. Criar migração de `news_analyses` para armazenar estado, probabilidade, política, hash do texto, hash do artefato e escopo. Classificação pode ser nula para falhas. Usar precisão suficiente para a probabilidade, sem a limitação atual de duas casas.
4. A chave de cache deve incluir `articleId`, hash do corpo, hash do artefato, versão do código de inferência e política de decisão. A busca atual somente por `articleId` não é suficiente.
5. Criar unicidade/idempotência para essa identidade e impedir análises duplicadas sob requisições concorrentes. Distinguir coordenação de análises em andamento do cache de resultados concluídos.
6. Não reutilizar `mock-v1` como análise do modelo real. Manter registros antigos identificados; gerar novos resultados para a identidade atual sem reescrever o histórico.
7. Falhas transitórias não viram resultados válidos em cache. Permitir nova tentativa limitada; não retornar o mock como fallback silencioso.

**Saída da fase:** análises reais reproduzíveis, versionadas e reutilizadas somente para o mesmo conteúdo e a mesma configuração.

### Fase 4 — Encerramento e acesso no jogo

1. Separar gravação do voto, atualização do placar e publicação de `ROUND_COMPLETED` da disponibilidade do modelo. Uma falha da IA não pode impedir esses três passos.
2. Remover a chamada obrigatória à inferência do caminho crítico de `SubmitVoteUseCase` e `ConcludeRoundUseCase`. Publicar o encerramento com o gabarito cadastrado e análise pendente ou disponível, em campos separados.
3. Criar `POST /api/news-prediction` com `{roomId, round}`. A primeira consulta autorizada após o encerramento resolve o artigo e solicita a análise, com cache e deduplicação da fase anterior. Isso permite a primeira entrega sem um novo sistema de jobs.
4. Verificar sessão, participação, notícia da rodada e encerramento real no servidor. Não liberar a previsão apenas porque o usuário votou, se os demais ainda estão respondendo. Verificar o encerramento também na consulta após atualizar a página e nos eventos SSE.
5. Validar a saída: campos permitidos, números finitos entre 0 e 1, score entre 0 e 100 consistente com a probabilidade, estado, classe e limites da política. Rejeitar probabilidades contraditórias ou dados insuficientes com score preenchido.
6. Reutilizar o corpo salvo. Se estiver vazio, usar o mesmo parser seguro da notícia cadastrada. Não classificar apenas o título nem aceitar texto arbitrário do cliente nessa rota.
7. Atualizar payloads de eventos, Server Actions e reconstrução de estado em `/sala/[codigo]`. `officialAnswer` vem do gabarito cadastrado; a previsão fica em `modelAnalysis`, sem substituir um pelo outro.
8. Usar timeout com aborto, estados de carregamento e tentativas limitadas. Fechamento da rodada e avanço do jogo continuam funcionando com `unavailable`.

O pré-cálculo na playlist ou no início da rodada pode entrar posteriormente, se a latência justificar. Mesmo que o resultado já exista no banco, a autorização de exibição continua dependente do encerramento; não enviar score oculto em HTML, props, eventos ou DTOs durante a leitura.

**Saída da fase:** nenhum vazamento de previsão antes do voto coletivo e nenhuma dependência do motor para registrar votos ou concluir rodadas.

### Fase 5 — Interface da análise e do score

1. Manter o ícone lateral do não supervisionado durante a leitura. Seus percentuais continuam sendo frequências do corpus, não scores de uma notícia.
2. Após encerrar a rodada, acrescentar o componente “Análise do modelo”, com estado de carregamento, classe estimada, score e explicações simples. Não apresentar esse resultado como “gabarito oficial”.
3. Mostrar a escala e sua direção: score maior significa maior estimativa de falsidade. Quando a classe for `uncertain`, explicar que a previsão ficou na faixa intermediária; não mostrar “100% de confiança”.
4. Para texto insuficiente, exibir “Texto insuficiente para estimar o score”; para indisponibilidade, exibir o estado de falha. Não preencher `0`, `85` ou outro valor fictício.
5. Traduzir contribuições para “termos que influenciaram o resultado” e “características da escrita”. As razões não são provas sobre os fatos nem explicações causais.
6. Remover os caminhos que convertem `confidence` em `reliabilityScore`, inclusive na restauração de sessão e no processamento de SSE. Preservar separadamente o voto, o resultado do jogo e a previsão.
7. Deixar detalhes de preparo, versão, fonte do modelo e limitações em área expansível. Cancelar consultas antigas ao mudar de rodada e impedir que uma resposta atrasada apareça na próxima notícia.

**Saída da fase:** score interpretável, separado do placar e das frequências do não supervisionado, com leitura simples no desktop e no celular.

### Fase 6 — Docker e verificação completa

1. Atualizar a imagem de execução com o artefato, módulos de compatibilidade e dependências fixadas. Não copiar o corpus, `.pkl` de treino, notebooks ou exportadores científicos.
2. Manter a URL do motor como variável interna do servidor. O navegador acessa somente as rotas autenticadas do web-app.
3. Expor saúde por modelo, por exemplo `/health/supervised` e `/health/unsupervised`. Preservar a compatibilidade de `/health` usada hoje pelo Compose. O supervisionado indisponível não deve tornar as observações do não supervisionado ou o jogo indisponíveis.
4. Atualizar README, `.env.example`, Compose, comandos de execução e relatório de validação.
5. Validar em banco e Redis isolados: parser → notícia salva → observações durante leitura → votos → encerramento → classificação/score reais → atualização da página → próxima rodada.

**Saída da fase:** os dois modelos operando no ambiente Docker, com verificação integrada e sem modificar os dados de partidas durante os testes.

## 6. Testes e critérios de aceite

- [x] Artefato e código congelado carregam sem `machine-learning/` no ambiente distribuído.
- [x] SHA-256, bibliotecas, classes e identidade do modelo são validados antes de servir previsões.
- [x] Resultados da cópia de execução reproduzem a implementação original, com tolerância numérica explícita.
- [x] São preservados preparo de dígitos, normalização, recorte e extração do supervisionado.
- [x] Limites `0,35` e `0,65`, texto vazio, 29/30 palavras, recorte 100/101 palavras e scores intermediários têm casos de teste.
- [x] `fakeScore` corresponde a `100 × fakeProbability`; não se confunde com `confidence`, placar ou frequência do corpus.
- [x] Textos insuficientes e falhas não apresentam score fictício.
- [x] Gabarito, voto, autor e título não alteram a previsão quando o corpo é o mesmo.
- [x] Cache invalida ao mudar corpo, artefato, código ou política; requisições concorrentes não duplicam registros.
- [x] Registros `mock-v1` não são reutilizados como resultados reais.
- [x] Antes do encerramento, API, props e SSE não revelam score ou classificação supervisionada.
- [x] Falha do modelo não impede voto, publicação do encerramento, placar ou próxima rodada.
- [x] Atualização da página mantém gabarito e previsão separados; respostas de outra rodada são descartadas.
- [x] Os 20 padrões e as comparações do não supervisionado continuam reproduzíveis.
- [x] Desktop/celular, teclado e telas de falha passam na verificação visual e funcional.
- [x] Latência, memória e comportamento de concorrência são medidos com o artefato real.

## 7. Divisão sugerida entre agentes

| Agente               | Responsabilidade                                                                      | Dependência                                |
| -------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| Motor supervisionado | Fases 1 e 2: empacotamento, compatibilidade, carregamento, inferência e testes Python | Nenhuma; define o contrato primeiro        |
| API e persistência   | Fases 3 e 4: DTO, migração, cache, adaptador real e autorização da previsão           | Contrato Python acordado                   |
| Interface            | Fase 5: exibição após encerramento, score, explicações e estados                      | Contrato e política de revelação definidos |
| Integração principal | Fase 6: revisão, Docker, testes completos e documentação                              | Entregas dos três agentes                  |

Começar pelo contrato e pelas decisões de score/revelação. Depois, API e UI podem trabalhar em paralelo em arquivos distintos. Integrar progressivamente: carregamento real → HTTP → persistência → encerramento → interface → Docker e teste completo.

## 8. Ordem de entrega e limites

1. **Entrega A:** artefato empacotado e inferência HTTP verificadas.
2. **Entrega B:** adaptador real, persistência e acesso após encerramento, sem depender do mock.
3. **Entrega C:** componente de análise/score e execução conjunta validada na plataforma.

Esta integração não cria um verificador externo de fatos, não retreina o modelo e não mistura scores dos dois modelos. A adoção da previsão como referência de pontuação, em vez do gabarito cadastrado, exigiria uma decisão de produto separada e identificada na interface.

Referências complementares: [plano do não supervisionado](plano-integracao-fp-growth.md), [motor de execução](../../model-engine/README.md), [web-app](../../web-app/README.md) e [documentação de arquitetura](../../docs/codigo/arquitetura-web-app.md). Os pontos de implementação seguem a organização atual em `web-app/src/app/api/ai-feedback`, `news-voting` e `realtime-events`, com persistência em `src/server/shared/database`; as referências devem ser conferidas novamente ao iniciar cada fase.

# Integração do FP-Growth ao jogo

Plano atualizado em 7 de outubro de 2026, conforme a autorização para implementação faseada com subagentes. O fluxo inicial é a rodada em `/sala/[codigo]`.

## Propósito

Mostrar características observáveis do corpo de uma notícia e perguntas socráticas sobre suas afirmações e evidências. O padrão linguístico não verifica os fatos. O motor não recebe gabarito, não classifica a notícia e não altera a pontuação.

## Principal e artefatos congelados

O principal é `machine-learning/unsupervised-learning/fp_growth_principal.py`, variante `sintaxe_ampliada`. O run é `machine-learning/outputs/model-comparison/fp-growth-metadados-ampliados-20261008T002311Z/`.

- 22 atributos ativos, 44 itens, 523 regras direcionais elegíveis e 345 padrões distintos.
- 422 regras sustentadas na validação; 347 também têm redescoberta ≥80%. São regras direcionais, não observações aprovadas.
- Fila de 20 candidatos, selecionada sem classe ou autoria no ranking. A seleção de famílias foi informada por análises exploratórias anteriores.
- O catálogo de pesquisa permanece `research_only`; ele não é sobrescrito pela exportação do produto.
- A validação possui 1.440 notícias, 720 Fake e 720 True. As contagens por classe descrevem essa base e não são probabilidades para uma notícia nova.
- O teste já foi observado e permanece exploratório. Não há nova validação externa nem estudo de compreensão concluídos.

Arquivos de `sintaxe_ampliada/`: `pattern_catalog.json`, `pattern_candidates.csv`, `review_candidates.csv`, `discretization.csv`, `rule_metrics.csv`, `training_rediscovery.csv` e `posthoc_composition.csv`. O manifesto está na raiz do run e os atributos congelados em `features.csv`.

Os antigos R05, R21 e R22 e o painel de 93 padrões pertencem à referência histórica `corrected_pos_dep`. Seus IDs e métricas não identificam automaticamente os padrões atuais. Consultar os relatórios em `history/mineracao-de-padroes/fp-growth-linguistico/` para essa referência.

## Fase 1 — Catálogo do produto

Gerar offline um catálogo experimental separado, com os candidatos observáveis da fila atual. Preservar identidade estável, regras de origem, operadores, limiares com precisão original, denominadores e hashes dos insumos.

Traduzir medidas em observações limitadas ao trecho e perguntas revisadas tecnicamente durante a implementação. Registrar `observation_only` e a natureza experimental; não alegar aprovação editorial humana, validação linguística humana ou estudo com usuários realizados.

Não interpretar advérbios ou adjetivos como intenção de manipulação, alarmismo, emoção ou falsidade. `baixo` pode representar contagem zero. POS e DEP podem descrever os mesmos tokens e não representam evidências independentes.

A comparação por classe fica desabilitada em todas as respostas do MVP, inclusive após o voto. Sua futura habilitação depende de revisão própria, intervalos da associação por classe, análise complementar de autoria e avaliação com usuários e textos externos. Intervalos de coocorrência gramatical não substituem essas análises.

## Fase 2 — Motor Python

Executar as equações congeladas de extração e discretização em `model-engine/models/unsupervised/features.py`, equivalentes às fontes do principal, em serviço persistente. O runtime não importa scripts de pesquisa. Fixar spaCy 3.8.16 e `pt_core_news_sm` 3.8.0.

Para cada corpo:

1. Aplicar NFKC, remover BOM inicial e analisar os primeiros 300 caracteres.
2. Reproduzir os denominadores do experimento: tokens lexicais para POS/DEP, tokens não espaciais para pontuação e medidas regex para estilo.
3. Aplicar exclusivamente os critérios congelados de `sintaxe_ampliada`. `linkDensity` foi omitida por quantis iguais e não retorna como critério ativo.
4. Exigir todos os itens da união antecedente/consequente. Medição ausente não é zero; zero medido continua um valor válido.
5. Selecionar até três famílias distintas, sem ordenar por pureza Fake, voto ou resposta do usuário.

Não executar notebook, carregar spaCy por requisição, recalcular quantis ou minerar regras online. Cache deve depender do trecho efetivamente analisado e das versões do catálogo e extrator. Qualquer alteração desses insumos invalida a entrada.

Contrato interno: `POST /analyze` recebe somente `{text}`; `GET /health` informa saúde e versões. O retorno contém `analysisStatus`, `catalogVersion`, `extractorVersion`, `analyzedText`, `characterLimit`, `quality` e `insights[]`. Cada insight contém identidade, observação, perguntas, família e medidas com valores, limites e denominadores.

Estados: `ok`, `no_match`, `invalid_text` e `unavailable`. Texto vazio ou sem tokens elegíveis não é avaliado como verdadeiro. Texto longo é analisado somente no recorte. Não inventar um comprimento mínimo validado.

## Fase 3 — API autenticada do jogo

O parser compartilhado `extractNews` já é executado em `AddPlaylistNewsUseCase` ao receber uma URL da playlist. A antiga rota `/api/news/extract` foi removida.

`POST /api/news-insights` recebe `{roomId, round}`. O servidor verifica sessão, participação na sala e rodada permitida; resolve o artigo da playlist e usa seu corpo persistido. Se não houver corpo, executa o parser seguro da URL cadastrada e devolve o corpo extraído para exibição.

Título, autoria, fonte e descrição não são concatenados ao corpo. O cliente não escolhe uma URL arbitrária nem fornece gabarito ao matcher. O retorno inclui a notícia resolvida e a análise estruturada. A projeção do DTO exclui classificação, confiança e comparação por classe mesmo se o serviço retornar campos adicionais.

Seguir as camadas de `docs/codigo/arquitetura-web-app.md`: caso de uso com dependências injetáveis, adaptador HTTP e validação de entrada/saída. O frontend consome a rota e não importa banco, parser ou serviço Python.

Falha do parser ou motor gera estado explícito e não impede a votação. Não persistir percentuais do corpus em `news_analyses.confidence`.

## Fase 4 — Apresentação socrática durante a rodada

Enquanto a rodada está em leitura, solicitar a análise e mostrar até três observações com perguntas específicas. Permitir consultar o trecho normalizado efetivamente analisado e o corpo completo. Exibir a limitação de 300 caracteres.

Perguntas possíveis, quando relacionadas aos atributos medidos:

- Qual afirmação deste trecho você gostaria de verificar?
- Quem realiza a ação descrita e que fonte sustenta essa informação?
- Qual é a origem dos números mencionados e o que eles medem?
- Quais palavras modificam a afirmação? Que evidência ajudaria a confirmá-la ou refutá-la?

Não usar selos de risco, probabilidades de falsidade ou votação de regras. Perguntas genéricas nos estados sem correspondência/indisponibilidade são identificadas como guia de investigação, e não como observações produzidas pelo modelo.

Cancelar requisições ao trocar de rodada e rejeitar respostas atrasadas. Reiniciar estado de voto e cronômetro de leitura por rodada. Os botões continuam disponíveis durante carregamento ou indisponibilidade.

Remover a estatística fixa de 78% e a apresentação de confiança/razões do mock como checagem factual. O gabarito cadastrado e a pontuação conservam seu fluxo próprio. URLs adicionadas pelo fluxo atual recebem `uncertain`; o FP-Growth não cria um gabarito factual.

## Fase 5 — Verificação e avaliação

Critérios técnicos: reprodução dos atributos e ocorrências de registros congelados; igualdade nos limites; itens omitidos; zero versus ausência; união completa; famílias distintas; invalidação de cache; entrada inadequada; autenticação; participação; rodadas indevidas; serviço indisponível; campos de classe excluídos; troca de rodada sem respostas antigas; votação preservada.

Verificar o caminho parser/corpo salvo → API → serviço real → perguntas. Usar testes de contrato para erros e teste de integração com o serviço Python real.

Pendências de pesquisa após a implementação: revisão editorial humana, avaliação das anotações linguísticas, estudo de compreensão e indução, e textos externos variados em época, tema e origem. Comparar perguntas sem estatísticas, estatísticas opcionais e exposição direta somente em estudo planejado. Não otimizar apenas acertos Fake/True ou cliques em avisos.

## Operação

A URL interna é configurada por `NEWS_INSIGHTS_SERVICE_URL`, nunca `NEXT_PUBLIC_*`. O Docker Compose deve incluir o serviço Python e seu healthcheck. Para execução local e comandos de verificação, consultar `web-app/README.md` e a documentação do serviço em `model-engine/README.md`. A ferramenta offline `model-engine/tools/export_unsupervised_catalog.py` publica os artefatos da pesquisa no runtime; somente essa ferramenta e os testes de reprodução acessam `machine-learning/`.

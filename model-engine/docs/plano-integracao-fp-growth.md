# Integração do FP-Growth ao jogo

Plano atualizado em 8 de outubro de 2026, conforme a autorização para implementação com subagentes de comparações descritivas por classe. O fluxo inicial é a rodada em `/sala/[codigo]`.

## Propósito

Mostrar características observáveis do trecho de uma notícia e a frequência da mesma combinação nas duas classes do corpus. A apresentação descreve os dados: o padrão linguístico não verifica os fatos. O motor não recebe gabarito, não classifica a notícia e não altera a pontuação.

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

Traduzir medidas em observações simples limitadas ao trecho, com contagens quando disponíveis. Registrar `descriptive_comparison` e a natureza experimental; não alegar aprovação editorial humana, validação linguística humana ou estudo com usuários realizados. Usar os mesmos 20 candidatos e preservar a prioridade; não adicionar um padrão apenas porque um atributo foi citado como exemplo na discussão.

Não interpretar advérbios ou adjetivos como intenção de manipulação, alarmismo, emoção ou falsidade. `baixo` pode representar contagem zero. POS e DEP podem descrever os mesmos tokens e não representam evidências independentes.

A comparação por classe foi autorizada como descrição do corpus. Exportar somente `validation/all`, com os campos `frequency_in_fake` e `frequency_in_true`, suas contagens e populações. Cada frequência é o número de notícias da classe que satisfazem todos os critérios dividido pelo total de notícias dessa classe. Não usar a composição entre ocorrências como probabilidade de falsidade. Indicar corpus, partição, variante e run de origem.

As frequências descrevem a amostra observada; não possuem intervalos de associação por classe neste catálogo. Revisão editorial humana, análise complementar de autoria, compreensão por usuários e avaliação externa permanecem pendentes. A descoberta e o ranking permanecem sem rótulos de classe; a comparação é posterior à descoberta.

## Fase 2 — Motor Python

Executar as equações congeladas de extração e discretização em `model-engine/models/unsupervised/features.py`, equivalentes às fontes do principal, em serviço persistente. O runtime não importa scripts de pesquisa. Fixar spaCy 3.8.16 e `pt_core_news_sm` 3.8.0.

Para cada corpo:

1. Aplicar NFKC, remover BOM inicial e analisar os primeiros 300 caracteres.
2. Reproduzir os denominadores do experimento: tokens lexicais para POS/DEP, tokens não espaciais para pontuação e medidas regex para estilo.
3. Aplicar exclusivamente os critérios congelados de `sintaxe_ampliada`. `linkDensity` foi omitida por quantis iguais e não retorna como critério ativo.
4. Exigir todos os itens da união antecedente/consequente. Medição ausente não é zero; zero medido continua um valor válido.
5. Selecionar até três famílias distintas, sem ordenar por pureza Fake, voto ou resposta do usuário.

Não executar notebook, carregar spaCy por requisição, recalcular quantis ou minerar regras online. Cache deve depender do trecho efetivamente analisado e das versões do catálogo e extrator. Qualquer alteração desses insumos invalida a entrada.

Contrato interno: `POST /analyze` recebe somente `{text}`; `GET /health` informa saúde e versões. O retorno contém `analysisStatus`, `catalogVersion`, `extractorVersion`, `analyzedText`, `characterLimit`, `quality` e `insights[]`. Cada insight contém identidade, observação, família, medidas e `comparison`. Esta registra `kind: descriptive_corpus_frequency`, referência do corpus, partição, escopo da combinação completa e `fake/true` com `count`, `total` e `frequency`. As medidas preservam valores, limites e denominadores, com textos simples para apresentação.

Estados: `ok`, `no_match`, `invalid_text` e `unavailable`. Texto vazio ou sem tokens elegíveis não é avaliado como verdadeiro. Texto longo é analisado somente no recorte. Não inventar um comprimento mínimo validado.

## Fase 3 — API autenticada do jogo

O parser compartilhado `extractNews` já é executado em `AddPlaylistNewsUseCase` ao receber uma URL da playlist. A antiga rota `/api/news/extract` foi removida.

`POST /api/news-insights` recebe `{roomId, round}`. O servidor verifica sessão, participação na sala e rodada permitida; resolve o artigo da playlist e usa seu corpo persistido. Se não houver corpo, executa o parser seguro da URL cadastrada e devolve o corpo extraído para exibição.

Título, autoria, fonte e descrição não são concatenados ao corpo. O cliente não escolhe uma URL arbitrária nem fornece gabarito ao matcher. O retorno inclui a notícia resolvida e a análise estruturada. O DTO preserva somente a comparação descritiva validada e exclui classificação, confiança, composição e outros campos adicionais. Validar contagens inteiras, populações positivas, contagem não superior à população e frequência consistente com a divisão.

Seguir as camadas de `docs/codigo/arquitetura-web-app.md`: caso de uso com dependências injetáveis, adaptador HTTP e validação de entrada/saída. O frontend consome a rota e não importa banco, parser ou serviço Python.

Falha do parser ou motor gera estado explícito e não impede a votação. Não persistir percentuais do corpus em `news_analyses.confidence`.

## Fase 4 — Apresentação descritiva durante a rodada

Enquanto a rodada está em leitura, mostrar até três observações simples sobre a escrita e as frequências nas notícias rotuladas como falsas e verdadeiras. Os dois grupos têm a mesma hierarquia visual, sem cores de julgamento. Apresentar a frequência da combinação inteira, sem atribuí-la a um item isolado. Contagens, origem e metodologia ficam disponíveis em detalhes.

O conteúdo fica em um painel lateral aberto por um ícone, inicialmente recolhido
a cada rodada. O painel tem rolagem interna, fechamento por botão, Esc ou clique
fora, e devolve o foco ao ícone ao fechar. A leitura principal permanece compacta.

Permitir consultar o trecho normalizado efetivamente analisado e o corpo completo. A área principal utiliza a palavra "trecho"; a limitação de 300 caracteres e as medidas técnicas ficam nos detalhes da análise. Não expor tokens, POS/DEP e operadores no texto principal. Remover dos cartões com correspondência as perguntas genéricas de checagem factual.

Não usar selos de risco, probabilidades de falsidade ou votação de regras. Orientações genéricas nos estados sem correspondência/indisponibilidade são identificadas como guia de leitura, e não como observações produzidas pelo modelo.

Cancelar requisições ao trocar de rodada e rejeitar respostas atrasadas. Reiniciar estado de voto e cronômetro de leitura por rodada. Os botões continuam disponíveis durante carregamento ou indisponibilidade.

Remover a estatística fixa de 78% e a apresentação de confiança/razões do mock como checagem factual. O gabarito cadastrado e a pontuação conservam seu fluxo próprio. URLs adicionadas pelo fluxo atual recebem `uncertain`; o FP-Growth não cria um gabarito factual.

## Fase 5 — Verificação e avaliação

Critérios técnicos: reprodução dos atributos e ocorrências de registros congelados; igualdade nos limites; itens omitidos; zero versus ausência; união completa; famílias distintas; entrada inadequada; autenticação; participação; rodadas indevidas; serviço indisponível; comparação fiel aos 20 registros científicos de validação; rejeição de frequências inconsistentes; classificação/confiança excluídas; troca de rodada sem respostas antigas; votação preservada.

Verificar o caminho parser/corpo salvo → API → serviço real → observações e comparações. Usar testes de contrato para erros e teste de integração com o serviço Python real.

Pendências de pesquisa após a implementação: revisão editorial humana, avaliação das anotações linguísticas, estudo de compreensão e indução, e textos externos variados em época, tema e origem. Avaliar como a exposição direta das frequências afeta a compreensão e a decisão dos jogadores. Não otimizar apenas acertos Fake/True ou cliques em avisos.

## Operação

A URL interna é configurada por `NEWS_INSIGHTS_SERVICE_URL`, nunca `NEXT_PUBLIC_*`. O Docker Compose deve incluir o serviço Python e seu healthcheck. Para execução local e comandos de verificação, consultar `web-app/README.md` e a documentação do serviço em `model-engine/README.md`. A ferramenta offline `model-engine/tools/export_unsupervised_catalog.py` publica os artefatos da pesquisa no runtime; somente essa ferramenta e os testes de reprodução acessam `machine-learning/`.

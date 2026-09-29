# Experimentos não supervisionados

## Mineração de padrões frequentes

O experimento [FP-Growth](docs/modelos/fp-growth.md) encontra combinações recorrentes das features de estilo existentes, sem usar rótulos Fake/True. O script executável fica em [`fp_growth.py`](fp_growth.py); os resultados são salvos em `../outputs/model-comparison/fp-growth-<UTC>/` como tabelas CSV brutos e consolidados, resumo Markdown e manifesto JSON. Esta análise exploratória fica separada do ranking de classificação em `RESULTADOS.md`.

A [avaliação externa dos padrões congelados](docs/modelos/fp-growth-evaluation.md) usa [`evaluate_patterns.py`](evaluate_patterns.py) para medir a incidência de cada padrão em Fake e Real, sem alterar a descoberta. Os resultados ficam em `../outputs/model-comparison/fp-growth-evaluation-<UTC>/`.

Os [controles de autoria](docs/modelos/fp-growth-controls.md) em [`fp_growth_controls.py`](fp_growth_controls.py) comparam autoria isolada, mineração textual sem autoria e avaliação dentro dos dois estratos de autoria, preservando o baseline original.

Esta pasta reúne **sete experimentos de métodos**, uma comparação independente com o Jev e um arquivo de experimentos anteriores. Os notebooks ficam em `history/`, organizados por categoria: agrupamento, detecção de anomalias, aprendizado semi-supervisionado e aprendizado supervisionado. A documentação de cada método está em [`docs/modelos/`](docs/modelos/), e [`RESULTADOS.md`](RESULTADOS.md) consolida as métricas registradas, mantendo protocolos incompatíveis em quadros separados.

## Métodos em avaliação

| Método | Tipo | Notebook | Documentação | Situação dos resultados |
|---|---|---|---|---|
| Isolation Forest | Detector de anomalias treinado em notícias True | [Abrir notebook](history/deteccao-de-anomalias/isolation-forest.ipynb) | [Ver documentação](docs/modelos/isolation-forest-sinais-de-anomalia.md) | Métricas q95 registradas como controle no notebook LOF; notebook próprio sem saídas salvas |
| Local Outlier Factor (LOF) | Detector de anomalias treinado em notícias True | [Abrir notebook](history/deteccao-de-anomalias/local-outlier-factor.ipynb) | [Ver documentação](docs/modelos/local-outlier-factor.md) | Resultados de validação e teste salvos no notebook |
| One-Class SVM | Detector de anomalias treinado em notícias True | [Abrir notebook](history/deteccao-de-anomalias/one-class-svm.ipynb) | [Ver documentação](docs/modelos/one-class-svm.md) | Métricas q95 registradas como controle no notebook LOF; notebook próprio sem saídas salvas |
| PU Learning | Classificação Positive–Unlabeled | [Abrir notebook](history/aprendizado-semi-supervisionado/pu-learning.ipynb) | [Ver documentação](docs/modelos/pu-learning.md) | Resultados de teste salvos no notebook; split diferente dos detectores |
| K-means | Detecção de novidade e descoberta temática exploratória, em trilhas separadas | [Abrir notebook](history/agrupamento/kmeans.ipynb) | [Ver documentação](docs/modelos/kmeans.md) | Executado no split canônico e em holdout temporal secundário; veja o run `kmeans-canonical-20260924T003936Z` |
| DBSCAN | Detecção de novidade por estilo e descoberta temática, em trilhas separadas | [Abrir notebook](history/agrupamento/dbscan.ipynb) | [Ver documentação](docs/modelos/dbscan.md) | Executado no split canônico e no holdout temporal; veja o run [`dbscan-20260924T141332Z`](../outputs/model-comparison/dbscan-20260924T141332Z/run_manifest.json) |
| HDBSCAN | Descoberta temática exploratória; sem atribuição documentada a notícias novas | [Abrir notebook](history/agrupamento/hdbscan.ipynb) | [Ver documentação](docs/modelos/hdbscan.md) | Executado nos treinos canônico e temporal; veja o run [`hdbscan-20260924T150053Z`](../outputs/model-comparison/hdbscan-20260924T150053Z/run_manifest.json) |

Os três primeiros são os detectores de anomalia da **fronteira atual**. PU Learning é uma linha complementar: ele usa exemplos Fake conhecidos e não rotulados, por isso seus resultados não devem ser misturados ao ranking dos detectores. K-means e DBSCAN têm cada um uma trilha de novidade comparável e uma trilha temática sem decisão Fake/True. HDBSCAN ficou na trilha exploratória: a API scikit-learn 1.9.1 instalada não documenta pontuação ou atribuição de notícias novas.

A comparação externa com o Jev está registrada no [notebook standalone](history/deteccao-de-anomalias/jev-standalone.ipynb) e no [plano do experimento](../docs/jev-standalone.md).

## Próximos testes

Os planos já estão documentados em [`machine-learning/docs/`](../docs/README.md). DBSCAN, K-means e HDBSCAN têm execução e resultados próprios; a trilha de novidade do HDBSCAN permanece indisponível com a API documentada usada neste run.

- [DBSCAN](../docs/dbscan.md) — plano executado; novidades e descoberta temática documentadas em [docs/modelos/dbscan.md](docs/modelos/dbscan.md).
- [HDBSCAN](../docs/hdbscan.md) — descoberta exploratória executada; novidade fora da amostra não reportada. Veja [docs/modelos/hdbscan.md](docs/modelos/hdbscan.md).

Antes de comparar modelos, consulte o [protocolo comum](../docs/comparison-protocol.md). Os outputs históricos usam splits diferentes; os rankings canônico e temporal incluem apenas métodos reexecutados nos mesmos IDs e partições. Veja as tabelas separadas e suas ressalvas em [`RESULTADOS.md`](RESULTADOS.md).

## Experimentos anteriores

[`history/consulta-modelos-anteriores/`](history/consulta-modelos-anteriores/) guarda variantes e análises anteriores para consulta. Elas não fazem parte da fronteira ativa nem do ranking atual. O catálogo da pasta explica o conteúdo e registra resultados históricos que não devem ser comparados diretamente com os atuais.

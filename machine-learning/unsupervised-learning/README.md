# Experimentos não supervisionados

Esta pasta reúne **seis experimentos registrados** e um arquivo de experimentos anteriores. Os notebooks dos métodos ficam na raiz para preservar os caminhos de dados usados por eles. A documentação de cada método está em [`docs/modelos/`](docs/modelos/), e [`RESULTADOS.md`](RESULTADOS.md) consolida as métricas registradas, mantendo protocolos incompatíveis em quadros separados.

## Métodos em avaliação

| Método | Tipo | Notebook | Documentação | Situação dos resultados |
|---|---|---|---|---|
| Isolation Forest | Detector de anomalias treinado em notícias True | [Abrir notebook](anomaly-detection-isolation-forest.ipynb) | [Ver documentação](docs/modelos/isolation-forest.md) | Métricas q95 registradas como controle no notebook LOF; notebook próprio sem saídas salvas |
| Local Outlier Factor (LOF) | Detector de anomalias treinado em notícias True | [Abrir notebook](anomaly-detection-local-outlier-factor.ipynb) | [Ver documentação](docs/modelos/local-outlier-factor.md) | Resultados de validação e teste salvos no notebook |
| One-Class SVM | Detector de anomalias treinado em notícias True | [Abrir notebook](anomaly-detection-one-class-svm.ipynb) | [Ver documentação](docs/modelos/one-class-svm.md) | Métricas q95 registradas como controle no notebook LOF; notebook próprio sem saídas salvas |
| PU Learning | Classificação Positive–Unlabeled | [Abrir notebook](05_PU_Learning.ipynb) | [Ver documentação](docs/modelos/pu-learning.md) | Resultados de teste salvos no notebook; split diferente dos detectores |
| K-means | Detecção de novidade e descoberta temática exploratória, em trilhas separadas | [Abrir notebook](anomaly-detection-kmeans.ipynb) | [Ver documentação](docs/modelos/kmeans.md) | Executado no split canônico e em holdout temporal secundário; veja o run `kmeans-canonical-20260924T003936Z` |
| DBSCAN | Detecção de novidade por estilo e descoberta temática, em trilhas separadas | [Abrir notebook](anomaly-detection-dbscan.ipynb) | [Ver documentação](docs/modelos/dbscan.md) | Executado no split canônico e no holdout temporal; veja o run [`dbscan-20260924T141332Z`](../outputs/model-comparison/dbscan-20260924T141332Z/run_manifest.json) |

Os três primeiros são os detectores de anomalia da **fronteira atual**. PU Learning é uma linha complementar: ele usa exemplos Fake conhecidos e não rotulados, por isso seus resultados não devem ser misturados ao ranking dos detectores. K-means e DBSCAN têm cada um uma trilha de novidade comparável e uma trilha temática sem decisão Fake/True.

## Próximos testes

Os planos já estão documentados em [`machine-learning/docs/`](../docs/README.md). DBSCAN e K-means têm execução e resultados próprios; HDBSCAN segue pendente.

- [DBSCAN](../docs/dbscan.md) — plano executado; novidades e descoberta temática documentadas em [docs/modelos/dbscan.md](docs/modelos/dbscan.md).
- [HDBSCAN](../docs/hdbscan.md) — planejado; sem execução/resultados.

Antes de comparar modelos, consulte o [protocolo comum](../docs/comparison-protocol.md). Os outputs históricos usam splits diferentes; os rankings canônico e temporal incluem apenas métodos reexecutados nos mesmos IDs e partições. Veja as tabelas separadas e suas ressalvas em [`RESULTADOS.md`](RESULTADOS.md).

## Experimentos anteriores

[`consulta-modelos-anteriores/`](consulta-modelos-anteriores/) guarda variantes e análises anteriores para consulta. Elas não fazem parte da fronteira ativa nem do ranking atual. O catálogo da pasta explica o conteúdo e registra resultados históricos que não devem ser comparados diretamente com os atuais.

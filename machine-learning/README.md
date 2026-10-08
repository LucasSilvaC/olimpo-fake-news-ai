# Machine Learning

O classificador principal está destacado nos [experimentos supervisionados](supervised-learning/README.md), com [notebook 12](supervised-learning/12_selectk_svd_svm_spacy.ipynb) e [resultados atuais](supervised-learning/RESULTADOS.md) na raiz da pasta. As duas linhas de pesquisa mantêm seus experimentos anteriores em `history/`; o [motor do app](../model-engine/README.md) contém a camada de execução.

Esta pasta contém experimentos supervisionados e não supervisionados do Olimpo. Os planos para implementar e comparar DBSCAN, HDBSCAN, K-means e Jev estão em [documentação de ML](../docs/machine-learning/README.md).

Os scripts de atributos linguísticos estão catalogados em [metadados](metadados/README.md); cada experimento mantém seus próprios dados e resultados.

Comece pelo [protocolo comum de comparação](../docs/machine-learning/comparacao-modelos/comparison-protocol.md) antes de criar um novo experimento. Ele define os IDs e partições compartilhados, as métricas, os baselines que devem ser reexecutados e as condições para não usar a API paga do Jev.

Os notebooks e artefatos existentes servem como referências experimentais. Não interpretar scores de anomalia ou grupos como comprovação de veracidade factual.

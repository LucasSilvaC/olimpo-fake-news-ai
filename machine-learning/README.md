# Machine Learning

O classificador final está destacado em [aprendizado supervisionado](supervised-learning/README.md).

Esta pasta contém experimentos supervisionados e não supervisionados do Olimpo. Os planos para implementar e comparar DBSCAN, HDBSCAN, K-means e Jev estão em [documentação de ML](../docs/machine-learning/README.md).

Os scripts de atributos linguísticos estão catalogados em [metadados](metadados/README.md); cada experimento mantém seus próprios dados e resultados.

Comece pelo [protocolo comum de comparação](../docs/machine-learning/comparacao-modelos/comparison-protocol.md) antes de criar um novo experimento. Ele define os IDs e partições compartilhados, as métricas, os baselines que devem ser reexecutados e as condições para não usar a API paga do Jev.

Os notebooks e artefatos existentes servem como referências experimentais. Não interpretar scores de anomalia ou grupos como comprovação de veracidade factual.

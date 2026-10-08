# Resultados históricos

Esta pasta guarda os CSVs de baselines, regularização, dimensionalidade,
validação externa e dos experimentos spaCy 10–11. Eles preservam os valores
produzidos pelos respectivos notebooks.

Os resultados atuais do notebook 12 ficam em `data/resultados/`:

- [Validação cruzada χ² + SVD](../../data/resultados/resultados_selectk_svd500_cv.csv).
- [Teste interno e externo χ² + SVD](../../data/resultados/resultados_selectk_svd500_teste.csv).
- [Relatório do principal](../../RESULTADOS.md).

Os notebooks históricos gravam novas tabelas aqui. O notebook 12 lê a referência
do experimento 10 nesta pasta e grava suas próprias tabelas em `data/resultados/`. A síntese
dos experimentos de redução de dimensionalidade está em
[`docs/modelos/REDUCAO_DIMENSIONALIDADE.md`](../../docs/modelos/REDUCAO_DIMENSIONALIDADE.md).

# Histórico de experimentos

Os notebooks nesta área registram os experimentos anteriores ao [principal atual, notebook 12](../support/notebooks/12_selectk_svd_svm_spacy.ipynb), em `support/notebooks/`. O pipeline de pesquisa está em [`../modelo_olimpo.py`](../modelo_olimpo.py), com documentação em [`../docs/modelos/modelo-olimpo.md`](../docs/modelos/modelo-olimpo.md).

- [`baselines/`](baselines/): preparação do corpus e comparação inicial de LR, SVM e Random Forest.
- [`ajuste-e-validacao/`](ajuste-e-validacao/): regularização, kernels, dimensionalidade e teste externo.
- [`modelo-final/`](modelo-final/README.md): antecessores 10–11 que definem os atributos spaCy e exploram redução de dimensão.
- [`resultados/`](resultados/README.md): tabelas CSV dos experimentos anteriores; os CSVs do principal ficam em `../data/resultados/`.

Os arquivos de entrada e caches ficam em [`../data/`](../data/README.md). Os notebooks preservam suas saídas incorporadas e resolvem os caminhos a partir da raiz supervisionada. O [registro de reorganização](reorganizacao.json) identifica as duplicatas consolidadas e seus arquivos canônicos.

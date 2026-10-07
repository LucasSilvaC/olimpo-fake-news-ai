# Histórico de experimentos

Os notebooks nesta área registram a evolução do classificador supervisionado. O módulo de inferência e exportação selecionado ao fim desse percurso está em [`../modelo_olimpo.py`](../modelo_olimpo.py), com documentação em [`../docs/modelos/modelo-olimpo.md`](../docs/modelos/modelo-olimpo.md).

- [`baselines/`](baselines/): preparação do corpus e comparação inicial de LR, SVM e Random Forest.
- [`ajuste-e-validacao/`](ajuste-e-validacao/): regularização, kernels, dimensionalidade e teste externo.
- [`modelo-final/`](modelo-final/): sequência 10–12 que define as features e os parâmetros do pipeline adotado.
- [`resultados/`](resultados/): tabelas CSV salvas pelos notebooks.

Os arquivos de entrada e caches usados nas execuções ficam em [`../data/`](../data/). Os notebooks foram mantidos com seus resultados incorporados e com caminhos ajustados para esta estrutura.

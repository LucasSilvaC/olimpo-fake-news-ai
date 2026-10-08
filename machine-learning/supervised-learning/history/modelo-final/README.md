# Antecessores do modelo principal

| Experimento                                                | Papel                                                                     | Resultados                                                                                                        |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [10 — metadados spaCy](10_svm_metadados_spacy.ipynb)       | Escolha das 24 features e do peso linguístico; gera os caches em `data/`. | [CV](../resultados/resultados_svm_meta_cv.csv) e [teste](../resultados/resultados_svm_meta_teste.csv)             |
| [11 — redução de dimensão](11_reducao_dim_svm_spacy.ipynb) | Compara dimensões do vetor TF-IDF com e sem metadados spaCy.              | [CV](../resultados/resultados_m2_reducao_dim_cv.csv) e [teste](../resultados/resultados_m2_reducao_dim_teste.csv) |

O [notebook 12 — seleção χ² + SVD](../../12_selectk_svd_svm_spacy.ipynb) é o
principal atual e fica na raiz, junto ao [relatório de resultados](../../RESULTADOS.md).
O nome desta pasta preserva a etapa histórica da seleção do modelo.

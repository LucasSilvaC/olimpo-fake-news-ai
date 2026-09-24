# Local Outlier Factor (LOF)

**Status:** notebook executado com resultados de validação e teste salvos. É o único detector atual cujo próprio notebook preserva uma execução completa.

- **Notebook:** [anomaly-detection-local-outlier-factor.ipynb](../../anomaly-detection-local-outlier-factor.ipynb)
- **Comparativo:** [RESULTADOS.md](../../RESULTADOS.md)

## Objetivo e método

Quatro pipelines LOF independentes aprendem apenas com as 2.160 notícias True de treino. Cada pipeline usa imputação pela mediana, `StandardScaler`, LOF com `novelty=True` e `n_neighbors` 10, 20, 40 ou 80. As seis features são recalculadas nos primeiros 300 caracteres.

A validação Fake participa da seleção assistida por ROC-AUC e AP; o LOF com 80 vizinhos foi escolhido antes da avaliação de teste (ROC-AUC 0,974691; AP 0,981207). O corte q95 é calculado apenas com os scores das 720 notícias True de validação.

## Resultados no teste histórico

O teste tem 720 True e 1.800 Fake. Resultados de LOF q95:

| ROC-AUC | AP | Acurácia | Precisão Fake | Recall Fake | F1 Fake | FPR True |
|---:|---:|---:|---:|---:|---:|---:|
| 0,987400 | 0,993869 | 0,977381 | 0,985515 | 0,982778 | 0,984145 | 0,036111 |

Matriz de confusão (`[[TN, FP], [FN, TP]]`): `[[694, 26], [31, 1769]]`.

| Corte | Recall Fake | FPR True | Acurácia |
|---|---:|---:|---:|
| q95 | 0,982778 | 0,036111 | 0,977381 |
| Nativo do LOF | 0,983333 | 0,038889 | 0,976984 |

## Limitações

Os resultados descrevem desvio linguístico no split usado e não provam falsidade. O teste já foi consultado durante o desenvolvimento, a seleção foi assistida por Fake-validation e a divisão por notícia pode deixar notícias sobre o mesmo assunto em partições diferentes. A AP também deve ser lida em relação à prevalência Fake de 71,43% nesse teste.

# One-Class SVM

**Status:** experimento atual; o notebook próprio não tem resultados de execução salvos. A tabela abaixo usa os números do controle One-Class SVM q95 reportado no notebook LOF.

- **Notebook:** [anomaly-detection-one-class-svm.ipynb](../../anomaly-detection-one-class-svm.ipynb)
- **Comparativo:** [RESULTADOS.md](../../RESULTADOS.md)

## Objetivo e método

O One-Class SVM aprende somente com notícias **True (0)** e usa as seis features de estilo linguístico extraídas dos primeiros 300 caracteres. Cada candidato tem imputação pela mediana, `StandardScaler` e kernel RBF (`gamma="scale"`). O notebook próprio compara `nu` 0,01, 0,025, 0,05 e 0,10. O corte q95 usa somente os scores das notícias True de validação.

## Resultado registrado

Os números a seguir foram reportados para `nu=0,10` como controle dentro do notebook LOF, no teste compartilhado de 720 True e 1.800 Fake:

| Corte | ROC-AUC | AP | Acurácia | Precisão Fake | Recall Fake | F1 Fake | FPR True |
|---|---:|---:|---:|---:|---:|---:|---:|
| q95 | 0,976384 | 0,985442 | 0,931746 | 0,983948 | 0,919444 | 0,950603 | 0,037500 |

No mesmo registro, a matriz de confusão foi `[[693, 27], [145, 1655]]`, na ordem de rótulos `[True, Fake]` e linhas reais/colunas previstas. O notebook One-Class SVM atual não tem outputs persistidos, então estes valores são evidência indireta de um controle comparável, não execução salva no notebook individual.

## Limitações

O teste já foi consultado, o split não é por tema/fonte/data e a prevalência Fake é 71,43%. Os scores indicam distância em relação ao padrão aprendido em notícias True; não estimam probabilidade de falsidade nem verificam fatos.

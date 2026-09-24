# Isolation Forest

**Status:** experimento atual; o notebook próprio não tem resultados de execução salvos. A tabela abaixo usa os números do controle Isolation Forest q95 reportado no notebook LOF.

- **Notebook:** [anomaly-detection-isolation-forest.ipynb](../../anomaly-detection-isolation-forest.ipynb)
- **Comparativo:** [RESULTADOS.md](../../RESULTADOS.md)

## Objetivo e método

O detector aprende somente com notícias **True (0)**. Ele calcula seis features de estilo linguístico a partir dos primeiros 300 caracteres: presença de autor, type-token ratio, densidade de links, densidade de pontuação, proporção de maiúsculas e diversidade lexical. O pipeline usa imputação pela mediana e Isolation Forest com 300 árvores, `contamination="auto"` e `random_state=42`, sem scaler.

O corte comparativo é o percentil 95 dos scores das notícias True na validação. Um score alto indica desvio em relação ao padrão True aprendido; não é probabilidade de falsidade.

## Resultado registrado

Os números foram reportados como controle dentro do notebook LOF, no teste compartilhado de 720 True e 1.800 Fake:

| Corte | ROC-AUC | AP | Acurácia | Precisão Fake | Recall Fake | F1 Fake | FPR True |
|---|---:|---:|---:|---:|---:|---:|---:|
| q95 | 0,980673 | 0,988672 | 0,979365 | 0,988268 | 0,982778 | 0,985515 | 0,029167 |

No mesmo registro, a matriz de confusão foi `[[699, 21], [31, 1769]]`, na ordem de rótulos `[True, Fake]` e linhas reais/colunas previstas. O notebook Isolation Forest atual não tem outputs persistidos, então estes valores são evidência indireta de um controle comparável, não execução salva no notebook individual.

## Limitações

O teste já foi consultado, o split é por notícia (não por tema, fonte ou data) e o teste tem prevalência Fake de 71,43%. As métricas são exploratórias. Um alerta identifica um texto atípico em relação ao conjunto True de treino e exige verificação externa.

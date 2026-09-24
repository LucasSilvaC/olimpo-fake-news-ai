# PU Learning

- **Notebook:** [05_PU_Learning.ipynb](../../05_PU_Learning.ipynb)
- **Comparativo:** [RESULTADOS.md](../../RESULTADOS.md)

## Objetivo e método

O notebook simula Positive–Unlabeled Learning com o Fake.br-Corpus preparado nos notebooks supervisionados. Usa `texto_trunc` (até 200 palavras), TF-IDF de palavras (n-gramas 1–2) e caracteres (3–5), totalizando 331.003 features. O split preparado tem 5.760 notícias de treino e 1.440 de teste.

No treino, P contém as 2.880 notícias Fake conhecidas e U contém 2.880 notícias True sem rótulo. O procedimento esconde 432 exemplos de P como *spies*, adota o limiar `P(fake)=0,0600` e seleciona 725 negativos confiáveis. Uma Random Forest final com 300 árvores é ajustada em P e nos negativos selecionados; o teste não participa dessas etapas.

## Resultados no teste

| Métrica | Resultado |
|---|---:|
| Acurácia | 0,7347 |
| ROC-AUC | 0,9547 |
| Precisão / recall / F1 — Real | 0,9856 / 0,4764 / 0,6423 |
| Precisão / recall / F1 — Fake | 0,6548 / 0,9931 / 0,7892 |

Matriz de confusão (linhas: classe verdadeira; colunas: classe prevista; ordem Real, Fake):

|  | Previsto Real | Previsto Fake |
|---|---:|---:|
| Real | 343 | 377 |
| Fake | 5 | 715 |

Com limiar 0,5, o modelo recupera quase todos os Fake, mas 377 das 720 notícias reais são previstas como Fake. A ROC-AUC alta não elimina esse custo no ponto de corte escolhido.

## Limitação principal

Esta simulação forma U somente com notícias reais usando os rótulos originais para escolher os exemplos. Em um cenário PU real, U pode conter notícias positivas e negativas. Portanto, as métricas descrevem esta simulação e não demonstram o desempenho em uma população U misturada. O split e a distribuição do teste também diferem dos usados pelos detectores de anomalia; não compare as métricas diretamente.

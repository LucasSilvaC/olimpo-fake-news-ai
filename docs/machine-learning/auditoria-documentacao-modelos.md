# Conferência da documentação dos modelos

Conferência realizada em 09/10/2026 na branch `docs/entregavel-final`, usando código, notebooks, manifestos, CSVs e artefatos locais. Não houve novo treinamento nem alteração dos resultados científicos persistidos.

## Referências atuais

- Supervisionado: [modelo Olimpo](../../machine-learning/supervised-learning/modelo_olimpo.py), [notebook 12](../../machine-learning/supervised-learning/support/notebooks/12_selectk_svd_svm_spacy.ipynb) e [resultados](../../machine-learning/supervised-learning/RESULTADOS.md).
- Não supervisionado: [FP-Growth da raiz](../../machine-learning/unsupervised-learning/fp_growth_principal.py), variante `sintaxe_ampliada`, [notebook principal](../../machine-learning/unsupervised-learning/fp_growth_principal_sem_autoria.ipynb) e [resultados](../../machine-learning/unsupervised-learning/REGRAS_FP_GROWTH.md).
- Execução no app: [motor](../../model-engine/README.md) e seus catálogos e manifestos congelados.

## Resultados conferidos

| Evidência | Resultado |
|---|---|
| FP-Growth principal | 22 atributos ativos, 44 itens, 523 regras elegíveis, 345 padrões |
| Regras sustentadas na validação | 422; destas, 347 com redescoberta ≥80% |
| Frequência por classe na validação | 105 padrões mais presentes proporcionalmente em Fake, 235 em True e cinco empates |
| Partições não supervisionadas | 4.320 treino, 1.440 validação, 1.440 teste; 7.200 IDs únicos e pares/grupos sem cruzamento |
| Catálogo do app | 20 padrões; contagens e frequências Fake/True reproduzidas aplicando seus limiares às features salvas da validação |
| Supervisionado, CV do candidato sem calibração | F1 macro 0,929503 ± 0,008131; gap 0,042153 |
| Supervisionado, teste interno sem calibração | F1 macro 0,924304; AUC 0,978937 |
| Supervisionado, teste interno calibrado | F1 macro 0,9208; AUC 0,9789; Brier 0,0569, conforme manifesto |
| Teste externo exploratório em títulos, candidato sem calibração | F1 macro 0,637803; AUC 0,677441 |

As quantidades de regras, padrões e candidatos das quatro variantes foram confrontadas com seus CSVs, além de `variant_summary.csv`. As 422/347 regras foram recontadas em `rule_metrics.csv`, e as 105/235/5 associações em `posthoc_composition.csv`. Todas as linhas do CSV supervisionado de teste tiveram o F1 macro recalculado a partir de `tn`, `fp`, `fn` e `tp`, com concordância na precisão salva.

O ZIP congelado corresponde ao SHA-256 `be91c188f621424017bd79a0f33528dcc27f8a6151adb2bcb899c17719eb4090`. As cópias do artefato supervisionado na pesquisa e no motor têm 21.414.887 bytes e SHA-256 `123763864725531f12aa0503530edce432ca6e59853d36ef472559790207df27`, iguais ao manifesto.

## Correções documentais

- Os entregáveis apresentavam o antigo FP-Growth de estilo, com oito regras elegíveis, como principal. A descrição atual passou a usar `sintaxe_ampliada`; tabelas, figuras e controles antigos foram identificados como históricos.
- O artigo apresentava a referência linguística de 152 regras e o ranking anterior de 25 padrões como versão mais recente. Esses resultados foram substituídos pelos do principal atual e pela fila de 20 candidatos sem rótulos no ranking.
- O F1 0,9243 foi identificado como resultado sem calibração. A documentação agora distingue o F1 calibrado 0,9208 e o reajuste final nas 7.200 notícias, que não tem avaliação interna independente.
- A comparação direta de desempenho entre FP-Growth e classificador foi substituída pela descrição de suas funções e protocolos distintos. A utilidade pedagógica permanece uma hipótese a avaliar.
- O inventário de baselines foi identificado como histórico. O código atual de preparação usa normalização e 100 palavras; os outputs anteriores podem pertencer ao protocolo de 200 palavras.
- Links relativos dos entregáveis e referências históricas foram corrigidos. A documentação de DBSCAN passou a informar a ausência do script citado nesta revisão, em vez de oferecer um link inexistente.
- Markdown, LaTeX e PDFs dos entregáveis foram atualizados. Os PDFs foram recompilados e as páginas alteradas inspecionadas visualmente.

## Verificação e limites

Os cinco testes existentes do FP-Growth principal e os quatro testes de caminhos/dados supervisionados passaram em contêiner descartável com Python 3.14.2, spaCy e o modelo de língua instalados. Os 22 testes existentes do motor também passaram, incluindo reprodução de probabilidades, contribuições e catálogo. A conferência numérica usa os resultados persistidos; não reexecuta a extração das 7.200 notícias, o bootstrap completo nem o treinamento supervisionado.

Os resultados históricos de outros detectores e classificadores permanecem como evidências de seus protocolos. O FP-Growth não estima veracidade; suas frequências são dentro de cada classe do corpus. A seleção das famílias de atributos foi informada por análises anteriores, o teste não supervisionado já era conhecido, e não há nova avaliação externa nem aprovação editorial humana do catálogo. Os resultados supervisionados internos anteriores ao reajuste final não devem ser apresentados como validação do artefato final em dados independentes.

# Resultados do modelo supervisionado principal

O experimento atual é o [notebook 12](12_selectk_svd_svm_spacy.ipynb):
**M2 + χ² (10.000 atributos) + SVD (500 componentes)**. As métricas vêm dos CSVs
salvos e do manifesto do artefato. A reorganização não executou novo treino.

| Evidência                                 |           Resultado | Fonte                                                                     |
| ----------------------------------------- | ------------------: | ------------------------------------------------------------------------- |
| F1 macro em CV de cinco folds             | 0,929503 ± 0,008131 | [CV, M2/10000/500](resultados_selectk_svd500_cv.csv)                      |
| F1 macro de treino em CV                  |            0,971657 | [CV](resultados_selectk_svd500_cv.csv)                                    |
| Gap treino–validação                      |            0,042153 | [CV](resultados_selectk_svd500_cv.csv)                                    |
| F1 macro no teste interno, sem calibração |            0,924304 | [Teste, M2/10000/500](resultados_selectk_svd500_teste.csv)                |
| AUC no teste interno, sem calibração      |            0,978937 | [Teste](resultados_selectk_svd500_teste.csv)                              |
| F1 macro no teste interno, calibrado      |              0,9208 | [Manifesto do artefato](modelos/olimpo-svm-spacy-chi2k10k-svd500-v1.json) |
| AUC no teste interno, calibrado           |              0,9789 | [Manifesto do artefato](modelos/olimpo-svm-spacy-chi2k10k-svd500-v1.json) |
| F1 macro externo em títulos FakeRecogna   |            0,637803 | [Teste externo exploratório](resultados_selectk_svd500_teste.csv)         |
| AUC externo em títulos FakeRecogna        |            0,677441 | [Teste externo exploratório](resultados_selectk_svd500_teste.csv)         |

O principal não tem o maior F1 de todas as configurações de CV. A escolha
documentada considera desempenho interno, tamanho e explicabilidade; o baseline
B0 e as demais configurações continuam nos CSVs para comparação. Veja a
[arquitetura e os limites](docs/modelos/modelo-olimpo.md).

## Artefato e uso no jogo

O artefato `svm-spacy-chi2k10k-svd500-v1` tem 21.414.887 bytes e SHA-256
`123763864725531f12aa0503530edce432ca6e59853d36ef472559790207df27`.
O ajuste final registrado usa treino e teste juntos, totalizando 7.200 notícias;
as métricas internas do manifesto pertencem ao modelo avaliado antes desse
reajuste. Elas não são uma avaliação independente do artefato final.

A cópia congelada usada no app fica em
[`model-engine/models/supervised/assets/`](../../model-engine/models/supervised/assets/).
O serviço aplica a política `olimpo-decision-policy-v1`: `P(fake) ≤ 0,35` resulta
em `reliable`, `P(fake) ≥ 0,65` em `unreliable` e a faixa intermediária em
`uncertain`. Menos de 30 palavras produz `insufficient_text` com scores nulos.
`fakeScore` é `100 × P(fake)`; não é prova de falsidade nem confiança no gabarito.

`modelo_olimpo.analisar()` mantém o contrato histórico da pesquisa, com
`confidence` e texto curto como `uncertain`. O app usa o
[contrato do motor HTTP](../../model-engine/README.md), que distingue os estados
de análise e separa a previsão do gabarito cadastrado.

## Resultados anteriores

Os notebooks 10 e 11 e seus CSVs estão no [histórico](history/README.md).
O relatório de [redução de dimensionalidade](docs/modelos/REDUCAO_DIMENSIONALIDADE.md)
descreve os experimentos 05, 07 e 08. Métricas de protocolos diferentes devem ser
lidas junto às respectivas configurações e partições.

# Comparação das melhores regras linguísticas

**Recorte final: 25 padrões distintos**, a partir de 152 regras direcionais e 93 combinações. 5 favorecem Fake e 20 favorecem True na validação. Não foi forçado equilíbrio entre classes.

O ranking global selecionou 20 padrões. Para examinar os dois sentidos da comparação, o painel acrescenta 5 candidatos Fake que passam os mesmos critérios mínimos. Eles são identificados como `fake_contrast` e não são apresentados como superiores aos20 globais. Esse acréscimo é exploratório, decidido após observar que o top20 global contém apenas padrões True.

## O que define uma regra melhor

Para a associação Fake/True, uma regra é mais útil quando separa as classes com ocorrências suficientes, mantém a descoberta sob reamostragem e acrescenta cobertura diferente das regras já escolhidas. O lift gramatical A→B não mede a associação com Fake/True.

`score = 100 × max(limite inferior95 da pureza da classe − baseline da classe, 0) × sqrt(cobertura da classe) × redescoberta da regra no treino`.

As frações da fórmula estão entre0 e1. A elegibilidade exige pelo menos100 ocorrências na validação, q≤0,05 na permutação pareada com correção BY das93 comparações e scorepositivo. A seleção é gulosa, por score, omitindo cobertura com Jaccard≥0,80 de um padrão já selecionado. O máximo escolhido antes da análise foi20; não foram preenchidas vagas com candidatos sem evidência mínima.

**A seleção agora usa os rótulos da validação:** é uma análise posterior supervisionada de regras descobertas sem classe. Teste e corpus inteiro não selecionam regras. Os intervalos são pontuais, não ajustados para a seleção do topX. Permutação pressupõe intercambiabilidade das classes dentro de grupos sob a hipótese nula, não causalidade. [Permutação pareada — SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html), [controle de comparações múltiplas — SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.false_discovery_control.html).

## Porcentagens com denominadores distintos

- `fake_pct = Fake com padrão / todas as notícias com padrão ×100`: composição/pureza.
- `fake_coverage_pct = Fake com padrão / todas as notícias Fake ×100`: frequência na classe.
- As duas versões True têm os denominadores correspondentes. `support_pct` usa todas as notícias da partição.
- Uma ocorrência requer todos os itens do antecedente e do consequente. Não significa que a seta cause a classe.

## Recorte final — métricas da validação

| ID | Padrão | Alvo | Ocorrências | Fake entre ocorrências | True entre ocorrências | Aparece nas Fake | Aparece nas True | Redescoberta treino |
|---|---|---|---:|---:|---:|---:|---:|---:|
| R01 | `DEP_advmod_rate_baixo + POS_ADV_rate_baixo + POS_VERB_rate_baixo` | True | 126 | 19.05% | 80.95% | 3.33% | 14.17% | 98% |
| R02 | `DEP_advmod_rate_baixo + POS_ADV_rate_baixo + POS_NOUN_rate_alto` | True | 143 | 20.98% | 79.02% | 4.17% | 15.69% | 99% |
| R03 | `DEP_advmod_rate_baixo + DEP_ccomp_rate_baixo + POS_VERB_rate_baixo` | True | 117 | 16.24% | 83.76% | 2.64% | 13.61% | 82% |
| R04 | `DEP_ccomp_rate_baixo + POS_VERB_rate_baixo` | True | 281 | 31.32% | 68.68% | 12.22% | 26.81% | 100% |
| R05 | `POS_NOUN_rate_alto + uppercaseRatio_baixo` | True | 182 | 26.37% | 73.63% | 6.67% | 18.61% | 97% |
| R06 | `DEP_advcl_rate_baixo + POS_NOUN_rate_alto` | True | 224 | 28.12% | 71.88% | 8.75% | 22.36% | 92% |
| R07 | `DEP_advcl_rate_baixo + POS_PRON_rate_baixo + POS_VERB_rate_baixo` | True | 114 | 22.81% | 77.19% | 3.61% | 12.22% | 99% |
| R08 | `DEP_advmod_rate_baixo + POS_ADV_rate_baixo + punctuationDensity_spacy_baixo` | True | 114 | 20.18% | 79.82% | 3.19% | 12.64% | 84% |
| R09 | `DEP_advcl_rate_baixo + POS_VERB_rate_baixo` | True | 272 | 31.62% | 68.38% | 11.94% | 25.83% | 100% |
| R10 | `DEP_advcl_rate_baixo + DEP_advmod_rate_baixo + POS_VERB_rate_baixo` | True | 115 | 17.39% | 82.61% | 2.78% | 13.19% | 69% |
| R11 | `DEP_ccomp_rate_baixo + POS_NOUN_rate_alto` | True | 239 | 31.38% | 68.62% | 10.42% | 22.78% | 100% |
| R12 | `DEP_ccomp_rate_baixo + DEP_nsubj_rate_baixo + POS_VERB_rate_baixo` | True | 150 | 26.67% | 73.33% | 5.56% | 15.28% | 100% |
| R13 | `DEP_advmod_rate_baixo + POS_ADV_rate_baixo` | True | 416 | 35.82% | 64.18% | 20.69% | 37.08% | 100% |
| R14 | `DEP_ccomp_rate_baixo + POS_PRON_rate_baixo + POS_VERB_rate_baixo` | True | 119 | 25.21% | 74.79% | 4.17% | 12.36% | 100% |
| R15 | `DEP_advcl_rate_baixo + DEP_advmod_rate_baixo` | True | 295 | 32.88% | 67.12% | 13.47% | 27.50% | 95% |
| R16 | `DEP_ccomp_rate_baixo + POS_NOUN_rate_alto + uppercaseRatio_baixo` | True | 127 | 25.98% | 74.02% | 4.58% | 13.06% | 97% |
| R17 | `DEP_advmod_rate_baixo + DEP_ccomp_rate_baixo + POS_ADV_rate_baixo` | True | 252 | 32.94% | 67.06% | 11.53% | 23.47% | 100% |
| R18 | `POS_NOUN_rate_alto + POS_PROPN_rate_baixo` | True | 159 | 28.93% | 71.07% | 6.39% | 15.69% | 89% |
| R19 | `POS_NOUN_rate_alto + POS_PROPN_rate_baixo + uppercaseRatio_baixo` | True | 112 | 25.89% | 74.11% | 4.03% | 11.53% | 92% |
| R20 | `DEP_ccomp_rate_baixo + DEP_obj_rate_baixo + POS_VERB_rate_baixo` | True | 124 | 28.23% | 71.77% | 4.86% | 12.36% | 100% |
| R21 | `DEP_advmod_rate_alto + POS_ADV_rate_alto + punctuationDensity_spacy_alto` | Fake | 106 | 91.51% | 8.49% | 13.47% | 1.25% | 37% |
| R22 | `DEP_advmod_rate_alto + POS_ADV_rate_alto` | Fake | 331 | 62.24% | 37.76% | 28.61% | 17.36% | 100% |
| R23 | `DEP_advmod_rate_alto + POS_ADV_rate_alto + POS_NOUN_rate_baixo` | Fake | 104 | 74.04% | 25.96% | 10.69% | 3.75% | 63% |
| R24 | `DEP_advmod_rate_alto + POS_ADV_rate_alto + POS_PRON_rate_alto` | Fake | 125 | 69.60% | 30.40% | 12.08% | 5.28% | 66% |
| R25 | `POS_PRON_rate_alto + uppercaseRatio_baixo` | Fake | 202 | 62.38% | 37.62% | 17.50% | 10.56% | 100% |

## Comparação com teste e corpus completo

O teste já foi consultado anteriormente e serve como descrição de recorrência, não nova confirmação externa. O corpus completo inclui treino/validação/teste e não é um holdout adicional.

| ID | Fake val. | Fake teste | Fake corpus | True corpus | Ocorrências corpus |
|---|---:|---:|---:|---:|---:|
| R01 | 19.05% | 30.77% | 27.66% | 72.34% | 629 |
| R02 | 20.98% | 22.41% | 25.84% | 74.16% | 654 |
| R03 | 16.24% | 33.64% | 27.78% | 72.22% | 594 |
| R04 | 31.32% | 44.84% | 39.36% | 60.64% | 1466 |
| R05 | 26.37% | 36.52% | 33.23% | 66.77% | 936 |
| R06 | 28.12% | 31.65% | 31.60% | 68.40% | 1152 |
| R07 | 22.81% | 41.28% | 36.79% | 63.21% | 617 |
| R08 | 20.18% | 23.68% | 23.85% | 76.15% | 587 |
| R09 | 31.62% | 41.00% | 39.08% | 60.92% | 1410 |
| R10 | 17.39% | 30.30% | 27.65% | 72.35% | 575 |
| R11 | 31.38% | 35.19% | 33.56% | 66.44% | 1201 |
| R12 | 26.67% | 39.55% | 33.38% | 66.62% | 725 |
| R13 | 35.82% | 36.85% | 38.21% | 61.79% | 2073 |
| R14 | 25.21% | 36.61% | 37.30% | 62.70% | 630 |
| R15 | 32.88% | 35.35% | 36.61% | 63.39% | 1505 |
| R16 | 25.98% | 36.72% | 32.96% | 67.04% | 631 |
| R17 | 32.94% | 36.64% | 36.87% | 63.13% | 1272 |
| R18 | 28.93% | 31.79% | 30.74% | 69.26% | 888 |
| R19 | 25.89% | 32.17% | 31.69% | 68.31% | 590 |
| R20 | 28.23% | 42.38% | 36.14% | 63.86% | 664 |
| R21 | 91.51% | 84.03% | 85.19% | 14.81% | 574 |
| R22 | 62.24% | 60.74% | 61.50% | 38.50% | 1665 |
| R23 | 74.04% | 75.00% | 74.41% | 25.59% | 590 |
| R24 | 69.60% | 66.12% | 65.47% | 34.53% | 614 |
| R25 | 62.38% | 56.94% | 55.76% | 44.24% | 1042 |

## O que permanece depois de considerar autoria

A autoria não foi usada para descobrir nem pontuar as regras, mas foi conferida como confundidor. O excesso ajustado compara a pureza dentro de cada estrato com sua baseline e padroniza os estratos à composição de autoria da população. É uma padronização descritiva, não estimativa causal nem percentual observado.

4 de 25 padrões têm intervalo95 do excesso ajustado inteiramente favorável à classe indicada. Estratos sem ocorrências ficam ausentes; estratos com menos20 ocorrências são sinalizados e células minoritárias pequenas limitam os intervalos. Esses intervalos são pontuais e não corrigidos para comparações múltiplas ou escolha do recorte; esse número não constitui comprovação de efeitos independentes.

| ID | Fake com autor | Baseline Fake com autor | Fake sem autor | Baseline Fake sem autor | Excesso Fake ajustado (pp) | Intervalo95 (pp) |
|---|---:|---:|---:|---:|---:|---|
| R01 | 1.01% | 2.35% | 85.19% | 98.05% | -7.08 | [-13.88; -0.74] |
| R02 | 1.79% | 2.35% | 90.32% | 98.05% | -4.13 | [-9.90; 0.42] |
| R03 | 1.03% | 2.35% | 90.00% | 98.05% | -4.67 | [-12.48; 0.64] |
| R04 | 1.56% | 2.35% | 95.51% | 98.05% | -1.66 | [-3.87; 0.25] |
| R05 | 1.50% | 2.35% | 93.88% | 98.05% | -2.50 | [-6.57; 0.32] |
| R06 | 1.27% | 2.35% | 92.42% | 98.05% | -3.34 | [-6.93; -0.74] |
| R07 | 1.15% | 2.35% | 92.59% | 98.05% | -3.32 | [-9.17; 0.91] |
| R08 | 6.32% | 2.35% | 89.47% | 98.05% | -2.28 | [-9.94; 3.94] |
| R09 | 1.66% | 2.35% | 91.21% | 98.05% | -3.75 | [-6.50; -1.14] |
| R10 | 1.09% | 2.35% | 82.61% | 98.05% | -8.32 | [-16.40; -1.06] |
| R11 | 1.21% | 2.35% | 98.65% | 98.05% | -0.27 | [-1.98; 1.04] |
| R12 | 2.65% | 2.35% | 100.00% | 98.05% | 1.12 | [-0.15; 2.78] |
| R13 | 2.24% | 2.35% | 96.62% | 98.05% | -0.77 | [-2.22; 0.53] |
| R14 | 1.12% | 2.35% | 96.67% | 98.05% | -1.30 | [-5.23; 1.25] |
| R15 | 2.54% | 2.35% | 93.88% | 98.05% | -1.98 | [-4.38; 0.12] |
| R16 | 1.06% | 2.35% | 96.97% | 98.05% | -1.18 | [-4.84; 1.15] |
| R17 | 2.92% | 2.35% | 96.30% | 98.05% | -0.58 | [-3.00; 1.49] |
| R18 | 2.63% | 2.35% | 95.56% | 98.05% | -1.10 | [-4.72; 1.60] |
| R19 | 2.41% | 2.35% | 93.10% | 98.05% | -2.43 | [-8.09; 1.36] |
| R20 | 2.27% | 2.35% | 91.67% | 98.05% | -3.22 | [-9.04; 1.02] |
| R21 | 0.00% | 2.35% | 100.00% | 98.05% | -0.21 | [-0.87; 0.51] |
| R22 | 2.38% | 2.35% | 99.02% | 98.05% | 0.50 | [-0.78; 1.87] |
| R23 | 3.57% | 2.35% | 100.00% | 98.05% | 1.58 | [-0.61; 5.70] |
| R24 | 0.00% | 2.35% | 100.00% | 98.05% | -0.21 | [-0.87; 0.51] |
| R25 | 5.06% | 2.35% | 99.19% | 98.05% | 1.93 | [-0.25; 4.38] |

## Exemplo de associação forte que não deve virar explicação causal

O maior percentual Fake entre os93 candidatos é **91.51%**, no padrão `DEP_advmod_rate_alto + POS_ADV_rate_alto + punctuationDensity_spacy_alto`: 97 Fake e 9 True, em 106 ocorrências. Ele aparece em **13.47% das Fake**, não em 91.51% de todas as Fake. A redescoberta da sua direção representativa é 37%. Seu status no recorte é `outside_top_x`.

Para entender quais itens acrescentam separação, `leave_one_item_out.csv` remove um item por vez e recalcula as porcentagens na validação. Essa diferença é associação condicional, não causa de falsidade. `individual_items.csv` permite comparar as mesmas taxas isoladas.

## Arquivos para a matriz de dispersão

- [selected_rules_scatter.csv](selected_rules_scatter.csv): um ponto por padrão selecionado, contagens, porcentagens0–100, intervalos, score, estabilidade, autoria e partições.
- [global_top_rules.csv](global_top_rules.csv): recorte global sem o acréscimo de candidatos Fake.
- [news_rule_matrix.csv](news_rule_matrix.csv): uma linha por notícia e colunasR01…RX booleanas, com rótulo, grupo, partição e autoria apenas para análise posterior.
- [all_93_patterns.csv](all_93_patterns.csv): todos os candidatos e motivos de exclusão.
- [leave_one_item_out.csv](leave_one_item_out.csv): diferença das porcentagens ao remover cada item.
- [individual_items.csv](individual_items.csv): frequências dos itens isolados.
- [Dispersão de cobertura por classe](class_coverage_scatter.png) e [matriz de dispersão](scatter_matrix.png).

Para visualizar separação, use `validation_true_coverage_pct` no eixoX e `validation_fake_coverage_pct` no eixoY. Pontos acima da diagonal aparecem proporcionalmente mais em Fake; abaixo, mais em True. Cor pode indicar classe predominante e tamanho o número de ocorrências. Usar Fake% e True% da composição como os dois eixos produz uma linha, pois somam100%.

Esses padrões descrevem este corpus e uma janela de300 caracteres. Eles ajudam a formular hipóteses sobre estilo, fonte e anotação gramatical; não estabelecem o que torna uma afirmação factual falsa ou verdadeira.

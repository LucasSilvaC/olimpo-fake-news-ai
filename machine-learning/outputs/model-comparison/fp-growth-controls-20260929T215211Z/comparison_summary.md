# Controles de autoria para FP-Growth

Baseline preservado: `fp-growth-20260929T212058Z`. Run de controle: `fp-growth-controls-20260929T215211Z`.
Corpus: 7200 notícias; 4320 no treino de descoberta. A mineração sem autoria usou os mesmos IDs, quantis, suporte, limites e filtros do baseline.

## A — autoria isolada

| Estado | Fake | Real | Total | P(fake | estado) | P(real | estado) | Lift fake | Lift real |
|---|---:|---:|---:|---:|---:|---:|---:|
| com_autor | 72 | 3527 | 3599 | 0.020 | 0.980 | 0.040 | 1.960 |
| sem_autor | 3528 | 73 | 3601 | 0.980 | 0.020 | 1.959 | 0.041 |

Fisher bicaudal: <1e-300 (limite numérico); qui-quadrado: p=<1e-300 (limite numérico); Cramér V=0.960.
Neste corpus, autoria apresenta forte associação com o rótulo. Isso não identifica uma causa.

Dos 31 padrões originais de tamanho ≥2, 21 contêm um item de autoria. `baseline_metadata_patterns.csv` mostra sua proporção fake ao lado da proporção fake da autoria isolada; essa comparação não decompõe causalmente o efeito do texto.

## B — mineração sem autoria

10 padrões de tamanho ≥2; 18 itemsets frequentes; 20 regras brutas. Nenhum item de autoria integra a mineração.

| ID | Features | Famílias | Support descoberta | Fake % corpus | Real % corpus | Lift fake | Lift real |
|---|---|---|---:|---:|---:|---:|---:|
| P03 | {punctuationDensity_alto, typeTokenRatio_baixo} | estilo + lexical | 0.138 | 0.703 | 0.297 | 1.406 | 0.594 |
| P10 | {punctuationDensity_alto, uppercaseRatio_baixo} | estilo | 0.105 | 0.679 | 0.321 | 1.359 | 0.641 |
| P08 | {typeTokenRatio_baixo, uppercaseRatio_baixo} | estilo + lexical | 0.106 | 0.636 | 0.364 | 1.272 | 0.728 |
| P01 | {diversidade_baixo, typeTokenRatio_baixo} | lexical | 0.172 | 0.616 | 0.384 | 1.232 | 0.768 |
| P09 | {diversidade_baixo, uppercaseRatio_baixo} | estilo + lexical | 0.105 | 0.605 | 0.395 | 1.211 | 0.789 |
| P07 | {diversidade_alto, uppercaseRatio_baixo} | estilo + lexical | 0.115 | 0.416 | 0.584 | 0.832 | 1.168 |
| P06 | {punctuationDensity_baixo, uppercaseRatio_baixo} | estilo | 0.116 | 0.408 | 0.592 | 0.816 | 1.184 |
| P05 | {typeTokenRatio_alto, uppercaseRatio_baixo} | estilo + lexical | 0.119 | 0.333 | 0.667 | 0.666 | 1.334 |
| P02 | {diversidade_alto, typeTokenRatio_alto} | lexical | 0.166 | 0.312 | 0.688 | 0.624 | 1.376 |
| P04 | {punctuationDensity_baixo, typeTokenRatio_alto} | estilo + lexical | 0.138 | 0.309 | 0.691 | 0.618 | 1.382 |

Os 10 padrões puramente textuais do baseline reaparecem com as mesmas features. Seu suporte de descoberta permanece igual porque os itens textuais e a partição de treino são os mesmos. Os padrões originais que continham autoria ficam fora da nova mineração.

## C — padrões textuais dentro de cada estado de autoria

Cada lift e delta usa a baseline Fake/Real do próprio estrato. Um estrato com pouquíssimos exemplos de uma classe exige cautela.

| Padrão | Estrato | Ocorrências | Support | Baseline fake | Fake % | Real % | Delta fake | Lift fake | Lift real | q BH |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| P06 | com_autor | 524 | 0.146 | 0.020 | 0.061 | 0.939 | 0.041 | 3.053 | 0.958 | 6.552e-09 |
| P09 | com_autor | 306 | 0.085 | 0.020 | 0.052 | 0.948 | 0.032 | 2.614 | 0.967 | 0.001273 |
| P05 | com_autor | 591 | 0.164 | 0.020 | 0.036 | 0.964 | 0.016 | 1.776 | 0.984 | 0.01438 |
| P04 | com_autor | 685 | 0.190 | 0.020 | 0.035 | 0.965 | 0.015 | 1.751 | 0.985 | 0.01172 |
| P07 | com_autor | 505 | 0.140 | 0.020 | 0.018 | 0.982 | -0.002 | 0.891 | 1.002 | 0.9599 |
| P08 | com_autor | 281 | 0.078 | 0.020 | 0.018 | 0.982 | -0.002 | 0.889 | 1.002 | 1 |
| P01 | com_autor | 473 | 0.131 | 0.020 | 0.017 | 0.983 | -0.003 | 0.845 | 1.003 | 0.9073 |
| P02 | com_autor | 823 | 0.229 | 0.020 | 0.015 | 0.985 | -0.005 | 0.729 | 1.006 | 0.3662 |
| P03 | com_autor | 293 | 0.081 | 0.020 | 0.007 | 0.993 | -0.013 | 0.341 | 1.013 | 0.2054 |
| P10 | com_autor | 239 | 0.066 | 0.020 | 0.004 | 0.996 | -0.016 | 0.209 | 1.016 | 0.1777 |
| P03 | sem_autor | 714 | 0.198 | 0.980 | 0.989 | 0.011 | 0.009 | 1.009 | 0.553 | 0.1813 |
| P10 | sem_autor | 522 | 0.145 | 0.980 | 0.989 | 0.011 | 0.009 | 1.009 | 0.567 | 0.2939 |
| P09 | sem_autor | 444 | 0.123 | 0.980 | 0.986 | 0.014 | 0.007 | 1.007 | 0.667 | 0.4334 |
| P08 | sem_autor | 497 | 0.138 | 0.980 | 0.986 | 0.014 | 0.006 | 1.006 | 0.695 | 0.4334 |
| P01 | sem_autor | 769 | 0.214 | 0.980 | 0.984 | 0.016 | 0.005 | 1.005 | 0.770 | 0.4334 |
| P07 | sem_autor | 356 | 0.099 | 0.980 | 0.980 | 0.020 | 0.001 | 1.001 | 0.970 | 1 |
| P06 | sem_autor | 324 | 0.090 | 0.980 | 0.969 | 0.031 | -0.011 | 0.989 | 1.522 | 0.2939 |
| P05 | sem_autor | 277 | 0.077 | 0.980 | 0.968 | 0.032 | -0.012 | 0.988 | 1.603 | 0.2939 |
| P02 | sem_autor | 376 | 0.104 | 0.980 | 0.963 | 0.037 | -0.017 | 0.983 | 1.837 | 0.09852 |
| P04 | sem_autor | 293 | 0.081 | 0.980 | 0.949 | 0.051 | -0.031 | 0.968 | 2.525 | 0.006015 |

## Comparação exata por features

A tabela completa está em `comparison_patterns.csv`. IDs não são usados para correspondência. Não há correspondência forçada para itemsets estruturalmente diferentes.

| Features | Baseline ID | Sem autor ID | Support original | Support sem autor | Fake % original | Fake % sem autor | Com autor: fake % / lift | Sem autor: fake % / lift |
|---|---|---|---:|---:|---:|---:|---:|---:|
| {diversidade_alto, typeTokenRatio_alto} | P06 | P02 | 0.166 | 0.166 | 0.312 | 0.312 | 0.015 / 0.729 | 0.963 / 0.983 |
| {diversidade_baixo, typeTokenRatio_baixo} | P04 | P01 | 0.172 | 0.172 | 0.616 | 0.616 | 0.017 / 0.845 | 0.984 / 1.005 |
| {punctuationDensity_alto, typeTokenRatio_baixo} | P11 | P03 | 0.138 | 0.138 | 0.703 | 0.703 | 0.007 / 0.341 | 0.989 / 1.009 |
| {punctuationDensity_baixo, typeTokenRatio_alto} | P12 | P04 | 0.138 | 0.138 | 0.309 | 0.309 | 0.035 / 1.751 | 0.949 / 0.968 |

## Leitura dos controles

A associação de metadata é dominante: 3.528 de 3.601 notícias sem autor são fake, enquanto 72 de 3.599 notícias com autor são fake. Os padrões originais com `com_autor` ou `sem_autor` podem refletir sobretudo essa composição; não é possível atribuir sua associação ao texto sem comparar dentro dos estratos.

No corpus completo, `punctuationDensity_alto + typeTokenRatio_baixo` e `diversidade_baixo + typeTokenRatio_baixo` têm maior proporção fake. No grupo com autor, ambos ficam abaixo da baseline fake do estrato; no grupo sem autor, ficam apenas ligeiramente acima e seus q BH não indicam diferença clara. `punctuationDensity_baixo + typeTokenRatio_alto` permanece abaixo da baseline fake no grupo sem autor; no grupo com autor muda de direção. `diversidade_alto + typeTokenRatio_alto` fica abaixo da baseline fake nos dois estratos, mas a diferença no grupo sem autor é pequena. Esses contrastes sugerem composição do corpus como explicação importante para os lifts agregados.

Há sinais textuais que merecem investigação: no estrato com autor, `punctuationDensity_baixo + uppercaseRatio_baixo` apresenta 32 fake em 524 ocorrências, ante baseline fake de 72/3599. No estrato sem autor, `punctuationDensity_baixo + typeTokenRatio_alto` apresenta 278 fake em 293 ocorrências, ante baseline fake de 3528/3601. São associações observadas, com poucos exemplos da classe minoritária em cada estrato.

A semelhança ou diferença das proporções condicionais é observacional. O corpus balanceado pode ter composição de fonte e metadados distinta entre classes; os estratos não constituem uma amostra independente nem demonstram robustez fora deste corpus.

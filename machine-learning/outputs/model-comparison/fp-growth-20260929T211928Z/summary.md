# FP-Growth — padrões consolidados

Protocolo: `canonical_random_group`; notícias: 4320; sem uso de rótulos.

Tabela completa em `consolidated_patterns.csv`; regras e itemsets brutos nos CSVs próprios.

| ID | Features | Famílias | Support | Lift máx. | Confidence máx. | Jaccard máx. | Redundância | Semelhantes |
|---|---|---|---:|---:|---:|---:|---|---|
| P01 | {com_autor, uppercaseRatio_baixo} | estilo + metadata | 0.2206 | — | — | — | baixa | — |
| P02 | {sem_autor, uppercaseRatio_baixo} | estilo + metadata | 0.2150 | — | — | — | baixa | — |
| P03 | {com_autor, typeTokenRatio_alto} | lexical + metadata | 0.1722 | 1.3670 | 0.6826 | 0.2972 | baixa | — |
| P04 | {diversidade_baixo, typeTokenRatio_baixo} | lexical | 0.1720 | 2.6918 | 0.6835 | 0.5156 | media | — |
| P05 | {punctuationDensity_alto, sem_autor} | estilo + metadata | 0.1697 | 1.3285 | 0.6652 | 0.2895 | baixa | — |
| P06 | {diversidade_alto, typeTokenRatio_alto} | lexical | 0.1657 | 2.5565 | 0.6569 | 0.4825 | media | — |
| P07 | {sem_autor, typeTokenRatio_baixo} | lexical + metadata | 0.1648 | 1.2963 | 0.6490 | 0.2794 | baixa | — |
| P08 | {com_autor, punctuationDensity_baixo} | estilo + metadata | 0.1562 | 1.2357 | 0.6170 | 0.2620 | baixa | — |
| P09 | {diversidade_baixo, sem_autor} | lexical + metadata | 0.1525 | 1.2108 | 0.6063 | 0.2543 | baixa | — |
| P10 | {com_autor, diversidade_alto} | lexical + metadata | 0.1498 | 1.1674 | 0.5829 | 0.2469 | media | P18 |
| P11 | {punctuationDensity_alto, typeTokenRatio_baixo} | estilo + lexical | 0.1384 | 2.1370 | 0.5451 | 0.3735 | media | — |
| P12 | {punctuationDensity_baixo, typeTokenRatio_alto} | estilo + lexical | 0.1382 | 2.1628 | 0.5477 | 0.3762 | media | — |
| P13 | {sem_autor, uppercaseRatio_alto} | estilo + metadata | 0.1380 | 1.0821 | 0.5418 | 0.2235 | baixa | — |
| P14 | {typeTokenRatio_alto, uppercaseRatio_baixo} | estilo + lexical | 0.1187 | — | — | — | baixa | — |
| P15 | {com_autor, uppercaseRatio_alto} | estilo + metadata | 0.1167 | — | — | — | baixa | — |
| P16 | {punctuationDensity_baixo, uppercaseRatio_baixo} | estilo | 0.1162 | — | — | — | media | — |
| P17 | {diversidade_alto, uppercaseRatio_baixo} | estilo + lexical | 0.1153 | — | — | — | baixa | — |
| P18 | {com_autor, diversidade_alto, typeTokenRatio_alto} | lexical + metadata | 0.1130 | 2.9893 | 0.7543 | 0.3907 | media | P10 |
| P19 | {diversidade_baixo, sem_autor, typeTokenRatio_baixo} | lexical + metadata | 0.1079 | 2.7847 | 0.7071 | 0.3612 | baixa | — |
| P20 | {diversidade_alto, sem_autor} | lexical + metadata | 0.1072 | — | — | — | baixa | — |
| P21 | {typeTokenRatio_baixo, uppercaseRatio_baixo} | estilo + lexical | 0.1062 | — | — | — | baixa | — |
| P22 | {diversidade_baixo, uppercaseRatio_baixo} | estilo + lexical | 0.1053 | — | — | — | baixa | — |
| P23 | {punctuationDensity_alto, uppercaseRatio_baixo} | estilo | 0.1051 | — | — | — | media | — |
| P24 | {com_autor, diversidade_baixo} | lexical + metadata | 0.0991 | — | — | — | baixa | — |
| P25 | {punctuationDensity_alto, sem_autor, typeTokenRatio_baixo} | estilo + lexical + metadata | 0.0984 | 2.3400 | 0.7107 | 0.3060 | baixa | — |
| P26 | {punctuationDensity_baixo, sem_autor} | estilo + metadata | 0.0970 | — | — | — | baixa | — |
| P27 | {com_autor, punctuationDensity_baixo, typeTokenRatio_alto} | estilo + lexical + metadata | 0.0968 | 2.4543 | 0.7002 | 0.3103 | baixa | — |
| P28 | {com_autor, typeTokenRatio_baixo} | lexical + metadata | 0.0891 | — | — | — | baixa | — |
| P29 | {com_autor, punctuationDensity_alto} | estilo + metadata | 0.0854 | — | — | — | baixa | — |
| P30 | {com_autor, typeTokenRatio_alto, uppercaseRatio_baixo} | estilo + lexical + metadata | 0.0819 | 1.3820 | 0.6901 | 0.1528 | baixa | — |

## Associações principais

### P03 — {com_autor, typeTokenRatio_alto}

- {typeTokenRatio_alto} → {com_autor}: confidence 0.6826, lift 1.3670, Jaccard 0.2972

### P04 — {diversidade_baixo, typeTokenRatio_baixo}

- {diversidade_baixo} → {typeTokenRatio_baixo}: confidence 0.6835, lift 2.6918, Jaccard 0.5156
- {typeTokenRatio_baixo} → {diversidade_baixo}: confidence 0.6773, lift 2.6918, Jaccard 0.5156

### P05 — {punctuationDensity_alto, sem_autor}

- {punctuationDensity_alto} → {sem_autor}: confidence 0.6652, lift 1.3285, Jaccard 0.2895

### P06 — {diversidade_alto, typeTokenRatio_alto}

- {typeTokenRatio_alto} → {diversidade_alto}: confidence 0.6569, lift 2.5565, Jaccard 0.4825
- {diversidade_alto} → {typeTokenRatio_alto}: confidence 0.6450, lift 2.5565, Jaccard 0.4825

### P07 — {sem_autor, typeTokenRatio_baixo}

- {typeTokenRatio_baixo} → {sem_autor}: confidence 0.6490, lift 1.2963, Jaccard 0.2794

### P08 — {com_autor, punctuationDensity_baixo}

- {punctuationDensity_baixo} → {com_autor}: confidence 0.6170, lift 1.2357, Jaccard 0.2620

### P09 — {diversidade_baixo, sem_autor}

- {diversidade_baixo} → {sem_autor}: confidence 0.6063, lift 1.2108, Jaccard 0.2543

### P10 — {com_autor, diversidade_alto}

- {diversidade_alto} → {com_autor}: confidence 0.5829, lift 1.1674, Jaccard 0.2469

### P11 — {punctuationDensity_alto, typeTokenRatio_baixo}

- {typeTokenRatio_baixo} → {punctuationDensity_alto}: confidence 0.5451, lift 2.1370, Jaccard 0.3735
- {punctuationDensity_alto} → {typeTokenRatio_baixo}: confidence 0.5426, lift 2.1370, Jaccard 0.3735

### P12 — {punctuationDensity_baixo, typeTokenRatio_alto}

- {typeTokenRatio_alto} → {punctuationDensity_baixo}: confidence 0.5477, lift 2.1628, Jaccard 0.3762
- {punctuationDensity_baixo} → {typeTokenRatio_alto}: confidence 0.5457, lift 2.1628, Jaccard 0.3762

### P13 — {sem_autor, uppercaseRatio_alto}

- {uppercaseRatio_alto} → {sem_autor}: confidence 0.5418, lift 1.0821, Jaccard 0.2235


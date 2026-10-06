# FP-Growth — padrões de estilo

Protocolo: `canonical_random_group`; notícias: 4320; sem uso de rótulos.

| Padrão | Support | Tamanho |
|---|---:|---:|
| {com_autor, uppercaseRatio_baixo} | 0.2206 | 2 |
| {sem_autor, uppercaseRatio_baixo} | 0.2150 | 2 |
| {com_autor, typeTokenRatio_alto} | 0.1722 | 2 |
| {diversidade_baixo, typeTokenRatio_baixo} | 0.1720 | 2 |
| {punctuationDensity_alto, sem_autor} | 0.1697 | 2 |
| {diversidade_alto, typeTokenRatio_alto} | 0.1657 | 2 |
| {sem_autor, typeTokenRatio_baixo} | 0.1648 | 2 |
| {com_autor, punctuationDensity_baixo} | 0.1562 | 2 |
| {diversidade_baixo, sem_autor} | 0.1525 | 2 |
| {com_autor, diversidade_alto} | 0.1498 | 2 |
| {punctuationDensity_alto, typeTokenRatio_baixo} | 0.1384 | 2 |
| {punctuationDensity_baixo, typeTokenRatio_alto} | 0.1382 | 2 |
| {sem_autor, uppercaseRatio_alto} | 0.1380 | 2 |
| {typeTokenRatio_alto, uppercaseRatio_baixo} | 0.1187 | 2 |
| {com_autor, uppercaseRatio_alto} | 0.1167 | 2 |
| {punctuationDensity_baixo, uppercaseRatio_baixo} | 0.1162 | 2 |
| {diversidade_alto, uppercaseRatio_baixo} | 0.1153 | 2 |
| {com_autor, diversidade_alto, typeTokenRatio_alto} | 0.1130 | 3 |
| {diversidade_baixo, sem_autor, typeTokenRatio_baixo} | 0.1079 | 3 |
| {diversidade_alto, sem_autor} | 0.1072 | 2 |

## Regras (maior lift)

| Antecedente → consequente | Support | Confidence | Lift | Jaccard | Tamanho |
|---|---:|---:|---:|---:|---:|
| {com_autor, diversidade_alto} → {typeTokenRatio_alto} | 0.1130 | 0.7543 | 2.9893 | 0.3907 | 3 |
| {diversidade_baixo, sem_autor} → {typeTokenRatio_baixo} | 0.1079 | 0.7071 | 2.7847 | 0.3612 | 3 |
| {diversidade_baixo} → {typeTokenRatio_baixo} | 0.1720 | 0.6835 | 2.6918 | 0.5156 | 2 |
| {typeTokenRatio_baixo} → {diversidade_baixo} | 0.1720 | 0.6773 | 2.6918 | 0.5156 | 2 |
| {sem_autor, typeTokenRatio_baixo} → {diversidade_baixo} | 0.1079 | 0.6545 | 2.6011 | 0.3496 | 3 |
| {typeTokenRatio_alto} → {diversidade_alto} | 0.1657 | 0.6569 | 2.5565 | 0.4825 | 2 |
| {diversidade_alto} → {typeTokenRatio_alto} | 0.1657 | 0.6450 | 2.5565 | 0.4825 | 2 |
| {com_autor, typeTokenRatio_alto} → {diversidade_alto} | 0.1130 | 0.6559 | 2.5527 | 0.3572 | 3 |
| {com_autor, punctuationDensity_baixo} → {typeTokenRatio_alto} | 0.0968 | 0.6193 | 2.4543 | 0.3103 | 3 |
| {sem_autor, typeTokenRatio_baixo} → {punctuationDensity_alto} | 0.0984 | 0.5969 | 2.3400 | 0.3060 | 3 |
| {punctuationDensity_alto, sem_autor} → {typeTokenRatio_baixo} | 0.0984 | 0.5798 | 2.2833 | 0.3025 | 3 |
| {com_autor, typeTokenRatio_alto} → {punctuationDensity_baixo} | 0.0968 | 0.5618 | 2.2186 | 0.2944 | 3 |
| {typeTokenRatio_alto} → {punctuationDensity_baixo} | 0.1382 | 0.5477 | 2.1628 | 0.3762 | 2 |
| {punctuationDensity_baixo} → {typeTokenRatio_alto} | 0.1382 | 0.5457 | 2.1628 | 0.3762 | 2 |
| {typeTokenRatio_baixo} → {punctuationDensity_alto} | 0.1384 | 0.5451 | 2.1370 | 0.3735 | 2 |
| {punctuationDensity_alto} → {typeTokenRatio_baixo} | 0.1384 | 0.5426 | 2.1370 | 0.3735 | 2 |
| {punctuationDensity_alto, typeTokenRatio_baixo} → {sem_autor} | 0.0984 | 0.7107 | 1.4194 | 0.1819 | 3 |
| {punctuationDensity_baixo, typeTokenRatio_alto} → {com_autor} | 0.0968 | 0.7002 | 1.4023 | 0.1789 | 3 |
| {typeTokenRatio_alto, uppercaseRatio_baixo} → {com_autor} | 0.0819 | 0.6901 | 1.3820 | 0.1528 | 3 |
| {typeTokenRatio_alto} → {com_autor} | 0.1722 | 0.6826 | 1.3670 | 0.2972 | 2 |

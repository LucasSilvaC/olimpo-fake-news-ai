# Avaliação externa dos padrões FP-Growth

Descoberta congelada: `fp-growth-20260929T212058Z`; notícias: 7200; fake: 3600; real: 3600.

Lift de classe = proporção da classe entre notícias com o padrão / proporção global da classe.
Fisher compara presença/ausência do padrão e classe; q usa Benjamini–Hochberg. Associações são descritivas.

## Maior lift fake

| Padrão | Features | Famílias | Ocorrências | Support | Fake % | Real % | Lift fake | Lift real | q BH |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| P25 | {punctuationDensity_alto, sem_autor, typeTokenRatio_baixo} | estilo + lexical + metadata | 714 | 0.0992 | 0.9888 | 0.0112 | 1.9776 | 0.0224 | 4.019e-213 |
| P05 | {punctuationDensity_alto, sem_autor} | estilo + metadata | 1223 | 0.1699 | 0.9886 | 0.0114 | 1.9771 | 0.0229 | 0 |
| P07 | {sem_autor, typeTokenRatio_baixo} | lexical + metadata | 1188 | 0.1650 | 0.9865 | 0.0135 | 1.9731 | 0.0269 | 0 |
| P19 | {diversidade_baixo, sem_autor, typeTokenRatio_baixo} | lexical + metadata | 769 | 0.1068 | 0.9844 | 0.0156 | 1.9688 | 0.0312 | 2.32e-224 |
| P09 | {diversidade_baixo, sem_autor} | lexical + metadata | 1073 | 0.1490 | 0.9832 | 0.0168 | 1.9664 | 0.0336 | 2.174e-322 |
| P02 | {sem_autor, uppercaseRatio_baixo} | estilo + metadata | 1578 | 0.2192 | 0.9816 | 0.0184 | 1.9632 | 0.0368 | 0 |
| P20 | {diversidade_alto, sem_autor} | lexical + metadata | 790 | 0.1097 | 0.9797 | 0.0203 | 1.9595 | 0.0405 | 2.32e-224 |
| P13 | {sem_autor, uppercaseRatio_alto} | estilo + metadata | 963 | 0.1338 | 0.9792 | 0.0208 | 1.9585 | 0.0415 | 2.626e-278 |
| P31 | {sem_autor, typeTokenRatio_alto} | lexical + metadata | 573 | 0.0796 | 0.9581 | 0.0419 | 1.9162 | 0.0838 | 1.465e-139 |
| P26 | {punctuationDensity_baixo, sem_autor} | estilo + metadata | 706 | 0.0981 | 0.9561 | 0.0439 | 1.9122 | 0.0878 | 1.756e-172 |

## Maior lift real

| Padrão | Features | Famílias | Ocorrências | Support | Fake % | Real % | Lift fake | Lift real | q BH |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| P29 | {com_autor, punctuationDensity_alto} | estilo + metadata | 622 | 0.0864 | 0.0032 | 0.9968 | 0.0064 | 1.9936 | 1.142e-194 |
| P15 | {com_autor, uppercaseRatio_alto} | estilo + metadata | 850 | 0.1181 | 0.0106 | 0.9894 | 0.0212 | 1.9788 | 9.961e-259 |
| P10 | {com_autor, diversidade_alto} | lexical + metadata | 1088 | 0.1511 | 0.0110 | 0.9890 | 0.0221 | 1.9779 | 0 |
| P28 | {com_autor, typeTokenRatio_baixo} | lexical + metadata | 653 | 0.0907 | 0.0138 | 0.9862 | 0.0276 | 1.9724 | 2.505e-190 |
| P18 | {com_autor, diversidade_alto, typeTokenRatio_alto} | lexical + metadata | 823 | 0.1143 | 0.0146 | 0.9854 | 0.0292 | 1.9708 | 3.249e-243 |
| P03 | {com_autor, typeTokenRatio_alto} | lexical + metadata | 1234 | 0.1714 | 0.0219 | 0.9781 | 0.0438 | 1.9562 | 0 |
| P01 | {com_autor, uppercaseRatio_baixo} | estilo + metadata | 1578 | 0.2192 | 0.0304 | 0.9696 | 0.0608 | 1.9392 | 0 |
| P27 | {com_autor, punctuationDensity_baixo, typeTokenRatio_alto} | estilo + lexical + metadata | 685 | 0.0951 | 0.0350 | 0.9650 | 0.0701 | 1.9299 | 8.115e-176 |
| P30 | {com_autor, typeTokenRatio_alto, uppercaseRatio_baixo} | estilo + lexical + metadata | 591 | 0.0821 | 0.0355 | 0.9645 | 0.0711 | 1.9289 | 1.099e-149 |
| P24 | {com_autor, diversidade_baixo} | lexical + metadata | 714 | 0.0992 | 0.0392 | 0.9608 | 0.0784 | 1.9216 | 2.149e-179 |

## Mais próximos da baseline

| Padrão | Features | Famílias | Ocorrências | Support | Fake % | Real % | Lift fake | Lift real | q BH |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| P17 | {diversidade_alto, uppercaseRatio_baixo} | estilo + lexical | 861 | 0.1196 | 0.4158 | 0.5842 | 0.8316 | 1.1684 | 1.6e-07 |
| P16 | {punctuationDensity_baixo, uppercaseRatio_baixo} | estilo | 848 | 0.1178 | 0.4080 | 0.5920 | 0.8160 | 1.1840 | 1.387e-08 |
| P22 | {diversidade_baixo, uppercaseRatio_baixo} | estilo + lexical | 750 | 0.1042 | 0.6053 | 0.3947 | 1.2107 | 0.7893 | 1.312e-09 |
| P04 | {diversidade_baixo, typeTokenRatio_baixo} | lexical | 1242 | 0.1725 | 0.6159 | 0.3841 | 1.2319 | 0.7681 | 2.948e-19 |
| P21 | {typeTokenRatio_baixo, uppercaseRatio_baixo} | estilo + lexical | 778 | 0.1081 | 0.6362 | 0.3638 | 1.2725 | 0.7275 | 8.855e-16 |
| P14 | {typeTokenRatio_alto, uppercaseRatio_baixo} | estilo + lexical | 868 | 0.1206 | 0.3329 | 0.6671 | 0.6659 | 1.3341 | 6.429e-26 |
| P23 | {punctuationDensity_alto, uppercaseRatio_baixo} | estilo | 761 | 0.1057 | 0.6794 | 0.3206 | 1.3587 | 0.6413 | 7.508e-26 |
| P06 | {diversidade_alto, typeTokenRatio_alto} | lexical | 1199 | 0.1665 | 0.3119 | 0.6881 | 0.6239 | 1.3761 | 9.406e-47 |
| P12 | {punctuationDensity_baixo, typeTokenRatio_alto} | estilo + lexical | 978 | 0.1358 | 0.3088 | 0.6912 | 0.6176 | 1.3824 | 2.273e-38 |
| P11 | {punctuationDensity_alto, typeTokenRatio_baixo} | estilo + lexical | 1007 | 0.1399 | 0.7031 | 0.2969 | 1.4062 | 0.5938 | 1.252e-44 |

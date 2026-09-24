# K-means

**Status: executado.** Run canÃ´nico: `kmeans-canonical-20260924T003936Z`. O experimento mantÃ©m duas trilhas independentes: detecÃ§Ã£o de novidade sobre estilo e descoberta temÃ¡tica sobre TF-IDF.

## Dados e partiÃ§Ã£o

| Item | ConfiguraÃ§Ã£o |
|---|---|
| Corpus | Fake.br-Corpus, revisÃ£o `780f5516c4ae070761632d98ac3368f3ded09d35` |
| URL | [ZIP da revisÃ£o fixa](https://codeload.github.com/roneysco/Fake.br-Corpus/zip/780f5516c4ae070761632d98ac3368f3ded09d35) |
| SHA-256 calculado | `be91c188f621424017bd79a0f33528dcc27f8a6151adb2bcb899c17719eb4090` â€” confere com o valor registrado nos notebooks atuais |
| Registros / classes | 7.200; `0 = True` (3.600), `1 = Fake` (3.600) |
| Identidade | `record_id` = pasta de origem + nome do arquivo; `group_id` une os pares alinhados Fake/True e textos integralmente duplicados normalizados |
| PartiÃ§Ã£o | `StratifiedGroupKFold`, 5 folds, shuffle, seed 42; folds 0/1 para teste/validaÃ§Ã£o e os restantes para treino |
| SobreposiÃ§Ã£o | Nenhum `record_id` ou `group_id` entre partiÃ§Ãµes; 3.599 grupos apÃ³s unir pares e uma duplicaÃ§Ã£o exata |

| PartiÃ§Ã£o | NotÃ­cias | Grupos | True (0) | Fake (1) |
|---|---:|---:|---:|---:|
| Treino | 4.320 | 2.159 | 2.160 | 2.160 |
| ValidaÃ§Ã£o | 1.440 | 720 | 720 | 720 |
| Teste congelado | 1.440 | 720 | 720 | 720 |

## Trilha 1 â€” detecÃ§Ã£o de novidade

As seis features foram recalculadas nos primeiros 300 caracteres: autoria presente, TTR, densidade de links, densidade de pontuaÃ§Ã£o, razÃ£o de maiÃºsculas e diversidade. A imputaÃ§Ã£o mediana e `StandardScaler` foram ajustados somente em True-train. As cinco features numÃ©ricas foram escaladas; `tem_autor` permaneceu 0/1 sem escala, limitando sua contribuiÃ§Ã£o mÃ¡xima Ã  distÃ¢ncia a 1. O ajuste do K-means usa apenas True-train.

O score Ã© a distÃ¢ncia ao centrÃ³ide mais prÃ³ximo; valores maiores indicam desvio. O limiar de cada mÃ©todo Ã© o q95 dos scores de True-validation. A regra foi declarada antes do teste: maior ROC-AUC de validaÃ§Ã£o, depois maior AP e, em empate dentro de `1e-12`, menor `k` ou hiperparÃ¢metro.

### SeleÃ§Ã£o e comparaÃ§Ã£o congelada no teste

IF, LOF e One-Class SVM foram reexecutados com os mesmos IDs e a mesma partiÃ§Ã£o. A tabela abaixo usa somente o teste congelado; os outputs histÃ³ricos em outros splits nÃ£o entram neste ranking.

| MÃ©todo | ParÃ¢metro selecionado | Macro-F1 | Balanced accuracy | PrecisÃ£o Fake | Recall Fake | F1 Fake | FPR True | AcurÃ¡cia | ROC-AUC | AP |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| K-means novidade | `k=8`, `n_init=20` | 0,4352 | 0,5382 | 0,7619 | 0,1111 | 0,1939 | 0,0347 | 0,5382 | 0,8471 | 0,7751 |
| Isolation Forest | `n_estimators=300` | 0,9729 | 0,9729 | 0,9620 | 0,9847 | 0,9732 | 0,0389 | 0,9729 | 0,9786 | 0,9750 |
| LOF | `n_neighbors=10` | 0,9479 | 0,9479 | 0,9601 | 0,9347 | 0,9472 | 0,0389 | 0,9479 | 0,9766 | 0,9659 |
| One-Class SVM | `nu=0,10` | 0,4685 | 0,5563 | 0,8000 | 0,1500 | 0,2526 | 0,0375 | 0,5563 | 0,8738 | 0,8266 |

| MÃ©todo/candidato | ROC-AUC validaÃ§Ã£o | AP validaÃ§Ã£o | q95 True-validation |
|---|---:|---:|---:|
| K-means, `k=1` | 0,6563 | 0,6245 | 3,3415 |
| K-means, `k=2` | 0,7278 | 0,6678 | 2,8141 |
| K-means, `k=4` | 0,7599 | 0,6913 | 2,4580 |
| **K-means, `k=8` selecionado** | **0,8351** | **0,7503** | **2,0300** |
| Isolation Forest, fixo | 0,9731 | 0,9538 | 0,0842 |
| LOF, `n_neighbors=10` selecionado | 0,9767 | 0,9668 | âˆ’0,0542 |
| One-Class SVM, `nu=0,10` selecionado | 0,8615 | 0,7960 | 3,3926 |

No teste compartilhado, K-means teve ROC-AUC 0,8471 e recall Fake 0,1111. IF e LOF tiveram ROC-AUC 0,9786 e 0,9766, respectivamente. Assim, este run nÃ£o mostra vantagem de K-means sobre esses baselines. O corte q95 reteve FPR True de 0,0347 para K-means; score e alerta indicam desvio do padrÃ£o de treino, nÃ£o falsidade factual.

## Trilha 2 â€” descoberta temÃ¡tica exploratÃ³ria

`texto_trunc` contÃ©m atÃ© 200 palavras. TF-IDF de palavras (uni/bigramas) e caracteres (`char_wb`, 3â€“5) foi ajustado somente no treino e mantido em matriz CSR esparsa. Os labels ficaram fora do ajuste e da seleÃ§Ã£o. O `k` foi escolhido antes de consultar o teste pela maior silhouette cosseno de validaÃ§Ã£o, com desempate pelo menor `k`.

| k candidato | InÃ©rcia de treino | Silhouette cosseno de validaÃ§Ã£o | SeleÃ§Ã£o |
|---:|---:|---:|---|
| 2 | 8.156,71 | 0,0077 |  |
| 4 | 8.101,75 | 0,0068 |  |
| **8** | **8.038,00** | **0,0098** | **Selecionado** |
| 16 | 7.971,10 | 0,0087 |  |

ApÃ³s congelar `k=8`, ARI/NMI e composiÃ§Ã£o Fake/True foram calculados como medidas externas. A trilha temÃ¡tica nÃ£o produz decisÃ£o Fake/True.

| Cluster | Treino | ValidaÃ§Ã£o | Teste | True (teste) | Fake (teste) | Termos de palavra representativos | IDs de treino mais prÃ³ximos do centrÃ³ide |
|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 894 | 309 | 336 | 236 | 100 | `de`, `que`, `do`, `em`, `da` | `true/2053`, `true/3541`, `true/3264` |
| 1 | 80 | 28 | 24 | 24 | 0 | `eldorado`, `para ouvir`, `clique`, `clique aqui`, `comentÃ¡rio` | `true/1525`, `true/1052`, `true/461` |
| 2 | 532 | 181 | 149 | 96 | 53 | `lula`, `ex`, `ex presidente`, `moro`, `juiz` | `true/1015`, `true/3028`, `true/1803` |
| 3 | 505 | 166 | 180 | 115 | 65 | `de`, `da`, `do`, `temer`, `delaÃ§Ã£o` | `true/3056`, `true/1241`, `true/2080` |
| 4 | 421 | 142 | 142 | 91 | 51 | `de`, `temer`, `cÃ¢mara`, `presidente`, `deputados` | `true/1337`, `true/3437`, `true/2592` |
| 5 | 882 | 269 | 286 | 102 | 184 | `de`, `que`, `um`, `do`, `uma` | `fake/1519`, `fake/162`, `fake/3234` |
| 6 | 198 | 68 | 75 | 36 | 39 | `norte`, `coreia`, `do norte`, `eua`, `kim` | `true/827`, `true/822`, `true/1341` |
| 7 | 808 | 277 | 248 | 20 | 228 | `de`, `dilma`, `que`, `do`, `nÃ£o` | `fake/145`, `fake/158`, `fake/2295` |

| PartiÃ§Ã£o | Silhouette cosseno | ARI externo | NMI externo | Tamanhos dos clusters |
|---|---:|---:|---:|---|
| Treino | 0,0083 | 0,0726 | 0,0919 | 894, 80, 532, 505, 421, 882, 198, 808 |
| ValidaÃ§Ã£o | 0,0098 | 0,0764 | 0,0993 | 309, 28, 181, 166, 142, 269, 68, 277 |
| Teste | 0,0097 | 0,0713 | 0,0952 | 336, 24, 149, 180, 142, 286, 75, 248 |

A estabilidade mÃ©dia ARI entre as atribuiÃ§Ãµes do treino com seeds 42, 17 e 123 foi 0,4482 (pares: 0,5293; 0,4272; 0,3881). A silhouette prÃ³xima de zero e os ARI/NMI baixos indicam separaÃ§Ã£o temÃ¡tica fraca nesta representaÃ§Ã£o. Os termos de grupos grandes incluem palavras frequentes e alguns grupos refletem tÃ³picos como Lula/Dilma, Temer ou Coreia do Norte. A composiÃ§Ã£o observada Ã© anÃ¡lise externa; cluster ID nÃ£o Ã© rÃ³tulo de classe.

## Holdout temporal secundÃ¡rio

**Status: executado; quadro separado do split canÃ´nico.** As datas vieram de `DD/MM/YYYY`, `YYYY-MM-DD` e datas textuais em portuguÃªs. A data do grupo Ã© a mais recente entre as notÃ­cias True/Fake alinhadas. Um grupo com data invÃ¡lida foi excluÃ­do; as demais datas cobrem 3.598 grupos entre 2015 e 2018. As fronteiras sÃ£o estritas e nÃ£o dividem grupos: treino atÃ© 2017-12-13, validaÃ§Ã£o de 2017-12-14 a 2018-02-07 e teste de 2018-02-08 a 2018-07-23.

| PartiÃ§Ã£o temporal | NotÃ­cias | Grupos | True (0) | Fake (1) |
|---|---:|---:|---:|---:|
| Treino | 4.304 | 2.151 | 2.152 | 2.152 |
| ValidaÃ§Ã£o | 1.452 | 726 | 726 | 726 |
| Teste | 1.442 | 721 | 721 | 721 |

Os modelos, hiperparÃ¢metros e limiares foram novamente escolhidos/calibrados somente na validaÃ§Ã£o temporal. A tabela mostra os quatro mÃ©todos no mesmo teste temporal congelado.

| MÃ©todo | ConfiguraÃ§Ã£o congelada | Macro-F1 | Balanced accuracy | PrecisÃ£o Fake | Recall Fake | F1 Fake | FPR True | AcurÃ¡cia | ROC-AUC | AP |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| K-means novidade | `k=8`, `n_init=20` | 0,4425 | 0,5423 | 0,7748 | 0,1193 | 0,2067 | 0,0347 | 0,5423 | 0,8577 | 0,7879 |
| Isolation Forest | `n_estimators=300` | 0,8575 | 0,8592 | 0,9609 | 0,7490 | 0,8418 | 0,0305 | 0,8592 | 0,9829 | 0,9741 |
| LOF | `n_neighbors=10` | 0,9186 | 0,9189 | 0,9778 | 0,8571 | 0,9135 | 0,0194 | 0,9189 | 0,9880 | 0,9796 |
| One-Class SVM | `nu=0,10` | 0,4765 | 0,5638 | 0,8485 | 0,1553 | 0,2626 | 0,0277 | 0,5638 | 0,9209 | 0,8693 |

### Descoberta temÃ¡tica temporal

O TF-IDF foi novamente ajustado somente no treino temporal. A validaÃ§Ã£o selecionou `k=8` pela maior silhouette cosseno, com desempate pelo menor `k`.

| k candidato | InÃ©rcia de treino | Silhouette cosseno temporal-validation | SeleÃ§Ã£o |
|---:|---:|---:|---|
| 2 | 8.109,69 | 0,0057 |  |
| 4 | 8.043,71 | 0,0040 |  |
| **8** | **7.973,35** | **0,0074** | **Selecionado** |
| 16 | 7.899,69 | 0,0066 |  |

No teste temporal, silhouette foi 0,0016, ARI 0,1249 e NMI 0,1276; os tamanhos dos clusters foram 372, 19, 86, 740, 76, 12, 53 e 84. A composiÃ§Ã£o Fake/True por cluster foi `0` (333/39), `1` (4/15), `2` (18/68), `3` (269/471), `4` (36/40), `5` (0/12), `6` (31/22) e `7` (30/54). Esses nÃºmeros sÃ£o anÃ¡lise externa de clusters e nÃ£o uma previsÃ£o de classe.

## Auditoria de holdout por fonte

**Status: nÃ£o executado.** HÃ¡ 29 domÃ­nios (24 em True e 5 em Fake, sem domÃ­nio compartilhado); alÃ©m disso, o grafo de domÃ­nios unidos pelos pares alinhados tem um Ãºnico componente. Um holdout estrito por fonte nÃ£o deixaria fontes disjuntas entre treino/teste sem separar pares ou esvaziar uma partiÃ§Ã£o.

## Artefatos, origem das mÃ©tricas e limitaÃ§Ãµes

Run e arquivos sem texto bruto:

- [Notebook executado](../../anomaly-detection-kmeans.ipynb) â€” contÃ©m as duas trilhas e os outputs desta execuÃ§Ã£o.
- [`metrics.csv`](../../../outputs/model-comparison/kmeans-canonical-20260924T003936Z/metrics.csv) â€” seleÃ§Ã£o de validaÃ§Ã£o, teste congelado, tamanhos/composiÃ§Ã£o e mÃ©tricas internas/externas dos dois protocolos.
- [`predictions.csv`](../../../outputs/model-comparison/kmeans-canonical-20260924T003936Z/predictions.csv) â€” IDs, grupo, protocolo, partiÃ§Ã£o, label para avaliaÃ§Ã£o, cluster, score, limiar e decisÃ£o aplicÃ¡vel.
- [`topic_cluster_profiles.csv`](../../../outputs/model-comparison/kmeans-canonical-20260924T003936Z/topic_cluster_profiles.csv) â€” termos e IDs prÃ³ximos dos centroides do split canÃ´nico, sem textos.
- [`run_manifest.json`](../../../outputs/model-comparison/kmeans-canonical-20260924T003936Z/run_manifest.json) â€” hash, revisÃ£o, IDs, ambiente, features, parÃ¢metros, seleÃ§Ã£o e limiares.

Os nÃºmeros deste documento vÃªm desses arquivos. Os nÃºmeros de IF/LOF/One-Class SVM registrados antes em outros notebooks usam outro split e permanecem resultados histÃ³ricos incompatÃ­veis; nÃ£o entram na tabela canÃ´nica.

LimitaÃ§Ãµes: a seleÃ§Ã£o de `k` da trilha de novidade Ã© assistida pelos labels de validaÃ§Ã£o; o limiar usa somente True-validation; o teste Ã© um Ãºnico holdout aleatÃ³rio por grupo; fonte e label estÃ£o confundidos no corpus. K-means atribui cada notÃ­cia a algum centrÃ³ide e favorece partiÃ§Ãµes convexas; distÃ¢ncia de estilo Ã© sinal de desvio e nÃ£o valida veracidade. A descoberta temÃ¡tica usa distÃ¢ncia euclidiana em TF-IDF esparso de alta dimensÃ£o, e seus grupos nÃ£o sÃ£o categorias semÃ¢nticas validadas.


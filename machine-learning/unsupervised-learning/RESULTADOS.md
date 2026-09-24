# Comparação dos experimentos


## Comparativo principal — mesmo split canônico

| Modelo | Macro-F1 | Balanced accuracy | Precisão Fake | Recall Fake | F1 Fake | FPR True | Acurácia | ROC-AUC | AP |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| K-means novidade (`k=8`) | 0,4352 | 0,5382 | 0,7619 | 0,1111 | 0,1939 | 0,0347 | 0,5382 | 0,8471 | 0,7751 |
| Isolation Forest (`n_estimators=300`) | 0,9729 | 0,9729 | 0,9620 | 0,9847 | 0,9732 | 0,0389 | 0,9729 | 0,9786 | 0,9750 |
| LOF (`n_neighbors=10`) | 0,9479 | 0,9479 | 0,9601 | 0,9347 | 0,9472 | 0,0389 | 0,9479 | 0,9766 | 0,9659 |
| One-Class SVM (`nu=0,10`) | 0,4685 | 0,5563 | 0,8000 | 0,1500 | 0,2526 | 0,0375 | 0,5563 | 0,8738 | 0,8266 |
| DBSCAN novidade (`min_samples=5`, `eps=0,5734`) | 0,9667 | 0,9667 | 0,9504 | 0,9847 | 0,9673 | 0,0514 | 0,9667 | 0,9598 | 0,9186 |

Fonte: resultados K-means em [`kmeans-canonical-20260924T003936Z`](../outputs/model-comparison/kmeans-canonical-20260924T003936Z/metrics.csv) e DBSCAN em [`dbscan-20260924T141332Z`](../outputs/model-comparison/dbscan-20260924T141332Z/metrics.csv). DBSCAN, K-means, Isolation Forest, LOF e One-Class SVM foram reexecutados na partição canônica recuperada, com 720 True e 720 Fake no teste; todos usam q95 de True-validation para a decisão. A descoberta temática está em quadro separado e não é classificação. DBSCAN teve macro-F1/balanced accuracy maiores que LOF e ROC-AUC/AP menores que Isolation Forest e LOF; marcou 53,1% do teste como ruído e atribuiu somente 46,9%. Esses resultados não demonstram melhora geral sobre um baseline. Resultados históricos com IDs incompatíveis não entram neste ranking.

Este relatório preserva os resultados históricos registrados nos notebooks e acrescenta as execuções canônicas de K-means e DBSCAN. O quadro histórico e os quadros novos usam splits diferentes; somente métodos reexecutados nos mesmos IDs podem ser comparados diretamente. O manifesto/outputs históricos de K-means referenciados no plano não estavam no workspace. O split foi recuperado da lógica salva no notebook, as contagens publicadas coincidiram e a impressão digital do K-means temático no treino (tamanhos, ARI e NMI) reproduziu os valores publicados. O manifesto DBSCAN guarda todos os IDs e grupos, mas não foi possível fazer comparação byte a byte com o manifesto histórico ausente.

## Diferença entre os métodos

| Método | Como encontra padrões | Estado |
|---|---|---|
| Isolation Forest | Isola observações atípicas por partições aleatórias; o treino deste experimento usa somente notícias True. | Atual; resultado q95 disponível como controle no notebook LOF. |
| LOF | Compara a densidade local de cada texto com a densidade de seus vizinhos. | Atual; execução registrada no próprio notebook. |
| One-Class SVM | Aprende uma fronteira RBF ao redor do padrão das notícias True. | Atual; resultado q95 disponível como controle no notebook LOF. |
| PU Learning | Usa Fake conhecidos como positivos e seleciona negativos confiáveis de U para treinar uma Random Forest. | Resultado histórico em split diferente; também reexecutado na partição canônica para comparação adicional. |
| DBSCAN | Agrupa por densidade; na trilha de novidade atribui registros novos a core points e mantém ruído separado do alerta q95. | Executado no split canônico e holdout temporal; descoberta temática exploratória reportada separadamente. |
| HDBSCAN | Forma grupos por densidade em níveis e comporta densidades variadas. | Próximo teste; plano pronto, sem execução. |
| K-means | Trilha de novidade por distância ao centróide e trilha separada de descoberta temática. | Executado no split canônico; métricas e limites abaixo. |

## Detectores de anomalia — resultados históricos em split incompatível

Os três detectores foram avaliados no mesmo teste histórico dentro do notebook LOF: 720 notícias True e 1.800 Fake. A prevalência Fake nesse recorte é **71,43%**, portanto ela é também a referência aproximada de AP para uma ordenação aleatória. Os resultados abaixo usam o corte q95 calibrado com notícias True de validação. Eles são preservados como histórico e **não** entram no ranking canônico de K-means, porque usam outros IDs e uma partição por notícia.

| Modelo | ROC-AUC | AP | Acurácia | Precisão Fake | Recall Fake | F1 Fake | FPR True | Origem do resultado |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Isolation Forest | 0,980673 | 0,988672 | 0,979365 | 0,988268 | 0,982778 | 0,985515 | 0,029167 | Controle q95 registrado no notebook LOF |
| LOF (`n_neighbors=80`) | 0,987400 | 0,993869 | 0,977381 | 0,985515 | 0,982778 | 0,984145 | 0,036111 | Resultado do notebook LOF; candidato escolhido na validação |
| One-Class SVM (`nu=0,10`) | 0,976384 | 0,985442 | 0,931746 | 0,983948 | 0,919444 | 0,950603 | 0,037500 | Controle q95 registrado no notebook LOF |

O relatório do notebook LOF também guarda os cortes nativos dos detectores. Para LOF, o corte nativo teve acurácia 0,976984, recall Fake 0,983333 e FPR 0,038889; para Isolation Forest, 0,948810, 0,986111 e 0,144444; para One-Class SVM, 0,962302, 0,986111 e 0,097222. Cortes diferentes mudam o equilíbrio entre Fake recuperadas e True sinalizadas.

**Origem e ressalvas:** o LOF selecionado (`n_neighbors=80`) foi escolhido com ROC-AUC e AP de Fake na validação, então a seleção é assistida por rótulos. Os resultados de Isolation Forest e One-Class SVM acima são controles reportados na execução do notebook LOF, não saídas dos notebooks individuais. O conjunto de teste já foi consultado durante o trabalho, o split é por notícia e não por tema/fonte/data, e as métricas não demonstram validade factual nem superioridade estatística. Trate estes números como resultados exploratórios, não como benchmark independente.

### Configurações e validação LOF

O LOF testou `n_neighbors` 10, 20, 40 e 80. O candidato 80 foi congelado antes da avaliação final: ROC-AUC de validação **0,974691**, AP **0,981207**. Todos os detectores aprendem com 2.160 notícias True; a seleção usa validação, e o teste reúne 720 True e 1.800 Fake. O detalhe de cada abordagem está em [Isolation Forest](docs/modelos/isolation-forest.md), [LOF](docs/modelos/local-outlier-factor.md) e [One-Class SVM](docs/modelos/one-class-svm.md).

## PU Learning

PU usa outro conjunto preparado e outro teste balanceado (720 notícias reais e 720 falsas). Portanto, seus números **não são diretamente comparáveis** aos detectores acima.

| Métrica | Resultado |
|---|---:|
| Acurácia | 0,7347 |
| ROC-AUC | 0,9547 |
| Precisão / recall / F1 — Real | 0,9856 / 0,4764 / 0,6423 |
| Precisão / recall / F1 — Fake | 0,6548 / 0,9931 / 0,7892 |

Com limiar 0,5, a matriz de confusão (linhas: rótulo real; colunas: previsão) é:

|  | Previsto Real | Previsto Fake |
|---|---:|---:|
| Real | 343 | 377 |
| Fake | 5 | 715 |

O recall Fake alto vem junto de **377 notícias reais sinalizadas como Fake**. Além disso, a simulação monta U apenas com notícias reais selecionadas pelos rótulos originais; um cenário PU de produção pode conter positivos e negativos em U. Consulte a [documentação PU](docs/modelos/pu-learning.md) e o [notebook](05_PU_Learning.ipynb) para o protocolo completo.

## K-means — detecção de novidade no split canônico

**Status: executado.** Run `kmeans-canonical-20260924T003936Z`, corpus Fake.br revisão `780f5516c4ae070761632d98ac3368f3ded09d35`, SHA-256 `be91c188f621424017bd79a0f33528dcc27f8a6151adb2bcb899c17719eb4090`. As partições foram agrupadas por pares alinhados e deduplicatas: treino 4.320 (2.160 True, 2.160 Fake), validação 1.440 (720/720), teste congelado 1.440 (720/720). Nenhum `record_id` ou `group_id` cruza partições.

K-means treina apenas em True do treino. IF, LOF e One-Class SVM foram reexecutados com os mesmos IDs e a mesma partição. Features: seis medidas de estilo dos primeiros 300 caracteres; imputação e escala ajustadas em True-train; autoria mantida binária sem escala. Todos os limiares são q95 de True-validation. O candidato foi escolhido na validação por ROC-AUC, depois AP e, no empate, menor parâmetro.

| Método | Configuração congelada | Macro-F1 | Balanced accuracy | Precisão Fake | Recall Fake | F1 Fake | FPR True | Acurácia | ROC-AUC | AP |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| K-means novidade | `k=8`, `n_init=20` | 0,4352 | 0,5382 | 0,7619 | 0,1111 | 0,1939 | 0,0347 | 0,5382 | 0,8471 | 0,7751 |
| Isolation Forest | `n_estimators=300` | 0,9729 | 0,9729 | 0,9620 | 0,9847 | 0,9732 | 0,0389 | 0,9729 | 0,9786 | 0,9750 |
| LOF | `n_neighbors=10` | 0,9479 | 0,9479 | 0,9601 | 0,9347 | 0,9472 | 0,0389 | 0,9479 | 0,9766 | 0,9659 |
| One-Class SVM | `nu=0,10` | 0,4685 | 0,5563 | 0,8000 | 0,1500 | 0,2526 | 0,0375 | 0,5563 | 0,8738 | 0,8266 |

Origem: [`metrics.csv`](../outputs/model-comparison/kmeans-canonical-20260924T003936Z/metrics.csv) do run; os detalhes de candidatos e limiares ficam também no [manifesto](../outputs/model-comparison/kmeans-canonical-20260924T003936Z/run_manifest.json). Neste split compartilhado, IF e LOF tiveram ROC-AUC maior que K-means. O score mede desvio de estilo, não probabilidade de falsidade nem validação factual.

## DBSCAN — detecção de novidade no split canônico

**Status: executado.** O run [`dbscan-20260924T141332Z`](../outputs/model-comparison/dbscan-20260924T141332Z/run_manifest.json) reexecutou DBSCAN, K-means, Isolation Forest, LOF, One-Class SVM e os baselines PU/supervisionados nos mesmos IDs canônicos. O manifesto K-means citado no pedido não estava no workspace; a partição foi recuperada pelo código salvo no notebook e conferida pelas contagens e pela impressão digital do K-means temático no treino (clusters, ARI e NMI iguais aos valores publicados). O manifesto DBSCAN registra todos os IDs/grupos e essa limitação de comparação direta.

As seis features de estilo foram recalculadas nos primeiros 300 caracteres. Imputação mediana e StandardScaler foram ajustados apenas em True-train; autoria permaneceu binária e sem escala. Para cada `min_samples` em 5/10/20/40, a grade `eps` veio de uma amostra fixa de 2.048 True-train (seed 42). Como o cotovelo determinístico não foi estável, foram usados os quantis predefinidos 0,80/0,90/0,95/0,975. Antes da validação, foram descartados ajustes sem core points, com menos de dois grupos não ruído ou com pelo menos 95% de ruído.

| Partição | Configuração congelada | q95 True-validation | Macro-F1 | Balanced accuracy | Precisão Fake | Recall Fake | F1 Fake | FPR True | Acurácia | ROC-AUC | AP | Ruído / cobertura |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Teste canônico | `min_samples=5`, `eps=0,5734` | 1,6370 | 0,9667 | 0,9667 | 0,9504 | 0,9847 | 0,9673 | 0,0514 | 0,9667 | 0,9598 | 0,9186 | 0,5313 / 0,4688 |

A seleção congelada na validação teve ROC-AUC 0,9603 e AP 0,9092. Em teste, o alerta q95 e o estado de ruído foram guardados separadamente: 51,8% receberam alerta pelo corte, 53,1% ficaram sem atribuição e as duas condições diferiram em 1,3% dos registros. Um registro ruído não é rotulado como Fake por esse status; o score contínuo é a distância ao core mais próximo dividida por `eps`.

### Baselines adicionais no mesmo teste canônico

| Família | Modelo | Macro-F1 | Balanced accuracy | Precisão Fake | Recall Fake | F1 Fake | FPR True | Acurácia | ROC-AUC | AP | Regra de decisão |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Supervisionado | Logistic Regression (`word+char`) | 0,9493 | 0,9493 | 0,9615 | 0,9361 | 0,9486 | 0,0375 | 0,9493 | 0,9895 | 0,9906 | `predict_proba >= 0,5` |
| Supervisionado | LinearSVC (`word+char+meta`) | 0,9667 | 0,9667 | 0,9786 | 0,9542 | 0,9662 | 0,0208 | 0,9667 | 0,9941 | 0,9949 | predição do modelo; score `decision_function` |
| Supervisionado | Random Forest (`word+char`) | 0,9104 | 0,9104 | 0,9191 | 0,9000 | 0,9095 | 0,0792 | 0,9104 | 0,9722 | 0,9754 | `predict_proba >= 0,5` |
| PU | Spy RF | 0,7183 | 0,7368 | 0,6566 | 0,9931 | 0,7905 | 0,5194 | 0,7368 | 0,9433 | 0,9493 | `predict_proba >= 0,5` |

PU usou Fake de treino como P e True de treino como U, selecionou 631 negativos confiáveis e preservou `0=True`, `1=Fake`. O LinearSVC reproduziu `max_iter=2000`, mas emitiu aviso de não convergência; seu resultado é aproximado e essa limitação está registrada no manifesto e nas métricas. As famílias supervisionada e PU têm regras de decisão próprias, por isso ficam fora do corte q95 dos detectores one-class.

### Holdout temporal secundário — detectores

Esta avaliação usa protocolo próprio e fica separada do quadro canônico. A data do grupo é a mais recente entre os membros True/Fake alinhados. Após parsing de datas numéricas e textuais em português, 3.598 grupos ficaram elegíveis; um grupo com data inválida foi excluído. Treino: 4.304 registros (2.152 por classe), validação: 1.452 (726/726), teste temporal: 1.442 (721/721). As fronteiras estritas foram 2017-12-13/14 e 2018-02-07/08; nenhum grupo cruza partições.

| Método | Configuração congelada | Macro-F1 | Balanced accuracy | Precisão Fake | Recall Fake | F1 Fake | FPR True | Acurácia | ROC-AUC | AP |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| K-means novidade | `k=8`, `n_init=20` | 0,4425 | 0,5423 | 0,7748 | 0,1193 | 0,2067 | 0,0347 | 0,5423 | 0,8577 | 0,7879 |
| Isolation Forest | `n_estimators=300` | 0,8575 | 0,8592 | 0,9609 | 0,7490 | 0,8418 | 0,0305 | 0,8592 | 0,9829 | 0,9741 |
| LOF | `n_neighbors=10` | 0,9186 | 0,9189 | 0,9778 | 0,8571 | 0,9135 | 0,0194 | 0,9189 | 0,9880 | 0,9796 |
| One-Class SVM | `nu=0,10` | 0,4765 | 0,5638 | 0,8485 | 0,1553 | 0,2626 | 0,0277 | 0,5638 | 0,9209 | 0,8693 |
| DBSCAN novidade | `min_samples=5`, `eps=0,7792` | 0,8107 | 0,8155 | 0,9633 | 0,6560 | 0,7805 | 0,0250 | 0,8155 | 0,9772 | 0,9431 |

Os cinco detectores foram reexecutados nos mesmos IDs temporais. DBSCAN teve cobertura 0,4799 e ruído 0,5201. Estes valores não substituem nem são combinados com o ranking canônico; PU e modelos supervisionados não foram executados neste protocolo secundário.

## K-means — descoberta temática exploratória

**Status: executado; trilha sem classificação.** O TF-IDF de palavras/caracteres foi ajustado somente em `texto_trunc` do treino e permaneceu esparso. O `k=8` foi escolhido pela silhouette cosseno de validação (0,0098); labels ficaram fora do ajuste e da seleção. Após congelar o modelo, foram calculados ARI/NMI e composição externa.

| Partição | k | Tamanhos dos clusters | Silhouette cosseno | ARI externo | NMI externo |
|---|---:|---|---:|---:|---:|
| Treino | 8 | 894, 80, 532, 505, 421, 882, 198, 808 | 0,0083 | 0,0726 | 0,0919 |
| Validação | 8 | 309, 28, 181, 166, 142, 269, 68, 277 | 0,0098 | 0,0764 | 0,0993 |
| Teste | 8 | 336, 24, 149, 180, 142, 286, 75, 248 | 0,0097 | 0,0713 | 0,0952 |

A estabilidade média entre seeds 42, 17 e 123 foi ARI 0,4482 no treino. No teste, a composição por cluster foi: `0` (236 True, 100 Fake), `1` (24 True, 0 Fake), `2` (96, 53), `3` (115, 65), `4` (91, 51), `5` (102, 184), `6` (36, 39), `7` (20, 228). A composição é análise externa; o número do cluster não representa classe. Silhouette baixa e ARI/NMI modestos mostram separação temática fraca para essa representação.

Os termos representativos, IDs mais próximos dos centroides e todos os tamanhos/composições estão em [`topic_cluster_profiles.csv`](../outputs/model-comparison/kmeans-canonical-20260924T003936Z/topic_cluster_profiles.csv) e `metrics.csv`. O teste temático não recebe F1, acurácia ou decisão Fake/True.

### Holdout temporal secundário — descoberta temática

| Partição | k | Tamanhos dos clusters | Silhouette cosseno | ARI externo | NMI externo |
|---|---:|---|---:|---:|---:|
| Treino temporal | 8 | 828, 330, 506, 1.477, 426, 90, 246, 401 | 0,0090 | 0,0680 | 0,0975 |
| Validação temporal | 8 | 316, 46, 118, 657, 63, 31, 36, 185 | 0,0074 | 0,0716 | 0,0943 |
| Teste temporal | 8 | 372, 19, 86, 740, 76, 12, 53, 84 | 0,0016 | 0,1249 | 0,1276 |

No teste temporal, as contagens True/Fake por cluster foram: `0` (39/333), `1` (15/4), `2` (68/18), `3` (471/269), `4` (40/36), `5` (12/0), `6` (22/31), `7` (54/30). A validação selecionou `k=8` com silhouette 0,0074; labels não participaram da escolha. O output permanece exploratório e sem decisão de classe.

## DBSCAN — descoberta temática exploratória

**Status: executado; sem decisão Fake/True.** A mesma representação K-means foi ajustada somente no treino (`texto_trunc`, TF-IDF word `(1,2)` e char_wb `(3,5)`, matriz CSR). A grade de `eps` veio de k-distance sem labels; `min_samples` variou entre 5/10/20/40. A seleção usou maior silhouette cosseno nos registros atribuídos à validação; labels externos entraram depois do congelamento, para ARI/NMI e composição. Nenhuma matriz TF-IDF densa ou matriz de distâncias completa foi criada.

| Protocolo / método | Configuração congelada | Grupos não ruído | Tamanhos dos grupos não ruído (ordem decrescente) | Ruído | Silhouette cosseno | ARI externo | NMI externo | Estabilidade média |
|---|---|---:|---|---:|---:|---:|---:|---:|
| Canônico — DBSCAN | `min_samples=5`, `eps=0,7718` | 39 | 588, 112, 58, 20, 13, 13, 11, 10, 9, 9, 9, 8, 8, 8, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4 | 3.308 (76,57%) | 0,0342* | 0,0353 | 0,0592 | ARI 0,4709** |
| Temporal — DBSCAN | `min_samples=5`, `eps=0,7283` | 41 | 262, 41, 38, 30, 23, 20, 20, 19, 18, 16, 14, 13, 12, 10, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5 | 3.614 (83,97%) | 0,0771* | 0,0240 | 0,0725 | ARI 0,3867** |
| Canônico — K-means | `k=8`, `n_init=10` | 8 | 894, 882, 808, 532, 505, 421, 198, 80 | 0 | 0,0090 | 0,0726 | 0,0919 | ARI entre seeds 0,4482*** |
| Temporal — K-means | `k=8`, `n_init=10` | 8 | 1.477, 828, 506, 426, 401, 330, 246, 90 | 0 | 0,0106 | 0,0680 | 0,0975 | ARI entre seeds 0,6001*** |

* A silhouette do DBSCAN é calculada apenas nos registros atribuídos (canônico `n=1.012`, temporal `n=690`); a silhouette K-means usa todos os registros. Não são diretamente comparáveis por causa dessa diferença de cobertura. ** A estabilidade DBSCAN é o ARI médio entre configurações candidatas no mesmo treino. *** A estabilidade K-means é ARI médio pareado entre seeds 42, 17 e 123. Os valores de estabilidade também usam variações diferentes.

No split canônico, o DBSCAN temático agrupou menos de um quarto do treino e obteve ARI/NMI abaixo do K-means; a silhouette positiva descreve somente a fração selecionada sem ruído. No holdout temporal, a fração não atribuída subiu para 84%. Os tamanhos completos, termos, IDs representativos, composição externa por grupo, todas as candidatas, custo e perfis estão em [`metrics.csv`](../outputs/model-comparison/dbscan-20260924T141332Z/metrics.csv) e [`cluster_profiles.csv`](../outputs/model-comparison/dbscan-20260924T141332Z/cluster_profiles.csv). O teste temático permanece análise externa de grupos, não previsão de notícias novas.

### Auditoria de holdout por fonte

O holdout por fonte estrito não foi executado: os 29 domínios (24 True, 5 Fake) não se sobrepõem entre classes e o grafo de domínios conectados pelos pares alinhados tem um único componente. Para manter `group_id` intacto, seria necessário separar esse componente inteiro; o holdout temporal é a avaliação secundária disponível.

## Status dos próximos testes

| Método | Status | Plano |
|---|---|---|
| DBSCAN | Executado; novidade e descoberta temática em split canônico e holdout temporal | [Plano](../docs/dbscan.md) · [resultado](docs/modelos/dbscan.md) |
| HDBSCAN | A implementar; sem resultado | [Plano](../docs/hdbscan.md) |
| K-means — novidade | Executado; split canônico e holdout temporal secundário | [Plano](../docs/kmeans.md) · [resultado](docs/modelos/kmeans.md) |
| K-means — descoberta temática | Executado; exploratório, sem classificação; split canônico e temporal | [Plano](../docs/kmeans.md) · [resultado](docs/modelos/kmeans.md) |

HDBSCAN permanece pendente. Para incorporá-lo ao comparativo principal, execute-o conforme o [protocolo comum](../docs/comparison-protocol.md), registre os resultados por ID e mantenha a mesma partição de teste. Não misture métricas de splits históricos diferentes.

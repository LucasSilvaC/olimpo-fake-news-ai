# DBSCAN

**Status: executado.** Notebook: [anomaly-detection-dbscan.ipynb](../../anomaly-detection-dbscan.ipynb). Implementação reproduzível: [dbscan_experiment.py](../../dbscan_experiment.py). Run: [`dbscan-20260924T141332Z`](../../../outputs/model-comparison/dbscan-20260924T141332Z/run_manifest.json).

O experimento mantém duas trilhas separadas: novidade por estilo, com score e limiar q95 para registros novos; e descoberta temática transdutiva, sem classificação Fake/True.

## Dados, IDs e partições

| Item | Registro |
|---|---|
| Corpus | Fake.br, revisão `780f5516c4ae070761632d98ac3368f3ded09d35` |
| URL | `https://codeload.github.com/roneysco/Fake.br-Corpus/zip/780f5516c4ae070761632d98ac3368f3ded09d35` |
| SHA-256 do ZIP | `be91c188f621424017bd79a0f33528dcc27f8a6151adb2bcb899c17719eb4090` |
| Registros e labels | 7.200 notícias; `0=True`, `1=Fake` |
| Identidade | `record_id` = pasta/classe + nome de arquivo; `group_id` une pares de mesmo nome e duplicatas textuais normalizadas |

O manifesto `kmeans-canonical-20260924T003936Z/run_manifest.json` solicitado não estava presente no workspace. O split canônico foi reconstruído com o algoritmo e os grupos salvos no notebook K-means: `StratifiedGroupKFold`, 5 folds, `shuffle=True`, seed 42; fold 0 para teste, fold 1 para validação e os grupos restantes para treino. As contagens publicadas coincidiram. Como verificação adicional, o K-means temático reexecutado no treino produziu exatamente os tamanhos publicados `894, 80, 532, 505, 421, 882, 198, 808`, ARI `0,072576` e NMI `0,091911`. Isso confirma a impressão digital dos IDs de treino, embora não tenha sido possível comparar byte a byte com o manifesto histórico ausente. A lista completa de IDs e grupos recuperados está no manifesto DBSCAN. O run supersedido `kmeans-canonical-20260924T001243Z` não foi usado.

| Protocolo | Treino | Validação | Teste | Integridade |
|---|---:|---:|---:|---|
| Canônico por grupos | 4.320 (2.160/2.160), 2.159 grupos | 1.440 (720/720), 720 grupos | 1.440 (720/720), 720 grupos | nenhum `record_id` ou `group_id` cruza partições |
| Holdout temporal secundário | 4.304 (2.152/2.152), 2.151 grupos | 1.452 (726/726), 726 grupos | 1.442 (721/721), 721 grupos | grupos com datas inválidas excluídos; sem sobreposição |

O holdout temporal usa a data mais recente de cada grupo e fronteiras cronológicas estritas; foi mantido em tabelas separadas. O holdout estrito por fonte não foi executado, conforme a auditoria existente: o grafo de domínios alinhados tem um componente e as fontes estão separadas por classe.

## Trilha 1 — detecção de novidade por estilo

As features foram recalculadas nos primeiros 300 caracteres: presença binária de autor, TTR, URLs/palavras, pontuação/tokens, palavras maiúsculas/palavras e tipos/palavras. Imputação mediana e `StandardScaler` foram ajustados somente em True-train. A autoria permaneceu em 0/1 e sem escala.

Para `min_samples` `{5, 10, 20, 40}`, o código calculou distâncias ao k-ésimo vizinho em uma amostra fixa de até 2.048 True-train, seed 42, contra o treino completo. O cotovelo é o ponto de maior desvio vertical normalizado da corda entre os extremos; foi considerado instável com força abaixo de 0,02 ou no extremo. Como as curvas desta execução não passaram esse critério, a grade congelada antes de consultar labels de validação usou os quantis predefinidos `0,80`, `0,90`, `0,95` e `0,975` das distâncias. Os parâmetros e curvas de cada split estão no manifesto.

Antes da validação, foram descartadas configurações sem core points, com menos de dois grupos úteis ou com 95% ou mais do treino como ruído. A seleção usou ROC-AUC de validação, depois AP e, em empate, menor número de core points, `min_samples` e `eps`. O limiar de cada modelo é o quantil 95 das pontuações das notícias True de validação.

Para cada notícia nova, calcula-se a distância euclidiana ao core point mais próximo. Se a distância for até `eps`, a notícia recebe o cluster desse core; fora do raio, recebe `cluster_id=-1` e status não atribuído/ruído. Empate exato é resolvido pelo menor `cluster_id` e depois pela ordem do core no treino. O score é `distância mínima / eps`; valores maiores indicam maior desvio. O alerta q95 e o ruído são campos independentes: um não implica o outro nem prova falsidade.

### Teste congelado

| Protocolo | Configuração | q95 | Macro-F1 | Balanced accuracy | Precisão Fake | Recall Fake | F1 Fake | FPR True | Acurácia | ROC-AUC | AP | Ruído | Cobertura atribuída |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Canônico | `min_samples=5`, `eps=0,573383` | 1,637035 | 0,966656 | 0,966667 | 0,950402 | 0,984722 | 0,967258 | 0,051389 | 0,966667 | 0,959756 | 0,918641 | 0,531250 | 0,468750 |
| Temporal | `min_samples=5`, `eps=0,779152` | 1,287375 | 0,810719 | 0,815534 | 0,963340 | 0,656033 | 0,780528 | 0,024965 | 0,815534 | 0,977150 | 0,943083 | 0,520111 | 0,479889 |

No teste canônico, 51,81% dos registros passaram o corte q95 e 53,13% ficaram sem atribuição; os estados diferiram em 1,32% dos registros. No teste temporal, os valores foram 34,05% e 52,01%, respectivamente, com diferença em 17,96% dos registros. `noise=True` é somente falha de atribuição por densidade; a decisão de alerta vem do limiar separado.

### Baselines no mesmo split canônico

K-means novidade, Isolation Forest, LOF e One-Class SVM foram ajustados novamente nos mesmos IDs, com parâmetros do protocolo atual e limiar q95. Os resultados aparecem juntos em [`metrics.csv`](../../../outputs/model-comparison/dbscan-20260924T141332Z/metrics.csv). Isolation Forest e LOF tiveram ROC-AUC/AP maiores que DBSCAN (`0,9786/0,9750` e `0,9766/0,9659`); o DBSCAN teve macro-F1/balanced accuracy maiores que LOF, mas também FPR maior (`0,0514` contra `0,0389`) e cobertura abaixo da metade. O resultado não indica superioridade geral.

Também foram reexecutados Logistic Regression (`word+char`), LinearSVC (`word+char+meta`), Random Forest (`word+char`) e PU Learning nos mesmos IDs canônicos. Logistic Regression, LinearSVC e Random Forest usaram as configurações dos notebooks atuais; PU usou Fake-train como positivos conhecidos, True-train como U, seleção spy com fração 0,15, 200 estimadores temporários, 300 finais e corte 0,5. PU selecionou 631 negativos confiáveis. Esses métodos têm hipóteses/regras de decisão distintas e são apresentados em quadro próprio em [`RESULTADOS.md`](../../RESULTADOS.md). LinearSVC emitiu `ConvergenceWarning` com `max_iter=2000`; seu score/métricas são aproximados, conforme registrado no manifesto e na coluna `fit_warnings`.

## Trilha 2 — descoberta temática exploratória

O ajuste é transdutivo no treino, sem labels. Para comparar diretamente com K-means, o vocabulário foi ajustado apenas em `texto_trunc` do treino, usando TF-IDF de palavras (1–2 gramas) e caracteres `char_wb` (3–5), matriz CSR `float32`. O DBSCAN de texto usou distância cosseno, grafo de raio esparso e teto de 3.000.000 arestas. Não foi necessária conversão densa: o grafo mediu 83.078 arestas/681.908 bytes no canônico e 102.146 arestas/834.388 bytes no holdout temporal.

A grade da trilha temática foi escolhida sem labels. `min_samples` variou em `{5, 10, 20, 40}`; os candidatos `eps` vêm da curva k-distance e dos quantis predefinidos após o critério determinístico de cotovelo. A configuração é escolhida pela maior silhouette cosseno entre registros não ruído na validação; empates favorecem maior cobertura, menos grupos, `min_samples` e `eps` menores. Só depois desse congelamento os labels são usados em ARI/NMI e composição externa. K-means foi reexecutado na mesma matriz esparsa e IDs de treino; `k` foi escolhido por silhouette não supervisionada de validação. Estabilidade DBSCAN mede ARI médio entre configurações; para K-means, mede ARI entre seeds 42/17/123.

| Split / método | Ajuste escolhido | Grupos | Ruído | Silhouette cosseno | ARI externo | NMI externo | Estabilidade média no treino |
|---|---|---:|---:|---:|---:|---:|---:|
| Canônico — DBSCAN | `min_samples=5`, `eps=0,771819` | 39 | 76,57% | 0,034249* | 0,035316 | 0,059215 | ARI 0,470888 entre configurações |
| Canônico — K-means | `k=8`, `n_init=10` | 8 | 0% | 0,009047 | 0,072576 | 0,091911 | ARI 0,448196 entre seeds |
| Temporal — DBSCAN | `min_samples=5`, `eps=0,728347` | 41 | 83,97% | 0,077079* | 0,024034 | 0,072506 | ARI 0,386739 entre configurações |
| Temporal — K-means | `k=8`, `n_init=10` | 8 | 0% | 0,010587 | 0,067975 | 0,097506 | ARI 0,600122 entre seeds |

* Silhouette DBSCAN considera somente registros atribuídos (`n=1.012` canônico; `n=690` temporal); K-means inclui todos os registros. Compare com essa ressalva. Os tamanhos dos grupos DBSCAN, em ordem decrescente, foram canônico `588, 112, 58, 20, 13, 13, 11, 10, 9, 9, 9, 8, 8, 8, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4`; temporal `262, 41, 38, 30, 23, 20, 20, 19, 18, 16, 14, 13, 12, 10, 8, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5`. O arquivo [`cluster_profiles.csv`](../../../outputs/model-comparison/dbscan-20260924T141332Z/cluster_profiles.csv) registra termos e IDs representativos sem textos brutos.

O DBSCAN formou muitos grupos pequenos e deixou a maior parte dos itens em ruído; ARI/NMI ficaram abaixo do K-means nos dois splits. A silhouette maior da porção atribuída não anula a baixa cobertura. A seleção de grupo não produz classe nem previsão de notícia nova.

## Artefatos e custo

- [`metrics.csv`](../../../outputs/model-comparison/dbscan-20260924T141332Z/metrics.csv) — candidatas de validação, limiares, decisões congeladas, testes, tamanhos, ruído, cobertura, métricas internas/externas e tempo de ajuste.
- [`predictions.csv`](../../../outputs/model-comparison/dbscan-20260924T141332Z/predictions.csv) — `record_id`, `group_id`, split, label somente para avaliação, cluster, score, ruído, status, q95 e decisão. Não contém texto bruto.
- [`cluster_profiles.csv`](../../../outputs/model-comparison/dbscan-20260924T141332Z/cluster_profiles.csv) — termos e IDs representativos sem textos.
- [`run_manifest.json`](../../../outputs/model-comparison/dbscan-20260924T141332Z/run_manifest.json) — hash, revisão, listas de IDs/grupos, versões, regras, curvas, parâmetros, seleção, custo e avisos.

O run completo levou 608,88 s (aprox. 10 min) e registrou pico de RSS do processo Python de 1.484,19 MiB; a memória de processos workers filhos não foi agregada. No tema canônico, TF-IDF levou 6,55 s, a grade/grafo DBSCAN 23,72 s e o grafo foi CSR esparso. Na trilha temporal, TF-IDF levou 8,40 s e a grade/grafo DBSCAN 22,33 s. O maior custo total veio também da comparação K-means com quatro valores de `k`; os tempos por candidato estão no manifesto.

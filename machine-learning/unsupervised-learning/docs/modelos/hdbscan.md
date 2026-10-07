# HDBSCAN — descoberta exploratória

**Status: executado na trilha exploratória; sem decisão Fake/True.** O notebook [`hdbscan.ipynb`](../../history/agrupamento/hdbscan.ipynb) executa o run [`hdbscan-20260924T150053Z`](../../../outputs/model-comparison/hdbscan-20260924T150053Z/run_manifest.json). O plano original em [`docs/machine-learning/comparacao-modelos/hdbscan.md`](../../../../docs/machine-learning/comparacao-modelos/hdbscan.md) foi preservado.

## API e trilha de novidade

O ambiente usa `sklearn.cluster.HDBSCAN` do scikit-learn 1.9.1. A [API oficial 1.9.1](https://scikit-learn.org/1.9/modules/generated/sklearn.cluster.HDBSCAN.html) documenta `fit`, `fit_predict` e `labels_`, sem um método para atribuir ou pontuar novas observações. Por isso, HDBSCAN não produz score, limiar q95, previsões de validação/teste nem métricas de classificação e não entra no ranking Fake/True.

As seis features de estilo foram recalculadas nos primeiros 300 caracteres. Em cada protocolo, imputer mediano e `StandardScaler` foram ajustados apenas em True-train para as variantes com e sem autoria. A autoria permanece binária e sem escala quando incluída. Essa preparação foi registrada no manifesto, mas não foi transformada em um classificador sem suporte documentado para dados novos.

## Descoberta temática

O ajuste transdutivo foi feito apenas no treino, sem fornecer labels a HDBSCAN. A representação replica o DBSCAN: `texto_trunc` (200 palavras), TF-IDF de palavras (1–2 gramas) e `char_wb` (3–5), ajustado no treino de cada protocolo. HDBSCAN e DBSCAN usaram os mesmos IDs de treino em cada comparação. Os labels externos foram consultados depois de congelar HDBSCAN, somente para ARI, NMI e composição dos grupos.

A grade pré-definida foi `min_cluster_size ∈ {20, 50}` e `min_samples ∈ {5, 10}`, com `cluster_selection_method="eom"`, `cluster_selection_epsilon=0`, `metric="cosine"`, `algorithm="brute"`, `copy=True` e `n_jobs=1`. A seleção maximiza silhouette cosseno nos itens não ruído do treino, exigindo cobertura mínima de 10%; empates favorecem cobertura maior, menos grupos e parâmetros menores. A estabilidade é a ARI média entre pares das quatro configurações; ela mede sensibilidade à grade, não variação entre seeds.

### Split canônico

| Método | Configuração selecionada | Grupos | Tamanhos | Ruído | Silhouette* | ARI externo | NMI externo | Estabilidade** |
|---|---|---:|---|---:|---:|---:|---:|---:|
| DBSCAN | `min_samples=5`, `eps=0,7718` | 39 | maiores: 588, 112, 58, 20, 13 | 76,57% | 0,0342 | 0,0353 | 0,0592 | 0,4709 |
| HDBSCAN | `min_cluster_size=20`, `min_samples=10` | 2 | 1.076, 174 | 71,06% | 0,0398 | 0,0628 | 0,0629 | 0,8315 |

### Holdout temporal

| Método | Configuração selecionada | Grupos | Tamanhos | Ruído | Silhouette* | ARI externo | NMI externo | Estabilidade** |
|---|---|---:|---|---:|---:|---:|---:|---:|
| DBSCAN | `min_samples=5`, `eps=0,7283` | 41 | maiores: 262, 41, 38, 30, 23 | 83,97% | 0,0771 | 0,0240 | 0,0725 | 0,3867 |
| HDBSCAN | `min_cluster_size=50`, `min_samples=10` | 2 | 1.404, 244 | 61,71% | 0,0380 | 0,0742 | 0,0584 | 0,7572 |

* Silhouette calculada nos registros atribuídos, usando uma amostra fixa de até 1.000 linhas. ** Estabilidade calculada entre configurações candidatas de cada algoritmo; as grades diferem.

HDBSCAN formou dois grupos largos nos dois protocolos. No canônico, ruído, silhouette, ARI e NMI foram menores/maiores que DBSCAN de forma favorável ao HDBSCAN; no temporal, a cobertura e ARI favoreceram HDBSCAN, enquanto silhouette e NMI favoreceram DBSCAN. A composição dos grupos variou e as métricas externas permaneceram baixas. O resultado é exploratório e não mostra superioridade geral.

No canônico, o cluster HDBSCAN de 1.076 registros contém 810 True e 266 Fake; o cluster de 174 contém 85 True e 89 Fake. No temporal, o grupo de 1.404 contém 993 True e 411 Fake; o grupo de 244 contém 127 True e 117 Fake. Ruído é uma categoria de densidade nesta representação, não uma classe Fake.

## Custo e artefatos

A matriz TF-IDF permaneceu CSR: `4.320 × 164.927` com 6.694.928 valores não nulos (53,6 MB) no canônico e `4.304 × 162.730` com 6.710.149 não nulos (53,7 MB) no temporal. A implementação `brute` materializa internamente uma matriz densa de distâncias `n × n`, estimada em 142,4 e 141,3 MiB; o limite de memória configurado foi 512 MiB e passou nos dois casos. A construção TF-IDF e a grade de quatro ajustes levaram 29,0 s no canônico e 29,4 s no temporal. O pico de RSS amostrado do processo chegou a 871,1 MiB e 965,9 MiB, com incrementos máximos de 384,7 MiB e 418,3 MiB. O notebook completo levou 64,65 s.

O run contém:

- [`metrics.csv`](../../../outputs/model-comparison/hdbscan-20260924T150053Z/metrics.csv): candidatos, seleção, ARI/NMI e comparação DBSCAN nos dois treinos.
- [`predictions.csv`](../../../outputs/model-comparison/hdbscan-20260924T150053Z/predictions.csv): IDs/grupos, label externo para auditoria, cluster e status; não contém scores nem decisões Fake/True.
- [`cluster_profiles.csv`](../../../outputs/model-comparison/hdbscan-20260924T150053Z/cluster_profiles.csv): termos TF-IDF e IDs representativos, sem textos brutos.
- [`run_manifest.json`](../../../outputs/model-comparison/hdbscan-20260924T150053Z/run_manifest.json): listas exatas de IDs/grupos, hashes, versões, API, parâmetros, métricas de custo e limitações.

O manifesto DBSCAN informa que o manifesto histórico do K-means não estava disponível e que as partições canônicas foram recuperadas da lógica salva no notebook, com contagens e impressão digital conferidas. Este run reutiliza aquelas listas sem gerar novos splits e preserva essa ressalva de proveniência.

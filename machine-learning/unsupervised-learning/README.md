# Experimentos não supervisionados

## FP-Growth linguístico: revisão dos metadados

O [novo notebook linguístico sem autoria](history/mineracao-de-padroes/fp-growth-linguistico/fp_growth_linguistico_sem_autoria.ipynb) implementa a extração POS/DEP **por notícia**, com contagens, denominadores, taxas e indicadores de qualidade. Compara estilo legado, correção lexical/pontuação, acréscimo de POS e acréscimo de DEP nos mesmos IDs canônicos e na mesma janela de 300 caracteres. Quantis e regras são aprendidos somente no treino; suporte, confidence e lift são medidos nas regras congeladas em validação/teste, com bootstrap pareado da validação. O teste canônico já foi observado: os resultados são exploratórios.

Consulte [protocolo, glossário e artefatos](docs/modelos/fp-growth-linguistico.md) e [as regras novas e a diferença para as anteriores](REGRAS_FP_GROWTH_LINGUISTICO.md). A execução produziu 10 regras elegíveis com estilo corrigido+POS, das quais 5 mantêm os filtros na validação; POS+DEP produziu 152, das quais 121 mantêm os filtros. As associações entre POS e funções sintáticas relacionadas exigem leitura de redundância. A redescoberta das regras é medida separadamente em 100 reamostragens dos grupos do treino, com quantis reaprendidos.

Instale [`../requirements-linguistic.txt`](../requirements-linguistic.txt) em um ambiente Python 3 e execute o notebook em sequência. A implementação reutilizável está em [linguistic_features.py](history/mineracao-de-padroes/fp-growth-linguistico/linguistic_features.py) e [linguistic_fp_growth.py](history/mineracao-de-padroes/fp-growth-linguistico/linguistic_fp_growth.py); o notebook apresenta tabelas reais, diferenças entre representações e exemplos das regras extraídas. Os notebooks anteriores permanecem preservados. Regras direcionais e padrões consolidados têm contagens diferentes; nenhum desses experimentos é um classificador.


## FP-Growth: principal e baseline

As [regras extraídas e sua utilidade para o projeto](REGRAS_FP_GROWTH.md) estão documentadas em um relatório próprio nesta pasta.

| Papel | Notebook | Justificativa |
|---|---|---|
| Principal exploratório | [FP-Growth sem autoria e controles](fp_growth_principal_sem_autoria_controles.ipynb) | Remove `tem_autor` da descoberta e examina cada padrão dentro dos estratos de autoria. É a leitura mais útil para investigar sinais textuais neste corpus. |
| Baseline | [FP-Growth com autoria](fp_growth_baseline_com_autoria.ipynb) | Preserva o experimento original e permite medir quanto os padrões refletem a metadata. |
| Histórico | [Avaliação do FP-Growth com autoria](history/mineracao-de-padroes/avaliacao_fp_growth_com_autoria.ipynb) | Etapa de avaliação do baseline, mantida para reprodução e consulta. |

O baseline encontrou 31 padrões, dos quais 21 incluem autoria. Autoria isolada tem Cramér V de 0,960 com o rótulo neste corpus; 3.528/3.601 notícias sem autor são Fake, contra 72/3.599 com autor. O experimento principal encontra 10 padrões textuais. Seu maior lift Fake agregado é 1,406, mas os contrastes diminuem ou mudam de direção dentro dos estratos. Por isso a escolha do principal considera a validade da interpretação para o projeto, e não o maior lift bruto. **Nenhum dos dois é um classificador; não há F1, acurácia ou ROC-AUC comparáveis aqui.** Consulte o [relatório de controles](../outputs/model-comparison/fp-growth-controls-20260929T215211Z/comparison_summary.md).

Execute os notebooks em kernel Python 3 a partir de uma pasta do repositório. São autossuficientes em código e exibem amostras reproduzíveis com `random_state=42`. As dependências estão em [`../requirements.txt`](../requirements.txt); para Jupyter, instale também `ipykernel` e `notebook` ou `nbclient`. O principal lê, por padrão, os runs históricos congelados de descoberta e avaliação; os caminhos podem ser ajustados nas células de configuração. Cada execução grava um novo diretório em `../outputs/model-comparison/`.

## Mineração de padrões frequentes

O experimento [FP-Growth](docs/modelos/fp-growth.md) encontra combinações recorrentes das features de estilo existentes, sem usar rótulos Fake/True. O notebook do baseline salva resultados em `../outputs/model-comparison/fp-growth-<UTC>/` como tabelas CSV brutas e consolidadas, resumo Markdown e manifesto JSON. Esta análise exploratória fica separada do ranking de classificação em `history/RESULTADOS.md`.


A [avaliação externa dos padrões congelados](docs/modelos/fp-growth-evaluation.md) usa o [notebook histórico](history/mineracao-de-padroes/avaliacao_fp_growth_com_autoria.ipynb) para medir a incidência de cada padrão em Fake e Real, sem alterar a descoberta. Os resultados ficam em `../outputs/model-comparison/fp-growth-evaluation-<UTC>/`.

Os [controles de autoria](docs/modelos/fp-growth-controls.md) no [notebook principal](fp_growth_principal_sem_autoria_controles.ipynb) comparam autoria isolada, mineração textual sem autoria e avaliação dentro dos dois estratos de autoria, preservando o baseline original.

Esta pasta reúne **sete experimentos de métodos**, uma comparação independente com o Jev e um arquivo de experimentos anteriores. Esses notebooks ficam em `history/`, organizados por categoria: agrupamento, detecção de anomalias e aprendizado semi-supervisionado. A documentação de cada método está em [`docs/modelos/`](docs/modelos/), e [`history/RESULTADOS.md`](history/RESULTADOS.md) consolida as métricas registradas, mantendo protocolos incompatíveis em quadros separados.

## Métodos em avaliação

| Método | Tipo | Notebook | Documentação | Situação dos resultados |
|---|---|---|---|---|
| Isolation Forest | Detector de anomalias treinado em notícias True | [Abrir notebook](history/deteccao-de-anomalias/isolation-forest.ipynb) | [Ver documentação](docs/modelos/isolation-forest-sinais-de-anomalia.md) | Métricas q95 registradas como controle no notebook LOF; notebook próprio sem saídas salvas |
| Local Outlier Factor (LOF) | Detector de anomalias treinado em notícias True | [Abrir notebook](history/deteccao-de-anomalias/local-outlier-factor.ipynb) | [Ver documentação](history/modelos/local-outlier-factor.md) | Resultados de validação e teste salvos no notebook |
| One-Class SVM | Detector de anomalias treinado em notícias True | [Abrir notebook](history/deteccao-de-anomalias/one-class-svm.ipynb) | [Ver documentação](history/modelos/one-class-svm.md) | Métricas q95 registradas como controle no notebook LOF; notebook próprio sem saídas salvas |
| PU Learning | Classificação Positive–Unlabeled | [Abrir notebook](history/aprendizado-semi-supervisionado/pu-learning.ipynb) | [Ver documentação](history/modelos/pu-learning.md) | Resultados de teste salvos no notebook; split diferente dos detectores |
| K-means | Detecção de novidade e descoberta temática exploratória, em trilhas separadas | [Abrir notebook](history/agrupamento/kmeans.ipynb) | [Ver documentação](history/modelos/kmeans.md) | Executado no split canônico e em holdout temporal secundário; veja o run `kmeans-canonical-20260924T003936Z` |
| DBSCAN | Detecção de novidade por estilo e descoberta temática, em trilhas separadas | [Abrir notebook](history/agrupamento/dbscan.ipynb) | [Ver documentação](docs/modelos/dbscan.md) | Executado no split canônico e no holdout temporal; veja o run [`dbscan-20260924T141332Z`](../outputs/model-comparison/dbscan-20260924T141332Z/run_manifest.json) |
| HDBSCAN | Descoberta temática exploratória; sem atribuição documentada a notícias novas | [Abrir notebook](history/agrupamento/hdbscan.ipynb) | [Ver documentação](docs/modelos/hdbscan.md) | Executado nos treinos canônico e temporal; veja o run [`hdbscan-20260924T150053Z`](../outputs/model-comparison/hdbscan-20260924T150053Z/run_manifest.json) |

Os três primeiros são os detectores de anomalia da **fronteira atual**. PU Learning é uma linha complementar: ele usa exemplos Fake conhecidos e não rotulados, por isso seus resultados não devem ser misturados ao ranking dos detectores. K-means e DBSCAN têm cada um uma trilha de novidade comparável e uma trilha temática sem decisão Fake/True. HDBSCAN ficou na trilha exploratória: a API scikit-learn 1.9.1 instalada não documenta pontuação ou atribuição de notícias novas.

A comparação externa com o Jev tem um [plano de experimento](../../docs/machine-learning/comparacao-modelos/jev-standalone.md); o notebook de referência está em `history/zero-shot/jev-standalone.ipynb`.

## Próximos testes

Os planos já estão documentados em [`docs/machine-learning/`](../../docs/machine-learning/README.md). DBSCAN, K-means e HDBSCAN têm execução e resultados próprios; a trilha de novidade do HDBSCAN permanece indisponível com a API documentada usada neste run.

- [DBSCAN](../../docs/machine-learning/comparacao-modelos/dbscan.md) — plano executado; novidades e descoberta temática documentadas em [docs/modelos/dbscan.md](docs/modelos/dbscan.md).
- [HDBSCAN](../../docs/machine-learning/comparacao-modelos/hdbscan.md) — descoberta exploratória executada; novidade fora da amostra não reportada. Veja [docs/modelos/hdbscan.md](docs/modelos/hdbscan.md).

Antes de comparar modelos, consulte o [protocolo comum](../../docs/machine-learning/comparacao-modelos/comparison-protocol.md). Os outputs históricos usam splits diferentes; os rankings canônico e temporal incluem apenas métodos reexecutados nos mesmos IDs e partições. Veja as tabelas separadas e suas ressalvas em [`history/RESULTADOS.md`](history/RESULTADOS.md).

## Experimentos anteriores

[`history/consulta-modelos-anteriores/`](history/consulta-modelos-anteriores/) guarda variantes e análises anteriores para consulta. Elas não fazem parte da fronteira ativa nem do ranking atual. O catálogo da pasta explica o conteúdo e registra resultados históricos que não devem ser comparados diretamente com os atuais.

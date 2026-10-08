# Experimentos não supervisionados

O motor utilizado pelo jogo foi separado em [`model-engine/`](../../model-engine/README.md).
Esta pasta contém os experimentos e resultados científicos; a execução de notícias
novas, o catálogo do produto, o serviço HTTP e seus testes ficam na nova camada.

## Modelo principal de mineração de padrões

O [FP-Growth principal sem autoria](fp_growth_principal_sem_autoria.ipynb) usa a variante **`sintaxe_ampliada`**: estilo corrigido, POS e dependências sintáticas na janela de 300 caracteres. Seu propósito é descrever combinações observáveis e apoiar perguntas de reflexão sobre notícias, conforme o `teste.md` do workspace.

O principal produziu **523 regras direcionais elegíveis e 345 padrões distintos**. Na validação, 422 regras mantêm os filtros e 347 também têm redescoberta ≥80%. O cruzamento por classe já está calculado: 105 padrões têm maior presença proporcional em Fake, 235 em True e cinco empatam. Veja [os resultados atuais](REGRAS_FP_GROWTH.md).

A implementação fica diretamente em [fp_growth_principal.py](fp_growth_principal.py), com testes em `tests/`. O notebook abre o último run concluído por padrão e identifica `sintaxe_ampliada` como principal. Os outros conjuntos são referências/ablações documentadas nos respectivos diretórios do run.

```powershell
python machine-learning/unsupervised-learning/fp_growth_principal.py --repetitions 100
python -m unittest discover -s machine-learning/unsupervised-learning/tests -v
```

Execute a partir da raiz do repositório com as dependências de [requirements-linguistic.txt](../requirements-linguistic.txt). O corpus congelado deve estar em `unsupervised-learning/data/Fake.br-Corpus-780f5516c4ae070761632d98ac3368f3ded09d35.zip`; seu SHA-256 é conferido. A CLI aceita `--archive` para outro caminho do mesmo arquivo e `--output` para uma pasta nova. A execução não sobrescreve resultados anteriores.

Quantis e regras usam apenas o treino canônico; as reamostragens mantêm pares e duplicatas juntos. Classe e autoria entram na análise descritiva posterior. Os catálogos têm observações e perguntas preliminares e aguardam revisão editorial. O teste conhecido permanece exploratório.

## Modelos anteriores e comparações

| Papel | Local | Documentação |
|---|---|---|
| Baseline com autoria e antigo principal de estilo | [fp-growth-legado](history/mineracao-de-padroes/fp-growth-legado/) | [Descrição](history/mineracao-de-padroes/fp-growth-legado/README.md) e [resultados](history/mineracao-de-padroes/fp-growth-legado/RESULTADOS.md) |
| Referência linguística com seis POS e seis DEP | [fp-growth-linguistico](history/mineracao-de-padroes/fp-growth-linguistico/) | [Descrição](history/mineracao-de-padroes/fp-growth-linguistico/README.md) e [resultados](history/mineracao-de-padroes/fp-growth-linguistico/RESULTADOS.md) |
| Ampliação POS e vocabulário amplo | [Run de comparação](../outputs/model-comparison/fp-growth-metadados-ampliados-20261008T002311Z/) | READMEs junto aos artefatos de cada variante |

O relatório de resultados ativo é [REGRAS_FP_GROWTH.md](REGRAS_FP_GROWTH.md). Os relatórios anteriores foram preservados nas pastas históricas de seus modelos. Os demais métodos abaixo mantêm seus protocolos próprios; métricas de classificação não são métricas do FP-Growth.

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

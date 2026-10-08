# Metadados

Ponto de entrada para scripts de extração e análise de atributos linguísticos do projeto.

## Scripts atuais

- [`extracao_funcoes.py`](extracao_funcoes.py): extração por notícia de atributos POS, DEP e MORPH com spaCy.
- [`eda.py`](eda.py): análise exploratória e seleção de features linguísticas.
- [Metadados spaCy do classificador](../supervised-learning/support/metadados_spacy.py): implementação específica do pipeline supervisionado, organizada em `support/` e importada pelo modelo principal.

## Scripts legados

Os scripts em [`legacy/`](legacy/) vieram da pasta de trabalho `metadados/`. A extração agregada em `extracao_funcoes.py` é diferente da versão atual: ela soma tags entre textos e não mantém uma linha por notícia. `extracao_true.py` e `extracao_false.py` baixam o corpus `master` e extraem arquivos no diretório de execução; não são o fluxo canônico do projeto.

A revisão e as limitações metodológicas estão em [`revisao-metadados-fp-growth.md`](../../docs/machine-learning/comparacao-modelos/revisao-metadados-fp-growth.md). A auditoria e seus artefatos ficam em [`outputs/metadata-review/`](../outputs/metadata-review/).

## Dados e resultados

Os caches do classificador continuam em [`supervised-learning/data/`](../supervised-learning/data/). Os resultados da EDA ficam em [`saida_features/`](../saida_features/). Esses arquivos são saídas dos respectivos experimentos, não cópias dos scripts desta pasta.

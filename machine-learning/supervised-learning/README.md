# Experimentos supervisionados

O motor utilizado pelo jogo fica em [`model-engine/`](../../model-engine/README.md).
Esta pasta contém a pesquisa, os resultados científicos e a exportação do
classificador. O serviço HTTP, a política de decisão e os testes de integração
com o app ficam na camada de execução.

## Modelo principal

O [notebook principal 12 — χ² + SVD + spaCy](12_selectk_svd_svm_spacy.ipynb)
seleciona **M2 + χ² (10 mil atributos) + SVD (500 componentes)**, versão
`svm-spacy-chi2k10k-svd500-v1`. Veja [os resultados atuais](RESULTADOS.md).

Leia a [documentação do modelo final](docs/modelos/modelo-olimpo.md) para ver a arquitetura, as métricas, os limites e como exportar o artefato. As features linguísticas estão descritas em [metadados spaCy](docs/modelos/metadados-spacy.md).

| Papel                                    | Arquivo                                                                                                           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Experimento principal                    | [`12_selectk_svd_svm_spacy.ipynb`](12_selectk_svd_svm_spacy.ipynb)                                                |
| Pipeline de pesquisa e explicações       | [`modelo_olimpo.py`](modelo_olimpo.py)                                                                            |
| Extração dos atributos linguísticos      | [`metadados_spacy.py`](metadados_spacy.py)                                                                        |
| Treino, checagens e exportação           | [`exportar_modelo.py`](exportar_modelo.py)                                                                        |
| Artefato exportado e metadados de versão | [`modelos/`](modelos/)                                                                                            |
| Resultados atuais                        | [Relatório](RESULTADOS.md), [CV](resultados_selectk_svd500_cv.csv) e [teste](resultados_selectk_svd500_teste.csv) |

O modelo usa TF-IDF de palavras e caracteres, seleção χ² de 10 mil atributos, SVD com 500 componentes, 24 atributos spaCy e LinearSVC com calibração sigmoide. No protocolo interno, obteve F1 macro 0,9295 em validação cruzada e 0,9243 no teste com o pipeline sem calibração. Em títulos do FakeRecogna, o AUC registrado foi 0,6774; a transferência entre corpora segue limitada. A saída é um indício para apoiar análise, não um veredito.

## Trilha de experimentos

Os notebooks e tabelas foram agrupados por etapa para preservar a sequência de decisão:

| Etapa                                                       | Conteúdo                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [Baselines](history/baselines/)                             | Preparação dos dados e comparações iniciais entre regressão logística, SVM e Random Forest (notebooks 01–04). |
| [Ajuste e validação](history/ajuste-e-validacao/)           | Análises de dimensionalidade, regularização, teste externo e kernels (notebooks 05–09).                       |
| [Antecessores do principal](history/modelo-final/README.md) | Metadados spaCy e redução de dimensão (notebooks 10–11).                                                      |
| [Resultados históricos](history/resultados/README.md)       | CSVs dos experimentos anteriores.                                                                             |
| [Dados e caches](data/)                                     | Corpus, split preparado e caches de atributos.                                                                |

A [documentação da pasta](docs/README.md) cataloga os materiais. O relatório de [redução de dimensionalidade](docs/modelos/REDUCAO_DIMENSIONALIDADE.md) mantém as conclusões e ressalvas dos experimentos 05, 07 e 08.

O notebook e os dois CSVs atuais ficam na raiz, como o experimento principal da
[linha não supervisionada](../unsupervised-learning/README.md). As tabelas dos
experimentos anteriores ficam em `history/resultados/`, sem cópias na raiz.
O [registro de reorganização](history/reorganizacao.json) identifica as nove
duplicatas consolidadas. As saídas, contagens de execução e metadados dos
notebooks foram preservados; os caminhos de entrada e saída foram ajustados.

## Treinar e exportar

Execute a partir da raiz do repositório:

```powershell
python -m pip install -r machine-learning/requirements.txt
python -m spacy download pt_core_news_sm
python machine-learning/supervised-learning/exportar_modelo.py --help
python -m unittest discover -s machine-learning/supervised-learning/tests -v
```

Execute primeiro os notebooks 01 e 10 para gerar o split, os transformers e os
caches spaCy em `data/`. O notebook 12 lê a referência de CV do experimento 10 em
`history/resultados/`. Os notebooks aceitam um kernel iniciado na raiz do
repositório, nesta pasta ou na pasta do próprio notebook.

Com as entradas prontas, reproduza a avaliação e exporte:

```powershell
python machine-learning/supervised-learning/exportar_modelo.py --somente-treino
```

O exportador lê `data/dados_preparados.pkl` e `data/Fake.br-Corpus-master/`,
reproduz o F1 de teste do notebook 12, calibra o classificador e salva `.joblib` e
`.json` em `modelos/`. `--somente-treino` restringe o ajuste final às 5.760 notícias
de treino. Sem essa opção, o ajuste final usa as 7.200 notícias, incluindo a
partição antes usada como teste; as métricas foram calculadas antes desse ajuste.
O exportador substitui os arquivos da mesma versão em `modelos/`. As versões
necessárias para carregar o artefato existente estão no JSON correspondente.

`modelo_olimpo.analisar()` mantém o contrato histórico da pesquisa, com
`confidence`. O app usa o contrato do motor HTTP, com `fakeProbability`,
`fakeScore` e estados de análise explícitos. O gabarito cadastrado determina o
resultado do jogo; a previsão do motor é apresentada separadamente.

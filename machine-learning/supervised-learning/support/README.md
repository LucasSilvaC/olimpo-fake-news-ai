# Apoio ao modelo principal

O ponto de entrada permanece em [`../modelo_olimpo.py`](../modelo_olimpo.py).
Esta pasta reúne os itens necessários à reprodução e manutenção do experimento.

| Item                                                    | Papel                                                            |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| [Notebook 12](notebooks/12_selectk_svd_svm_spacy.ipynb) | Seleção χ² + SVD + spaCy, com as saídas científicas preservadas. |
| [`metadados_spacy.py`](metadados_spacy.py)              | Extração das 24 features linguísticas usadas pelo modelo.        |
| [`exportar_modelo.py`](exportar_modelo.py)              | Reprodução da avaliação, calibração e exportação.                |
| [`tests/`](tests/)                                      | Regressões dos caminhos e da leitura das entradas.               |

O notebook lê os caches em `../data/` e a referência de CV do experimento 10
em `../history/resultados/`. Grava os CSVs atuais em `../data/resultados/`.
O relatório para leitura está em [`../RESULTADOS.md`](../RESULTADOS.md).
Os notebooks aceitam um kernel iniciado na raiz do repositório, na raiz
supervisionada ou na pasta do próprio notebook.

## Reproduzir e exportar

Execute a partir da raiz do repositório:

```powershell
python -m pip install -r machine-learning/requirements.txt
python -m spacy download pt_core_news_sm
python machine-learning/supervised-learning/support/exportar_modelo.py --help
python -m unittest discover -s machine-learning/supervised-learning/support/tests -v
```

Execute primeiro os notebooks históricos [01](../history/baselines/01_Data_Prep.ipynb)
e [10](../history/modelo-final/10_svm_metadados_spacy.ipynb) para gerar o split,
os transformers e os caches spaCy em `data/`. Com as entradas prontas:

```powershell
python machine-learning/supervised-learning/support/exportar_modelo.py --somente-treino
```

O exportador lê `data/dados_preparados.pkl` e o corpus bruto, reproduz a avaliação
do notebook 12, calibra o classificador e salva `.joblib` e `.json` em `modelos/`.
`--somente-treino` restringe o ajuste final às 5.760 notícias de treino. Sem essa
opção, o ajuste usa as 7.200 notícias, incluindo a partição antes usada como
teste; as métricas são calculadas antes desse ajuste. O exportador substitui os
arquivos da mesma versão. As versões para carregar o artefato existente estão
no manifesto correspondente.

`modelo_olimpo.analisar()` mantém o contrato histórico da pesquisa, com
`confidence`. O app usa o [contrato HTTP do motor](../../../model-engine/README.md),
com `fakeProbability`, `fakeScore` e estados de análise explícitos.
O empacotador do motor adapta somente o import do extrator de `support/` para o
nome legado do ambiente de execução, preservando os fontes congelados e o
carregamento do artefato.

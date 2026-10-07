# Aprendizado supervisionado

## Modelo final de produção

> **Item final do fluxo:** [`modelo_olimpo.py`](modelo_olimpo.py), versão `svm-spacy-chi2k10k-svd500-v1`.
> Ele recebe texto bruto e devolve classificação, confiança e motivos no contrato `AIAnalysisResult`.

Leia a [documentação do modelo final](docs/modelos/modelo-olimpo.md) para ver a arquitetura, as métricas, os limites e como exportar o artefato. As features linguísticas estão descritas em [metadados spaCy](docs/modelos/metadados-spacy.md).

| Papel | Arquivo |
|---|---|
| Inferência, explicações e contrato do backend | [`modelo_olimpo.py`](modelo_olimpo.py) |
| Extração dos atributos linguísticos | [`metadados_spacy.py`](metadados_spacy.py) |
| Treino, checagens e exportação | [`exportar_modelo.py`](exportar_modelo.py) |
| Artefato exportado e metadados de versão | [`modelos/`](modelos/) |

O modelo usa TF-IDF de palavras e caracteres, seleção χ² de 10 mil atributos, SVD com 500 componentes, 24 atributos spaCy e LinearSVC com calibração sigmoide. No protocolo interno, obteve F1 macro 0,9295 em validação cruzada e 0,9243 no teste com o pipeline sem calibração. Em títulos do FakeRecogna, o AUC registrado foi 0,6774; a transferência entre corpora segue limitada. A saída é um indício para apoiar análise, não um veredito.

## Trilha de experimentos

Os notebooks e tabelas foram agrupados por etapa para preservar a sequência de decisão:

| Etapa | Conteúdo |
|---|---|
| [Baselines](history/baselines/) | Preparação dos dados e comparações iniciais entre regressão logística, SVM e Random Forest (notebooks 01–04). |
| [Ajuste e validação](history/ajuste-e-validacao/) | Análises de dimensionalidade, regularização, teste externo e kernels (notebooks 05–09). |
| [Escolha do modelo final](history/modelo-final/) | Metadados spaCy, redução de dimensão e experimento que seleciona o pipeline de produção (notebooks 10–12). |
| [Resultados tabulares](history/resultados/) | CSVs produzidos pelos experimentos. |
| [Dados e caches](data/) | Corpus, split preparado e caches de atributos. |

A [documentação da pasta](docs/README.md) cataloga os materiais. O relatório de [redução de dimensionalidade](docs/modelos/REDUCAO_DIMENSIONALIDADE.md) mantém as conclusões e ressalvas dos experimentos 05, 07 e 08.

## Treinar e exportar

No diretório `machine-learning/supervised-learning`, instale as dependências de `../requirements.txt` e o modelo de língua spaCy usado na extração:

```bash
python -m pip install -r ../requirements.txt
python -m spacy download pt_core_news_sm
python exportar_modelo.py
```

O exportador lê `data/dados_preparados.pkl` e `data/Fake.br-Corpus-master/`, reproduz o F1 de teste do notebook 12, calibra o classificador e salva o `.joblib` e o `.json` em `modelos/`. Use `--somente-treino` para exportar sem incorporar a partição de teste ao ajuste final. As versões de bibliotecas necessárias para carregar o artefato estão no JSON correspondente.

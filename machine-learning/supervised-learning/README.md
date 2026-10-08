# Modelo Olimpo supervisionado

O modelo principal está em [`modelo_olimpo.py`](modelo_olimpo.py):
**M2 + χ² (10 mil atributos) + SVD (500 componentes)**, versão
`svm-spacy-chi2k10k-svd500-v1`.

Comece pelo [modelo](modelo_olimpo.py), pelos [resultados](RESULTADOS.md) e pela
[documentação técnica](docs/modelos/modelo-olimpo.md). O motor utilizado pelo
web app está em [`model-engine/`](../../model-engine/README.md).

| Pasta                           | Conteúdo                                                           |
| ------------------------------- | ------------------------------------------------------------------ |
| [`modelos/`](modelos/)          | Artefato principal ajustado e manifesto de treinamento.            |
| [`data/`](data/README.md)       | Dados, caches e [tabelas dos resultados atuais](data/resultados/). |
| [`support/`](support/README.md) | Notebook principal, extrator spaCy, exportador e testes.           |
| [`history/`](history/README.md) | Experimentos anteriores e resultados históricos.                   |
| [`docs/`](docs/README.md)       | Arquitetura, atributos e análises técnicas.                        |

A raiz mantém apenas o modelo principal, este índice e o relatório de
resultados. As saídas dos notebooks, os CSVs e o artefato ajustado foram
preservados. Veja o [registro de reorganização](history/reorganizacao.json).

Para reproduzir ou exportar, siga as [instruções de apoio](support/README.md).
No jogo, o gabarito cadastrado determina o resultado; a previsão do motor é
apresentada separadamente.

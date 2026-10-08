# Modelo Olimpo principal

O módulo [`modelo_olimpo.py`](../../modelo_olimpo.py) implementa o pipeline de pesquisa do classificador **M2 + χ² (10 mil) + SVD (500)**, versão `svm-spacy-chi2k10k-svd500-v1`. O artefato correspondente está em [`modelos/`](../../modelos/). O [notebook principal 12](../../support/notebooks/12_selectk_svd_svm_spacy.ipynb) fica em `support/notebooks/`; o [relatório de resultados atuais](../../RESULTADOS.md) permanece na raiz. O app utiliza a cópia congelada e o serviço HTTP de [`model-engine/`](../../../../model-engine/README.md).

## Pipeline

1. `PreparadorEntrada` recebe texto bruto, normaliza artefatos de codificação, substitui dígitos por zero e conserva as primeiras 100 palavras.
2. O bloco textual cria TF-IDF de palavras e caracteres, seleciona 10.000 atributos com χ², projeta em 500 componentes por TruncatedSVD e normaliza o vetor.
3. O bloco linguístico calcula 24 taxas e indicadores spaCy; valores ausentes são imputados pela mediana, os atributos são padronizados e recebem peso `0,03`.
4. `LinearSVC(C=1, class_weight="balanced")` produz o score. `CalibratedClassifierCV` com sigmoide, `StratifiedKFold(5)` e `ensemble=False` converte o score em probabilidade de Fake.

O modelo de língua `pt_core_news_sm` é carregado sob demanda durante a inferência e não é empacotado no `.joblib`. Consulte [features spaCy](metadados-spacy.md) para o conjunto usado e suas definições.

## Evidências e limites

| Métrica                                                | Resultado registrado |
| ------------------------------------------------------ | -------------------: |
| F1 macro na validação cruzada de 5 folds (notebook 12) |      0,9295 ± 0,0081 |
| Gap treino–validação                                   |               0,0422 |
| F1 macro no teste interno, sem calibração              |               0,9243 |
| F1 macro no teste interno, calibrado                   |               0,9208 |
| AUC no teste interno, calibrado                        |               0,9789 |
| AUC externo em títulos FakeRecogna                     |               0,6774 |

O desempenho cai fora do Fake.br: convenções de redação, domínio e o uso de títulos em vez de corpos de notícias limitam a transferência. Apresente a previsão como indício, e não como veredito. As métricas externas são exploratórias e não devem ser comparadas como se viessem do mesmo protocolo interno.

O notebook 12 compara candidatos no split interno e registra os resultados em [`resultados_selectk_svd500_cv.csv`](../../data/resultados/resultados_selectk_svd500_cv.csv) e [`resultados_selectk_svd500_teste.csv`](../../data/resultados/resultados_selectk_svd500_teste.csv). O pipeline escolhido equilibra desempenho interno, tamanho e explicabilidade; o B0 word+char sem spaCy permanece como baseline.

## Inferência e contrato de pesquisa

Carregue o artefato com as versões de bibliotecas registradas no JSON ao lado do `.joblib`. O módulo precisa estar importável como `modelo_olimpo`:

```python
import joblib
import modelo_olimpo

modelo = joblib.load("modelos/olimpo-svm-spacy-chi2k10k-svd500-v1.joblib")
resultado = modelo_olimpo.analisar(modelo, texto_bruto)
```

`analisar` devolve `classification`, `confidence`, `reasons` e `modelVersion`. Por padrão, `P(fake) ≤ 0,35` resulta em `reliable`, `P(fake) ≥ 0,65` em `unreliable`, e a faixa entre os limites em `uncertain`. Textos com menos de 30 palavras também recebem `uncertain`, pois o modelo foi treinado com trechos de 100 palavras. Esses limites são decisões do produto.

As justificativas combinam até três n-gramas legíveis de maior contribuição e descrições das features linguísticas mais influentes. `explicar` separa contribuições de texto e metadados para inspeção técnica.

Esse é o contrato histórico da pesquisa. O serviço HTTP do app devolve
`analysisStatus`, `fakeProbability`, `fakeScore`, versões e escopo de entrada;
textos curtos retornam `insufficient_text` com scores nulos. O jogo usa o gabarito
cadastrado e apresenta a previsão separadamente. Consulte o
[contrato de execução](../../../../model-engine/README.md).

## Exportação

Execute `python machine-learning/supervised-learning/support/exportar_modelo.py` a partir da raiz do repositório. O [script](../../support/exportar_modelo.py) resolve dados e saídas pela sua própria localização, confere que o pré-processamento reproduz o split oficial, repete o F1 0,9243 do notebook 12 com o pipeline sem calibração, avalia a versão calibrada e valida o arquivo após recarregá-lo.

Por padrão, o artefato final é treinado nas 7.200 notícias do split oficial. `--somente-treino` restringe o ajuste final às 5.760 notícias de treino. Ambos os arquivos, `.joblib` e `.json`, são gravados em `modelos/`; o JSON registra SHA-256, versões, hiperparâmetros e métricas.

## Origem da decisão

- [Notebook 10 — metadados spaCy](../../history/modelo-final/10_svm_metadados_spacy.ipynb)
- [Notebook 11 — redução de dimensão](../../history/modelo-final/11_reducao_dim_svm_spacy.ipynb)
- [Notebook 12 — seleção final χ² + SVD](../../support/notebooks/12_selectk_svd_svm_spacy.ipynb)
- [Relatório técnico, seção 5.11](../../../../docs/entregaveis/entregavel-final-reestruturado.md)

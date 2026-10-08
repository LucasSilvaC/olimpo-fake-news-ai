# Atributos linguísticos spaCy

O módulo [`metadados_spacy.py`](../../metadados_spacy.py) extrai features por notícia usando `pt_core_news_sm`. O pipeline de entrada do classificador usa o mesmo texto normalizado e truncado nas 100 primeiras palavras que o bloco TF-IDF.

## Features usadas pelo modelo final

São 24 atributos, calculados como taxas para reduzir a dependência do comprimento do texto:

- **Classes gramaticais (11):** `pos_ADJ`, `pos_ADP`, `pos_AUX`, `pos_CCONJ`, `pos_DET`, `pos_NOUN`, `pos_NUM`, `pos_PRON`, `pos_PROPN`, `pos_PUNCT` e `pos_VERB`.
- **Relações sintáticas (9):** `dep_nsubj`, `dep_obj`, `dep_obl`, `dep_nmod`, `dep_advmod`, `dep_amod`, `dep_ccomp`, `dep_xcomp` e `dep_mark`.
- **Estrutura e morfologia (4):** `taxa_sentencas`, `tam_medio_sentenca_sp`, `verbo_subjuntivo` e `pessoa_1_2`.

As taxas POS e DEP usam o total de tokens como denominador. `taxa_sentencas` é a quantidade de sentenças por token; `tam_medio_sentenca_sp` é a média de palavras (sem pontuação) por sentença. `verbo_subjuntivo` é a proporção de verbos e auxiliares no subjuntivo; `pessoa_1_2` mede a proporção de tokens marcados como primeira ou segunda pessoa. A soma é 11 atributos POS + 9 DEP + 4 de estrutura e morfologia = 24.

O extrator também calcula contagens e categorias de diagnóstico, além de `verbo_imperativo`; eles ajudam a auditar a extração, mas não estão entre as 24 colunas selecionadas pelo modelo final. A lista efetivamente usada está em `META_SPACY` no módulo do modelo.

## Tratamento no pipeline

O pipeline substitui valores ausentes pela mediana e padroniza as features. Textos sem verbos recebem `NaN` nas taxas verbais e o imputador resolve esses casos. O bloco spaCy recebe peso `0,03` na combinação com o vetor textual. O extrator não aprende parâmetros com rótulos e não participa de qualquer busca que use o conjunto de teste.

## Reprodução

Instale spaCy e o pacote de língua:

```bash
python -m spacy download pt_core_news_sm
```

Os caches em [`data/`](../../data/README.md) foram gerados pelo notebook 10 e reutilizados nos experimentos 11 e 12. A escolha de features e o efeito delas no desempenho estão descritos nos [antecessores 10–11](../../history/modelo-final/README.md), no [principal 12](../../12_selectk_svd_svm_spacy.ipynb) e na [documentação do modelo final](modelo-olimpo.md).

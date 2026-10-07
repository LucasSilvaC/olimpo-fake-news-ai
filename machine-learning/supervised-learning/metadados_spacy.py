"""Metadados morfossintáticos por notícia, extraídos com spaCy (pt_core_news_sm).

Todas as features são taxas (por token ou por verbo), e não contagens, para não
depender do tamanho do texto. A entrada esperada é o mesmo texto que o TF-IDF vê
(`texto_trunc`: normalizado + 100 palavras). A extração é por documento e não tem
`fit`, então pode ser pré-calculada uma vez e cacheada sem vazamento.

Requer: pip install spacy && python -m spacy download pt_core_news_sm
"""

import numpy as np
import pandas as pd
import spacy

MODELO = "pt_core_news_sm"

POS_TAGS = ["ADJ", "ADP", "ADV", "AUX", "CCONJ", "DET", "NOUN", "NUM",
            "PRON", "PROPN", "PUNCT", "SCONJ", "VERB"]
DEP_TAGS = ["nsubj", "obj", "obl", "nmod", "case", "advmod", "amod",
            "ccomp", "xcomp", "mark"]

# Calculadas só para diagnóstico de artefato de fonte (não entram no modelo)
POS_DIAG = ["SPACE", "X", "SYM", "INTJ"]
DEP_DIAG = ["dep"]


def carregar_nlp():
    return spacy.load(MODELO, disable=["ner"])


def extrair_doc(doc):
    n = len(doc)
    f = {"n_tokens": n}
    if n == 0:
        return f

    pos = pd.Series([t.pos_ for t in doc]).value_counts()
    dep = pd.Series([t.dep_ for t in doc]).value_counts()
    for tag in POS_TAGS:
        f[f"pos_{tag}"] = pos.get(tag, 0) / n
    for tag in DEP_TAGS:
        f[f"dep_{tag}"] = dep.get(tag, 0) / n
    for tag in POS_DIAG:
        f[f"diag_pos_{tag}"] = pos.get(tag, 0) / n
    for tag in DEP_DIAG:
        f[f"diag_dep_{tag}"] = dep.get(tag, 0) / n

    # Sentenças: taxa por token (≈ ROOT) e tamanho médio em palavras (sem pontuação)
    sents = list(doc.sents)
    palavras = sum(1 for t in doc if not t.is_punct)
    f["taxa_sentencas"] = len(sents) / n
    f["tam_medio_sentenca_sp"] = palavras / len(sents)

    # Morfologia: modo verbal por verbo; pessoa 1/2 por token
    verbos = [t for t in doc if t.pos_ in ("VERB", "AUX")]
    if verbos:
        modos = [t.morph.get("Mood") for t in verbos]
        f["verbo_imperativo"] = sum("Imp" in m for m in modos) / len(verbos)
        f["verbo_subjuntivo"] = sum("Sub" in m for m in modos) / len(verbos)
    else:
        # Sem verbos (comum em títulos): fica NaN e o SimpleImputer do pipeline trata
        f["verbo_imperativo"] = np.nan
        f["verbo_subjuntivo"] = np.nan
    f["pessoa_1_2"] = sum(any(p in ("1", "2") for p in t.morph.get("Person")) for t in doc) / n
    return f


def extrair(textos, nlp=None, batch_size=64, n_process=1):
    """Recebe uma Series de textos e devolve um DataFrame de features com o mesmo índice."""
    nlp = nlp or carregar_nlp()
    linhas = [extrair_doc(doc) for doc in nlp.pipe(textos.tolist(), batch_size=batch_size, n_process=n_process)]
    return pd.DataFrame(linhas, index=textos.index)


def colunas_features(df):
    """Colunas candidatas a feature (exclui contagem bruta e diagnósticos)."""
    return [c for c in df.columns if c != "n_tokens" and not c.startswith("diag_")]

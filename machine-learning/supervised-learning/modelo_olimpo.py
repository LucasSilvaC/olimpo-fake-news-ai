"""Pipeline de produção do classificador Olimpo: M2 + χ² 10 mil + SVD(500).

Recebe texto bruto (lista/Series de strings) e faz tudo internamente:
normalização + truncamento (iguais ao 01_Data_Prep) → metadados spaCy →
TF-IDF word+char → SelectKBest(χ², 10 mil) → TruncatedSVD(500) → Normalizer,
+ bloco spaCy padronizado com peso w → LinearSVC(C=1) → calibração sigmoide.

Escolhas e evidências: `history/modelo-final/` e `docs/modelos/modelo-olimpo.md`.
As features linguísticas estão descritas em `docs/modelos/metadados-spacy.md`.

ATENÇÃO: o artefato .joblib referencia as classes e funções deste módulo pelo
nome (`modelo_olimpo.*`). Quem carrega precisa ter este arquivo importável e as
mesmas versões de Python, scikit-learn, numpy, scipy, spaCy e pt_core_news_sm
registradas no .json de metadados.
"""

import re

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, Normalizer, StandardScaler
from sklearn.svm import LinearSVC

import metadados_spacy as ms

VERSAO_MODELO = "svm-spacy-chi2k10k-svd500-v1"

# Hiperparâmetros escolhidos na CV (notebooks 10 e 12)
C = 1.0
W_META = 0.03
K_CHI2 = 10_000
D_SVD = 500
N_PALAVRAS = 100

# meta_spacy final do notebook 10, seção 4
META_SPACY = ['pos_ADJ', 'pos_ADP', 'pos_AUX', 'pos_CCONJ', 'pos_DET', 'pos_NOUN', 'pos_NUM', 'pos_PRON',
              'pos_PROPN', 'pos_PUNCT', 'pos_VERB', 'dep_nsubj', 'dep_obj', 'dep_obl', 'dep_nmod', 'dep_advmod',
              'dep_amod', 'dep_ccomp', 'dep_xcomp', 'dep_mark', 'taxa_sentencas', 'tam_medio_sentenca_sp',
              'verbo_subjuntivo', 'pessoa_1_2']

# Frases para o campo `reasons` do backend: (feature acima da média, abaixo da média)
DESCRICAO_META = {
    "taxa_sentencas": ("muitas frases por trecho (frases curtas)", "poucas frases por trecho (frases longas)"),
    "tam_medio_sentenca_sp": ("frases longas", "frases curtas"),
    "pos_DET": ("uso alto de artigos/determinantes", "uso baixo de artigos/determinantes"),
    "pos_ADP": ("muitas preposições (estilo nominal)", "poucas preposições"),
    "pos_NOUN": ("muitos substantivos", "poucos substantivos"),
    "pos_VERB": ("muitos verbos", "poucos verbos"),
    "pos_AUX": ("muitos verbos auxiliares", "poucos verbos auxiliares"),
    "dep_nmod": ("muitos complementos nominais", "poucos complementos nominais"),
    "pessoa_1_2": ("uso de 1ª/2ª pessoa", "pouca 1ª/2ª pessoa"),
}


def normalizar(texto):
    """Idêntica ao 01_Data_Prep: remove artefatos de fonte e troca dígitos por 0."""
    texto = str(texto)
    texto = texto.translate(str.maketrans({"\x96": "-", "\x97": "-", "\x93": '"', "\x94": '"', "\x91": "'", "\x92": "'"}))
    texto = re.sub(r"[\x80-\x9f]", " ", texto)
    texto = re.sub(r"[–—]", "-", texto)
    texto = re.sub(r"[“”«»]", '"', texto)
    texto = re.sub(r"[‘’]", "'", texto)
    texto = re.sub(r"\s*(?:\[\.*\]|\.{2,}|…)", ".", texto)
    texto = re.sub(r"\d", "0", texto)
    return " ".join(texto.split())


def truncar(texto, n=N_PALAVRAS):
    return " ".join(str(texto).split()[:n])


# Cache opcional das features spaCy por texto truncado. Só o treino/exportação ativa
# (a calibração reajusta o pipeline várias vezes sobre os mesmos textos). Fica fora do pickle.
_CACHE_SPACY = None


def ativar_cache_spacy():
    global _CACHE_SPACY
    _CACHE_SPACY = {}


class PreparadorEntrada(BaseEstimator, TransformerMixin):
    """Texto bruto → DataFrame com `texto_trunc` + taxas spaCy.

    Sem `fit` (processamento por documento). O modelo spaCy é carregado sob demanda
    e não vai para o pickle, então o .joblib não carrega o modelo de linguagem.
    """

    def __init__(self, batch_size=64):
        self.batch_size = batch_size

    def fit(self, X, y=None):
        return self

    def _nlp(self):
        if getattr(self, "_nlp_cache", None) is None:
            self._nlp_cache = ms.carregar_nlp()
        return self._nlp_cache

    def transform(self, X):
        # Uma string solta viraria uma lista de caracteres, e um DataFrame, a lista de colunas
        if isinstance(X, (str, bytes, pd.DataFrame)):
            raise TypeError("Passe uma lista ou Series de textos, por exemplo modelo.predict_proba([texto]).")
        textos = pd.Series(list(X) if not isinstance(X, pd.Series) else X.values, dtype=object)
        trunc = textos.fillna("").map(normalizar).map(truncar).reset_index(drop=True)
        if _CACHE_SPACY is None:
            feats = ms.extrair(trunc, nlp=self._nlp(), batch_size=self.batch_size)
        else:
            faltam = pd.Series(pd.unique(trunc[~trunc.map(lambda t: t in _CACHE_SPACY)]), dtype=object)
            if len(faltam):
                novos = ms.extrair(faltam, nlp=self._nlp(), batch_size=self.batch_size)
                _CACHE_SPACY.update(zip(faltam, novos.to_dict("records")))
            feats = pd.DataFrame([_CACHE_SPACY[t] for t in trunc])
        out = pd.DataFrame({"texto_trunc": trunc})
        return out.join(feats.reindex(columns=META_SPACY))

    def __getstate__(self):
        estado = self.__dict__.copy()
        estado.pop("_nlp_cache", None)
        return estado


def para_float32(X):
    return X.astype(np.float32)


def construir_pipeline():
    """Pipeline não calibrado (o mesmo avaliado no notebook 12, seção 4)."""
    word = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, token_pattern=r"(?u)\b[^\d\W]{2,}\b")
    char = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=3, sublinear_tf=True)
    texto = Pipeline([
        ("tfidf", ColumnTransformer([("txt_word", word, "texto_trunc"), ("txt_char", char, "texto_trunc")])),
        ("chi2", SelectKBest(chi2, k=K_CHI2)),
        ("f32", FunctionTransformer(para_float32, accept_sparse=True)),
        ("svd", TruncatedSVD(n_components=D_SVD, random_state=42)),
        ("norm", Normalizer()),
    ])
    meta = Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())])
    blocos = ColumnTransformer([("txt", texto, ["texto_trunc"]), ("meta", meta, META_SPACY)],
                               transformer_weights={"txt": 1.0, "meta": W_META})
    return Pipeline([
        ("entrada", PreparadorEntrada()),
        ("prep", blocos),
        ("clf", LinearSVC(C=C, class_weight="balanced", random_state=42, max_iter=20000, dual=False)),
    ])


def construir_modelo_calibrado(cv):
    """Envolve o pipeline numa calibração sigmoide (Platt) para obter P(fake).

    `ensemble=False`: o classificador final é treinado em todos os dados, e a
    sigmoide é ajustada nas predições out-of-fold de `cv`.
    """
    return CalibratedClassifierCV(construir_pipeline(), method="sigmoid", cv=cv, ensemble=False)


def _pipeline_interno(modelo):
    if isinstance(modelo, CalibratedClassifierCV):
        return modelo.calibrated_classifiers_[0].estimator
    return modelo


def _nomes_selecionados(pipe):
    """Nomes dos n-gramas que passaram no χ² (calculado uma vez e guardado no objeto)."""
    if getattr(pipe, "_nomes_chi2", None) is None:
        txt = pipe.named_steps["prep"].named_transformers_["txt"]
        nomes = txt.named_steps["tfidf"].get_feature_names_out()[txt.named_steps["chi2"].get_support()]
        pipe._nomes_chi2 = pd.Index(nomes)  # prefixos txt_word__ / txt_char__ mantidos
    return pipe._nomes_chi2


def _p_fake(modelo, pipe, df):
    """P(fake) a partir da entrada já preparada, sem refazer o spaCy."""
    score = pipe[1:].decision_function(df)
    if isinstance(modelo, CalibratedClassifierCV):
        return float(modelo.calibrated_classifiers_[0].calibrators[0].predict(score)[0])
    return float(1 / (1 + np.exp(-score[0])))


def explicar(modelo, df):
    """Contribuições de n-gramas e features spaCy para o score de UM texto já preparado.

    O índice de `contrib_txt` mantém o prefixo do bloco (`txt_word__` ou `txt_char__`).

    O bloco de texto é z = V·x / ||V·x|| (SVD + Normalizer), então o score de texto
    c·z se decompõe exatamente em Σ_j x_j (Vᵀc)_j / ||V·x|| por n-grama selecionado.
    """
    pipe = _pipeline_interno(modelo)
    prep = pipe.named_steps["prep"]
    txt = prep.named_transformers_["txt"]
    coef = pipe.named_steps["clf"].coef_.ravel()

    xs = txt.named_steps["chi2"].transform(txt.named_steps["tfidf"].transform(df)).astype(np.float32).tocsr()
    V = txt.named_steps["svd"].components_
    norma = float(np.linalg.norm(xs @ V.T)) or 1.0
    peso_ngrama = (V.T @ coef[:D_SVD]) / norma
    contrib_txt = pd.Series(xs.data * peso_ngrama[xs.indices], index=_nomes_selecionados(pipe)[xs.indices])

    z_meta = prep.named_transformers_["meta"].transform(df[META_SPACY])[0]
    contrib_meta = pd.Series(W_META * z_meta * coef[D_SVD:], index=META_SPACY)
    return contrib_txt, contrib_meta, pd.Series(z_meta, index=META_SPACY)


def analisar(modelo, texto, limiar_baixo=0.35, limiar_alto=0.65, min_palavras=30):
    """Saída no formato do `AIAnalysisResult` do backend (web-app/src/app/api/ai-feedback).

    Os limiares que separam `uncertain` e o mínimo de palavras são decisão de produto,
    não do modelo. Textos curtos viram `uncertain`: no Fake.br, quase todo texto com
    menos de 100 palavras é falso, então o modelo tende a chamar texto curto de fake.
    """
    pipe = _pipeline_interno(modelo)
    df = pipe.named_steps["entrada"].transform([texto])
    n_palavras = len(df["texto_trunc"].iloc[0].split())
    if n_palavras < min_palavras:
        return {"classification": "uncertain", "confidence": 0.0, "modelVersion": VERSAO_MODELO,
                "reasons": [f"Texto curto demais para análise ({n_palavras} palavras; mínimo {min_palavras}). "
                            "O modelo foi treinado com trechos de 100 palavras."]}

    p_fake = _p_fake(modelo, pipe, df)
    if p_fake >= limiar_alto:
        classe, conf = "unreliable", p_fake
    elif p_fake <= limiar_baixo:
        classe, conf = "reliable", 1 - p_fake
    else:
        classe, conf = "uncertain", 1 - abs(p_fake - 0.5) * 2

    contrib_txt, contrib_meta, z_meta = explicar(modelo, df)
    sinal = 1 if p_fake >= 0.5 else -1
    motivos = []
    # Só n-gramas de palavra aparecem nos motivos (os de caractere não são legíveis)
    palavras = contrib_txt[contrib_txt.index.str.startswith("txt_word__")]
    palavras.index = palavras.index.str.removeprefix("txt_word__")
    top_txt = (sinal * palavras).groupby(level=0).sum().sort_values(ascending=False)
    termos = [t for t, v in top_txt.items() if v > 0][:3]
    if termos:
        lado = "notícias falsas" if sinal > 0 else "notícias verdadeiras"
        motivos.append(f"Termos mais associados a {lado} no treino: {', '.join(repr(t) for t in termos)}.")
    for feat in (sinal * contrib_meta).sort_values(ascending=False).index[:2]:
        if feat in DESCRICAO_META and sinal * contrib_meta[feat] > 0:
            motivo = f"Estilo de escrita: {DESCRICAO_META[feat][0 if z_meta[feat] > 0 else 1]}."
            if motivo not in motivos:
                motivos.append(motivo)
    motivos.append(f"Probabilidade estimada de ser falsa: {p_fake:.0%} (modelo treinado no corpus Fake.br).")
    return {"classification": classe, "confidence": round(conf, 2), "reasons": motivos, "modelVersion": VERSAO_MODELO}

"""Treina e exporta o classificador Olimpo (M2 + χ² 10 mil + SVD 500) para .joblib.

Uso (dentro de machine-learning/supervised-learning):
    python exportar_modelo.py                   # exporta treinado em treino+teste (7.200 notícias)
    python exportar_modelo.py --somente-treino  # exporta o modelo treinado só no X_tr

Pré-requisitos: data/dados_preparados.pkl e data/Fake.br-Corpus-master/ (gerados pelo notebook
history/baselines/01_Data_Prep.ipynb)
e `python -m spacy download pt_core_news_sm`.

Etapas:
1. Recarrega o texto BRUTO do corpus e confere que normalizar+truncar reproduz o texto_trunc
   do split oficial, para que treino e produção usem exatamente o mesmo pré-processamento.
2. Checagem de reprodução: o pipeline não calibrado, treinado no X_tr, precisa repetir o
   F1 do teste interno do notebook 12 (0,9243).
3. Avalia o modelo calibrado (treinado no X_tr) no X_te: F1, AUC, Brier e calibração por faixa.
4. Treina o modelo final, calibrado, e salva o .joblib + um .json de metadados (versões,
   hiperparâmetros, métricas e sha256).
5. Recarrega o .joblib e confere que as predições batem com o modelo em memória.
"""

import argparse
import glob
import hashlib
import json
import os
import platform
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import scipy
import sklearn
import spacy
from sklearn.metrics import brier_score_loss, f1_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold

import modelo_olimpo as mo

F1_TESTE_NB12 = 0.9243
SAIDA = Path("./modelos")


def carregar_textos(pasta, label):
    registros = []
    for caminho in sorted(glob.glob(os.path.join(pasta, "*.txt"))):
        id_noticia = os.path.basename(caminho).replace(".txt", "t" if label == 0 else "")
        with open(caminho, encoding="utf-8") as f:
            registros.append({"id": id_noticia, "texto": f.read(), "label": label})
    return pd.DataFrame(registros)


def carregar_dados():
    X_tr, X_te, y_tr, y_te = joblib.load("./data/dados_preparados.pkl")
    base = "data/Fake.br-Corpus-master/full_texts"
    df = pd.concat([carregar_textos(f"{base}/fake", 1), carregar_textos(f"{base}/true", 0)], ignore_index=True)
    trunc = df["texto"].map(mo.normalizar).map(mo.truncar)
    for X, y in ((X_tr, y_tr), (X_te, y_te)):
        assert (trunc.loc[X.index] == X["texto_trunc"]).all(), "pré-processamento difere do split oficial"
        assert (df.loc[X.index, "label"] == y).all()
    return df.loc[X_tr.index, "texto"], df.loc[X_te.index, "texto"], y_tr, y_te


def calibracao_por_faixa(y, p, faixas=(0, 0.2, 0.35, 0.5, 0.65, 0.8, 1.0)):
    cortes = pd.cut(p, faixas, include_lowest=True)
    tab = pd.DataFrame({"y": np.asarray(y), "p": p}).groupby(cortes, observed=True).agg(
        n=("y", "size"), p_media=("p", "mean"), taxa_fake=("y", "mean"))
    return {str(k): {c: round(float(v), 4) for c, v in r.items()} for k, r in tab.iterrows()}


def sha256(caminho):
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--somente-treino", action="store_true", help="treina o modelo final só no X_tr")
    args = ap.parse_args()

    t0 = time.time()
    mo.ativar_cache_spacy()
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    print("1) Carregando texto bruto e conferindo alinhamento com o split oficial...", flush=True)
    txt_tr, txt_te, y_tr, y_te = carregar_dados()
    print(f"   ok: {len(txt_tr):,} treino / {len(txt_te):,} teste")

    print("2) Reprodução do notebook 12 (pipeline não calibrado, treino → teste)...", flush=True)
    pipe = mo.construir_pipeline().fit(txt_tr, y_tr)
    f1_bruto = f1_score(y_te, pipe.predict(txt_te), average="macro")
    print(f"   F1 teste {f1_bruto:.4f} (notebook 12: {F1_TESTE_NB12})")
    assert abs(f1_bruto - F1_TESTE_NB12) < 0.002, "não reproduz o notebook 12: PARAR e investigar"

    print("3) Modelo calibrado treinado no X_tr, avaliado no X_te...", flush=True)
    cal = mo.construir_modelo_calibrado(cv).fit(txt_tr, y_tr)
    p_te = cal.predict_proba(txt_te)[:, 1]
    metricas_teste = {
        "f1_macro": round(f1_score(y_te, (p_te >= 0.5).astype(int), average="macro"), 4),
        "roc_auc": round(roc_auc_score(y_te, p_te), 4),
        "brier": round(brier_score_loss(y_te, p_te), 4),
        "f1_macro_sem_calibracao": round(f1_bruto, 4),
        "calibracao_por_faixa": calibracao_por_faixa(y_te, p_te),
    }
    print(f"   F1 {metricas_teste['f1_macro']} | AUC {metricas_teste['roc_auc']} | Brier {metricas_teste['brier']}")

    if args.somente_treino:
        final, dados = cal, "X_tr (5.760 notícias)"
    else:
        print("4) Treinando o modelo final em treino+teste...", flush=True)
        final = mo.construir_modelo_calibrado(cv).fit(pd.concat([txt_tr, txt_te]), pd.concat([y_tr, y_te]))
        dados = "X_tr + X_te (7.200 notícias)"

    SAIDA.mkdir(exist_ok=True)
    caminho = SAIDA / f"olimpo-{mo.VERSAO_MODELO}.joblib"
    joblib.dump(final, caminho, compress=3)

    print("5) Conferindo o artefato salvo...", flush=True)
    recarregado = joblib.load(caminho)
    amostra = txt_te.iloc[:50]
    assert np.allclose(recarregado.predict_proba(amostra), final.predict_proba(amostra))
    exemplo = mo.analisar(recarregado, txt_te.iloc[0])

    meta = {
        "versao_modelo": mo.VERSAO_MODELO,
        "arquivo": caminho.name,
        "sha256": sha256(caminho),
        "tamanho_mb": round(caminho.stat().st_size / 2**20, 1),
        "criado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "dados_treino_final": dados,
        "rotulos": {"0": "real", "1": "fake"},
        "entrada": "texto bruto da notícia (corpo; o modelo normaliza e usa as 100 primeiras palavras)",
        "saida": "predict_proba[:, 1] = P(fake); modelo_olimpo.analisar() devolve o formato AIAnalysisResult",
        "hiperparametros": {"C": mo.C, "w_meta": mo.W_META, "k_chi2": mo.K_CHI2, "d_svd": mo.D_SVD,
                            "n_palavras": mo.N_PALAVRAS, "calibracao": "sigmoide, StratifiedKFold(5, seed 42), ensemble=False",
                            "meta_spacy": mo.META_SPACY},
        "metricas_teste_interno_modelo_treinado_em_X_tr": metricas_teste,
        "metricas_cv_notebook_12": {"f1_cv": 0.9295, "f1_cv_std": 0.0081, "gap": 0.0422},
        "referencia_externa_fakerecogna_titulos": {"auc": 0.6774, "obs": "espiada, notebook 12"},
        "versoes": {"python": platform.python_version(), "scikit_learn": sklearn.__version__,
                    "numpy": np.__version__, "scipy": scipy.__version__, "pandas": pd.__version__,
                    "spacy": spacy.__version__, "pt_core_news_sm": spacy.util.get_package_version("pt_core_news_sm"),
                    "joblib": joblib.__version__},
        "exemplo_analisar": exemplo,
    }
    caminho_meta = caminho.with_suffix(".json")
    caminho_meta.write_text(json.dumps(meta, ensure_ascii=False, indent=2))
    print(f"\nSalvo: {caminho} ({meta['tamanho_mb']} MB) e {caminho_meta}")
    print(f"Exemplo de analisar(): {json.dumps(exemplo, ensure_ascii=False)}")
    print(f"Tempo total: {(time.time() - t0) / 60:.1f} min")


if __name__ == "__main__":
    sys.exit(main())

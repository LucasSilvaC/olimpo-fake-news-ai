#!/usr/bin/env python3
"""CLI execution of notebook 06_Grid_Search.ipynb."""

from __future__ import annotations

import argparse

parser = argparse.ArgumentParser(description='Run the Grid Search for supervised models.')
parser.add_argument("--n-jobs", type=int, default=2, help="Parallel CV jobs (default: 2; capped at available CPU cores).")
parser.add_argument("--skip-sensitivity", action="store_true", help="Skip extra sensitivity-analysis fits.")
parser.add_argument("--skip-plots", action="store_true", help="Skip plot generation.")
ARGS = parser.parse_args()
if ARGS.n_jobs < 1:
    parser.error("--n-jobs must be greater than zero")

def display(value):
    """Print tables in the terminal instead of using Jupyter rich output."""
    if hasattr(value, "to_string"):
        try:
            print(value.to_string(index=False))
        except TypeError:
            print(value.to_string())
    else:
        print(value)

# Paths are resolved from the script so it can be launched from another directory.

# # Grid Search dos modelos supervisionados
# 
# Este notebook executa somente o Grid Search para Regressão Logística, SVM linear e Random Forest. O Random Search está separado em [`07_Random_Search.ipynb`](07_Random_Search.ipynb).
# 
# A seleção usa F1 macro em validação cruzada estratificada. O conjunto de teste permanece isolado e não participa da busca.
# 
# Os resultados de cada modelo são salvos em uma pasta exclusiva por execução, com métricas por fold e parâmetros efetivos.

# ## 1. Importar bibliotecas e carregar os modelos existentes
# 
# Os estimadores serão montados em `Pipeline`, mantendo cada `ColumnTransformer` dentro da validação cruzada. Assim, vocabulário TF-IDF e demais transformações são ajustados somente nos folds de treino.

from pathlib import Path
from datetime import datetime, timezone
import json
import os
import platform
import re
from tempfile import TemporaryDirectory

import joblib
import numpy as np
import pandas as pd
import sklearn
from joblib import Memory
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import ConfusionMatrixDisplay, classification_report, roc_auc_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

script_path = Path(__file__).resolve()
script_directories = (script_path.parent, *script_path.parents)
current_directories = (*script_directories, Path.cwd(), *Path.cwd().parents)
data_directory = next(
    (
        candidate
        for current_directory in current_directories
        for candidate in (
            current_directory,
            current_directory / "machine-learning" / "supervised-learning",
            current_directory / "supervised-learning",
        )
        if (candidate / "dados_preparados.pkl").is_file()
        and (candidate / "transformers.pkl").is_file()
    ),
    None,
)

if data_directory is None:
    raise FileNotFoundError(
        "Artefatos não encontrados. Execute primeiro o notebook 01_Data_Prep.ipynb."
    )

X_tr, X_te, y_tr, y_te = joblib.load(data_directory / "dados_preparados.pkl")
configs = joblib.load(data_directory / "transformers.pkl")

print(f"Diretório dos artefatos: {data_directory}")
print(f"Treino: {X_tr.shape}; teste: {X_te.shape}")
print(f"Distribuição das classes no treino: {y_tr.value_counts().to_dict()}")
print(f"Combinações de atributos: {list(configs)}")
if "taxa_stop_words" not in X_tr.columns:
    raise ValueError(
        "Os artefatos não incluem taxa_stop_words. Execute novamente o notebook 01_Data_Prep.ipynb."
    )
has_taxa_in_metadata = any(
    "taxa_stop_words" in columns
    for transformers in configs.values()
    for name, _, columns in transformers
    if name == "meta"
)
if not has_taxa_in_metadata:
    raise ValueError("Os preprocessadores carregados não incluem taxa_stop_words.")

# ## 2. Configurar a validação e a linha de base
# 
# A busca usa quatro pré-processadores e três folds estratificados. Os parâmetros-base estão incluídos na grade; depois da busca, a tabela de linha de base será extraída desses candidatos. Isso preserva as mesmas métricas e folds sem repetir 36 ajustes.

# Notebook configuration and helper functions.
PREPROCESSORS = {
    config_name: ColumnTransformer(transformers)
    for config_name, transformers in configs.items()
}
CONFIG_BY_SIGNATURE = {
    tuple(name for name, _, _ in transformers): config_name
    for config_name, transformers in configs.items()
}
CV = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
SCORING = {
    "f1_macro": "f1_macro",
    "accuracy": "accuracy",
    "precision_macro": "precision_macro",
    "recall_macro": "recall_macro",
    "roc_auc": "roc_auc",
}
METRIC_COLUMNS = {
    "f1_macro": "f1_macro_cv",
    "accuracy": "accuracy_cv",
    "precision_macro": "precision_macro_cv",
    "recall_macro": "recall_macro_cv",
    "roc_auc": "roc_auc_cv",
}

MODEL_SPECS = {
    "Regressão Logística": {
        "estimator": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "baseline_params": {"C": 1.0, "class_weight": "balanced"},
        "report_params": ["C", "class_weight"],
        "grid": {
            "clf__C": [0.1, 1.0, 10.0],
            "clf__class_weight": [None, "balanced"],
        },
    },
    "SVM Linear": {
        "estimator": LinearSVC(class_weight="balanced", random_state=42, max_iter=10000),
        "baseline_params": {"C": 1.0, "class_weight": "balanced"},
        "report_params": ["C", "class_weight"],
        "grid": {
            "clf__C": [0.1, 1.0, 10.0],
            "clf__class_weight": [None, "balanced"],
        },
    },
    "Random Forest": {
        "estimator": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=1),
        "baseline_params": {
            "n_estimators": 100,
            "max_depth": None,
            "min_samples_leaf": 1,
            "min_samples_split": 2,
            "max_features": "sqrt",
            "class_weight": None,
        },
        "report_params": ["n_estimators", "max_depth", "min_samples_split", "min_samples_leaf", "max_features", "class_weight"],
        "grid": {
            "clf__n_estimators": [100, 250],
            "clf__max_depth": [None, 30],
            "clf__min_samples_leaf": [1, 3],
            "clf__min_samples_split": [2],
            "clf__max_features": ["sqrt"],
            "clf__class_weight": [None, "balanced"],
        },
    },
}

N_JOBS = min(ARGS.n_jobs, os.cpu_count() or 1)
PRE_DISPATCH = N_JOBS
CACHE_DIRECTORY = TemporaryDirectory(prefix="fakebr-hyperparameter-search-")
PIPELINE_MEMORY = Memory(location=CACHE_DIRECTORY.name, verbose=0)

SEARCH_METHOD = 'Grid Search'
RUN_KEY = 'grid-search'
RUN_ID = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
_ml_roots = [path for path in (data_directory, *data_directory.parents) if path.name == "machine-learning"]
if _ml_roots:
    ML_ROOT = _ml_roots[0]
else:
    _repo_roots = [path for path in (data_directory, *data_directory.parents) if (path / "machine-learning").is_dir()]
    ML_ROOT = _repo_roots[0] / "machine-learning" if _repo_roots else data_directory.parent
RUN_ROOT = ML_ROOT / "outputs" / "model-comparison"
RUN_DIRECTORY = RUN_ROOT / f"{RUN_KEY}-{RUN_ID}"
RUN_DIRECTORY.mkdir(parents=True, exist_ok=False)

RUN_METADATA = {
    "run_id": RUN_ID,
    "strategy": SEARCH_METHOD,
    "status": "running",
    "started_at_utc": datetime.now(timezone.utc).isoformat(),
    "versions": {
        "python": platform.python_version(),
        "numpy": np.__version__,
        "pandas": pd.__version__,
        "scikit_learn": sklearn.__version__,
    },
    "input": {
        "artifact_directory": str(data_directory.resolve()),
        "X_train_shape": list(X_tr.shape),
        "X_test_shape": list(X_te.shape),
        "y_train_distribution": {str(key): int(value) for key, value in y_tr.value_counts().items()},
    },
    "validation": {
        "strategy": "StratifiedKFold",
        "n_splits": CV.get_n_splits(),
        "shuffle": True,
        "random_state": 42,
        "scoring": SCORING,
    },
    "parallelism": {"n_jobs": N_JOBS, "pre_dispatch": PRE_DISPATCH},
    "completed_baseline_configs": [],
    "completed_models": [],
    "artifacts": [],
}


def write_run_metadata():
    RUN_METADATA["updated_at_utc"] = datetime.now(timezone.utc).isoformat()
    target = RUN_DIRECTORY / "run_metadata.json"
    temporary = target.with_name("run_metadata.tmp.json")
    temporary.write_text(
        json.dumps(RUN_METADATA, ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )
    temporary.replace(target)


def write_dataframe_checkpoint(dataframe, filename):
    target = RUN_DIRECTORY / filename
    temporary = target.with_name(f"{target.stem}.tmp{target.suffix}")
    dataframe.to_csv(temporary, index=False, encoding="utf-8")
    temporary.replace(target)
    relative_path = str(target.relative_to(RUN_DIRECTORY))
    if relative_path not in RUN_METADATA["artifacts"]:
        RUN_METADATA["artifacts"].append(relative_path)
    write_run_metadata()


def create_pipeline(preprocessor, estimator):
    return Pipeline(
        [("prep", preprocessor), ("clf", clone(estimator))],
        memory=PIPELINE_MEMORY,
    )


def resolve_config_name(preprocessor):
    signature = tuple(name for name, _, _ in preprocessor.transformers)
    return CONFIG_BY_SIGNATURE[signature]


def format_parameter_value(parameter_value):
    if parameter_value is None:
        return "None"
    if isinstance(parameter_value, (float, np.floating)):
        return f"{float(parameter_value):.4g}"
    if isinstance(parameter_value, (int, np.integer)):
        return str(int(parameter_value))
    return str(parameter_value)


def json_value(value):
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, Path):
        return str(value)
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return repr(value)


def effective_candidate_parameters(model_name, candidate_params):
    effective_params = MODEL_SPECS[model_name]["estimator"].get_params(deep=False)
    effective_params.update(
        {
            name.removeprefix("clf__"): value
            for name, value in candidate_params.items()
            if name.startswith("clf__")
        }
    )
    return {
        "config": resolve_config_name(candidate_params["prep"]),
        "estimator": {key: json_value(value) for key, value in effective_params.items()},
        "search_parameters": {
            key: resolve_config_name(value) if key == "prep" else json_value(value)
            for key, value in candidate_params.items()
        },
    }


def candidate_parameters_json(model_name, candidate_params):
    return json.dumps(
        effective_candidate_parameters(model_name, candidate_params),
        ensure_ascii=False,
        sort_keys=True,
    )


def summarize_search_candidate(cv_results, index):
    details = {}
    for metric_name, column_name in METRIC_COLUMNS.items():
        details[column_name] = float(cv_results[f"mean_test_{metric_name}"][index])
        details[f"{column_name}_std"] = float(cv_results[f"std_test_{metric_name}"][index])
        train_mean = float(cv_results[f"mean_train_{metric_name}"][index])
        train_std = float(cv_results[f"std_train_{metric_name}"][index])
        details[f"{metric_name}_treino_cv"] = train_mean
        details[f"{metric_name}_treino_cv_std"] = train_std
        if metric_name == "f1_macro":
            details["f1_macro_treino"] = train_mean
            details["f1_macro_treino_std"] = train_std
        for fold_index in range(CV.get_n_splits()):
            details[f"fold_{fold_index + 1}_test_{metric_name}"] = float(
                cv_results[f"split{fold_index}_test_{metric_name}"][index]
            )
            details[f"fold_{fold_index + 1}_train_{metric_name}"] = float(
                cv_results[f"split{fold_index}_train_{metric_name}"][index]
            )
    details["tempo_medio_fit_s"] = float(cv_results["mean_fit_time"][index])
    details["tempo_fit_std_s"] = float(cv_results["std_fit_time"][index])
    details["tempo_medio_score_s"] = float(cv_results["mean_score_time"][index])
    details["tempo_score_std_s"] = float(cv_results["std_score_time"][index])
    return details


def summarize_cross_validation(fold_scores):
    details = {}
    for metric_name, column_name in METRIC_COLUMNS.items():
        test_scores = np.asarray(fold_scores[f"test_{metric_name}"], dtype=float)
        train_scores = np.asarray(fold_scores[f"train_{metric_name}"], dtype=float)
        details[column_name] = float(test_scores.mean())
        details[f"{column_name}_std"] = float(test_scores.std())
        details[f"{metric_name}_treino_cv"] = float(train_scores.mean())
        details[f"{metric_name}_treino_cv_std"] = float(train_scores.std())
        if metric_name == "f1_macro":
            details["f1_macro_treino"] = float(train_scores.mean())
            details["f1_macro_treino_std"] = float(train_scores.std())
        for fold_index, (test_score, train_score) in enumerate(zip(test_scores, train_scores), start=1):
            details[f"fold_{fold_index}_test_{metric_name}"] = float(test_score)
            details[f"fold_{fold_index}_train_{metric_name}"] = float(train_score)
    fit_times = np.asarray(fold_scores["fit_time"], dtype=float)
    score_times = np.asarray(fold_scores["score_time"], dtype=float)
    details["tempo_medio_fit_s"] = float(fit_times.mean())
    details["tempo_fit_std_s"] = float(fit_times.std())
    details["tempo_medio_score_s"] = float(score_times.mean())
    details["tempo_score_std_s"] = float(score_times.std())
    for fold_index, (fit_time, score_time) in enumerate(zip(fit_times, score_times), start=1):
        details[f"fold_{fold_index}_fit_time_s"] = float(fit_time)
        details[f"fold_{fold_index}_score_time_s"] = float(score_time)
    return details


def collect_search_rows(search, model_name, search_name):
    cv_results = search.cv_results_
    model_spec = MODEL_SPECS[model_name]
    result_rows = []
    for index, candidate_params in enumerate(cv_results["params"]):
        row = {
            "modelo": model_name,
            "busca": search_name,
            "config": resolve_config_name(candidate_params["prep"]),
            "candidate_index": index,
            "parameters_json": candidate_parameters_json(model_name, candidate_params),
        }
        row.update(summarize_search_candidate(cv_results, index))
        row["overfit_gap"] = row["f1_macro_treino"] - row["f1_macro_cv"]
        effective_params = model_spec["estimator"].get_params(deep=False)
        effective_params.update(
            {
                name.removeprefix("clf__"): value
                for name, value in candidate_params.items()
                if name.startswith("clf__")
            }
        )
        row.update(
            {
                f"param_{name}": format_parameter_value(effective_params[name])
                for name in model_spec["report_params"]
            }
        )
        result_rows.append(row)
    return result_rows


def best_candidate(search):
    scores = np.asarray(search.cv_results_["mean_test_f1_macro"], dtype=float)
    best_index = int(np.nanargmax(scores))
    return best_index, float(scores[best_index]), search.cv_results_["params"][best_index]


def model_slug(model_name):
    return re.sub(r"[^A-Za-z0-9_-]+", "_", model_name).strip("_").lower()


def persist_search_checkpoint(search, model_name, search_name):
    new_rows = collect_search_rows(search, model_name, search_name)
    SEARCH_ROWS.extend(new_rows)
    write_dataframe_checkpoint(pd.DataFrame(SEARCH_ROWS), "search_candidates.csv")

    cv_export = pd.DataFrame(search.cv_results_).drop(
        columns=["params", "param_prep"], errors="ignore"
    )
    cv_export.insert(
        0,
        "parameters_json",
        [candidate_parameters_json(model_name, params) for params in search.cv_results_["params"]],
    )
    cv_export.insert(
        1,
        "config",
        [resolve_config_name(params["prep"]) for params in search.cv_results_["params"]],
    )
    cv_export.insert(0, "busca", search_name)
    cv_export.insert(0, "modelo", model_name)
    cv_export.insert(0, "candidate_index", range(len(search.cv_results_["params"])))
    model_number = list(MODEL_SPECS).index(model_name) + 1
    filename = f"cv_results_{model_number:02d}_{model_slug(model_name)}.csv"
    write_dataframe_checkpoint(cv_export, filename)

    RUN_METADATA["completed_models"].append(
        {"model": model_name, "candidate_count": len(search.cv_results_["params"]), "cv_fits": len(search.cv_results_["params"]) * CV.get_n_splits()}
    )
    RUN_METADATA["status"] = "search_in_progress"
    write_run_metadata()


write_run_metadata()
print(f"Execu\u00e7\u00e3o: {SEARCH_METHOD}; artefatos e checkpoints: {RUN_DIRECTORY}")
print(f"Valida\u00e7\u00e3o: {CV.get_n_splits()} folds estratificados; atributos: {len(PREPROCESSORS)}; modelos: {len(MODEL_SPECS)}")
print(f"Paralelismo limitado: n_jobs={N_JOBS}, pre_dispatch={PRE_DISPATCH}")

# ## Como ler os hiperparâmetros
# 
# O prefixo `clf__` identifica parâmetros do classificador dentro do `Pipeline`; `prep` escolhe um dos quatro conjuntos de atributos. O Grid Search percorre os valores discretos abaixo e compara cada combinação pelo F1 macro médio nos mesmos três folds.
# 
# | Modelo / parâmetro | O que controla | Valores percorridos |
# |---|---|---|
# | Regressão Logística / `C` | Inverso da força da regularização L2. `C` menor regulariza mais; `C` maior regulariza menos. | 0,1; 1; 10 |
# | SVM Linear / `C` | Penalidade dos erros em relação à margem. `C` menor regulariza mais; `C` maior penaliza mais os erros e regulariza menos. | 0,1; 1; 10 |
# | Regressão Logística e SVM / `class_weight` | Peso atribuído aos erros de cada classe. | `None`; `balanced` |
# | Random Forest / `n_estimators` | Quantidade de árvores; mais árvores custam mais e tendem a estabilizar a média, sem garantir melhora. | 100; 250 |
# | Random Forest / `max_depth` | Profundidade máxima; `None` deixa crescer até os limites de folha. | `None`; 30 |
# | Random Forest / `min_samples_leaf` | Mínimo de amostras por folha; valor maior restringe a complexidade. | 1; 3 |
# | Random Forest / `class_weight` | Peso dos erros de cada classe. | `None`; `balanced` |
# 
# No Grid Search, `min_samples_split=2` e `max_features='sqrt'` ficam fixos no Random Forest; a busca não mede o efeito deles. Também permanecem fixos os demais parâmetros dos estimadores (por exemplo, `solver`, `penalty`, `criterion` e `bootstrap`). A tabela de sensibilidade abaixo mostra comparações com os demais parâmetros e o pré-processador mantidos no candidato vencedor. A SVM usa `max_iter=10000` para reduzir os avisos de não convergência observados antes; confirme no novo resultado se ainda há `ConvergenceWarning` antes de interpretar seus scores.
# 
# Os máximos de F1 entre Random Search e Grid Search não medem qual método é melhor com o mesmo orçamento: o Random Search testa 16 candidatos por modelo, enquanto a grade enumera todos os pontos discretos definidos para cada modelo. Os espaços também diferem, então compare os efeitos locais com os valores e configurações apresentados, não só os máximos.

# ## Linha de base
# 
# Cada configuração-base dos três modelos está presente na grade. A célula do Grid Search identificará esses 12 candidatos depois da avaliação e montará a comparação de linha de base com os mesmos scores por fold. Nenhum ajuste adicional é necessário.

# ## 3. Grid Search
# 
# Para cada modelo, o Grid Search percorre todas as combinações discretas de hiperparâmetros e preprocessadores disponíveis. Cada candidato é avaliado nos três folds estratificados; TF-IDF e classificador são ajustados novamente em cada fold. Para a amostragem aleatória, consulte [`07_Random_Search.ipynb`](07_Random_Search.ipynb).

from sklearn.model_selection import ParameterGrid

GRID_CANDIDATES = {
    model_name: len(
        list(
            ParameterGrid(
                {"prep": list(PREPROCESSORS.values()), **model_spec["grid"]}
            )
        )
    )
    for model_name, model_spec in MODEL_SPECS.items()
}
GRID_FITS = sum(GRID_CANDIDATES.values()) * CV.get_n_splits()

print(f"Grid Search: {GRID_CANDIDATES} candidatos por modelo")
print(f"Ajustes estimados nos folds: {GRID_FITS}")
print("Linha de base: 12 candidatos reutilizados da grade; 0 ajustes extras")
print("Refit em todo o treino: desativado; o estimador final não era usado neste notebook")

SEARCH_ROWS = []
SEARCH_OBJECTS = {}
RUN_METADATA["status"] = "search_in_progress"
write_run_metadata()

for model_name, model_spec in MODEL_SPECS.items():
    print(f"{model_name} | {SEARCH_METHOD}: iniciando busca")
    estimator = create_pipeline(PREPROCESSORS["word"], model_spec["estimator"])
    search = GridSearchCV(
        estimator=estimator,
        param_grid={
            "prep": list(PREPROCESSORS.values()),
            **model_spec["grid"],
        },
        scoring=SCORING,
        refit=False,
        cv=CV,
        return_train_score=True,
        n_jobs=N_JOBS,
        pre_dispatch=PRE_DISPATCH,
        verbose=1,
        error_score="raise",
    )
    search.fit(X_tr, y_tr)
    SEARCH_OBJECTS[(model_name, SEARCH_METHOD)] = search
    persist_search_checkpoint(search, model_name, SEARCH_METHOD)
    _, model_best_score, model_best_params = best_candidate(search)
    print(
        f"{model_name} | {SEARCH_METHOD}: F1 macro CV={model_best_score:.4f}; "
        f"config={resolve_config_name(model_best_params['prep'])}; candidatos salvos"
    )

SEARCH_RESULTS_DF = pd.DataFrame(SEARCH_ROWS)
if SEARCH_METHOD == "Grid Search":
    BASELINE_ROWS = []
    for model_name, model_spec in MODEL_SPECS.items():
        model_rows = SEARCH_RESULTS_DF.loc[SEARCH_RESULTS_DF["modelo"] == model_name]
        for config_name in PREPROCESSORS:
            matching_rows = model_rows.loc[model_rows["config"] == config_name]
            for param_name, param_value in model_spec["baseline_params"].items():
                column_name = f"param_{param_name}"
                matching_rows = matching_rows.loc[
                    matching_rows[column_name] == format_parameter_value(param_value)
                ]
            if len(matching_rows) != 1:
                raise ValueError(
                    f"Esperado exatamente um candidato-base para {model_name}/{config_name}; encontrado {len(matching_rows)}."
                )
            baseline_row = matching_rows.iloc[0].to_dict()
            baseline_row["busca"] = "Baseline"
            BASELINE_ROWS.append(baseline_row)
    BASELINE_DF = pd.DataFrame(BASELINE_ROWS)
    write_dataframe_checkpoint(BASELINE_DF, "baseline_candidates.csv")
    RUN_METADATA["baseline_source"] = "candidatos correspondentes do Grid Search; sem novos ajustes"
    RUN_METADATA["completed_baseline_configs"] = [
        {"model": model_name, "config": config_name, "cv_fits_reused": CV.get_n_splits()}
        for model_name in MODEL_SPECS for config_name in PREPROCESSORS
    ]
    write_run_metadata()
    BASELINE_LEADERBOARD = (
        BASELINE_DF.sort_values("f1_macro_cv", ascending=False)
        .groupby("modelo", sort=False)
        .head(1)
        .sort_values("f1_macro_cv", ascending=False)
    )

BEST_SEARCH_DF = SEARCH_RESULTS_DF.loc[
    SEARCH_RESULTS_DF.groupby("modelo", sort=False)["f1_macro_cv"].idxmax()
].reset_index(drop=True)
COMPARISON_DF = pd.concat([BASELINE_LEADERBOARD, BEST_SEARCH_DF], ignore_index=True)

RUN_METADATA["status"] = "search_complete"
write_dataframe_checkpoint(BEST_SEARCH_DF, "best_search_candidates.csv")
write_run_metadata()

comparison_columns = [
    "modelo",
    "busca",
    "config",
    "f1_macro_cv",
    "f1_macro_cv_std",
    "accuracy_cv",
    "precision_macro_cv",
    "recall_macro_cv",
    "roc_auc_cv",
    "overfit_gap",
]
display(
    COMPARISON_DF[comparison_columns]
    .sort_values(["modelo", "f1_macro_cv"], ascending=[True, False])
    .reset_index(drop=True)
)

if not ARGS.skip_plots:
    import matplotlib.pyplot as plt
    import seaborn as sns

    plt.figure(figsize=(11, 6))
    sns.barplot(
        data=COMPARISON_DF,
        x="f1_macro_cv",
        y="modelo",
        hue="busca",
    )
    plt.title("F1 macro por modelo e estratégia de busca")
    plt.xlabel("F1 macro médio na validação cruzada")
    plt.ylabel("Modelo")
    plt.xlim(0, 1)
    plt.grid(axis="x", linestyle="--", alpha=0.5)
    plt.tight_layout()
    plt.savefig(RUN_DIRECTORY / "comparison_f1.png", dpi=150, bbox_inches="tight")
    plt.close()

    plt.figure(figsize=(10, 6))
    sns.scatterplot(
        data=SEARCH_RESULTS_DF,
        x="tempo_medio_fit_s",
        y="f1_macro_cv",
        hue="busca",
        style="modelo",
        size="f1_macro_cv_std",
        sizes=(30, 180),
        alpha=0.8,
    )
    plt.title("Desempenho versus custo por candidato")
    plt.xlabel("Tempo médio de ajuste por fold (s)")
    plt.ylabel("F1 macro médio na validação cruzada")
    plt.grid(True, linestyle="--", alpha=0.4)
    plt.tight_layout()
    plt.savefig(RUN_DIRECTORY / "comparison_runtime.png", dpi=150, bbox_inches="tight")
    plt.close()

    # Nos modelos lineares, C é numérico e foi amostrado em escala logarítmica.
    linear_results = SEARCH_RESULTS_DF.loc[
        SEARCH_RESULTS_DF["modelo"].isin(["Regressão Logística", "SVM Linear"])
    ].copy()
    linear_results["param_C_num"] = pd.to_numeric(linear_results["param_C"], errors="coerce")

    fig, axes = plt.subplots(1, 2, figsize=(13, 5), sharey=True)
    for axis, model_name in zip(axes, ["Regressão Logística", "SVM Linear"]):
        model_results = linear_results.loc[linear_results["modelo"] == model_name]
        sns.scatterplot(
            data=model_results,
            x="param_C_num",
            y="f1_macro_cv",
            hue="config",
            style="busca",
            alpha=0.8,
            ax=axis,
        )
        axis.set_xscale("log")
        axis.set_title(model_name)
        axis.set_xlabel("C (escala logarítmica)")
        axis.grid(True, linestyle="--", alpha=0.4)
    axes[0].set_ylabel("F1 macro médio na validação cruzada")
    fig.tight_layout()
    plt.savefig(RUN_DIRECTORY / "search_parameter_distribution.png", dpi=150, bbox_inches="tight")
    plt.close()
else:
    print("Plot generation skipped (--skip-plots).")

# ## Sensibilidade controlada no candidato vencedor
# 
# A tabela seguinte muda um hiperparâmetro por vez, mantendo o pré-processador e os demais parâmetros no melhor candidato do Grid Search. Como a grade contém todas as combinações configuradas, cada comparação reutiliza os resultados já calculados. `delta_f1_macro` mostra a diferença para o valor vencedor daquele parâmetro.
# 
# Esta leitura mostra efeitos locais, não interações entre parâmetros nem garantia de desempenho fora dos folds. Considere a dispersão entre folds ao julgar diferenças pequenas. Parâmetros com um único valor aparecem como fixos e não têm efeito medido nesta busca.

if ARGS.skip_sensitivity:
    RUN_METADATA["status"] = "complete"
    RUN_METADATA["sensitivity_analysis"] = "skipped_by_user"
    write_run_metadata()
    print("Sensitivity analysis skipped (--skip-sensitivity).")
    print(f"Results saved to: {RUN_DIRECTORY}")
else:
    RUN_METADATA["status"] = "analysis_in_progress"
    write_run_metadata()
    BEST_PARAMETER_ROWS = []
    SENSITIVITY_ROWS = []
    FIXED_GRID_ROWS = []


    def same_parameter_value(left, right):
        if isinstance(left, (int, float, np.integer, np.floating)) and isinstance(
            right, (int, float, np.integer, np.floating)
        ):
            return bool(np.isclose(float(left), float(right), rtol=1e-12, atol=0.0))
        return left == right


    def find_candidate_index(search, desired_params, search_space, config_name):
        for candidate_index, candidate_params in enumerate(search.cv_results_["params"]):
            if resolve_config_name(candidate_params["prep"]) != config_name:
                continue
            if all(
                same_parameter_value(candidate_params[key], desired_params[key])
                for key in search_space
            ):
                return candidate_index
        return None


    for model_name, model_spec in MODEL_SPECS.items():
        search = SEARCH_OBJECTS[(model_name, SEARCH_METHOD)]
        best_index, best_score, best_params = best_candidate(search)
        best_config = resolve_config_name(best_params["prep"])
        search_space = model_spec["grid"]
        estimator_defaults = model_spec["estimator"].get_params(deep=False)
        best_settings = {
            name: best_params.get(f"clf__{name}", estimator_defaults[name])
            for name in model_spec["report_params"]
        }

        best_row = {
            "modelo": model_name,
            "config": best_config,
            "f1_macro_cv": float(best_score),
            "candidate_index": best_index,
            "parameters_json": candidate_parameters_json(model_name, best_params),
        }
        best_row.update(
            {f"param_{name}": format_parameter_value(value) for name, value in best_settings.items()}
        )
        BEST_PARAMETER_ROWS.append(best_row)

        for param_key, searched_values in search_space.items():
            unique_values = []
            for value in searched_values:
                if not any(same_parameter_value(value, seen) for seen in unique_values):
                    unique_values.append(value)

            if len(unique_values) <= 1:
                FIXED_GRID_ROWS.append(
                    {
                        "modelo": model_name,
                        "hiperparametro": param_key.removeprefix("clf__"),
                        "valor_fixo": format_parameter_value(unique_values[0]) if unique_values else "não variado",
                    }
                )
                continue

            selected_value = best_settings[param_key.removeprefix("clf__")]
            parameter_rows = []
            for value in unique_values:
                candidate_params = dict(best_params)
                candidate_params[param_key] = value
                candidate_index = find_candidate_index(
                    search, candidate_params, search_space, best_config
                )
                if candidate_index is None:
                    raise ValueError(
                        f"Candidato de sensibilidade não encontrado na grade: {model_name}, {param_key}={value}."
                    )
                candidate_details = summarize_search_candidate(search.cv_results_, candidate_index)
                candidate_details["overfit_gap"] = (
                    candidate_details["f1_macro_treino"] - candidate_details["f1_macro_cv"]
                )
                parameter_rows.append(
                    {
                        **candidate_details,
                        "modelo": model_name,
                        "config": best_config,
                        "hiperparametro": param_key.removeprefix("clf__"),
                        "valor": format_parameter_value(value),
                        "candidate_index": candidate_index,
                        "parameters_json": candidate_parameters_json(model_name, candidate_params),
                        "_valor_original": value,
                        "_valor_escolhido": selected_value,
                        "f1_macro_cv": float(search.cv_results_["mean_test_f1_macro"][candidate_index]),
                        "f1_macro_cv_std": float(search.cv_results_["std_test_f1_macro"][candidate_index]),
                    }
                )

            selected_rows = [
                row for row in parameter_rows
                if same_parameter_value(row["_valor_original"], row["_valor_escolhido"])
            ]
            reference_score = selected_rows[0]["f1_macro_cv"] if selected_rows else float(best_score)
            for row in parameter_rows:
                row["delta_f1_macro"] = row["f1_macro_cv"] - reference_score
                row.pop("_valor_original")
                row.pop("_valor_escolhido")
                SENSITIVITY_ROWS.append(row)

    BEST_PARAMETER_DF = pd.DataFrame(BEST_PARAMETER_ROWS)
    best_parameter_columns = ["modelo", "config", "f1_macro_cv"]
    for model_spec in MODEL_SPECS.values():
        best_parameter_columns.extend(f"param_{name}" for name in model_spec["report_params"])
    best_parameter_columns = list(dict.fromkeys(
        column for column in best_parameter_columns if column in BEST_PARAMETER_DF.columns
    ))
    print(f"Melhores candidatos por modelo — {SEARCH_METHOD}")
    display(BEST_PARAMETER_DF[best_parameter_columns].reset_index(drop=True))

    SENSITIVITY_DF = pd.DataFrame(SENSITIVITY_ROWS)
    write_dataframe_checkpoint(BEST_PARAMETER_DF, "best_parameters.csv")
    write_dataframe_checkpoint(SENSITIVITY_DF, "sensitivity_results.csv")
    print("Comparação de um fator por vez, com os demais parâmetros e atributos fixos no melhor candidato")
    display(
        SENSITIVITY_DF.sort_values(
            ["modelo", "hiperparametro", "delta_f1_macro"],
            ascending=[True, True, False],
        ).reset_index(drop=True)
    )

    FIXED_GRID_DF = pd.DataFrame(FIXED_GRID_ROWS)
    write_dataframe_checkpoint(FIXED_GRID_DF, "fixed_grid_parameters.csv")
    if not FIXED_GRID_DF.empty:
        print("Parâmetros que o Grid Search manteve fixos")
        display(FIXED_GRID_DF.reset_index(drop=True))

    RUN_METADATA["status"] = "complete"
    write_run_metadata()
    print(f"Resultados completos salvos em: {RUN_DIRECTORY}")

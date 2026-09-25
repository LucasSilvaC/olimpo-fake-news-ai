"""Funções compartilhadas pelos notebooks de detecção de anomalias (02_IF, 03_OCSVM, 04_LOF).

Todos os detectores aprendem somente com notícias True (label 0). O anomalyScore é
-decision_function: maior = mais anômalo. Não é probabilidade de falsidade.
"""
import time

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.metrics import (
    average_precision_score, confusion_matrix, f1_score, precision_score,
    recall_score, roc_auc_score,
)

LABEL_NAMES = {0: "True", 1: "Fake"}


def combinePartitions(partitions, stage):
    """Junta normal<stage> e fake<stage> (stage = "Validation" ou "Test")."""
    return pd.concat([
        partitions[f"normal{stage}"].assign(partition=f"normal{stage}"),
        partitions[f"fake{stage}"].assign(partition=f"fake{stage}"),
    ], ignore_index=True)


def fitNormalOnly(pipeline, trainingFrame, features):
    if trainingFrame.empty or not trainingFrame["label"].eq(0).all():
        raise ValueError("Treino permitido apenas com notícias True (label == 0).")
    trainingFeatures = trainingFrame[features]
    if np.isinf(trainingFeatures.to_numpy(dtype=float)).any():
        raise ValueError("Features de treino contêm infinito.")
    emptyColumns = trainingFeatures.columns[trainingFeatures.isna().all()].tolist()
    if emptyColumns:
        raise ValueError(f"Features inteiramente ausentes em normalTrain: {emptyColumns}")
    pipeline.fit(trainingFeatures)
    # LOF com novelty=True não pode pontuar as próprias amostras do fit.
    pipeline._normalTrainIds = frozenset(trainingFrame["id"].astype(str))
    np.testing.assert_allclose(pipeline["imputer"].statistics_, trainingFeatures.median().to_numpy())
    if "scaler" in pipeline.named_steps:
        imputedTrain = pipeline["imputer"].transform(trainingFeatures)
        expectedScale = imputedTrain.std(axis=0)
        expectedScale[expectedScale == 0] = 1.0
        np.testing.assert_allclose(pipeline["scaler"].mean_, imputedTrain.mean(axis=0))
        np.testing.assert_allclose(pipeline["scaler"].scale_, expectedScale)
    return pipeline


def _assertUnseen(pipeline, frame):
    overlap = getattr(pipeline, "_normalTrainIds", frozenset()).intersection(frame["id"].astype(str))
    if overlap:
        raise AssertionError(f"Pontuação de amostras usadas no fit: {len(overlap)} IDs")


def anomalyScores(pipeline, frame, features):
    _assertUnseen(pipeline, frame)
    scores = -pipeline.decision_function(frame[features])
    if not np.isfinite(scores).all():
        raise ValueError("Scores não finitos.")
    return np.asarray(scores, dtype=float)


def nativeFlags(pipeline, frame, features):
    """Fronteira nativa do detector (decision_function < 0), conferida com predict == -1."""
    _assertUnseen(pipeline, frame)
    decisionFlags = pipeline.decision_function(frame[features]) < 0
    if not np.array_equal(decisionFlags, pipeline.predict(frame[features]) == -1):
        raise AssertionError("Fronteira nativa divergiu de predict == -1.")
    return decisionFlags


def binaryMetrics(labels, scores, flags):
    """Classe positiva = Fake (1). ROC-AUC/AP usam scores; demais métricas usam flags."""
    labels = np.asarray(labels, dtype=int)
    flags = np.asarray(flags, dtype=bool)
    matrix = confusion_matrix(labels, flags.astype(int), labels=[0, 1])
    tn, fp, fn, tp = (int(value) for value in matrix.ravel())
    return {
        "rocAuc": float(roc_auc_score(labels, scores)),
        "averagePrecision": float(average_precision_score(labels, scores)),
        "fakePrevalence": float(np.mean(labels == 1)),
        "tn": tn, "fp": fp, "fn": fn, "tp": tp,
        "accuracy": float((tp + tn) / matrix.sum()),
        "precision": float(precision_score(labels, flags, zero_division=0)),
        "recall": float(recall_score(labels, flags, zero_division=0)),
        "f1": float(f1_score(labels, flags, zero_division=0)),
        "fpr": float(fp / (tn + fp)) if tn + fp else 0.0,
    }


def evaluateQ95(pipeline, partitions, features, fit=True):
    """Ajusta em normalTrain (se `fit`), calibra o corte q95 em normalValidation e avalia uma vez no teste."""
    if fit:
        pipeline = fitNormalOnly(clone(pipeline), partitions["normalTrain"], features)
    normalValidationScores = anomalyScores(pipeline, partitions["normalValidation"], features)
    threshold = float(np.quantile(normalValidationScores, 0.95))
    testFrame = combinePartitions(partitions, "Test")
    labels = testFrame["label"].to_numpy(dtype=int)
    scores = anomalyScores(pipeline, testFrame, features)
    q95Flags = scores >= threshold
    native = nativeFlags(pipeline, testFrame, features)
    return {
        "pipeline": pipeline, "threshold": threshold, "testFrame": testFrame,
        "normalValidationScores": normalValidationScores,
        "scores": scores, "q95Flags": q95Flags, "nativeFlags": native,
        "q95Metrics": binaryMetrics(labels, scores, q95Flags),
        "nativeMetrics": binaryMetrics(labels, scores, native),
    }


def evaluateCandidates(candidates, partitions, features, describe=None):
    """Ajusta cada candidato em normalTrain e mede na validação (q95 calibrado só em True).

    `describe(pipeline)` pode devolver campos extras, específicos do modelo, para o registro.
    """
    validationFrame = combinePartitions(partitions, "Validation")
    validationLabels = validationFrame["label"].to_numpy(dtype=int)
    fittedPipelines, records = {}, []
    for modelKey, pipeline in candidates.items():
        fitStarted = time.perf_counter()
        pipeline = fitNormalOnly(clone(pipeline), partitions["normalTrain"], features)
        fitSeconds = time.perf_counter() - fitStarted
        normalValidationScores = anomalyScores(pipeline, partitions["normalValidation"], features)
        validationScores = anomalyScores(pipeline, validationFrame, features)
        q95Threshold = float(np.quantile(normalValidationScores, 0.95))
        q95 = binaryMetrics(validationLabels, validationScores, validationScores >= q95Threshold)
        native = binaryMetrics(validationLabels, validationScores, nativeFlags(pipeline, validationFrame, features))
        records.append({
            "modelKey": modelKey,
            **(describe(pipeline) if describe else {}),
            "fitSeconds": fitSeconds,
            "q95Threshold": q95Threshold,
            "normalValidationQ95AlertRate": float(np.mean(normalValidationScores >= q95Threshold)),
            "validationRocAuc": q95["rocAuc"],
            "validationAveragePrecision": q95["averagePrecision"],
            "nativeMetrics": native, "q95Metrics": q95,
        })
        fittedPipelines[modelKey] = pipeline
    return fittedPipelines, pd.DataFrame(records)


def selectCandidate(validationResults, tieBreakColumn, tolerance=1e-12):
    """ROC-AUC de validação → AP → menor valor de `tieBreakColumn`."""
    aucTies = validationResults[validationResults["validationRocAuc"].max() - validationResults["validationRocAuc"] <= tolerance]
    apTies = aucTies[aucTies["validationAveragePrecision"].max() - aucTies["validationAveragePrecision"] <= tolerance]
    return apTies.sort_values(tieBreakColumn).iloc[0]["modelKey"]


def transition(leftFlags, rightFlags, leftName, rightName):
    leftFlags, rightFlags = np.asarray(leftFlags, dtype=bool), np.asarray(rightFlags, dtype=bool)
    return np.select(
        [leftFlags & rightFlags, ~leftFlags & ~rightFlags, leftFlags],
        ["alerta_mantido", "sem_alerta", f"alerta_adicionado_{leftName}"],
        default=f"alerta_adicionado_{rightName}",
    )


def scoreSummary(frame, scoreColumn):
    summary = frame.groupby("label")[scoreColumn].agg(["count", "mean", "median", "std", "min", "max"])
    summary.insert(0, "class", summary.index.map(LABEL_NAMES))
    return summary


def extremeCases(frame, scoreColumn, n=5):
    trueFrame, fakeFrame = frame.loc[frame["label"].eq(0)], frame.loc[frame["label"].eq(1)]
    return {
        f"{n} True mais anômalas": trueFrame.nlargest(n, scoreColumn).reset_index(drop=True),
        f"{n} Fake mais anômalas": fakeFrame.nlargest(n, scoreColumn).reset_index(drop=True),
        f"{n} Fake menos anômalas": fakeFrame.nsmallest(n, scoreColumn).reset_index(drop=True),
    }

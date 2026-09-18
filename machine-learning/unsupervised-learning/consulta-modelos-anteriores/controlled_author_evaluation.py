import re

import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def derivePairGroupId(newsId):
    value = str(newsId).strip()
    if not value:
        raise ValueError("id must not be empty")
    return re.sub(r"[tf]$", "", value, flags=re.IGNORECASE)


def splitPairedCorpus(newsFrame, randomState=42):
    required = {"id", "label"}
    missing = required.difference(newsFrame.columns)
    if missing:
        raise ValueError(f"missing required columns: {sorted(missing)}")
    if newsFrame["id"].duplicated().any():
        raise ValueError("id values must be unique")
    if not set(newsFrame["label"]).issubset({0, 1}):
        raise ValueError("label values must follow the 0=True, 1=Fake contract")
    frame = newsFrame.copy()
    frame["pairGroupId"] = frame["id"].map(derivePairGroupId)
    groupedLabels = frame.groupby("pairGroupId")["label"]
    invalid = [groupId for groupId, labels in groupedLabels if 0 not in set(labels)]
    if invalid:
        raise ValueError(f"each pair group must contain a True row: {invalid[:3]}")

    groupIds = np.array(sorted(frame["pairGroupId"].unique()), dtype=object)
    rng = np.random.default_rng(randomState)
    rng.shuffle(groupIds)
    trainCount = int(round(len(groupIds) * 0.6))
    validationCount = int(round(len(groupIds) * 0.2))
    trainGroups = set(groupIds[:trainCount])
    validationGroups = set(groupIds[trainCount : trainCount + validationCount])
    testGroups = set(groupIds[trainCount + validationCount :])

    groupSeries = frame["pairGroupId"]
    trainRows = groupSeries.isin(trainGroups)
    validationRows = groupSeries.isin(validationGroups)
    testRows = groupSeries.isin(testGroups)
    fakeRows = frame["label"].eq(1)
    normalTrainFrame = frame.loc[trainRows & frame["label"].eq(0)].copy()
    validationFrame = frame.loc[validationRows].copy()
    testFrame = frame.loc[testRows].copy()
    quarantinedFakeFrame = frame.loc[trainRows & fakeRows].copy()

    splitGroupIds = {
        "train": frozenset(trainGroups),
        "validation": frozenset(validationGroups),
        "test": frozenset(testGroups),
    }
    assert not (trainGroups & validationGroups or trainGroups & testGroups or validationGroups & testGroups)
    assert not set(quarantinedFakeFrame["pairGroupId"]) & (validationGroups | testGroups)
    assignedIds = set(normalTrainFrame["id"]) | set(quarantinedFakeFrame["id"])
    assignedIds |= set(validationFrame["id"]) | set(testFrame["id"])
    assert assignedIds == set(frame["id"])
    counts = {
        "trainGroups": len(trainGroups),
        "validationGroups": len(validationGroups),
        "testGroups": len(testGroups),
        "normalTrain": len(normalTrainFrame),
        "validation": len(validationFrame),
        "test": len(testFrame),
        "quarantinedFake": len(quarantinedFakeFrame),
    }
    result = {
        "normalTrainFrame": normalTrainFrame,
        "normalValidationFrame": validationFrame.loc[validationFrame["label"].eq(0)].copy(),
        "normalTestFrame": testFrame.loc[testFrame["label"].eq(0)].copy(),
        "fakeValidationFrame": validationFrame.loc[validationFrame["label"].eq(1)].copy(),
        "fakeTestFrame": testFrame.loc[testFrame["label"].eq(1)].copy(),
        "validationFrame": validationFrame,
        "testFrame": testFrame,
        "quarantinedFakeFrame": quarantinedFakeFrame,
        "splitGroupIds": splitGroupIds,
        "counts": counts,
    }
    return result


def buildGroupedPartitions(newsFrame, randomState=42):
    result = splitPairedCorpus(newsFrame, randomState=randomState)
    return {
        "normalTrain": result["normalTrainFrame"],
        "normalValidation": result["normalValidationFrame"],
        "normalTest": result["normalTestFrame"],
        "fakeValidation": result["fakeValidationFrame"],
        "fakeTest": result["fakeTestFrame"],
        "quarantinedFake": result["quarantinedFakeFrame"],
        "splitGroupIds": result["splitGroupIds"],
        "counts": result["counts"],
    }


def _safeMetric(metricFunction, labels, flags):
    predictedPositive = flags.sum()
    actualPositive = (labels == 1).sum()
    truePositive = ((labels == 1) & flags).sum()
    if metricFunction is precision_score:
        denominator = predictedPositive
        numerator = truePositive
    elif metricFunction is recall_score:
        denominator = actualPositive
        numerator = truePositive
    else:
        denominator = predictedPositive + actualPositive
        numerator = 2 * truePositive
    if denominator == 0:
        return np.nan
    return float(numerator / denominator)


def evaluateAnomalyScores(resultsFrame, scoreColumn="anomalyScore", flagColumn="isAnomaly"):
    required = {"label", scoreColumn, flagColumn}
    missing = required.difference(resultsFrame.columns)
    if missing:
        raise ValueError(f"missing required columns: {sorted(missing)}")
    labels = resultsFrame["label"].to_numpy()
    if not set(labels).issubset({0, 1}):
        raise ValueError("label values must follow the 0=True, 1=Fake contract")
    scores = resultsFrame[scoreColumn].to_numpy(dtype=float)
    flags = resultsFrame[flagColumn].astype(bool).to_numpy()
    positives = labels == 1
    negatives = labels == 0
    tn, fp, fn, tp = confusion_matrix(labels, flags.astype(int), labels=[0, 1]).ravel()
    metrics = {
        "count": len(labels),
        "fakeCount": int(positives.sum()),
        "trueCount": int(negatives.sum()),
        "rocAuc": float(roc_auc_score(labels, scores)) if len(np.unique(labels)) == 2 else np.nan,
        "averagePrecision": float(average_precision_score(labels, scores)) if positives.any() else np.nan,
        "precision": _safeMetric(precision_score, labels, flags),
        "recall": _safeMetric(recall_score, labels, flags),
        "f1": _safeMetric(f1_score, labels, flags),
        "trueNegative": int(tn), "falsePositive": int(fp),
        "falseNegative": int(fn), "truePositive": int(tp),
        "falsePositiveRate": float(fp / negatives.sum()) if negatives.any() else np.nan,
        "fakeDetectionRate": float(tp / positives.sum()) if positives.any() else np.nan,
    }
    return metrics


def evaluateAuthorSubgroups(resultsFrame, scoreColumn="anomalyScore", flagColumn="isAnomaly", authorColumn="tem_autor"):
    if authorColumn not in resultsFrame.columns:
        raise ValueError(f"missing required column: {authorColumn}")
    rows = []
    for label, labelName in [(0, "true"), (1, "fake")]:
        for hasAuthor, authorName in [(0, "withoutAuthor"), (1, "withAuthor")]:
            subset = resultsFrame.loc[resultsFrame["label"].eq(label) & resultsFrame[authorColumn].eq(hasAuthor)]
            denominator = len(subset)
            flagged = int(subset[flagColumn].astype(bool).sum())
            rows.append({
                "label": labelName, "authorStatus": authorName,
                "denominator": denominator, "anomalyCount": flagged,
                "anomalyRate": float(flagged / denominator) if denominator else np.nan,
                "meanAnomalyScore": float(subset[scoreColumn].mean()) if denominator else np.nan,
            })
    return pd.DataFrame(rows)

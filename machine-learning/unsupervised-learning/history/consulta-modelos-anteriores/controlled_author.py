import numpy as np
import pandas as pd


AUTHOR_STATUSES = {"identified", "not_reported", "unknown"}


def normalizeAuthorStatus(author=None, extractionSucceeded=None):
    if extractionSucceeded is not True:
        return "unknown"
    if author is None or pd.isna(author):
        return "not_reported"
    if isinstance(author, str) and author.strip().lower() in {"", "none", "null"}:
        return "not_reported"
    return "identified"


def calibrateAuthorPolicy(normalValidationScores, lowerQuantile=0.90, thresholdQuantile=0.95):
    if not 0 < lowerQuantile < thresholdQuantile < 1:
        raise ValueError("quantiles must satisfy 0 < lowerQuantile < thresholdQuantile < 1")
    values = np.asarray(normalValidationScores, dtype=float)
    if values.ndim != 1:
        raise ValueError("normalValidationScores must be one-dimensional")
    if values.size == 0 or not np.all(np.isfinite(values)):
        raise ValueError("normalValidationScores must be nonempty and finite")
    lowerBound = float(np.quantile(values, lowerQuantile))
    threshold = float(np.quantile(values, thresholdQuantile))
    return {
        "threshold": threshold,
        "lowerBound": lowerBound,
        "maxAdjustment": threshold - lowerBound,
        "quantiles": {
            "lowerQuantile": float(lowerQuantile),
            "thresholdQuantile": float(thresholdQuantile),
        },
    }


def _asAlignedSeries(values, name, index):
    if isinstance(values, pd.Series):
        if not values.index.equals(index):
            raise ValueError(f"{name} index must align with scores index")
        return values.copy()
    values = list(values)
    if len(values) != len(index):
        raise ValueError(f"{name} must have the same length as scores")
    return pd.Series(values, index=index, name=name)


def applyAuthorPolicy(scores, statuses, policy):
    if isinstance(scores, pd.Series):
        scoreSeries = scores.astype(float).copy()
    else:
        scoreSeries = pd.Series(scores, dtype=float)
    if not np.all(np.isfinite(scoreSeries.to_numpy())):
        raise ValueError("scores must be finite")
    statusSeries = _asAlignedSeries(statuses, "statuses", scoreSeries.index).astype(object)
    invalid = set(statusSeries.dropna()) - AUTHOR_STATUSES
    if invalid or statusSeries.isna().any():
        invalidNames = sorted(repr(value) for value in invalid)
        if statusSeries.isna().any():
            invalidNames.append("None")
        raise ValueError(f"invalid author statuses: {invalidNames}")
    try:
        threshold = float(policy["threshold"])
        lowerBound = float(policy["lowerBound"])
        maxAdjustment = float(policy["maxAdjustment"])
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError("policy must contain numeric threshold, lowerBound, and maxAdjustment") from error
    if not np.all(np.isfinite([threshold, lowerBound, maxAdjustment])):
        raise ValueError("policy bounds must be finite")
    if lowerBound > threshold:
        raise ValueError("policy lowerBound must be less than or equal to threshold")
    expectedAdjustment = threshold - lowerBound
    if maxAdjustment < 0 or not np.isclose(maxAdjustment, expectedAdjustment):
        raise ValueError("policy maxAdjustment must equal threshold - lowerBound")
    base = scoreSeries >= threshold
    eligible = (statusSeries == "not_reported") & (scoreSeries >= lowerBound) & (scoreSeries < threshold)
    adjustment = pd.Series(np.where(eligible, maxAdjustment, 0.0), index=scoreSeries.index)
    adjusted = scoreSeries + adjustment
    return pd.DataFrame({
        "anomalyScore": scoreSeries,
        "authorStatus": statusSeries,
        "authorAdjustment": adjustment,
        "authorAdjustedScore": adjusted,
        "isAnomalyBase": base,
        "isAnomaly": base | (adjusted >= threshold),
    }, index=scoreSeries.index)

"""Per-news linguistic features for a controlled, label-free FP-Growth experiment.

The default window matches the legacy notebook: NFKC, leading BOM removal,
then 300 characters. POS/DEP counts use lexical tokens (not space/punctuation;
numbers remain eligible). spaCy punctuation uses all non-space tokens.
The ``DEP_complete`` view removes a possibly clipped final predicted sentence;
it does not reparse full text and is only a sentence-boundary sensitivity check.
No model loading, downloading, extraction, or mining occurs on import.
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path
import re
import unicodedata
from zipfile import ZipFile

import numpy as np
import pandas as pd

POS_TAGS = ("ADJ", "ADV", "NOUN", "PROPN", "VERB", "PRON")
DEP_TAGS = ("nsubj", "obj", "amod", "advmod", "ccomp", "advcl")
LEGACY_FEATURES = (
    "tem_autor", "typeTokenRatio", "linkDensity", "punctuationDensity",
    "uppercaseRatio", "diversidade",
)
POS_FEATURES = tuple(f"POS_{tag}_rate" for tag in POS_TAGS)
DEP_FEATURES = tuple(f"DEP_{tag}_rate" for tag in DEP_TAGS)
DEP_COMPLETE_FEATURES = tuple(f"DEP_complete_{tag}_rate" for tag in DEP_TAGS)
WORDS = re.compile(r"[^\W\d_]+(?:['’\-][^\W\d_]+)*", re.UNICODE)
TOKENS = re.compile(
    r"[^\W\d_]+(?:['’\-][^\W\d_]+)*|\d+(?:[.,]\d+)*|[^\w\s]", re.UNICODE
)
TERMINAL = re.compile(r'''[.!?…][\s"'’”»\)\]\}]*$''')


def load_records(archive_path) -> pd.DataFrame:
    """Read the frozen full-text ZIP using the legacy IDs and author protocol.

    SHA-256/provenance validation belongs to the calling experiment. Text and
    author are retained for extraction; class is deliberately not a column.
    Duplicated ZIP entries/IDs and absent or unmatched metadata fail explicitly.
    """
    rows = []
    with ZipFile(archive_path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError("Duplicate ZIP member names")
        for folder in ("fake", "true"):
            marker = f"/full_texts/{folder}/"
            text_names = [name for name in names if marker in name and name.endswith(".txt")]
            meta_marker = f"/full_texts/{folder}-meta-information/"
            meta_names = [name for name in names if meta_marker in name and name.endswith("-meta.txt")]
            texts = {Path(name).stem: name for name in text_names}
            meta = {Path(name).name.removesuffix("-meta.txt"): name for name in meta_names}
            if len(texts) != len(text_names) or len(meta) != len(meta_names):
                raise ValueError(f"Duplicate canonical IDs in {folder}")
            if not texts or set(texts) != set(meta):
                raise ValueError(f"Text and metadata IDs do not correspond in {folder}")
            for stem in sorted(texts):
                metadata_lines = archive.read(meta[stem]).decode("utf-8").splitlines()
                if not metadata_lines:
                    raise ValueError(f"Empty metadata for {folder}/{stem}")
                rows.append({
                    "record_id": f"{folder}/{stem}",
                    "text": archive.read(texts[stem]).decode("utf-8"),
                    "author": metadata_lines[0],
                })
    result = pd.DataFrame(rows).set_index("record_id")
    if not result.index.is_unique:
        raise ValueError("record_id must be unique")
    return result


def _ratio(count, denominator):
    return count / denominator if denominator else np.nan


def _legacy_style(text, author):
    """Exact legacy equations; text has already been normalized and clipped."""
    words, tokens = WORDS.findall(text), TOKENS.findall(text)
    nw, nt = len(words), len(tokens)
    distinct = len({word.casefold() for word in words})
    return {
        "tem_autor": int(str(author).strip().casefold() not in {"", "none", "null", "nan"}),
        "typeTokenRatio": _ratio(distinct, nt),
        "linkDensity": _ratio(len(re.findall(r"https?://\S+", text, flags=re.IGNORECASE)), nw),
        "punctuationDensity": _ratio(nt - nw, nt),
        "uppercaseRatio": _ratio(sum(word.isupper() and len(word) > 1 for word in words), nw),
        "diversidade": _ratio(distinct, nw),
    }


def extract_features(records, nlp, character_limit=300, batch_size=50) -> pd.DataFrame:
    """Extract aligned per-record counts/rates through ``nlp.pipe``.

    Zero counts produce zero rates for eligible documents. A zero denominator
    produces NaN, never an invented zero. Changing ``character_limit`` changes
    both legacy and linguistic windows and requires a new experiment manifest.
    POS, DEP, and sentence annotations are required for nonempty documents.
    """
    if not isinstance(character_limit, int) or isinstance(character_limit, bool) or character_limit <= 0:
        raise ValueError("character_limit must be a positive integer")
    if not isinstance(batch_size, int) or isinstance(batch_size, bool) or batch_size <= 0:
        raise ValueError("batch_size must be a positive integer")
    if not records.index.is_unique:
        raise ValueError("record_id must be unique")
    if not {"text", "author"}.issubset(records.columns):
        raise ValueError("records must contain text and author columns")
    if not records["text"].map(lambda value: isinstance(value, str)).all():
        raise ValueError("All record texts must be strings")
    normalized = records["text"].map(lambda text: unicodedata.normalize("NFKC", text).lstrip("\ufeff"))
    windows = normalized.map(lambda text: text[:character_limit])
    docs = iter(nlp.pipe(windows.tolist(), batch_size=batch_size))
    rows = []
    for record_id, text in windows.items():
        try:
            doc = next(docs)
        except StopIteration as exc:
            raise ValueError("nlp.pipe returned fewer documents than records") from exc
        if doc.text != text:
            raise ValueError(f"nlp.pipe changed document alignment at {record_id}")
        if len(doc) and not all(doc.has_annotation(name) for name in ("POS", "DEP", "SENT_START")):
            raise ValueError("Pipeline must supply POS, DEP, and sentence annotations")
        nonspace = [token for token in doc if not token.is_space]
        lexical = [token for token in nonspace if not token.is_punct]
        pos_counts = Counter(token.pos_ for token in lexical)
        dep_counts = Counter(token.dep_ for token in lexical)
        truncated = len(normalized.loc[record_id]) > character_limit
        drop_last = bool(truncated and len(doc) and not TERMINAL.search(text.rstrip()))
        sentences = list(doc.sents) if len(doc) else []
        complete_end = sentences[-1].start if drop_last and sentences else len(doc)
        complete_tokens = [token for token in doc[:complete_end] if not token.is_space and not token.is_punct]
        complete_counts = Counter(token.dep_ for token in complete_tokens)
        kept_chars = sentences[-1].start_char if drop_last and sentences else len(text)
        row = {
            "record_id": record_id,
            **_legacy_style(text, records.at[record_id, "author"]),
            "text_chars_raw": len(records.at[record_id, "text"]),
            "text_chars_normalized": len(normalized.loc[record_id]),
            "text_chars_window": len(text),
            "tokens_all": len(doc),
            "tokens_nonspace": len(nonspace),
            "tokens_lexical": len(lexical),
            "punctuation_count_spacy": sum(token.is_punct for token in nonspace),
            "punctuationDensity_spacy": _ratio(sum(token.is_punct for token in nonspace), len(nonspace)),
            "quality_empty": not bool(text.strip()),
            "quality_noeligible": not bool(lexical),
            "quality_truncated": truncated,
            "quality_complete_last_sentence_dropped": drop_last,
            "quality_complete_noeligible": not bool(complete_tokens),
            "tokens_complete_lexical": len(complete_tokens),
            "text_chars_complete_kept": kept_chars,
        }
        for tag in POS_TAGS:
            row[f"POS_{tag}_count"] = pos_counts[tag]
            row[f"POS_{tag}_rate"] = _ratio(pos_counts[tag], len(lexical))
        for tag in DEP_TAGS:
            row[f"DEP_{tag}_count"] = dep_counts[tag]
            row[f"DEP_{tag}_rate"] = _ratio(dep_counts[tag], len(lexical))
            row[f"DEP_complete_{tag}_count"] = complete_counts[tag]
            row[f"DEP_complete_{tag}_rate"] = _ratio(complete_counts[tag], len(complete_tokens))
        rows.append(row)
    try:
        next(docs)
    except StopIteration:
        pass
    else:
        raise ValueError("nlp.pipe returned more documents than records")
    if not rows:
        # Obtain the stable output schema without depending on model annotations.
        empty_record = pd.DataFrame({"text": [""], "author": [""]}, index=pd.Index(["schema"], name="record_id"))
        return extract_features(empty_record, nlp, character_limit, batch_size).iloc[:0]
    return pd.DataFrame(rows).set_index("record_id")


def audit_features(frame) -> dict:
    """Return JSON-safe quality/distribution evidence and dependence warnings."""
    distributions = {}
    for name in frame.select_dtypes(include="number").columns:
        series = frame[name]
        valid = series.dropna()
        distributions[name] = {
            "present": int(valid.size), "missing": int(series.isna().sum()),
            "zeros": int(series.eq(0).sum()), "unique": int(valid.nunique()),
            "min": float(valid.min()) if len(valid) else None,
            "max": float(valid.max()) if len(valid) else None,
            "mean": float(valid.mean()) if len(valid) else None,
            "median": float(valid.median()) if len(valid) else None,
        }
    identity = (frame["typeTokenRatio"] - frame["diversidade"] * (1 - frame["punctuationDensity"])).abs().dropna()
    return {
        "records": int(len(frame)), "unique_record_ids": bool(frame.index.is_unique),
        "quality": {name: int(frame[name].sum()) for name in frame if name.startswith("quality_")},
        "distributions": distributions,
        "legacy_identity_max_abs_error": float(identity.max()) if len(identity) else None,
        "denominators": {
            "POS_and_DEP": "tokens_lexical: excludes space/punctuation, includes NUM",
            "punctuationDensity_spacy": "tokens_nonspace",
            "DEP_complete": "tokens_complete_lexical",
        },
        "warnings": [
            "Legacy typeTokenRatio = diversidade * (1 - punctuationDensity); rules between them may be mathematical.",
            "Legacy punctuationDensity includes numeric regex tokens; spaCy punctuation is a separately versioned measurement.",
            "POS rates and DEP rates are compositions over the same lexical tokens; tags within each system compete for mass.",
            "POS and DEP are model predictions; ADJ/amod and ADV/advmod may be structurally redundant.",
            "DEP_complete drops the possibly clipped final predicted sentence without reparsing; terminal punctuation and predicted boundaries can be wrong.",
            "Missing rates indicate zero eligible tokens; zero rates in valid documents mean the tag was absent.",
        ],
    }

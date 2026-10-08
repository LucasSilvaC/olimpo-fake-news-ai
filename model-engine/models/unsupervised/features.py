"""Frozen serving equations from sintaxe_ampliada; no research dependencies.

Copied from the principal extraction and corrected linguistic discretization.
Equivalence against their frozen corpus output is tested separately.
"""
from __future__ import annotations
from collections import Counter
import hashlib
import re
import unicodedata
import numpy as np
import pandas as pd

WORDS = re.compile(r"[^\W\d_]+(?:['’\-][^\W\d_]+)*", re.UNICODE)

TOKENS = re.compile(
    r"[^\W\d_]+(?:['’\-][^\W\d_]+)*|\d+(?:[.,]\d+)*|[^\w\s]", re.UNICODE
)

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

def extract_collected_features(records, nlp, tags, character_limit=300):
    """Same normalized window/denominators as the corrected reference."""
    if not records.index.is_unique or not {'text', 'author'}.issubset(records):
        raise ValueError('Unique canonical IDs, text and author metadata are required')
    if not records.text.map(lambda t: isinstance(t, str)).all():
        raise ValueError('Texts must be strings')
    normalized = records.text.map(lambda t: unicodedata.normalize('NFKC', t).lstrip('\ufeff'))
    windows = normalized.str[:character_limit]
    rows = []
    for position, (rid, doc) in enumerate(zip(records.index, nlp.pipe(windows, batch_size=50), strict=True), 1):
        if doc.text != windows.at[rid]:
            raise ValueError('Pipeline changed text alignment')
        if len(doc) and not all(doc.has_annotation(a) for a in ['POS', 'DEP', 'SENT_START']):
            raise ValueError('POS, DEP and sentence annotations are required')
        nonspace = [t for t in doc if not t.is_space]
        lexical = [t for t in nonspace if not t.is_punct]
        pos, dep = Counter(t.pos_ for t in lexical), Counter(t.dep_ for t in lexical)
        punctuation = sum(t.is_punct for t in nonspace)
        ratio = lambda n, d: n/d if d else np.nan
        row = {'record_id': rid, **_legacy_style(doc.text, records.at[rid, 'author']),
               'text_sha256': hashlib.sha256(records.at[rid, 'text'].encode('utf8')).hexdigest(),
               'text_chars_raw': len(records.at[rid, 'text']), 'text_chars_window': len(doc.text),
               'tokens_all': len(doc), 'tokens_nonspace': len(nonspace), 'tokens_lexical': len(lexical),
               'punctuation_count_spacy': punctuation,
               'punctuationDensity_spacy': ratio(punctuation, len(nonspace)),
               'quality_empty': not bool(doc.text.strip()), 'quality_noeligible': not bool(lexical),
               'quality_truncated': len(normalized.at[rid]) > character_limit,
               'diag_space_count': sum(t.is_space for t in doc),
               'diag_root_count': sum(t.dep_ == 'ROOT' for t in doc),
               'diag_dep_count': sum(t.dep_ == 'dep' for t in doc)}
        for tag in tags:
            system, label = tag.split('_', 1)
            count = (pos if system == 'POS' else dep)[label]
            row[tag+'_count'] = count
            row[tag+'_rate'] = ratio(count, len(lexical))
        rows.append(row)
        if position % 500 == 0:
            print(f'Extração: {position}/{len(records)}', flush=True)
    return pd.DataFrame(rows).set_index('record_id')

def apply_discretization(frame, criteria):
    """Apply previously learned criteria without computing any new quantile."""
    result = pd.DataFrame(index=frame.index)
    for row in criteria.itertuples():
        if row.direction not in {'equals', 'baixo', 'alto'}:
            raise ValueError(f'Unknown discretization direction: {row.direction}')
        if row.omitted:
            continue
        if not np.isfinite(row.threshold):
            raise ValueError(f'Nonfinite threshold for {row.item}')
        series = pd.to_numeric(frame[row.feature], errors='coerce').replace([np.inf, -np.inf], np.nan)
        if row.direction == 'equals':
            mask = series.eq(row.threshold)
        elif row.direction == 'baixo':
            mask = series.le(row.threshold)
        elif row.direction == 'alto':
            mask = series.ge(row.threshold)
        result[row.item] = mask & series.notna()
    return result.astype(bool)

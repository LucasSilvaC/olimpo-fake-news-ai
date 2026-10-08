"""Apply frozen principal patterns to a new text; no online mining or labels."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import threading
import unicodedata

import pandas as pd

from . import features

HERE = Path(__file__).resolve().parent
CATALOG_PATH = HERE / 'assets/product_catalog.json'
CHARACTER_LIMIT = 300
MAX_TEXT_CHARACTERS = 100_000


def normalize_text(text):
    return unicodedata.normalize('NFKC', text).lstrip('\ufeff')


class NewsInsightsEngine:
    """Load spaCy once and keep all preprocessing/thresholds frozen."""

    def __init__(self, catalog_path=CATALOG_PATH, nlp=None):
        self.catalog = json.loads(Path(catalog_path).read_text(encoding='utf8'))
        if self.catalog['characterLimit'] != CHARACTER_LIMIT or self.catalog['comparisonEnabled']:
            raise ValueError('Invalid product catalog policy')
        runtime_path = Path(features.__file__)
        if hashlib.sha256(runtime_path.read_bytes()).hexdigest() != self.catalog['runtimeFeaturesSha256']:
            raise ValueError('Frozen serving features changed; review and rebuild the catalog')
        import spacy
        self.nlp = nlp if nlp is not None else spacy.load('pt_core_news_sm', disable=['ner'])
        if spacy.__version__ != '3.8.16' or self.nlp.meta['version'] != '3.8.0':
            raise ValueError('Use spaCy 3.8.16 and pt_core_news_sm 3.8.0')
        self.criteria = pd.DataFrame(self.catalog['discretization'])
        self.feature_names = list(dict.fromkeys(self.criteria.feature))
        self.tags = [f.removesuffix('_rate') for f in self.feature_names if f.startswith(('POS_', 'DEP_'))]
        self.lock = threading.Lock()
        definitions = self.criteria.set_index('item')
        for pattern in self.catalog['patterns']:
            if pattern['displayStatus'] != 'observation_only' or pattern['comparisonEnabled']:
                raise ValueError('Only observation-only patterns may be displayed')
            for item in pattern['items']:
                row = definitions.loc[item['item']]
                operator = '<=' if row.direction == 'baixo' else '>='
                if row.omitted or row.feature != item['feature'] or row.threshold != item['threshold'] or operator != item['operator']:
                    raise ValueError('Pattern criteria do not match frozen discretization')

    def response(self, status, text='', quality=None, insights=None):
        return {'analysisStatus': status, 'catalogVersion': self.catalog['catalogVersion'],
                'extractorVersion': self.catalog['extractorVersion'],
                'analyzedText': text, 'characterLimit': CHARACTER_LIMIT,
                'quality': quality or {'empty': not bool(text.strip()), 'noEligibleTokens': not bool(text.strip()), 'truncated': False},
                'insights': insights or []}

    def extract(self, text):
        records = pd.DataFrame({'text': [text], 'author': ['']}, index=['input'])
        with self.lock:
            return features.extract_collected_features(records, self.nlp, self.tags, CHARACTER_LIMIT)

    def select_insights(self, frame, text):
        # Reindexing inserts NaN for missing columns. Missing never becomes zero.
        matrix = features.apply_discretization(frame.reindex(columns=self.feature_names), self.criteria)
        present = {name for name in matrix if bool(matrix.at['input', name])}
        selected, families, selected_items = [], set(), []
        for pattern in sorted(self.catalog['patterns'], key=lambda p: (p['priority'], p['patternId'])):
            names = {i['item'] for i in pattern['items']}
            if not names.issubset(present) or pattern['redundancyFamily'] in families:
                continue
            if any(names <= previous or previous <= names for previous in selected_items):
                continue
            measurements = []
            for item in pattern['items']:
                feature = item['feature']
                measurement = {'feature': feature, 'label': item['annotation_label'],
                               'value': float(frame.at['input', feature]), 'operator': item['operator'],
                               'threshold': item['threshold'], 'denominator': item['denominator']}
                if feature.endswith('_rate'):
                    count_column = feature.removesuffix('_rate') + '_count'
                    if count_column in frame:
                        measurement['count'] = int(frame.at['input', count_column])
                    measurement['denominatorCount'] = int(frame.at['input', 'tokens_lexical'])
                elif feature == 'punctuationDensity_spacy':
                    measurement['count'] = int(frame.at['input', 'punctuation_count_spacy'])
                    measurement['denominatorCount'] = int(frame.at['input', 'tokens_nonspace'])
                elif item['denominator'] == 'regex_words':
                    words = features.WORDS.findall(text)
                    measurement['denominatorCount'] = len(words)
                    if feature == 'uppercaseRatio':
                        measurement['count'] = sum(w.isupper() and len(w) > 1 for w in words)
                    elif feature == 'diversidade':
                        measurement['count'] = len({w.casefold() for w in words})
                measurements.append(measurement)
            selected.append({'patternId': pattern['patternId'], 'observationTitle': pattern['observationTitle'],
                             'observation': pattern['observationTemplate'],
                             'reflectionQuestions': pattern['reflectionQuestions'],
                             'redundancyFamily': pattern['redundancyFamily'], 'measurements': measurements})
            families.add(pattern['redundancyFamily'])
            selected_items.append(names)
            if len(selected) == 3:
                break
        return selected

    def analyze_text(self, text):
        if not isinstance(text, str) or len(text) > MAX_TEXT_CHARACTERS:
            return self.response('invalid_text')
        try:
            text.encode('utf8')
        except UnicodeEncodeError:
            return self.response('invalid_text')
        normalized = normalize_text(text)
        window = normalized[:CHARACTER_LIMIT]
        if not window.strip():
            return self.response('invalid_text', window,
                                 {'empty': True, 'noEligibleTokens': True, 'truncated': len(normalized) > CHARACTER_LIMIT})
        frame = self.extract(text)
        row = frame.loc['input']
        quality = {'empty': bool(row.quality_empty), 'noEligibleTokens': bool(row.quality_noeligible),
                   'truncated': bool(row.quality_truncated)}
        if quality['noEligibleTokens']:
            return self.response('invalid_text', window, quality)
        insights = self.select_insights(frame, window)
        return self.response('ok' if insights else 'no_match', window, quality, insights)


_engine = None
_engine_lock = threading.Lock()


def analyze_text(text):
    """Convenience entrypoint; a persistent service should own its engine."""
    global _engine
    with _engine_lock:
        if _engine is None:
            _engine = NewsInsightsEngine()
    return _engine.analyze_text(text)

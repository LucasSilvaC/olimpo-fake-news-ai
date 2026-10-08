"""Apply frozen patterns and expose descriptive reference frequencies, never a verdict."""
from __future__ import annotations

import hashlib
import json
import math
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
        if (self.catalog['characterLimit'] != CHARACTER_LIMIT
                or self.catalog['comparisonEnabled'] is not True
                or self.catalog['status'] != 'experimental_descriptive_comparison'):
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
            if pattern['displayStatus'] != 'descriptive_comparison' or pattern['comparisonEnabled'] is not True:
                raise ValueError('Only descriptive comparisons may be displayed')
            self.validate_comparison(pattern['comparison'])
            for item in pattern['items']:
                row = definitions.loc[item['item']]
                operator = '<=' if row.direction == 'baixo' else '>='
                if row.omitted or row.feature != item['feature'] or row.threshold != item['threshold'] or operator != item['operator']:
                    raise ValueError('Pattern criteria do not match frozen discretization')

    def validate_comparison(self, comparison):
        expected = {'kind': 'descriptive_corpus_frequency', 'referenceDataset': 'Fake.br-Corpus',
                    'partition': 'validation', 'authorScope': 'all', 'scope': 'matched_pattern',
                    'sourceRun': self.catalog['sourceRun'], 'variant': self.catalog['variant']}
        if set(comparison) != set(expected) | {'fake', 'true'} or any(comparison[k] != v for k, v in expected.items()):
            raise ValueError('Invalid descriptive comparison provenance or scope')
        for label in ['fake', 'true']:
            group = comparison[label]
            if set(group) != {'count', 'total', 'frequency'}:
                raise ValueError('Only within-class frequencies may be displayed')
            count, total, frequency = group['count'], group['total'], group['frequency']
            if (type(count) is not int or type(total) is not int or total != 720 or not 0 <= count <= total
                    or type(frequency) not in {float, int} or not math.isfinite(frequency)
                    or abs(frequency - count / total) > 1e-12):
                raise ValueError('Invalid descriptive comparison counts/frequency')

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

    def summarize_measurements(self, pattern, measurements):
        """Describe every matched criterion briefly, without technical annotation names."""
        absent, measured = [], []
        for item, measurement in zip(pattern['items'], measurements, strict=True):
            count = measurement['count']
            if count == 0 and item['threshold'] == 0:
                absent.append(item['summaryPlural'])
                continue
            label = item['summarySingular'] if count == 1 else item['summaryPlural']
            band = 'mais baixa' if item['operator'] == '<=' else 'mais alta'
            measured.append(f'{count} {label} (proporção na faixa {band} da referência)')
        parts = []
        if absent:
            parts.append('não encontrou ' + ' nem '.join(absent))
        if measured:
            parts.append('encontrou ' + ' e '.join(measured))
        return '; '.join(parts)

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
                measurement['displayLabel'] = item['displayLabel']
                count = measurement.get('count')
                detail = f"{count} ocorrências identificadas" if count is not None else 'medida identificada'
                if item['threshold'] != 0:
                    band = 'inferior' if item['operator'] == '<=' else 'superior'
                    detail += f'; proporção na faixa {band} da referência estudada'
                measurement['displayText'] = f"{item['displayLabel']}: {detail}"
                measurements.append(measurement)
            selected.append({'patternId': pattern['patternId'], 'observationTitle': pattern['observationTitle'],
                             'observation': pattern['observationTemplate'].format(
                                 summary=self.summarize_measurements(pattern, measurements)),
                             'reflectionQuestions': pattern['reflectionQuestions'],
                             'redundancyFamily': pattern['redundancyFamily'], 'measurements': measurements,
                             'comparison': json.loads(json.dumps(pattern['comparison']))})
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

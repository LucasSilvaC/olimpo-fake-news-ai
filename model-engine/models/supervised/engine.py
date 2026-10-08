"""Load the controlled artifact once and serve its calibrated probability."""
from __future__ import annotations

import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import platform
import threading
import time

ASSETS = Path(__file__).resolve().parent / 'assets'
ROOT = Path(__file__).resolve().parents[2]
POLICY = {'version': 'olimpo-decision-policy-v1', 'lowThreshold': 0.35,
          'highThreshold': 0.65, 'minWords': 30, 'wordLimit': 100}
MAX_TEXT_CHARACTERS = 100_000
SCORE_KIND = 'predicted_fake_probability'


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def inference_version(manifest):
    payload = {key: manifest[key] for key in ('codeSha256', 'policy', 'runtimeVersions')}
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def empty_response(status, identity=None, scope=None):
    return {'analysisStatus': status,
            'classification': 'uncertain' if status == 'insufficient_text' else None,
            'fakeProbability': None, 'fakeScore': None, 'scoreKind': SCORE_KIND,
            **(identity or {'modelVersion': None, 'policyVersion': None,
                            'artifactSha256': None, 'inferenceVersion': None}),
            'reasons': [], 'inputScope': scope or {'source': 'article_body', 'wordLimit': 100,
                                                  'analyzedWordCount': 0, 'truncated': False}}


def classify_probability(probability):
    if not math.isfinite(probability) or not 0 <= probability <= 1:
        raise ValueError('Invalid calibrated probability')
    if probability <= POLICY['lowThreshold']:
        return 'reliable'
    if probability >= POLICY['highThreshold']:
        return 'unreliable'
    return 'uncertain'


class InferenceBusy(RuntimeError):
    """The bounded inference queue is full or its wait deadline expired."""


class SupervisedEngine:
    def __init__(self, assets=ASSETS, queue_size=2, queue_timeout=10):
        # Paths are deployment-owned; the HTTP contract never accepts a path/upload.
        self.manifest = json.loads((Path(assets) / 'serving_manifest.json').read_text(encoding='utf8'))
        self.artifact_manifest = json.loads((Path(assets) / self.manifest['artifactManifest']).read_text(encoding='utf8'))
        manifest = self.manifest
        if manifest['policy'] != POLICY or manifest['inferenceVersion'] != inference_version(manifest):
            raise ValueError('Invalid serving policy or inference identity')
        for relative, digest in manifest['codeSha256'].items():
            if sha256(ROOT / relative) != digest:
                raise ValueError('Frozen serving source hash mismatch: ' + relative)
        if sha256(Path(assets) / manifest['artifactManifest']) != manifest['artifactManifestSha256']:
            raise ValueError('Artifact manifest hash mismatch')
        artifact = Path(assets) / manifest['artifact']
        if sha256(artifact) != manifest['artifactSha256'] or self.artifact_manifest['sha256'] != manifest['artifactSha256']:
            raise ValueError('Artifact hash mismatch')
        expected = manifest['runtimeVersions']
        if platform.python_version() != expected['python']:
            raise ValueError('Python version differs from controlled artifact runtime')
        names = {'scikit_learn': 'scikit-learn', 'numpy': 'numpy', 'scipy': 'scipy',
                 'pandas': 'pandas', 'spacy': 'spacy', 'pt_core_news_sm': 'pt_core_news_sm', 'joblib': 'joblib'}
        for key, distribution in names.items():
            if importlib.metadata.version(distribution) != expected[key]:
                raise ValueError('Runtime version mismatch: ' + distribution)
        if expected != self.artifact_manifest['versoes'] or self.artifact_manifest['rotulos'] != {'0': 'real', '1': 'fake'}:
            raise ValueError('Inconsistent artifact metadata')
        import joblib
        import numpy as np
        from sklearn.calibration import CalibratedClassifierCV
        from . import pipeline
        self.pipeline_module = pipeline
        self.model = joblib.load(artifact)
        if (not isinstance(self.model, CalibratedClassifierCV) or self.model.method != 'sigmoid'
                or self.model.ensemble is not False or len(self.model.calibrated_classifiers_) != 1
                or not np.array_equal(self.model.classes_, [0, 1])):
            raise ValueError('Expected a calibrated binary classifier with classes [real, fake]')
        self.pipe = self.model.calibrated_classifiers_[0].estimator
        if (self.artifact_manifest['versao_modelo'] != pipeline.VERSAO_MODELO
                or pipeline.N_PALAVRAS != POLICY['wordLimit']):
            raise ValueError('Model/preparation identity mismatch')
        self.identity = {'modelVersion': pipeline.VERSAO_MODELO, 'policyVersion': POLICY['version'],
                         'artifactSha256': manifest['artifactSha256'], 'inferenceVersion': manifest['inferenceVersion']}
        # One inference at a time: spaCy and fitted explanation caches are not shared concurrently.
        self.lock = threading.Lock()
        self.capacity = threading.BoundedSemaphore(1 + max(0, queue_size))
        self.queue_timeout = queue_timeout
        self.pipe.named_steps['entrada']._nlp()
        pipeline._nomes_selecionados(self.pipe)
        warm_text = 'O governo publicou documentos sobre as escolas e informou os resultados da pesquisa. ' * 8
        self.analyze_text(warm_text)

    def analyze_text(self, text):
        if (not isinstance(text, str) or not text.strip() or len(text) > MAX_TEXT_CHARACTERS
                or any(0xD800 <= ord(c) <= 0xDFFF for c in text) or not any(c.isalpha() for c in text)):
            return empty_response('invalid_text', self.identity)
        normalized = self.pipeline_module.normalizar(text)
        words = normalized.split()
        scope = {'source': 'article_body', 'wordLimit': POLICY['wordLimit'],
                 'analyzedWordCount': min(len(words), POLICY['wordLimit']), 'truncated': len(words) > POLICY['wordLimit']}
        if len(words) < POLICY['minWords']:
            result = empty_response('insufficient_text', self.identity, scope)
            result['reasons'] = [f"Texto insuficiente para estimar o score ({len(words)} palavras; mínimo 30)."]
            return result
        if not self.capacity.acquire(blocking=False):
            raise InferenceBusy('Inference queue full')
        acquired = False
        try:
            acquired = self.lock.acquire(timeout=self.queue_timeout)
            if not acquired:
                raise InferenceBusy('Inference queue wait expired')
            started = time.monotonic()
            # Preparation runs exactly once; prediction and explanation receive the same frame.
            df = self.pipe.named_steps['entrada'].transform([text])
            score = self.pipe[1:].decision_function(df)
            probability = float(self.model.calibrated_classifiers_[0].calibrators[0].predict(score)[0])
            classification = classify_probability(probability)
            contributions, meta, standardized = self.pipeline_module.explicar(self.model, df)
            reasons = self._reasons(probability, contributions, meta, standardized)
            self.last_inference_seconds = time.monotonic() - started
            return {**empty_response('ok', self.identity, scope), 'classification': classification,
                    'fakeProbability': probability, 'fakeScore': 100 * probability, 'reasons': reasons}
        finally:
            if acquired:
                self.lock.release()
            self.capacity.release()

    def _reasons(self, probability, contributions, meta, standardized):
        sign = 1 if probability >= 0.5 else -1
        words = contributions[contributions.index.str.startswith('txt_word__')].copy()
        words.index = words.index.str.removeprefix('txt_word__')
        ordered = (sign * words).groupby(level=0).sum().sort_values(ascending=False)
        terms = [term for term, value in ordered.items() if value > 0][:3]
        reasons = []
        if terms:
            side = 'falsas' if sign > 0 else 'verdadeiras'
            reasons.append(f"Termos associados a notícias {side} no corpus de treino que influenciaram a previsão: "
                           + ', '.join(repr(term) for term in terms) + '.')
        for feature in (sign * meta).sort_values(ascending=False).index[:2]:
            if feature in self.pipeline_module.DESCRICAO_META and sign * meta[feature] > 0:
                reason = 'Característica da escrita: ' + self.pipeline_module.DESCRICAO_META[feature][0 if standardized[feature] > 0 else 1] + '.'
                if reason not in reasons:
                    reasons.append(reason)
        return reasons

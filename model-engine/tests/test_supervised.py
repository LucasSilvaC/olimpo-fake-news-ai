"""Controlled-artifact inference and equivalence, with no training."""
from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from http.client import HTTPConnection
import importlib.util
import json
from pathlib import Path
import shutil
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

import joblib
import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
from models.supervised.engine import (ASSETS, SupervisedEngine, InferenceBusy,
                                      classify_probability, inference_version)
from models.supervised import pipeline
from service import create_server

SAMPLES = [
    'A prefeitura divulgou nesta terça-feira os resultados da pesquisa sobre educação. '
    'Segundo o relatório, 23 escolas receberam materiais para as aulas e os professores '
    'participaram de reuniões com os moradores. A secretaria informou que a avaliação '
    'será publicada em 2027 e que novos documentos estarão disponíveis para consulta pública.',
    'Compartilhe esta mensagem com todos os seus amigos! Nós precisamos descobrir o que '
    'aconteceu ontem durante a reunião. Pessoas disseram que viram algo surpreendente, '
    'mas ninguém apresentou detalhes sobre a origem da informação. O texto continua '
    'circulando em grupos e promete revelar novas informações no próximo mês para todos.',
    'O governo publicou documentos sobre as escolas e informou os resultados da pesquisa. ' * 12,
]


def load_source(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class SupervisedTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = SupervisedEngine()

    def test_real_probability_is_calibrated_and_scope_is_independent(self):
        for text in SAMPLES:
            result = self.engine.analyze_text(text)
            expected = self.engine.model.predict_proba([text])[0, 1]
            self.assertAlmostEqual(result['fakeProbability'], expected, delta=1e-12)
            self.assertEqual(result['fakeScore'], result['fakeProbability'] * 100)
            self.assertEqual(result['classification'], classify_probability(expected))
            self.assertEqual(result['analysisStatus'], 'ok')
            self.assertTrue(result['reasons'])
            self.assertEqual(result['inputScope']['analyzedWordCount'], min(100, len(pipeline.normalizar(text).split())))

    def test_frozen_sources_reproduce_original_preparation_probability_and_contributions(self):
        research = HERE.parent / 'machine-learning/supervised-learning'
        if not (research / 'modelo_olimpo.py').exists():
            self.skipTest('Research source is intentionally absent from standalone image; mount it for equivalence validation')
        with patch.object(sys, 'path', [str(research), *sys.path]):
            original = load_source('research_model', research / 'modelo_olimpo.py')
        original.ms = load_source('research_linguistic', research / 'support/metadados_spacy.py')
        with patch.dict(sys.modules, {'modelo_olimpo': original}):
            model = joblib.load(research / 'modelos/olimpo-svm-spacy-chi2k10k-svd500-v1.joblib')
        original_pipe = original._pipeline_interno(model)
        for text in SAMPLES + ['Número 123 — mensagem “pública”… ' * 40]:
            self.assertEqual(pipeline.normalizar(text), original.normalizar(text))
            self.assertEqual(pipeline.truncar(pipeline.normalizar(text)), original.truncar(original.normalizar(text)))
            frozen_frame = self.engine.pipe.named_steps['entrada'].transform([text])
            original_frame = original_pipe.named_steps['entrada'].transform([text])
            pd.testing.assert_frame_equal(frozen_frame, original_frame, check_exact=False, rtol=0, atol=1e-15)
            result = self.engine.analyze_text(text)
            self.assertAlmostEqual(result['fakeProbability'], model.predict_proba([text])[0, 1], delta=1e-12)
            self.assertEqual(result['classification'], original.analisar(model, text)['classification'])
            for actual, expected in zip(pipeline.explicar(self.engine.model, frozen_frame), original.explicar(model, original_frame)):
                pd.testing.assert_series_equal(actual, expected, check_exact=False, rtol=0, atol=1e-12)

    def test_research_support_layout_preserves_frozen_packaging_sources(self):
        research = HERE.parent / 'machine-learning/supervised-learning'
        if not (research / 'modelo_olimpo.py').exists():
            self.skipTest('Mount research sources to validate packaging equivalence')
        from tools.import_supervised_artifact import frozen_source
        self.assertEqual(frozen_source(research / 'modelo_olimpo.py'),
                         (HERE / 'models/supervised/pipeline.py').read_bytes())
        self.assertEqual(frozen_source(research / 'support/metadados_spacy.py'),
                         (HERE / 'models/supervised/linguistic_features.py').read_bytes())

    def test_threshold_boundaries_and_null_scores(self):
        for p, label in [(0, 'reliable'), (0.35, 'reliable'), (np.nextafter(0.35, 1), 'uncertain'),
                         (0.5, 'uncertain'), (np.nextafter(0.65, 0), 'uncertain'), (0.65, 'unreliable'), (1, 'unreliable')]:
            self.assertEqual(classify_probability(p), label)
        for probability in [-1, 1.01, float('nan'), float('inf')]:
            with self.assertRaises(ValueError):
                classify_probability(probability)
        short = self.engine.analyze_text('palavra ' * 29)
        self.assertEqual(short['analysisStatus'], 'insufficient_text')
        self.assertEqual(short['classification'], 'uncertain')
        self.assertIsNone(short['fakeScore'])
        self.assertIsNone(short['fakeProbability'])
        self.assertEqual(self.engine.analyze_text('palavra ' * 30)['analysisStatus'], 'ok')
        for size in [100, 101]:
            response = self.engine.analyze_text('palavra ' * size)
            self.assertEqual(response['inputScope']['analyzedWordCount'], 100)
            self.assertEqual(response['inputScope']['truncated'], size == 101)
        for text in ['', ' \n\t', '!!!', '\ud800', 'palavra ' * 20_000]:
            response = self.engine.analyze_text(text)
            self.assertEqual(response['analysisStatus'], 'invalid_text')
            self.assertIsNone(response['classification'])
            self.assertIsNone(response['fakeScore'])

    def test_loading_and_serving_never_fit_and_prepare_once(self):
        from sklearn.calibration import CalibratedClassifierCV
        from sklearn.svm import LinearSVC
        entrada = self.engine.pipe.named_steps['entrada']
        with (patch.object(CalibratedClassifierCV, 'fit', side_effect=AssertionError('No training')),
              patch.object(LinearSVC, 'fit', side_effect=AssertionError('No training')),
              patch.object(pipeline.PreparadorEntrada, 'fit', side_effect=AssertionError('No training'))):
            engine = SupervisedEngine()
            engine.analyze_text(SAMPLES[0])
        with patch.object(entrada, 'transform', wraps=entrada.transform) as transform:
            self.engine.analyze_text(SAMPLES[0])
            self.assertEqual(transform.call_count, 1)

    def test_manifest_artifact_and_code_hashes_guard_loading(self):
        with patch('models.supervised.engine.platform.python_version', return_value='3.12.0'):
            with self.assertRaisesRegex(ValueError, 'Python version differs'):
                SupervisedEngine()
        with patch('models.supervised.engine.importlib.metadata.version', return_value='0.0.0'):
            with self.assertRaisesRegex(ValueError, 'Runtime version mismatch'):
                SupervisedEngine()
        with patch('joblib.load', return_value=self.engine.pipe):
            with self.assertRaisesRegex(ValueError, 'calibrated binary classifier'):
                SupervisedEngine()
        with (patch.object(self.engine.model, 'classes_', np.array([1, 0])),
              patch('joblib.load', return_value=self.engine.model)):
            with self.assertRaisesRegex(ValueError, 'calibrated binary classifier'):
                SupervisedEngine()
        with tempfile.TemporaryDirectory() as temporary:
            assets = Path(temporary)
            for path in ASSETS.iterdir():
                shutil.copyfile(path, assets / path.name)
            manifest = json.loads((assets / 'serving_manifest.json').read_text())
            self.assertEqual(manifest['inferenceVersion'], inference_version(manifest))
            with (assets / manifest['artifact']).open('ab') as artifact:
                artifact.write(b'changed')
            with self.assertRaisesRegex(ValueError, 'Artifact hash mismatch'):
                SupervisedEngine(assets=assets)
            manifest['codeSha256']['models/supervised/pipeline.py'] = '0' * 64
            manifest['inferenceVersion'] = inference_version(manifest)
            (assets / 'serving_manifest.json').write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, 'source hash mismatch'):
                SupervisedEngine(assets=assets)

    def test_queue_saturation_and_wait_timeout_are_explicit(self):
        previous_capacity, previous_timeout = self.engine.capacity, self.engine.queue_timeout
        self.engine.capacity = threading.BoundedSemaphore(1)
        self.engine.queue_timeout = 0.15
        self.engine.lock.acquire()
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                pending = executor.submit(self.engine.analyze_text, SAMPLES[0])
                deadline = time.monotonic() + 1
                while self.engine.capacity._value != 0 and time.monotonic() < deadline:
                    time.sleep(0.001)
                with self.assertRaises(InferenceBusy):
                    self.engine.analyze_text(SAMPLES[0])
                with self.assertRaises(InferenceBusy):
                    pending.result(timeout=2)
        finally:
            self.engine.lock.release()
            self.engine.capacity, self.engine.queue_timeout = previous_capacity, previous_timeout

    def test_http_contract_and_independent_health(self):
        server = create_server(port=0, supervised_engine=self.engine)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            def request(method, path, payload=None):
                connection = HTTPConnection(*server.server_address, timeout=20)
                body = json.dumps(payload) if payload is not None else None
                connection.request(method, path, body, {'Content-Type': 'application/json'})
                response = connection.getresponse()
                status, data = response.status, json.loads(response.read())
                connection.close()
                return status, data
            status, health = request('GET', '/health/supervised')
            self.assertEqual(status, 200)
            self.assertEqual(health, {'status': 'ok', **self.engine.identity})
            self.assertEqual(request('GET', '/health')[0], 503)
            self.assertEqual(request('GET', '/health/unsupervised')[0], 503)
            status, result = request('POST', '/supervised/analyze', {'text': SAMPLES[0]})
            self.assertEqual(status, 200)
            self.assertEqual(result, self.engine.analyze_text(SAMPLES[0]))
            self.assertEqual(request('POST', '/supervised/analyze', {'text': 'curto'})[1]['analysisStatus'], 'insufficient_text')
            for payload in [{'text': ''}, {'text': SAMPLES[0], 'targetClassification': 'reliable'}, {'text': 123}, []]:
                self.assertEqual(request('POST', '/supervised/analyze', payload)[0], 400)
            server.supervised_engine = None
            status, result = request('POST', '/supervised/analyze', {'text': SAMPLES[0]})
            self.assertEqual(status, 503)
            self.assertEqual(result['analysisStatus'], 'unavailable')
            self.assertIsNone(result['fakeScore'])
            self.assertEqual(request('GET', '/health/supervised')[0], 503)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == '__main__':
    unittest.main()

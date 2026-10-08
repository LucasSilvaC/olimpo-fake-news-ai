from __future__ import annotations

from http.client import HTTPConnection
import json
from pathlib import Path
import sys
import threading
import unittest
from zipfile import ZipFile

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parents[1]
RESEARCH_ROOT = HERE.parent / 'machine-learning'
sys.path.insert(0, str(HERE))
from tools.export_unsupervised_catalog import build_catalog
from models.unsupervised.engine import NewsInsightsEngine, normalize_text
from service import create_server


class NewsInsightsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = NewsInsightsEngine()

    def test_frozen_corpus_records_reproduce_counts_and_items(self):
        run = RESEARCH_ROOT / 'outputs/model-comparison/fp-growth-metadados-ampliados-20261008T002311Z'
        frozen = pd.read_csv(run / 'features.csv', index_col='record_id', float_precision='round_trip')
        ids = ['fake/1', 'fake/10', 'true/1', 'true/10']
        archive_path = next((RESEARCH_ROOT / 'unsupervised-learning/data').glob('Fake.br-Corpus-*.zip'))
        with ZipFile(archive_path) as archive:
            for rid in ids:
                member = next(name for name in archive.namelist() if name.endswith('/full_texts/' + rid + '.txt'))
                text = archive.read(member).decode('utf8')
                frame = self.engine.extract(text)
                expected = frozen.loc[rid]
                columns = self.engine.feature_names + ['tokens_lexical', 'tokens_nonspace', 'punctuation_count_spacy']
                columns += [tag + '_count' for tag in self.engine.tags]
                for feature in columns:
                    actual = frame.at['input', feature]
                    self.assertTrue(np.isclose(actual, expected[feature], rtol=0, atol=1e-15, equal_nan=True), (rid, feature, actual, expected[feature]))
                expected_frame = frozen.loc[[rid]].rename(index={rid: 'input'})
                actual_matrix = self.engine.select_insights(frame, normalize_text(text)[:300])
                expected_insights = self.engine.select_insights(expected_frame, normalize_text(text)[:300])
                self.assertEqual(actual_matrix, expected_insights, rid)

    def test_normalization_and_window_are_frozen(self):
        text = '\ufeffＯ governo publicou documentos. ' + 'ação ' * 100
        response = self.engine.analyze_text(text)
        self.assertEqual(response['analyzedText'], normalize_text(text)[:300])
        self.assertEqual(response['characterLimit'], 300)
        self.assertTrue(response['quality']['truncated'])
        self.assertEqual(response, self.engine.analyze_text(normalize_text(text)))

    def test_empty_punctuation_and_absent_values(self):
        for text in ['', ' \n\t', '\ufeff', '\ud800']:
            result = self.engine.analyze_text(text)
            self.assertEqual(result['analysisStatus'], 'invalid_text')
            self.assertTrue(result['quality']['empty'])
            self.assertEqual(result['insights'], [])
        result = self.engine.analyze_text('!!!')
        self.assertEqual(result['analysisStatus'], 'invalid_text')
        self.assertTrue(result['quality']['noEligibleTokens'])
        frame = self.engine.extract('!!!')
        self.assertTrue(np.isnan(frame.at['input', 'POS_ADV_rate']))
        # Missing measurements cannot satisfy a <= 0 pattern.
        self.assertEqual(self.engine.select_insights(pd.DataFrame(index=['input']), ''), [])

    def test_exact_boundary_included_and_adjacent_values_excluded(self):
        from models.unsupervised import features as base
        for criterion in self.engine.criteria.itertuples():
            if criterion.omitted:
                continue
            boundary = criterion.threshold
            lower, upper = np.nextafter(boundary, -np.inf), np.nextafter(boundary, np.inf)
            frame = pd.DataFrame({criterion.feature: [lower, boundary, upper, np.nan]})
            matrix = base.apply_discretization(frame, self.engine.criteria.loc[self.engine.criteria.item.eq(criterion.item)])
            self.assertEqual(matrix[criterion.item].tolist(),
                             [True, True, False, False] if criterion.direction == 'baixo' else [False, True, True, False], criterion.item)

    def test_all_items_required_and_deterministic_selection(self):
        from models.unsupervised import features as base
        for pattern in self.engine.catalog['patterns']:
            values = {item['feature']: item['threshold'] for item in pattern['items']}
            frame = pd.DataFrame([values], index=['input']).reindex(columns=self.engine.feature_names)
            matrix = base.apply_discretization(frame, self.engine.criteria)
            items = [i['item'] for i in pattern['items']]
            self.assertTrue(matrix[items].all(axis=1).at['input'])
            for missing in pattern['items']:
                modified = frame.copy()
                modified.at['input', missing['feature']] = np.nan
                self.assertFalse(base.apply_discretization(modified, self.engine.criteria)[items].all(axis=1).at['input'])
        text = 'Os jornalistas leram 20 notícias. O governo publicou documentos sobre as escolas.'
        response = self.engine.analyze_text(text)
        self.assertEqual(response, self.engine.analyze_text(text))
        self.assertEqual(response['analysisStatus'], 'ok')
        self.assertLessEqual(len(response['insights']), 3)
        self.assertEqual(len(response['insights']), len({i['redundancyFamily'] for i in response['insights']}))
        for insight in response['insights']:
            self.assertTrue(insight['reflectionQuestions'])
            for measurement in insight['measurements']:
                self.assertGreater(measurement['denominatorCount'], 0)
                self.assertAlmostEqual(measurement['value'], measurement['count'] / measurement['denominatorCount'])

    def test_product_catalog_reproducible_and_has_no_class_data(self):
        self.assertEqual(self.engine.catalog, build_catalog())
        self.assertEqual(len(self.engine.catalog['patterns']), 20)
        self.assertFalse(self.engine.catalog['comparisonEnabled'])
        self.assertFalse(self.engine.catalog['review']['humanEditorialApproval'])
        forbidden = {'classComparison', 'classification', 'confidence', 'fake_count', 'true_count', 'composition_fake', 'frequency_in_fake'}
        def walk(value):
            if isinstance(value, dict):
                self.assertFalse(forbidden.intersection(value))
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)
        walk(self.engine.catalog)
        walk(self.engine.analyze_text('O governo publicou documentos sobre escolas.'))

    def test_serving_has_no_research_or_mining_imports(self):
        for name in ['fp_growth_principal', 'linguistic_fp_growth', 'linguistic_features', 'mlxtend']:
            self.assertNotIn(name, sys.modules)


class ServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = NewsInsightsEngine()
        cls.server = create_server(port=0, engine=cls.engine)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, method, path, body=None, headers=None):
        connection = HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
        try:
            connection.request(method, path, body=body, headers=headers or {})
            response = connection.getresponse()
            return response.status, json.loads(response.read())
        finally:
            connection.close()

    def test_health_and_real_request(self):
        status, health = self.request('GET', '/health')
        self.assertEqual(status, 200)
        self.assertEqual(health['status'], 'ok')
        self.assertFalse(health['comparisonEnabled'])
        text = 'Os jornalistas leram 20 notícias.'
        status, body = self.request('POST', '/analyze', json.dumps({'text': text}).encode(), {'Content-Type': 'application/json'})
        self.assertEqual(status, 200)
        self.assertEqual(body, self.engine.analyze_text(text))

    def test_invalid_requests_rejected(self):
        for payload in ['{broken', '{}', '{"text":42}', '{"text":"bom", "label":"fake"}', '[]', '{"text":""}', '{"text":"\\ud800"}']:
            status, body = self.request('POST', '/analyze', payload.encode(), {'Content-Type': 'application/json'})
            self.assertEqual(status, 400, payload)
            self.assertEqual(body['analysisStatus'], 'invalid_text')
            self.assertEqual(body['insights'], [])
        status, body = self.request('POST', '/analyze', b'{"text":"bom"}')
        self.assertEqual(status, 415)
        self.assertEqual(body['analysisStatus'], 'invalid_text')

    def test_unavailable_never_fabricates_insights(self):
        unavailable = create_server(port=0)
        thread = threading.Thread(target=unavailable.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection('127.0.0.1', unavailable.server_port, timeout=5)
        try:
            connection.request('POST', '/analyze', body=b'{"text":"bom"}', headers={'Content-Type': 'application/json'})
            result = connection.getresponse()
            self.assertEqual(result.status, 503)
            body = json.loads(result.read())
            self.assertEqual(body['analysisStatus'], 'unavailable')
            self.assertEqual(body['insights'], [])
        finally:
            connection.close()
            unavailable.shutdown()
            unavailable.server_close()
            thread.join()


if __name__ == '__main__':
    unittest.main()

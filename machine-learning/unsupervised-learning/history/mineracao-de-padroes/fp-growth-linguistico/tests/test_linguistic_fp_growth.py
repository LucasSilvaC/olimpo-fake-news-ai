"""Checks for document identity, denominators, frozen quantiles and rule metrics."""
import ast
import json
from pathlib import Path
import sys
import unittest

import numpy as np
import pandas as pd
import spacy

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))

from linguistic_features import extract_features
from linguistic_fp_growth import apply_discretization, bootstrap_rules, evaluate_rules, fit_discretization


class LinguisticFeaturesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.nlp = spacy.load('pt_core_news_sm', disable=['ner'])
        cls.records = pd.DataFrame({
            'record_id': ['fake/1', 'true/1', 'fake/2', 'true/2', 'fake/3'],
            'text': ['', '!!!', '2026 20', 'Os jornalistas publicaram notícias.\n\n',
                     'Os jornalistas publicaram notícias. ' + 'palavra ' * 70],
            'author': [None, 'Maria', '', 'None', 'Pedro'],
        }).set_index('record_id')
        cls.features = extract_features(cls.records, cls.nlp)

    def test_identity_alignment_and_no_label_feature(self):
        self.assertEqual(self.features.index.tolist(), self.records.index.tolist())
        self.assertTrue(self.features.index.is_unique)
        self.assertNotIn('label', self.features.columns)
        self.assertNotIn('text', self.features.columns)

    def test_empty_is_missing_but_absent_tag_is_zero(self):
        self.assertTrue(np.isnan(self.features.loc['fake/1', 'POS_NOUN_rate']))
        self.assertTrue(np.isnan(self.features.loc['true/1', 'POS_NOUN_rate']))
        self.assertEqual(self.features.loc['fake/2', 'POS_NOUN_rate'], 0.)
        self.assertEqual(self.features.loc['fake/2', 'tokens_lexical'], 2)

    def test_spaces_and_punctuation_have_distinct_denominators(self):
        row = self.features.loc['true/2']
        self.assertGreater(row.tokens_all, row.tokens_nonspace)
        self.assertGreater(row.tokens_nonspace, row.tokens_lexical)
        self.assertAlmostEqual(row.punctuationDensity_spacy,
                               1. / row.tokens_nonspace)

    def test_complete_sentence_sensitivity_has_no_extra_tokens(self):
        row = self.features.loc['fake/3']
        self.assertGreater(row.tokens_lexical, row.tokens_complete_lexical)
        self.assertGreater(row.tokens_complete_lexical, 0)
        for tag in ('nsubj', 'obj', 'amod', 'advmod', 'ccomp', 'advcl'):
            rate = row[f'DEP_complete_{tag}_rate']
            self.assertGreaterEqual(rate, 0.)
            self.assertLessEqual(rate, 1.)

    def test_legacy_features_reproduce_original_definitions(self):
        # Read the original implementation rather than reimplement its formula.
        ns = {'np': np}
        notebook = json.loads((HERE.parent / 'fp-growth-legado/fp_growth_baseline_com_autoria.ipynb').read_text(encoding='utf-8'))
        import re
        import unicodedata
        ns.update({'re': re, 'unicodedata': unicodedata})
        source = next(''.join(c['source']) for c in notebook['cells']
                      if c['cell_type'] == 'code' and ''.join(c['source']).startswith('"""Minera'))
        module = ast.parse(source)
        for node in module.body:
            if isinstance(node, ast.Assign) and any(
                isinstance(t, ast.Name) and t.id in {'WORDS', 'TOKENS'} for t in node.targets):
                exec(compile(ast.Module(body=[node], type_ignores=[]), '<baseline>', 'exec'), ns)
        style_src = next(''.join(c['source']) for c in notebook['cells']
                         if c['cell_type'] == 'code' and ''.join(c['source']).startswith('def style'))
        exec(style_src, ns)
        for rid, record in self.records.iterrows():
            expected = ns['style'](record.text, record.author)
            for feature, value in expected.items():
                self.assertTrue(np.isclose(self.features.loc[rid, feature], value, equal_nan=True),
                                (rid, feature))


class FrozenDiscretizationTests(unittest.TestCase):
    def test_missing_and_constant_features_are_omitted(self):
        frame = pd.DataFrame({'x': [0., 0., 1., 2., 3., 4., np.nan],
                              'constant': [1.] * 7, 'missing': [np.nan] * 7})
        matrix, criteria = fit_discretization(frame, ['x', 'constant', 'missing'])
        self.assertTrue(all(name.startswith('x_') for name in matrix.columns))
        self.assertEqual(len(matrix.columns), 2)
        self.assertFalse(matrix.iloc[-1].any())
        external = pd.DataFrame({'x': [-100., 100., np.nan], 'constant': [1.] * 3,
                                 'missing': [np.nan] * 3})
        applied = apply_discretization(external, criteria)
        self.assertEqual(applied.columns.tolist(), matrix.columns.tolist())
        self.assertEqual(applied.sum(axis=1).tolist(), [1, 1, 0])
        self.assertTrue(applied.loc[0, 'x_baixo'])
        self.assertTrue(applied.loc[1, 'x_alto'])


class RuleMetricsTests(unittest.TestCase):
    def test_bootstrap_resamples_groups_and_is_reproducible(self):
        # Doubling every observation inside its group must leave all metrics
        # and percentile intervals unchanged when groups are resampled intact.
        compact = pd.DataFrame({'A': [1, 1, 0, 0], 'B': [1, 0, 1, 0]}).astype(bool)
        groups = pd.Series(['g1', 'g2', 'g3', 'g4'], index=compact.index)
        rules = pd.DataFrame([{'rule_id': 'AB', 'antecedents': ['A'], 'consequents': ['B']}])
        original = bootstrap_rules(compact, rules, groups, repetitions=100, seed=42)
        expanded = compact.loc[compact.index.repeat(2)].reset_index(drop=True)
        expanded_groups = pd.Series(groups.repeat(2).tolist(), index=expanded.index)
        duplicate = bootstrap_rules(expanded, rules, expanded_groups, repetitions=100, seed=42)
        pd.testing.assert_frame_equal(original, duplicate)
        pd.testing.assert_frame_equal(original, bootstrap_rules(compact, rules, groups, 100, 42))

    def test_no_eligible_rules_produce_mergeable_tables(self):
        matrix = pd.DataFrame({'A': [True, False]})
        rules = pd.DataFrame({'rule_id': pd.Series(dtype='str'),
                              'antecedents': pd.Series(dtype='object'),
                              'consequents': pd.Series(dtype='object')})
        metrics = evaluate_rules(matrix, rules)
        joined = rules.merge(metrics, on='rule_id', how='left')
        self.assertEqual(len(joined), 0)
        self.assertIn('confidence', joined)

    def test_known_contingency_and_empty_antecedent(self):
        matrix = pd.DataFrame({'A': [1, 1, 1, 1, 1, 1, 0, 0],
                               'B': [1, 1, 1, 0, 0, 0, 1, 0],
                               'Z': [0] * 8}).astype(bool)
        rules = pd.DataFrame([
            {'rule_id': 'AB', 'antecedents': ['A'], 'consequents': ['B']},
            {'rule_id': 'ZB', 'antecedents': ['Z'], 'consequents': ['B']},
        ])
        metrics = evaluate_rules(matrix, rules).set_index('rule_id')
        row = metrics.loc['AB']
        self.assertEqual(row.occurrences, 3)
        self.assertAlmostEqual(row.support, 3 / 8)
        self.assertAlmostEqual(row.confidence, 3 / 6)
        self.assertAlmostEqual(row.lift, 1.)
        self.assertAlmostEqual(row.jaccard, 3 / 7)
        self.assertTrue(np.isnan(metrics.loc['ZB', 'confidence']))


if __name__ == '__main__':
    unittest.main()

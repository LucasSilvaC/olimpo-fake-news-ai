"""Failure paths and missing-value semantics for the linguistic extractor."""

import json
from pathlib import Path
import sys
import unittest

import numpy as np
import pandas as pd
import spacy

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from linguistic_features import audit_features, extract_features


class AdditionalExtractionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.nlp = spacy.load("pt_core_news_sm", disable=["ner"])

    def records(self, texts, ids=None):
        return pd.DataFrame(
            {"text": texts, "author": [None] * len(texts)},
            index=pd.Index(ids or [f"record/{i}" for i in range(len(texts))], name="record_id"),
        )

    def test_missing_pos_and_parser_fail_explicitly(self):
        records = self.records(["A jornalista publicou a notícia."])
        with self.assertRaisesRegex(ValueError, "POS, DEP, and sentence"):
            extract_features(records, spacy.blank("pt"))
        with self.nlp.select_pipes(disable=["parser"]):
            with self.assertRaisesRegex(ValueError, "POS, DEP, and sentence"):
                extract_features(records, self.nlp)
        with self.nlp.select_pipes(disable=["morphologizer"]):
            with self.assertRaisesRegex(ValueError, "POS, DEP, and sentence"):
                extract_features(records, self.nlp)

    def test_duplicate_record_ids_fail(self):
        records = self.records(["Um texto.", "Outro texto."], ["record/1", "record/1"])
        with self.assertRaisesRegex(ValueError, "record_id must be unique"):
            extract_features(records, self.nlp)

    def test_empty_dataframe_preserves_schema_and_json_safe_audit(self):
        records = self.records([""])
        expected = extract_features(records, self.nlp)
        empty = extract_features(records.iloc[:0], self.nlp)
        self.assertEqual(empty.columns.tolist(), expected.columns.tolist())
        self.assertEqual(empty.index.name, "record_id")
        evidence = audit_features(empty)
        self.assertEqual(evidence["records"], 0)
        self.assertIsNone(evidence["legacy_identity_max_abs_error"])
        json.dumps(evidence, allow_nan=False)

    def test_nfkc_bom_and_numbers_are_not_spacy_punctuation(self):
        records = self.records(["\ufeff１２３ ４５６!"])
        row = extract_features(records, self.nlp).iloc[0]
        self.assertEqual(row.text_chars_raw, 9)
        self.assertEqual(row.text_chars_normalized, 8)
        self.assertEqual(row.tokens_lexical, 2)
        self.assertEqual(row.punctuation_count_spacy, 1)
        self.assertAlmostEqual(row.punctuationDensity_spacy, 1 / 3)
        self.assertEqual(row.punctuationDensity, 1.)
        self.assertEqual(row.POS_NOUN_rate, 0.)
        json.dumps(audit_features(extract_features(records, self.nlp)), allow_nan=False)

    def test_single_truncated_sentence_has_missing_complete_rates(self):
        records = self.records(["A jornalista escreve " + "palavras " * 100])
        row = extract_features(records, self.nlp).iloc[0]
        self.assertTrue(row.quality_truncated)
        self.assertTrue(row.quality_complete_last_sentence_dropped)
        self.assertTrue(row.quality_complete_noeligible)
        self.assertEqual(row.tokens_complete_lexical, 0)
        self.assertEqual(row.text_chars_complete_kept, 0)
        self.assertTrue(np.isnan(row.DEP_complete_nsubj_rate))
        self.assertGreater(row.tokens_lexical, 0)


if __name__ == "__main__":
    unittest.main()

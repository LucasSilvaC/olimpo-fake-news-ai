"""Semantic checks for class comparison; composition and class coverage differ."""
from pathlib import Path
import sys
import unittest

import numpy as np
import pandas as pd

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from compare_linguistic_rules import partition_stats, rank_select


class RankingSemanticsTests(unittest.TestCase):
    def test_ninety_percent_purity_does_not_mean_ninety_percent_class_coverage(self):
        fake = np.array([True]*100+[False]*100)
        author = np.tile([0,1],100)
        event = np.zeros((200,1),dtype=bool)
        event[:9] = True
        event[100] = True
        row = partition_stats(event,fake,author).iloc[0]
        self.assertEqual(row.fake_pct,90.)
        self.assertEqual(row.fake_coverage_pct,9.)
        self.assertEqual(row.true_coverage_pct,1.)
        self.assertEqual(row.fake_count+row.true_count,row.occurrences)

    def test_author_mix_can_explain_raw_class_composition(self):
        # Author0 population:90Fake/10True; author1:10Fake/90True.
        fake = np.array([True]*90+[False]*10+[True]*10+[False]*90)
        author = np.array([0]*100+[1]*100)
        event = np.zeros((200,1),dtype=bool)
        event[:81]=True
        event[90:99]=True
        event[100]=True
        event[110:119]=True
        row = partition_stats(event,fake,author).iloc[0]
        self.assertEqual(row.fake_pct,82.)
        self.assertAlmostEqual(row.author_adjusted_excess_fake_pp,0.)
        self.assertAlmostEqual(row.author_standardized_fake_pct,50.)

    def test_unobserved_author_stratum_is_missing_not_zero(self):
        fake=np.array([True,False,True,False]);author=np.array([0,0,1,1])
        row=partition_stats(np.array([[1],[1],[0],[0]]),fake,author).iloc[0]
        self.assertTrue(np.isnan(row.with_author_fake_pct))
        self.assertTrue(np.isnan(row.author_adjusted_excess_fake_pp))

    def test_test_outcomes_cannot_change_ranking_and_duplicate_coverage_is_excluded(self):
        table=pd.DataFrame({'pattern_id':['A','B','C'],
          'validation_fake_pct':[85.,80.,30.],'validation_true_pct':[15.,20.,70.],
          'validation_fake_ci_low_pct':[75.,70.,20.],'validation_fake_ci_high_pct':[90.,88.,40.],
          'validation_baseline_fake_pct':[50.]*3,'validation_baseline_true_pct':[50.]*3,
          'validation_fake_coverage_pct':[30.,30.,10.],'validation_true_coverage_pct':[5.,5.,30.],
          'validation_occurrences':[150]*3,'validation_paired_permutation_q_by':[.01]*3,
          'train_rule_rediscovery_pct':[100.]*3,'test_fake_pct':[5.,99.,99.]})
        events=np.array([[1,1,0],[1,1,0],[0,0,1],[0,0,1]],dtype=bool)
        _, first=rank_select(table,events,max_rules=20)
        table.test_fake_pct=[99.,0.,0.]
        _, second=rank_select(table,events,max_rules=20)
        self.assertEqual(first.pattern_id.tolist(),['A','C'])
        self.assertEqual(first.pattern_id.tolist(),second.pattern_id.tolist())


if __name__=='__main__':unittest.main()

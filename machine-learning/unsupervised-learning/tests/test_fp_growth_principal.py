import hashlib
from pathlib import Path
import sys
import unittest

import numpy as np
import pandas as pd
import spacy

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import fp_growth_principal as exp


class ExpansionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.nlp=spacy.load('pt_core_news_sm',disable=['ner'])

    def test_empty_versus_absent_and_denominators(self):
        records=pd.DataFrame({'text':['','!!!','Os jornalistas leram 20 notícias.\n\n'],
                              'author':['','','']},index=['fake/1','true/1','fake/2'])
        f=exp.extract_collected_features(records,self.nlp,['POS_NUM','POS_SPACE','DEP_obl'])
        self.assertTrue(np.isnan(f.at['fake/1','POS_NUM_rate']))
        self.assertTrue(np.isnan(f.at['true/1','DEP_obl_rate']))
        doc=self.nlp(records.at['fake/2','text'])
        lexical=[t for t in doc if not t.is_space and not t.is_punct]
        self.assertEqual(f.at['fake/2','POS_NUM_count'],1)
        self.assertAlmostEqual(f.at['fake/2','POS_NUM_rate'],1/len(lexical))
        self.assertEqual(f.at['fake/2','POS_SPACE_rate'],0)
        self.assertGreater(f.at['fake/2','diag_space_count'],0)
        self.assertEqual(f.at['fake/2','text_sha256'],hashlib.sha256(records.at['fake/2','text'].encode()).hexdigest())

    def test_fixed_window_and_unchanged_reference_features(self):
        text='\ufeffO governo publicou 10 documentos. '+ 'palavra '*100
        records=pd.DataFrame({'text':[text],'author':['Maria']},index=['true/1'])
        tags,variants,pool=exp.configuration()
        f=exp.extract_collected_features(records,self.nlp,tags)
        old=exp.base_extraction.extract_features(records,self.nlp)
        for c in ['tem_autor']+variants['referencia_corrigida']:
            self.assertTrue(np.isclose(f.at['true/1',c],old.at['true/1',c],equal_nan=True),c)
        self.assertEqual(f.at['true/1','text_chars_window'],300)
        self.assertTrue(f.at['true/1','quality_truncated'])
        self.assertEqual(set(exp.EXCLUDED)&{c.removesuffix('_rate') for c in variants['metadados_coletados']},set())
        self.assertNotIn('label',variants['metadados_coletados'])
        self.assertNotIn('tem_autor',variants['metadados_coletados'])
        self.assertIn('POS_ADV_rate',variants['metadados_coletados'])

    def test_mining_empty_and_known_cooccurrence(self):
        _,empty=exp.mine(pd.DataFrame(index=range(5)))
        self.assertEqual(len(empty),0)
        matrix=pd.DataFrame({'A':[True]*8+[False]*2,'B':[True]*8+[False]*2})
        _,rules=exp.mine(matrix)
        rule=rules.loc[rules.antecedents.map(lambda x:x==['A'])].iloc[0]
        self.assertAlmostEqual(rule.support,.8)
        self.assertAlmostEqual(rule.confidence,1)
        self.assertAlmostEqual(rule.lift,1.25)
        self.assertTrue(rule.passes_filters)

    def test_class_denominators_and_missing_strata(self):
        frame=pd.DataFrame({'tem_autor':[0,0,0,1]},index=['fake/1','fake/2','true/1','true/2'])
        assignments=pd.DataFrame({'record_id':frame.index,'partition':['validation']*4})
        items=pd.DataFrame({'A':[True,False,True,False]},index=frame.index)
        rows=exp.composition(frame,assignments,items)
        allrows=next(x for x in rows if x['partition']=='validation' and x['author_state']=='all')
        self.assertEqual(allrows['occurrences'],2)
        self.assertEqual(allrows['composition_fake'],.5)
        self.assertEqual(allrows['frequency_in_fake'],.5)
        stratum=next(x for x in rows if x['partition']=='validation' and x['author_state']=='sem_autor')
        self.assertEqual(stratum['frequency_in_true'],1)
        missing=next(x for x in rows if x['partition']=='test' and x['author_state']=='all')
        self.assertIsNone(missing['composition_fake'])

    def test_group_resampling_keeps_pairs_and_duplicates_together(self):
        ids=['fake/1','true/1','fake/2','true/2']
        a=pd.DataFrame({'record_id':ids,'group_id':['g1','g1','g2','g2']})
        samples=exp.training_resamples(a,ids,20)
        for sample in samples:
            counts=np.bincount(sample,minlength=4)
            self.assertEqual(counts[0],counts[1])
            self.assertEqual(counts[2],counts[3])


if __name__=='__main__':
    unittest.main()

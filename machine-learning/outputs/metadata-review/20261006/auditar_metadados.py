"""Auditoria de leitura; não altera os scripts da equipe nem os notebooks."""
import ast
import hashlib
import importlib.util
from importlib.metadata import version
import json
import os
from pathlib import Path
import platform
import statistics
import sys
import unicodedata
from collections import Counter
from zipfile import ZipFile

import numpy as np
import pandas as pd
import spacy

search_roots = [Path(__file__).resolve().parent, *Path(__file__).resolve().parents]
REPO = next(candidate for parent in search_roots
            for candidate in (parent, parent / 'olimpo-fake-news-ai')
            if (candidate / 'machine-learning' / 'unsupervised-learning' /
                'fp_growth_baseline_com_autoria.ipynb').is_file())
ROOT = REPO / 'machine-learning'
OUT = ROOT / 'outputs' / 'metadata-review' / '20261006'
OUT.mkdir(parents=True, exist_ok=True)
os.chdir(REPO)
notebook = ROOT / 'unsupervised-learning' / 'fp_growth_baseline_com_autoria.ipynb'
ns = {}
for cell in json.loads(notebook.read_text(encoding='utf-8'))['cells']:
    source = ''.join(cell['source'])
    if cell['cell_type'] == 'code' and (source.startswith('"""Minera') or source.startswith('def ')):
        exec(compile(source, str(notebook), 'exec'), ns)
manifest = json.loads(ns['BASELINE'].read_text(encoding='utf-8'))
archive = ns['DATA'] / f"Fake.br-Corpus-{manifest['corpus']['revision']}.zip"
assert hashlib.sha256(archive.read_bytes()).hexdigest() == manifest['corpus']['archive_sha256']
features = ns['read_corpus'](archive)
train_ids = manifest['partitions']['canonical_random_group']['train']['record_ids']
train = features.loc[train_ids]
matrix, thresholds = ns['transactions'](train, .25, .75)
frequent, rules, _, covers = ns['mine'](matrix, .08, 3, .5, 1.05, .1, .9)
selected = train.sample(n=100, random_state=42).index.tolist()
texts = {}
lengths = {}
with ZipFile(archive) as z:
    for group in ('fake', 'true'):
        names = [n for n in z.namelist() if f'/full_texts/{group}/' in n and n.endswith('.txt')]
        data = {f'{group}/{Path(n).stem}': z.read(n).decode('utf-8') for n in names}
        texts.update(data)
        sizes = [len(t) for t in data.values()]
        lengths[group] = {'count': len(sizes), 'median_chars': statistics.median(sizes),
                          'mean_chars': statistics.mean(sizes)}
sample = [texts[rid] for rid in selected]
LEGACY = ROOT / 'metadados' / 'legacy'
module_path = LEGACY / 'extracao_funcoes.py'
spec = importlib.util.spec_from_file_location('team_extraction', module_path)
team = importlib.util.module_from_spec(spec)
spec.loader.exec_module(team)
aggregate = team.metaExtractionFromDataset(sample)
formatted = team.formatarMetadados(aggregate, str(OUT / 'sample_aggregate_original.csv'))
rows = []
denominators = []
for rid, doc in zip(selected, team.nlp.pipe(sample, batch_size=50)):
    valid = [t for t in doc if not t.is_space and not t.is_punct]
    counts = Counter(f'POS_{t.pos_}' for t in valid)
    denominators.append(len(valid))
    rows.append({'record_id': rid, 'token_count': len(doc), 'lexical_token_count': len(valid),
                 'space_count': sum(t.is_space for t in doc),
                 **{f'{key}_rate': counts[key] / len(valid) if valid else np.nan
                    for key in ('POS_ADJ', 'POS_ADV', 'POS_NOUN', 'POS_PROPN', 'POS_VERB', 'POS_PRON')}})
sample_features = pd.DataFrame(rows).set_index('record_id')
sample_features.to_csv(OUT / 'sample_per_document_pos.csv', encoding='utf-8')
macro = sample_features['POS_NOUN_rate'].mean()
pooled = np.average(sample_features['POS_NOUN_rate'], weights=denominators)
probe = team.nlp('A notícia chegou.\n\n2026!')
token_probe = [{'text': t.text, 'pos': t.pos_, 'dep': t.dep_, 'space': t.is_space,
                'punct': t.is_punct} for t in probe]
eda = ast.parse((LEGACY / 'eda-depracated.py').read_text(encoding='utf-8'))
eda_ns = {'pd': pd, 'POS_TAGS': {'NOUN'}}
exec(compile(ast.Module(body=[n for n in eda.body if isinstance(n, ast.FunctionDef)],
                        type_ignores=[]), 'eda-functions', 'exec'), eda_ns)
errors = {}
try:
    eda_ns['collectMetadado'](formatted, 'pos')
except Exception as exc:
    errors['current_csv_in_eda'] = f'{type(exc).__name__}: {exc}'
try:
    eda_ns['collectMetadado'](pd.DataFrame({'Metadado': ['NOUN']}), 'morph')
except Exception as exc:
    errors['morph_mode'] = f'{type(exc).__name__}: {exc}'
evidence = {
    'date_local': '2026-10-06',
    'scope': 'Baseline integral; NLP em amostra aleatória de 100 notícias do treino; sem experimento enriquecido de mineração.',
    'environment': {'python': platform.python_version(), 'spacy': spacy.__version__,
                    'packages': {name: version(name) for name in ('numpy', 'pandas', 'mlxtend', 'scipy')},
                    'pt_core_news_sm': team.nlp.meta['version'], 'pipeline': team.nlp.pipe_names},
    'source_sha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                      for p in [notebook, *sorted(LEGACY.glob('*.py'))]},
    'corpus': manifest['corpus'],
    'baseline': {'total_records': len(features), 'train_records': len(train),
                 'frequent_itemsets': len(frequent), 'all_rules': len(rules),
                 'eligible_rules': int(rules.passes_filters.sum()), 'patterns': len(covers),
                 'patterns_with_author': sum(any('autor' in i for i in row)
                    for row in frequent.loc[frequent.itemset_size.ge(2), 'features']),
                 'identity_max_abs_error': float((train.typeTokenRatio -
                     train.diversidade * (1 - train.punctuationDensity)).abs().max()),
                 'thresholds': thresholds, 'item_supports': matrix.mean().to_dict()},
    'full_text_lengths': lengths,
    'nlp_sample': {'random_state': 42, 'record_ids': selected, 'size': len(selected),
                   'original_tokens': aggregate['META_quant_tokens'],
                   'original_csv_rows': len(formatted), 'original_csv_columns': formatted.columns.tolist(),
                   'percentage_sum_by_type': formatted.groupby('Tipo')['Porcentagem (%)'].sum().to_dict(),
                   'space_tokens': int(sample_features.space_count.sum()),
                   'noun_macro_rate': float(macro), 'noun_pooled_rate': float(pooled),
                   'token_probe': token_probe},
    'eda_errors': errors,
}
(OUT / 'evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k: v for k, v in evidence.items() if k not in ('source_sha256', 'nlp_sample')},
                 ensure_ascii=False, indent=2))
print('NLP SAMPLE', json.dumps({k: v for k, v in evidence['nlp_sample'].items() if k != 'record_ids'}, ensure_ascii=False))
print('OUTPUT', OUT)

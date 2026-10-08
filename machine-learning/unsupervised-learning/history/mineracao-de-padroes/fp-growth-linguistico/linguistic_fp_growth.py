"""Reproducible label-free linguistic FP-Growth ablations on frozen Fake.br IDs.

The test results are descriptive: this project's canonical test was used before.
All discovery and thresholds use training only; validation bootstrap holds rules fixed.
"""
from __future__ import annotations

import argparse
import ast
from collections import defaultdict
from datetime import datetime, timezone
import hashlib
from importlib.metadata import version
import json
from pathlib import Path
import platform
import unicodedata

import numpy as np
import pandas as pd

import linguistic_features as extraction

ROOT = next(parent for parent in Path(__file__).resolve().parents
            if (parent / 'unsupervised-learning/README.md').is_file())
BASELINE_NOTEBOOK = ROOT / 'unsupervised-learning/history/mineracao-de-padroes/fp-growth-legado/fp_growth_baseline_com_autoria.ipynb'
BASELINE_MANIFEST = ROOT / 'outputs/model-comparison/dbscan-20260924T141332Z/run_manifest.json'
LEGACY = ['typeTokenRatio', 'linkDensity', 'punctuationDensity', 'uppercaseRatio', 'diversidade']
CORRECTED = ['diversidade', 'linkDensity', 'uppercaseRatio', 'punctuationDensity_spacy']
POS = [f'POS_{tag}_rate' for tag in ('ADJ', 'ADV', 'NOUN', 'PROPN', 'VERB', 'PRON')]
DEP_TAGS = ('nsubj', 'obj', 'amod', 'advmod', 'ccomp', 'advcl')
DEP = [f'DEP_{tag}_rate' for tag in DEP_TAGS]
COMPLETE_DEP = [f'DEP_complete_{tag}_rate' for tag in DEP_TAGS]
VARIANTS = {
    'legacy_author': (LEGACY, True), 'legacy_style': (LEGACY, False),
    'legacy_pos': (LEGACY + POS, False), 'corrected_style': (CORRECTED, False),
    'corrected_pos': (CORRECTED + POS, False),
    'corrected_pos_dep': (CORRECTED + POS + DEP, False),
    'corrected_pos_dep_complete': (CORRECTED + POS + COMPLETE_DEP, False),
}
PARAMETERS = {'min_support': .08, 'max_len': 3, 'min_confidence': .5,
              'min_lift': 1.05, 'min_jaccard': .1, 'redundancy_jaccard': .9,
              'consolidation_jaccard': .75, 'extension_tolerance': .03,
              'low_quantile': .25, 'high_quantile': .75, 'character_limit': 300}


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def stable_id(values):
    return hashlib.sha256(json.dumps(values, ensure_ascii=True).encode()).hexdigest()[:12]


def rule_key(antecedents, consequents):
    return stable_id([sorted(antecedents), sorted(consequents)])


def _items(value):
    return json.loads(value) if isinstance(value, str) else list(value)


def _json_clean(value):
    if isinstance(value, dict):
        return {str(k): _json_clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_clean(v) for v in value]
    if isinstance(value, np.generic):
        value = value.item()
    if isinstance(value, float) and not np.isfinite(value):
        return None
    return value


def _save(table, path):
    copy = table.drop(columns=['itemsets'], errors='ignore').copy()
    for name in copy.columns:
        if copy[name].map(lambda x: isinstance(x, (list, dict, set, tuple, frozenset))).any():
            copy[name] = copy[name].map(lambda x: json.dumps(_json_clean(sorted(x) if isinstance(x, (set, frozenset)) else x), ensure_ascii=False))
    copy.to_csv(path, index=False, encoding='utf-8', float_format='%.17g')


def _baseline_functions():
    """Load imports/definitions only; neither notebook main nor downloads execute."""
    namespace = {}
    notebook = json.loads(BASELINE_NOTEBOOK.read_text(encoding='utf-8'))
    nodes = []
    for cell in notebook['cells']:
        if cell['cell_type'] != 'code':
            continue
        source = ''.join(cell['source'])
        if not (source.startswith('def ') or source.startswith('"""Minera')):
            continue
        for node in ast.parse(source).body:
            if isinstance(node, (ast.Import, ast.ImportFrom, ast.FunctionDef)):
                nodes.append(node)
            elif isinstance(node, ast.Assign) and all(isinstance(t, ast.Name) and t.id in {'WORDS', 'TOKENS', 'FEATURES', 'FAMILIES'} for t in node.targets):
                nodes.append(node)
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(BASELINE_NOTEBOOK), 'exec'), namespace)
    namespace['FAMILIES'].update({f: 'POS' for f in POS})
    namespace['FAMILIES'].update({f: 'sintaxe' for f in DEP + COMPLETE_DEP})
    namespace['FAMILIES']['punctuationDensity_spacy'] = 'estilo'
    return namespace


def fit_discretization(frame, feature_names, include_author=False):
    """Learn quartiles solely from frame. Degenerate/missing features emit no items."""
    criteria = []
    if include_author:
        for item, value in [('com_autor', 1), ('sem_autor', 0)]:
            criteria.append({'feature': 'tem_autor', 'item': item, 'direction': 'equals',
                             'threshold': value, 'low_threshold': None, 'high_threshold': None,
                             'missing': int(frame.tem_autor.isna().sum()), 'omitted': False,
                             'omission_reason': '', 'criterion': f'value == {value}'})
    for feature in feature_names:
        series = pd.to_numeric(frame[feature], errors='coerce').replace([np.inf, -np.inf], np.nan)
        low, high = float(series.quantile(.25)), float(series.quantile(.75))
        omitted = not np.isfinite(low) or not np.isfinite(high) or low >= high
        reason = 'all_missing' if series.notna().sum() == 0 else 'equal_quantiles' if omitted else ''
        for direction, threshold in [('baixo', low), ('alto', high)]:
            criteria.append({'feature': feature, 'item': f'{feature}_{direction}', 'direction': direction,
                             'threshold': threshold, 'low_threshold': low, 'high_threshold': high,
                             'low_quantile': .25, 'high_quantile': .75,
                             'missing': int(series.isna().sum()), 'omitted': omitted,
                             'omission_reason': reason, 'criterion': 'value <= threshold' if direction == 'baixo' else 'value >= threshold'})
    criteria = pd.DataFrame(criteria, columns=['feature', 'item', 'direction', 'threshold',
        'low_threshold', 'high_threshold', 'low_quantile', 'high_quantile', 'missing',
        'omitted', 'omission_reason', 'criterion'])
    matrix = apply_discretization(frame, criteria)
    criteria['train_occurrences'] = [int(matrix[c].sum()) if c in matrix else 0 for c in criteria.item]
    criteria['train_actual_support'] = criteria.train_occurrences / len(frame) if len(frame) else np.nan
    return matrix, criteria


def apply_discretization(frame, criteria):
    """Apply previously learned criteria without computing any new quantile."""
    result = pd.DataFrame(index=frame.index)
    for row in criteria.itertuples():
        if row.direction not in {'equals', 'baixo', 'alto'}:
            raise ValueError(f'Unknown discretization direction: {row.direction}')
        if row.omitted:
            continue
        if not np.isfinite(row.threshold):
            raise ValueError(f'Nonfinite threshold for {row.item}')
        series = pd.to_numeric(frame[row.feature], errors='coerce').replace([np.inf, -np.inf], np.nan)
        if row.direction == 'equals':
            mask = series.eq(row.threshold)
        elif row.direction == 'baixo':
            mask = series.le(row.threshold)
        elif row.direction == 'alto':
            mask = series.ge(row.threshold)
        result[row.item] = mask & series.notna()
    return result.astype(bool)


def _events(matrix, rules):
    n, r = len(matrix), len(rules)
    antecedents, consequents = np.zeros((n, r), dtype=bool), np.zeros((n, r), dtype=bool)
    for j, row in enumerate(rules.itertuples()):
        a, c = _items(row.antecedents), _items(row.consequents)
        antecedents[:, j] = matrix[a].all(axis=1).to_numpy()
        consequents[:, j] = matrix[c].all(axis=1).to_numpy()
    return antecedents, consequents, antecedents & consequents


def _metrics(a, c, joint, n):
    n = np.asarray(n, dtype=float)
    with np.errstate(divide='ignore', invalid='ignore'):
        support = joint / n
        asupport, csupport = a / n, c / n
        confidence = np.where(a > 0, joint / a, np.nan)
        lift = np.where((a > 0) & (c > 0), joint * n / (a * c), np.nan)
        union = a + c - joint
        jaccard = np.where(union > 0, joint / union, np.nan)
    return {'occurrences': joint, 'antecedent_occurrences': a, 'consequent_occurrences': c,
            'support': support, 'antecedent_support': asupport, 'consequent_support': csupport,
            'confidence': confidence, 'lift': lift, 'jaccard': jaccard,
            'passes_filters': (support >= .08) & (confidence >= .5) & (lift >= 1.05) & (jaccard >= .1)}


def evaluate_rules(matrix, rules):
    """Evaluate fixed directed rules; undefined conditional metrics remain NaN."""
    a, c, joint = _events(matrix, rules)
    output = pd.DataFrame(_metrics(a.sum(axis=0), c.sum(axis=0), joint.sum(axis=0), len(matrix)))
    output.insert(0, 'rule_id', pd.Series([getattr(r, 'rule_id', rule_key(_items(r.antecedents), _items(r.consequents))) for r in rules.itertuples()], dtype='str'))
    return output


def bootstrap_rules(matrix, rules, groups, repetitions=100, seed=42):
    """Fixed-event percentile intervals from resampling whole canonical groups."""
    if isinstance(repetitions, bool) or not isinstance(repetitions, (int, np.integer)) or repetitions < 0:
        raise ValueError('bootstrap_repetitions must be a nonnegative integer')
    ids = pd.Series(groups, index=matrix.index)
    if ids.isna().any():
        raise ValueError('Every bootstrap record must have a group')
    ids = ids.astype(str)
    group_names = sorted(ids.unique())
    codes = pd.Categorical(ids, categories=group_names).codes
    a, c, joint = _events(matrix, rules)
    aggregate = []
    for event in [a, c, joint]:
        counts = np.zeros((len(group_names), len(rules)), dtype=float)
        np.add.at(counts, codes, event)
        aggregate.append(counts)
    sizes = np.bincount(codes, minlength=len(group_names))
    rng = np.random.default_rng(seed)
    samples = {'confidence': [], 'lift': [], 'passes_filters': []}
    for _ in range(repetitions if group_names else 0):
        weights = np.bincount(rng.integers(0, len(group_names), size=len(group_names)), minlength=len(group_names))
        metrics = _metrics(*(weights @ x for x in aggregate), weights @ sizes)
        for key in samples:
            samples[key].append(metrics[key])
    output = pd.DataFrame({'rule_id': pd.Series([r.rule_id for r in rules.itertuples()], dtype='str')})
    for key in ['confidence', 'lift']:
        array = np.asarray(samples[key]) if samples[key] else np.empty((0, len(rules)))
        for suffix, quantile in [('low', .025), ('high', .975)]:
            output[f'validation_{key}_ci_{suffix}'] = [float(np.quantile(array[:, j][np.isfinite(array[:, j])], quantile)) if len(array) and np.isfinite(array[:, j]).any() else np.nan for j in range(len(rules))]
        output[f'validation_{key}_bootstrap_valid_repetitions'] = np.isfinite(array).sum(axis=0)
    output['validation_bootstrap_pass_fraction'] = np.asarray(samples['passes_filters']).mean(axis=0) if samples['passes_filters'] else np.nan
    return output


def canonical_assignments(records, baseline):
    """Reconstruct aligned-pair and exact-fulltext connected components."""
    parent = {rid: rid for rid in records.index}
    def find(rid):
        while parent[rid] != rid:
            parent[rid] = parent[parent[rid]]
            rid = parent[rid]
        return rid
    by_pair, by_hash = defaultdict(list), defaultdict(list)
    for rid, row in records.iterrows():
        by_pair[rid.split('/', 1)[1]].append(rid)
        text = ' '.join(unicodedata.normalize('NFKC', row.text).lstrip('\ufeff').split()).casefold()
        by_hash[hashlib.sha256(text.encode()).hexdigest()].append(rid)
    for members in list(by_pair.values()) + list(by_hash.values()):
        for rid in members[1:]:
            first, second = sorted((find(members[0]), find(rid)))
            parent[second] = first
    components = defaultdict(list)
    for rid in records.index:
        components[find(rid)].append(rid)
    group_map = {}
    for members in components.values():
        group = 'group-' + hashlib.sha256('|'.join(sorted(members)).encode()).hexdigest()[:16]
        group_map.update({rid: group for rid in members})
    assignments = []
    observed_ids, observed_groups = set(), set()
    for partition, expected_count in [('train', 4320), ('validation', 1440), ('test', 1440)]:
        frozen = baseline['partitions']['canonical_random_group'][partition]
        ids = frozen['record_ids']
        assert len(ids) == expected_count and len(set(ids)) == expected_count
        assert not observed_ids.intersection(ids)
        groups = {group_map[rid] for rid in ids}
        assert groups == set(frozen['group_ids']), 'Canonical group reconstruction mismatch'
        assert not observed_groups.intersection(groups), 'Canonical group leakage'
        observed_ids.update(ids)
        observed_groups.update(groups)
        assignments += [{'record_id': rid, 'partition': partition, 'group_id': group_map[rid], 'pair_id': rid.split('/', 1)[1]} for rid in ids]
    assert observed_ids == set(records.index) and len(observed_ids) == 7200
    result = pd.DataFrame(assignments)
    assert result.groupby('pair_id').partition.nunique().max() == 1
    return result


def _empty_rules():
    return pd.DataFrame(columns=['antecedents', 'consequents', 'features', 'pattern_id', 'rule_id', 'support', 'confidence', 'lift', 'jaccard', 'passes_filters'])


def _validate_feature_cache(features, records, schema):
    """Reject corrupt schema/values and cross-check six original measurements."""
    if not features.index.is_unique or set(features.index) != set(records.index):
        raise ValueError('Cached record IDs differ from corpus')
    if list(features.columns) != [item['column'] for item in schema]:
        raise ValueError('Cached feature schema differs from extraction schema')
    for item in schema:
        column = item['column']
        series = features[column]
        if str(series.dtype) != item['dtype']:
            raise ValueError(f'Cached dtype mismatch: {column}')
        if pd.api.types.is_numeric_dtype(series.dtype):
            if np.isinf(series.to_numpy(dtype=float)).any():
                raise ValueError(f'Infinite cached measurement: {column}')
            if column.endswith('_rate') or column in LEGACY + ['punctuationDensity_spacy']:
                if not series.dropna().between(0, 1).all():
                    raise ValueError(f'Cached rate outside [0,1]: {column}')
            elif column != 'tem_autor' and (series.isna().any() or not series.ge(0).all() or not series.eq(np.floor(series)).all()):
                raise ValueError(f'Invalid cached count: {column}')
    if not features.tem_autor.isin([0, 1]).all():
        raise ValueError('Cached author flag invalid')
    namespace = _baseline_functions()
    expected = pd.DataFrame([namespace['style'](row.text, row.author) for row in records.itertuples()], index=records.index)
    for column in ['tem_autor'] + LEGACY:
        if not np.array_equal(features.loc[expected.index, column].to_numpy(), expected[column].to_numpy(), equal_nan=True):
            raise ValueError(f'Cached original definition mismatch: {column}')
    for column in POS + DEP + COMPLETE_DEP + ['punctuationDensity_spacy']:
        if column == 'punctuationDensity_spacy':
            count, denominator = 'punctuation_count_spacy', 'tokens_nonspace'
        else:
            count = column.removesuffix('_rate') + '_count'
            denominator = 'tokens_complete_lexical' if column.startswith('DEP_complete_') else 'tokens_lexical'
        actual = features[count].div(features[denominator].replace(0, np.nan))
        if not np.allclose(features[column], actual, atol=1e-15, rtol=0, equal_nan=True):
            raise ValueError(f'Cached count/rate mismatch: {column}')


def _cache_envelope(metadata, features, csv_path):
    return {'metadata': metadata, 'csv_sha256': sha256(csv_path),
            'schema': [{'column':c, 'dtype':str(features[c].dtype)} for c in features.columns]}


def run_experiment(output_dir=None, force_extract=False, bootstrap_repetitions=100) -> Path:
    """Execute seven prespecified ablations and save all rules and frozen metrics."""
    if isinstance(bootstrap_repetitions, bool) or not isinstance(bootstrap_repetitions, (int, np.integer)) or bootstrap_repetitions < 0:
        raise ValueError('bootstrap_repetitions must be a nonnegative integer')
    output = Path(output_dir) if output_dir else ROOT / 'outputs/model-comparison' / f"fp-growth-linguistic-{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}"
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise FileExistsError(f'Refusing to overwrite nonempty experiment output: {output}')
    import spacy
    baseline = json.loads(BASELINE_MANIFEST.read_text(encoding='utf-8'))
    archive = ROOT / f"unsupervised-learning/data/Fake.br-Corpus-{baseline['corpus']['revision']}.zip"
    assert sha256(archive) == baseline['corpus']['archive_sha256'], 'Corpus SHA-256 mismatch'
    records = extraction.load_records(archive)
    assignments = canonical_assignments(records, baseline)
    nlp = spacy.load('pt_core_news_sm', disable=['ner'])
    cache_meta = {'corpus_sha256': sha256(archive), 'model': nlp.meta['name'], 'model_version': nlp.meta['version'],
                  'spacy_version': spacy.__version__, 'pipeline': nlp.pipe_names,
                  'character_limit': 300, 'extraction_sha256': sha256(extraction.__file__), 'normalization': 'NFKC; strip leading BOM; first300 characters'}
    cache_key = stable_id(cache_meta)
    cache_dir = ROOT / 'outputs/linguistic-feature-cache'
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_csv, cache_json = cache_dir / f'{cache_key}.csv', cache_dir / f'{cache_key}.json'
    schema_sample = extraction.extract_features(records.iloc[:1], nlp, character_limit=300, batch_size=50)
    expected_schema = [{'column':c, 'dtype':str(schema_sample[c].dtype)} for c in schema_sample.columns]
    cache_hit = cache_csv.exists() and cache_json.exists() and not force_extract
    if cache_hit:
        try:
            envelope = json.loads(cache_json.read_text(encoding='utf8'))
            if 'metadata' in envelope:
                if envelope['metadata'] != cache_meta or envelope['schema'] != expected_schema or envelope['csv_sha256'] != sha256(cache_csv):
                    raise ValueError('Cache metadata/checksum/schema mismatch')
            else:
                raise ValueError('Legacy cache lacks a CSV checksum; re-extraction required')
            features = pd.read_csv(cache_csv, index_col='record_id', float_precision='round_trip')
            _validate_feature_cache(features, records, expected_schema)
            print(f'Feature cache hit: {cache_key}', flush=True)
        except (ValueError, KeyError, TypeError):
            print(f'Cache integrity/schema check failed: re-extracting {cache_key}', flush=True)
            cache_hit = False
    if not cache_hit:
        print('Extracting linguistic features: 7200 records, window=300, batch_size=50', flush=True)
        features = extraction.extract_features(records, nlp, character_limit=300, batch_size=50)
        features.to_csv(cache_csv, encoding='utf8', float_format='%.17g')
        _validate_feature_cache(features, records, expected_schema)
        cache_json.write_text(json.dumps(_cache_envelope(cache_meta, features, cache_csv), ensure_ascii=False, indent=2), encoding='utf8')
    assert features.index.is_unique and set(features.index) == set(records.index)
    print('Linguistic extraction complete; beginning train-only discovery', flush=True)
    output.mkdir(parents=True, exist_ok=True)
    features.to_csv(output / 'linguistic_features.csv', encoding='utf8', float_format='%.17g')
    features.to_csv(output / 'features.csv', encoding='utf8', float_format='%.17g')
    audit = extraction.audit_features(features)
    (output / 'feature_audit.json').write_text(json.dumps(_json_clean(audit), ensure_ascii=False, indent=2, allow_nan=False), encoding='utf8')
    _save(pd.DataFrame([{'feature':feature, **values} for feature, values in audit['distributions'].items()]), output / 'feature_audit.csv')
    _save(assignments, output / 'split_assignments.csv')
    namespace = _baseline_functions()
    splits = {part: features.loc[group.record_id.tolist()] for part, group in assignments.groupby('partition')}
    validation_groups = assignments.set_index('record_id').loc[splits['validation'].index, 'group_id']
    summaries, combined, rule_tables, pattern_tables, variant_manifests = [], [], {}, {}, {}
    for variant, (columns, author) in VARIANTS.items():
        print(f'Mining {variant}', flush=True)
        destination = output / variant
        destination.mkdir(exist_ok=True)
        train_matrix, criteria = fit_discretization(splits['train'], columns, author)
        matrices = {'train': train_matrix, **{part: apply_discretization(frame, criteria) for part, frame in splits.items() if part != 'train'}}
        if train_matrix.shape[1]:
            frequent, rules, similar, covers = namespace['mine'](train_matrix, .08, 3, .5, 1.05, .1, .9)
        else:
            frequent = pd.DataFrame(columns=['support', 'itemsets', 'features', 'itemset_size', 'pattern_id'])
            rules, similar, covers = _empty_rules(), pd.DataFrame(), {}
        if rules.empty:
            rules = _empty_rules()
        else:
            rules['rule_id'] = [rule_key(r.antecedents, r.consequents) for r in rules.itertuples()]
        eligible = rules.loc[rules.passes_filters.astype(bool)].copy()
        rule_tables[variant] = eligible
        pattern_tables[variant] = frequent.loc[frequent.itemset_size.ge(2)].copy()
        for metric in ['confidence', 'lift', 'jaccard']:
            frequent[f'max_rule_{metric}'] = frequent.pattern_id.map(eligible.groupby('pattern_id')[metric].max() if len(eligible) else pd.Series(dtype=float))
        consolidated = namespace['consolidate'](frequent, eligible, covers, .75, .03) if len(pattern_tables[variant]) else pd.DataFrame(columns=['is_primary'])
        metrics = eligible[['rule_id', 'pattern_id', 'antecedents', 'consequents', 'features']].copy().reset_index(drop=True)
        for partition, matrix in matrices.items():
            scores = evaluate_rules(matrix, eligible).rename(columns=lambda c: c if c == 'rule_id' else f'{partition}_{c}')
            metrics = metrics.merge(scores, on='rule_id', how='left')
        metrics = metrics.merge(bootstrap_rules(matrices['validation'], eligible, validation_groups, bootstrap_repetitions), on='rule_id', how='left')
        metrics.insert(0, 'variant', variant)
        combined.append(metrics)
        for partition in ['validation', 'test']:
            criteria[f'{partition}_missing'] = [int(pd.to_numeric(splits[partition][f], errors='coerce').replace([np.inf,-np.inf],np.nan).isna().sum()) for f in criteria.feature]
            criteria[f'{partition}_actual_support'] = [float(matrices[partition][i].mean()) if i in matrices[partition] else np.nan for i in criteria.item]
        for table, filename in [(frequent, 'frequent_itemsets.csv'), (rules, 'all_rules.csv'), (rules, 'association_rules.csv'), (eligible, 'eligible_rules.csv'), (metrics, 'rule_metrics.csv'), (metrics, 'rules.csv'), (similar, 'similar_patterns.csv'), (consolidated, 'consolidated_patterns.csv'), (criteria, 'discretization.csv')]:
            _save(table, destination / filename)
        summary = {'variant': variant, 'feature_count': len(columns) + int(author), 'item_count': train_matrix.shape[1],
                   'frequent_itemsets': len(frequent), 'all_rules': len(rules), 'eligible_rules': len(eligible),
                   'patterns': len(pattern_tables[variant]), 'primary_patterns': int(consolidated.is_primary.sum()),
                   'validation_pass_rules': int(metrics.validation_passes_filters.sum()), 'test_pass_rules': int(metrics.test_passes_filters.sum())}
        summaries.append(summary)
        variant_manifests[variant] = {'features': (['tem_autor'] if author else []) + columns, 'discretization': _json_clean(criteria.to_dict('records')), 'counts': summary}
        print(json.dumps(summary), flush=True)
    legacy_counts = next(s for s in summaries if s['variant'] == 'legacy_author')
    assert (legacy_counts['frequent_itemsets'], legacy_counts['all_rules'], legacy_counts['eligible_rules'], legacy_counts['patterns']) == (41, 82, 28, 31), 'Legacy baseline reproduction failed'
    assert next(s for s in summaries if s['variant'] == 'legacy_style')['patterns'] == 10, 'Style-only baseline reproduction failed'
    comparisons, detail = [], []
    comparison_pairs = [('legacy_style','legacy_author'), ('legacy_pos','legacy_style'), ('corrected_style','legacy_style'), ('corrected_pos','corrected_style'), ('corrected_pos','legacy_pos'), ('corrected_pos_dep','corrected_pos'), ('corrected_pos_dep_complete','corrected_pos_dep')]
    for new, old in comparison_pairs:
        new_rules, old_rules = rule_tables[new].set_index('rule_id'), rule_tables[old].set_index('rule_id')
        nk, ok = set(new_rules.index), set(old_rules.index)
        npat, opat = set(pattern_tables[new].pattern_id), set(pattern_tables[old].pattern_id)
        comparisons.append({'comparison': f'{new}_vs_{old}', 'new_variant': new, 'old_variant': old,
                            'new_rules': len(nk-ok), 'retained_rules': len(nk&ok), 'removed_rules': len(ok-nk),
                            'new_patterns':len(npat-opat), 'retained_patterns':len(npat&opat), 'removed_patterns':len(opat-npat)})
        for rid in sorted(nk | ok):
            status = 'retained' if rid in nk & ok else 'new' if rid in nk else 'removed'
            row = (new_rules if rid in nk else old_rules).loc[rid]
            detail.append({'comparison': f'{new}_vs_{old}', 'new_variant': new, 'old_variant': old, 'rule_id':rid, 'status':status, 'antecedents':row.antecedents, 'consequents':row.consequents})
    _save(pd.DataFrame(summaries), output / 'variant_summary.csv')
    _save(pd.concat(combined, ignore_index=True), output / 'rule_metrics.csv')
    _save(pd.DataFrame(comparisons), output / 'comparisons.csv')
    _save(pd.DataFrame(detail), output / 'rule_comparison.csv')
    manifest = {'status':'executed', 'created_utc':datetime.now(timezone.utc).isoformat(), 'corpus':baseline['corpus'],
                'baseline_manifest':str(BASELINE_MANIFEST.relative_to(ROOT)), 'baseline_manifest_sha256':sha256(BASELINE_MANIFEST),
                'parameters':PARAMETERS, 'bootstrap':{'repetitions':bootstrap_repetitions, 'seed':42, 'unit':'canonical paired/exact-duplicate group', 'interval':'percentile 2.5%-97.5%; fixed validation rules and thresholds'},
                'partitions':{'canonical_random_group':baseline['partitions']['canonical_random_group']},
                'variants':variant_manifests, 'cache':{**cache_meta, 'key':cache_key,'cache_hit':cache_hit,'path':str(cache_csv),'csv_sha256':sha256(cache_csv)},
                'environment':{'python':platform.python_version(), 'packages':{p:version(p) for p in ['numpy','pandas','mlxtend','spacy','pt_core_news_sm']}},
                'source_sha256':{p.name:sha256(p) for p in [Path(__file__),Path(extraction.__file__),BASELINE_NOTEBOOK]},
                'identity':{'rule_id':'SHA256(sorted antecedents, sorted consequents) first12; direction retained', 'pattern_id':'SHA256(sorted feature items) first12', 'definition_identity':cache_meta},
                'notes':['No class labels are used in discovery or thresholds.', 'Class/author posthoc analyses are separate from rule discovery.', 'Corrected punctuation and complete-sentence DEP retain different names: no forced equivalence mapping.', 'Test evaluation is descriptive: canonical test was already used by preceding experiments.', 'More rules do not establish classification accuracy or causal/independent relationships.']}
    (output / 'run_manifest.json').write_text(json.dumps(_json_clean(manifest),ensure_ascii=False,indent=2,allow_nan=False),encoding='utf8')
    print(f'Experiment complete: {output}', flush=True)
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--force-extract', action='store_true')
    parser.add_argument('--bootstrap-repetitions', type=int, default=100)
    args = parser.parse_args()
    run_experiment(args.output, args.force_extract, args.bootstrap_repetitions)

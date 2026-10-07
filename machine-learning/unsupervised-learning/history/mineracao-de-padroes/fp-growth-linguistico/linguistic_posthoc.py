"""Descriptive class/author controls after label-free rule discovery.

This module neither refits cuts nor changes eligible rules. Class composition
is descriptive, respects saved partitions, and is not classifier accuracy.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd

from linguistic_fp_growth import apply_discretization


def _items(value):
    return json.loads(value) if isinstance(value, str) else list(value)


def write_posthoc(run_path):
    run_path = Path(run_path)
    frame = pd.read_csv(run_path / 'features.csv', index_col='record_id', float_precision='round_trip')
    assignments = pd.read_csv(run_path / 'split_assignments.csv').set_index('record_id')
    metrics = pd.read_csv(run_path / 'rule_metrics.csv')
    if not frame.index.is_unique or not assignments.index.is_unique:
        raise ValueError('Duplicate record IDs in posthoc inputs')
    if set(frame.index) != set(assignments.index):
        raise ValueError('Features and saved partitions do not correspond')
    if not frame.index.str.match(r'^(fake|true)/[^/]+$').all():
        raise ValueError('Unexpected canonical ID format')
    fake = pd.Series(frame.index.str.startswith('fake/'), index=frame.index)
    rows = []
    for variant, rules in metrics.groupby('variant', sort=False):
        criteria = pd.read_csv(run_path / variant / 'discretization.csv', float_precision='round_trip')
        items = apply_discretization(frame, criteria)
        patterns = {}
        for rule in rules.itertuples():
            signature = tuple(sorted(set(_items(rule.antecedents) + _items(rule.consequents))))
            patterns[signature] = hashlib.sha256(json.dumps(signature).encode()).hexdigest()[:16]
        for signature, pattern_id in patterns.items():
            matched = items[list(signature)].all(axis=1)
            for partition in ('train', 'validation', 'test'):
                partition_mask = assignments.partition.eq(partition).reindex(frame.index)
                for author_state in ('all', 'com_autor', 'sem_autor'):
                    population = partition_mask.copy()
                    if author_state != 'all':
                        population &= frame.tem_autor.eq(int(author_state == 'com_autor'))
                    selected = population & matched
                    size, count = int(population.sum()), int(selected.sum())
                    population_fake = int(fake[population].sum())
                    matched_fake = int(fake[selected].sum())
                    baseline = population_fake / size if size else np.nan
                    fake_pct = matched_fake / count if count else np.nan
                    rows.append({
                        'variant': variant, 'pattern_id': pattern_id,
                        'features': json.dumps(signature), 'partition': partition,
                        'author_state': author_state, 'population': size,
                        'population_fake': population_fake,
                        'occurrences': count, 'support': count / size if size else np.nan,
                        'fake_count': matched_fake, 'true_count': count - matched_fake,
                        'fake_pct': fake_pct, 'baseline_fake_pct': baseline,
                        'lift_fake_descriptive': fake_pct / baseline if baseline > 0 else np.nan,
                        'delta_fake_descriptive': fake_pct - baseline,
                    })
    composition = pd.DataFrame(rows)
    composition.to_csv(run_path / 'posthoc_pattern_composition.csv', index=False, encoding='utf-8')
    distribution_rows = []
    selected_features = [column for column in frame if column.startswith(('POS_', 'DEP_'))
                         and column.endswith('_rate')]
    selected_features += ['diversidade', 'punctuationDensity_spacy', 'uppercaseRatio']
    for partition in ('train', 'validation', 'test'):
        for origin in ('fake', 'true'):
            for author_state in ('all', 'com_autor', 'sem_autor'):
                mask = assignments.partition.eq(partition).reindex(frame.index)
                mask &= frame.index.str.startswith(origin + '/')
                if author_state != 'all':
                    mask &= frame.tem_autor.eq(int(author_state == 'com_autor'))
                for feature in selected_features:
                    values = frame.loc[mask, feature].dropna()
                    distribution_rows.append({
                        'partition': partition, 'origin': origin, 'author_state': author_state,
                        'feature': feature, 'records': int(mask.sum()), 'present': len(values),
                        'missing': int(mask.sum()) - len(values),
                        'mean': values.mean(), 'median': values.median(),
                        'q25': values.quantile(.25), 'q75': values.quantile(.75),
                    })
    pd.DataFrame(distribution_rows).to_csv(run_path / 'posthoc_feature_distributions.csv',
                                          index=False, encoding='utf-8')
    return composition


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('run_path', type=Path)
    args = parser.parse_args()
    print(f'{len(write_posthoc(args.run_path))} descriptive rows written')

"""Train-group rediscovery bootstrap with quartiles refitted in each replicate.

Rediscovery concerns directed rule names, not identical numerical thresholds.
It neither uses class labels nor establishes causality or classification accuracy.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from importlib.metadata import version
import json
from pathlib import Path

import numpy as np
import pandas as pd
from mlxtend.frequent_patterns import association_rules, fpgrowth

from linguistic_fp_growth import VARIANTS, fit_discretization, rule_key, sha256


def _rediscover(frame, columns, author):
    """Mine eligible directed rules without pairwise pattern consolidation."""
    matrix, _ = fit_discretization(frame, columns, author)
    if len(matrix) == 0 or matrix.shape[1] == 0:
        return set()
    frequent = fpgrowth(matrix, min_support=.08, use_colnames=True, max_len=3)
    if frequent.empty or not frequent.itemsets.map(len).ge(2).any():
        return set()
    rules = association_rules(frequent, metric='confidence', min_threshold=.5)
    if rules.empty:
        return set()
    union = rules['antecedent support'] + rules['consequent support'] - rules.support
    jaccard = rules.support.div(union.where(union.gt(0)))
    eligible = rules.loc[rules.lift.ge(1.05) & jaccard.ge(.1)]
    return {rule_key(row.antecedents, row.consequents) for row in eligible.itertuples()}


def write_rediscovery_stability(run_path, repetitions=100, seed=42) -> pd.DataFrame:
    """Resample canonical training groups, refit cuts, and count rule rediscovery."""
    if isinstance(repetitions, bool) or not isinstance(repetitions, (int, np.integer)) or repetitions < 1:
        raise ValueError('repetitions must be a positive integer')
    run = Path(run_path)
    manifest_path = run / 'run_manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf8'))
    if manifest.get('status') != 'executed':
        raise ValueError('A completed linguistic experiment is required')
    features_path = run / 'linguistic_features.csv'
    splits_path = run / 'split_assignments.csv'
    features = pd.read_csv(features_path, index_col='record_id', float_precision='round_trip')
    splits = pd.read_csv(splits_path)
    assignments = splits.loc[splits.partition.eq('train'), ['record_id', 'group_id']]
    if assignments.record_id.duplicated().any() or assignments.group_id.isna().any():
        raise ValueError('Training assignments must have unique IDs and complete groups')
    expected_ids = manifest['partitions']['canonical_random_group']['train']['record_ids']
    if set(assignments.record_id) != set(expected_ids):
        raise ValueError('Training IDs differ from the run manifest')
    train = features.loc[expected_ids]
    groups = assignments.set_index('record_id').loc[expected_ids, 'group_id']
    if set(groups) != set(manifest['partitions']['canonical_random_group']['train']['group_ids']):
        raise ValueError('Training group IDs differ from the run manifest')
    # All variants use the same sequence of resampled groups to isolate changes.
    group_names = sorted(groups.unique())
    positions = {g: np.flatnonzero(groups.to_numpy() == g) for g in group_names}
    rng = np.random.default_rng(seed)
    resampled_indices = []
    for _ in range(repetitions):
        selected = rng.integers(0, len(group_names), size=len(group_names))
        resampled_indices.append(np.concatenate([positions[group_names[j]] for j in selected]))
    rows, summaries = [], []
    for variant, (columns, author) in VARIANTS.items():
        configured = manifest['variants'][variant]['features']
        if configured != (['tem_autor'] if author else []) + columns:
            raise ValueError(f'Feature definitions differ from executed run: {variant}')
        original_path = run / variant / 'eligible_rules.csv'
        original = pd.read_csv(original_path, dtype={'rule_id':str})
        if original.rule_id.duplicated().any():
            raise ValueError(f'Duplicate canonical rule IDs: {variant}')
        rule_ids = set(original.rule_id)
        rediscovery_counts = {rid: 0 for rid in rule_ids}
        print(f'Train group rediscovery: {variant}, {repetitions} refitted replicates', flush=True)
        for replicate, indices in enumerate(resampled_indices, start=1):
            sample = train.iloc[indices].reset_index(drop=True)
            discovered = _rediscover(sample, columns, author)
            retained = discovered & rule_ids
            for rid in retained:
                rediscovery_counts[rid] += 1
            summaries.append({'variant':variant, 'replicate':replicate, 'records':len(sample),
                              'eligible_rules':len(discovered), 'retained_rules':len(retained),
                              'new_rules':len(discovered-rule_ids), 'removed_rules':len(rule_ids-discovered)})
            if replicate % 25 == 0 or replicate == repetitions:
                print(f'  {variant}: {replicate}/{repetitions}', flush=True)
        rows.extend({'variant':variant, 'rule_id':rid, 'rediscovery_count':rediscovery_counts[rid],
                     'rediscovery_fraction':rediscovery_counts[rid]/repetitions, 'repetitions':repetitions}
                    for rid in sorted(rule_ids))
    stability = pd.DataFrame(rows, columns=['variant','rule_id','rediscovery_count','rediscovery_fraction','repetitions'])
    stability.to_csv(run / 'training_rediscovery_stability.csv', index=False, encoding='utf8', float_format='%.17g')
    pd.DataFrame(summaries).to_csv(run / 'training_bootstrap_summary.csv', index=False, encoding='utf8')
    details = {'status':'executed', 'created_utc':datetime.now(timezone.utc).isoformat(),
               'repetitions':repetitions, 'seed':seed, 'unit':'whole canonical training paired/exact-duplicate groups',
               'group_count':len(group_names), 'canonical_train_records':len(train),
               'same_group_resamples_for_all_variants':True, 'quantiles_refitted_each_replicate':True,
               'parameters':{'min_support':.08,'max_len':3,'min_confidence':.5,'min_lift':1.05,'min_jaccard':.1,'low_quantile':.25,'high_quantile':.75},
               'labels_used':False, 'source_sha256':{Path(__file__).name:sha256(__file__),
                 'linguistic_fp_growth.py':sha256(Path(__file__).with_name('linguistic_fp_growth.py'))},
               'input_sha256':{p.name:sha256(p) for p in [manifest_path,features_path,splits_path]},
               'environment':{p:version(p) for p in ['numpy','pandas','mlxtend']},
               'notes':['Rule-name rediscovery uses direction-preserving rule IDs with newly fitted cuts.',
                        'Rediscovery does not imply the same numerical thresholds or exact event memberships.',
                        'This training discovery bootstrap is separate from fixed-rule validation metric intervals.',
                        'No class labels or test outcomes select rules; no causal or classification claim follows.']}
    (run / 'training_bootstrap_manifest.json').write_text(json.dumps(details,ensure_ascii=False,indent=2),encoding='utf8')
    return stability


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('run_path', type=Path)
    parser.add_argument('--repetitions', type=int, default=100)
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()
    write_rediscovery_stability(args.run_path,args.repetitions,args.seed)

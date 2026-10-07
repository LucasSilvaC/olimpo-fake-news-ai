"""Rank frozen linguistic patterns for exploratory Fake/True comparison.

Discovery remains label-free. This subsequent ranking explicitly uses validation
labels; test and whole-corpus composition never enter ranking or deduplication.
All columns ending in _pct contain percentages on the 0--100 scale.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import false_discovery_control

from linguistic_fp_growth import ROOT, apply_discretization

DEFAULT_RUN = ROOT / 'outputs/model-comparison/fp-growth-linguistic-20261006T230752Z'
VARIANT = 'corrected_pos_dep'


def collapse_rules(rules, stability):
    """One point per conjunction, preserving all original directed rule IDs."""
    table = rules.merge(stability[['rule_id', 'rediscovery_fraction']], on='rule_id', validate='one_to_one')
    table['features_key'] = table.apply(lambda row: json.dumps(sorted(set(
        json.loads(row.antecedents) + json.loads(row.consequents)))), axis=1)
    output = []
    for key, group in table.groupby('features_key', sort=True):
        representative = group.sort_values(
            ['rediscovery_fraction', 'train_lift', 'train_confidence', 'rule_id'],
            ascending=[False, False, False, True]).iloc[0]
        output.append({'pattern_id': hashlib.sha256(key.encode()).hexdigest()[:16],
                       'features': key, 'pattern_text': ' + '.join(json.loads(key)),
                       'representative_rule_id': representative.rule_id,
                       'original_directed_rule_ids': json.dumps(sorted(group.rule_id)),
                       'directed_rule_count': len(group),
                       'representative_arrow': ' + '.join(json.loads(representative.antecedents)) +
                            ' → ' + ' + '.join(json.loads(representative.consequents)),
                       'train_rule_rediscovery_pct': 100 * representative.rediscovery_fraction,
                       'validation_grammar_filters_pass': bool(representative.validation_passes_filters),
                       'train_rule_confidence_pct': 100 * representative.train_confidence,
                       'train_rule_lift': representative.train_lift})
    return pd.DataFrame(output)


def partition_stats(events, fake, author):
    """Purity P(class|pattern), class coverage P(pattern|class), author controls."""
    events = np.asarray(events, dtype=float)
    fake = np.asarray(fake, dtype=bool)
    author = np.asarray(author, dtype=int)
    n = len(fake)
    f = events[fake].sum(axis=0)
    t = events[~fake].sum(axis=0)
    count = f + t
    ratio = lambda a, b: np.divide(a, b, out=np.full(np.broadcast_shapes(np.shape(a), np.shape(b)), np.nan), where=np.asarray(b) != 0)
    result = {'occurrences': count.astype(int), 'fake_count': f.astype(int), 'true_count': t.astype(int),
              'support_pct': 100 * count / n, 'fake_pct': 100 * ratio(f, count),
              'true_pct': 100 * ratio(t, count), 'fake_coverage_pct': 100 * f / fake.sum(),
              'true_coverage_pct': 100 * t / (~fake).sum(),
              'baseline_fake_pct': np.repeat(100 * fake.mean(), events.shape[1]),
              'baseline_true_pct': np.repeat(100 * (~fake).mean(), events.shape[1]),
              'lift_fake_class': ratio(ratio(f, count), fake.mean()),
              'lift_true_class': ratio(ratio(t, count), (~fake).mean())}
    excess = np.zeros(events.shape[1])
    for state, name in [(1, 'with_author'), (0, 'without_author')]:
        population = author == state
        sf = events[population & fake].sum(axis=0)
        st = events[population & ~fake].sum(axis=0)
        present = sf + st
        baseline = fake[population].mean() if population.any() else np.nan
        purity = ratio(sf, present)
        result.update({name + '_occurrences': present.astype(int), name + '_fake_count': sf.astype(int),
                       name + '_true_count': st.astype(int), name + '_fake_pct': 100 * purity,
                       name + '_baseline_fake_pct': np.repeat(100 * baseline, events.shape[1]),
                       name + '_excess_fake_pp': 100 * (purity - baseline)})
        excess += population.mean() * (purity - baseline)
    result['author_adjusted_excess_fake_pp'] = 100 * excess
    result['author_standardized_fake_pct'] = 100 * (fake.mean() + excess)
    return pd.DataFrame(result)


def grouped_bootstrap(events, fake, author, groups, repetitions=1000, seed=42):
    """Pointwise intervals from sampling complete paired/duplicate groups."""
    events = np.asarray(events, dtype=float)
    fake, author = np.asarray(fake, dtype=bool), np.asarray(author, dtype=int)
    codes, names = pd.factorize(np.asarray(groups), sort=True)
    rng = np.random.default_rng(seed)
    weights = rng.multinomial(len(names), np.repeat(1 / len(names), len(names)), size=repetitions)
    def aggregate(values):
        values = np.asarray(values, dtype=float)
        array = np.zeros((len(names), *values.shape[1:]))
        np.add.at(array, codes, values)
        return weights @ array
    def divide(a, b):
        with np.errstate(divide='ignore', invalid='ignore'):
            return a / b
    mf, mt = aggregate(events * fake[:, None]), aggregate(events * (~fake)[:, None])
    fake_pct = 100 * divide(mf, mf + mt)
    excess = np.zeros_like(fake_pct)
    for state in (1, 0):
        mask = author == state
        sf = aggregate(events * (mask & fake)[:, None])
        st = aggregate(events * (mask & ~fake)[:, None])
        baseline = divide(aggregate(mask & fake), aggregate(mask))
        excess += mask.mean() * (divide(sf, sf + st) - baseline[:, None])
    result = {}
    for name, values in [('fake', fake_pct), ('author_adjusted_excess_fake', excess * 100)]:
        for suffix, q in [('ci_low', .025), ('ci_high', .975)]:
            result[f'{name}_{suffix}' + ('_pct' if name == 'fake' else '_pp')] = [
                np.quantile(column[np.isfinite(column)], q) if np.isfinite(column).any() else np.nan
                for column in values.T]
        result[name + '_bootstrap_valid_repetitions'] = np.isfinite(values).sum(axis=0)
    return pd.DataFrame(result)


def paired_permutation(events, fake, groups, repetitions=4999, seed=42):
    """Swap Fake/True labels within each whole group; absolute two-sided test."""
    fake = np.asarray(fake, dtype=bool)
    codes, names = pd.factorize(np.asarray(groups), sort=True)
    counts_fake, counts_true = np.bincount(codes[fake]), np.bincount(codes[~fake])
    if not np.array_equal(counts_fake, counts_true):
        raise ValueError('Paired permutation requires equal class counts within each group')
    differences = np.zeros((len(names), events.shape[1]))
    np.add.at(differences, codes, np.asarray(events) * np.where(fake, 1, -1)[:, None])
    observed = np.abs(differences.sum(axis=0))
    rng = np.random.default_rng(seed)
    extreme = np.zeros(events.shape[1], dtype=int)
    for start in range(0, repetitions, 250):
        signs = rng.choice([-1., 1.], size=(min(250, repetitions-start), len(names)))
        extreme += (np.abs(signs @ differences) >= observed[None, :] - 1e-10).sum(axis=0)
    p = (extreme + 1) / (repetitions + 1)
    return pd.DataFrame({'paired_permutation_p': p,
                         'paired_permutation_q_bh': false_discovery_control(p, method='bh'),
                         'paired_permutation_q_by': false_discovery_control(p, method='by')})


def rank_select(table, validation_events, max_rules=20, min_occurrences=100, max_jaccard=.80):
    """Uses validation only, plus training rediscovery; never reads test fields."""
    table = table.copy()
    toward_fake = table.validation_fake_pct.ge(table.validation_baseline_fake_pct)
    table['target_class'] = np.where(toward_fake, 'Fake', 'True')
    table['validation_target_pct'] = np.where(toward_fake, table.validation_fake_pct, table.validation_true_pct)
    table['validation_target_ci_low_pct'] = np.where(toward_fake, table.validation_fake_ci_low_pct,
                                                    100-table.validation_fake_ci_high_pct)
    table['validation_target_coverage_pct'] = np.where(toward_fake, table.validation_fake_coverage_pct,
                                                      table.validation_true_coverage_pct)
    baseline = np.where(toward_fake, table.validation_baseline_fake_pct, table.validation_baseline_true_pct)
    margin = np.maximum((table.validation_target_ci_low_pct-baseline)/100, 0)
    table['ranking_score'] = 100 * margin * np.sqrt(table.validation_target_coverage_pct/100) * table.train_rule_rediscovery_pct/100
    table['eligible_for_shortlist'] = (table.validation_occurrences.ge(min_occurrences) &
            table.validation_paired_permutation_q_by.le(.05) & (table.ranking_score > 0))
    table['selection_status'] = 'below_minimum_evidence'
    table['redundant_with_pattern_id'] = ''
    selected = []
    order = table[table.eligible_for_shortlist].sort_values(
        ['ranking_score', 'validation_occurrences', 'pattern_id'], ascending=[False, False, True])
    for idx, row in order.iterrows():
        event = validation_events[:, idx]
        redundant = None
        for previous in selected:
            other = validation_events[:, previous]
            union = (event | other).sum()
            similarity = (event & other).sum()/union if union else 0.
            if similarity >= max_jaccard:
                redundant = previous
                break
        if redundant is not None:
            table.loc[idx, 'selection_status'] = 'redundant_coverage'
            table.loc[idx, 'redundant_with_pattern_id'] = table.loc[redundant, 'pattern_id']
        elif len(selected) < max_rules:
            selected.append(idx)
            table.loc[idx, 'selection_status'] = 'selected'
        else:
            table.loc[idx, 'selection_status'] = 'outside_top_x'
    result = table.loc[selected].copy()
    result.insert(0, 'display_id', [f'R{i:02d}' for i in range(1, len(result)+1)])
    return table, result


def _plots(selected, out):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from pandas.plotting import scatter_matrix
    colors = selected.target_class.map({'Fake': '#c54a49', 'True': '#386caa'}).tolist()
    fig, ax = plt.subplots(figsize=(9, 7))
    ax.scatter(selected.validation_true_coverage_pct, selected.validation_fake_coverage_pct,
               s=45+selected.validation_occurrences*.35, c=colors, alpha=.75, edgecolor='white')
    for row in selected.itertuples():
        ax.annotate(row.display_id, (row.validation_true_coverage_pct, row.validation_fake_coverage_pct),
                    xytext=(4, 4), textcoords='offset points', fontsize=8)
    maximum = max(selected.validation_true_coverage_pct.max(), selected.validation_fake_coverage_pct.max())*1.12
    ax.plot([0, maximum], [0, maximum], '--', color='#777777', lw=1)
    ax.set(xlabel='Notícias True que contêm o padrão (%)', ylabel='Notícias Fake que contêm o padrão (%)',
           title=f'{len(selected)} padrões selecionados — validação', xlim=(0, maximum), ylim=(0, maximum))
    ax.grid(alpha=.2)
    fig.text(.1, .01, 'Acima da diagonal: mais frequente em Fake. Abaixo: mais frequente em True.\nCor: classe predominante; tamanho: ocorrências. Seleção usa validação.', fontsize=9)
    fig.tight_layout(rect=(0, .07, 1, 1))
    fig.savefig(out/'class_coverage_scatter.png', dpi=200)
    plt.close(fig)
    columns = {'validation_fake_pct': 'Fake entre ocorrências (%)',
               'validation_fake_coverage_pct': 'Cobertura Fake (%)',
               'validation_true_coverage_pct': 'Cobertura True (%)',
               'train_rule_rediscovery_pct': 'Redescoberta treino (%)',
               'validation_author_adjusted_excess_fake_pp': 'Excesso Fake por autoria (pp)',
               'validation_support_pct': 'Cobertura total (%)'}
    axes = scatter_matrix(selected[list(columns)].rename(columns=columns), figsize=(14, 14),
                          color=colors, alpha=.7, diagonal='hist', s=35)
    for axis in axes.ravel():
        axis.set_xlabel(axis.get_xlabel(), fontsize=8)
        axis.set_ylabel(axis.get_ylabel(), fontsize=8)
        axis.tick_params(labelsize=7)
    plt.suptitle('Matriz de dispersão dos padrões selecionados — validação', y=.998)
    plt.tight_layout()
    plt.savefig(out/'scatter_matrix.png', dpi=180)
    plt.close('all')


def add_fake_contrast(full, selected, validation_events, maximum=5, max_jaccard=.80):
    """Separate comparison panel, not a claim that these outrank the global top."""
    selected = selected.copy()
    selected['selection_panel'] = 'global_top'
    indices = selected.index.tolist()
    added = []
    candidates = full[full.eligible_for_shortlist & full.target_class.eq('Fake') &
                      ~full.pattern_id.isin(selected.pattern_id)].sort_values(
                          ['ranking_score', 'validation_occurrences', 'pattern_id'], ascending=[False, False, True])
    for idx in candidates.index:
        if len(added) >= maximum:
            break
        event = validation_events[:, idx]
        if any((event & validation_events[:, other]).sum() /
               (event | validation_events[:, other]).sum() >= max_jaccard for other in indices):
            continue
        added.append(idx)
        indices.append(idx)
    if added:
        contrast = full.loc[added].copy()
        contrast['selection_panel'] = 'fake_contrast'
        selected = pd.concat([selected.drop(columns='display_id'), contrast])
        selected.insert(0, 'display_id', [f'R{i:02d}' for i in range(1,len(selected)+1)])
    return selected


def analyze(source_run=DEFAULT_RUN, output=None, max_rules=20, bootstrap=1000, permutations=4999, fake_contrast=5):
    source = Path(source_run)
    manifest = json.loads((source/'run_manifest.json').read_text(encoding='utf-8'))
    if manifest['status'] != 'executed':
        raise ValueError('Source run must be complete')
    if max_rules < 1 or bootstrap < 100 or permutations < 99 or fake_contrast < 0:
        raise ValueError('Require positive X, at least100 bootstraps and99 permutations')
    output = Path(output) if output else ROOT/'outputs/rule-ranking'/f'{source.name}-top{max_rules}-{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}'
    if output.exists() and any(output.iterdir()):
        raise FileExistsError('Output must be new or empty')
    output.mkdir(parents=True, exist_ok=True)
    if hashlib.sha256((source/'features.csv').read_bytes()).hexdigest() != manifest['cache']['csv_sha256']:
        raise ValueError('Saved features differ from the audited extraction checksum')
    features = pd.read_csv(source/'features.csv', index_col='record_id', float_precision='round_trip')
    assignments = pd.read_csv(source/'split_assignments.csv').set_index('record_id')
    if not features.index.is_unique or not assignments.index.is_unique or set(features.index) != set(assignments.index):
        raise ValueError('Invalid canonical IDs')
    assignments = assignments.loc[features.index]
    for partition in ('train','validation','test'):
        frozen = manifest['partitions']['canonical_random_group'][partition]
        observed = assignments[assignments.partition.eq(partition)]
        if set(observed.index) != set(frozen['record_ids']) or set(observed.group_id) != set(frozen['group_ids']):
            raise ValueError('Partitions differ from the frozen source run')
    if assignments.groupby('group_id').partition.nunique().max() != 1:
        raise ValueError('Group leakage')
    criteria = pd.read_csv(source/VARIANT/'discretization.csv', float_precision='round_trip')
    items = apply_discretization(features, criteria)
    rules = pd.read_csv(source/VARIANT/'rule_metrics.csv', float_precision='round_trip')
    stability = pd.read_csv(source/'training_rediscovery_stability.csv')
    patterns = collapse_rules(rules, stability[stability.variant.eq(VARIANT)])
    glossary = {'POS_ADJ_rate':'adjetivos','POS_ADV_rate':'advérbios','POS_NOUN_rate':'substantivos comuns',
                'POS_PROPN_rate':'nomes próprios','POS_VERB_rate':'verbos','POS_PRON_rate':'pronomes',
                'DEP_nsubj_rate':'sujeitos nominais','DEP_obj_rate':'objetos diretos',
                'DEP_amod_rate':'modificadores adjetivais','DEP_advmod_rate':'modificadores adverbiais',
                'DEP_ccomp_rate':'complementos oracionais','DEP_advcl_rate':'orações adverbiais',
                'diversidade':'diversidade lexical','punctuationDensity_spacy':'pontuação',
                'uppercaseRatio':'palavras inteiras em caixa alta'}
    criterion_by_item = criteria.set_index('item')
    def describe(key):
        descriptions=[]
        limits=[]
        for item in json.loads(key):
            criterion=criterion_by_item.loc[item]
            operator='≤' if criterion.direction=='baixo' else '≥'
            descriptions.append(f'{glossary[criterion.feature]} {operator} {100*criterion.threshold:.2f}%')
            limits.append({'item':item,'operator':operator,'threshold_pct':100*criterion.threshold})
        return ' + '.join(descriptions),json.dumps(limits,ensure_ascii=False)
    descriptions=patterns.features.map(describe)
    patterns['pattern_pt']=[entry[0] for entry in descriptions]
    patterns['thresholds_pct']=[entry[1] for entry in descriptions]
    events = np.column_stack([items[json.loads(row.features)].all(axis=1).to_numpy() for row in patterns.itertuples()])
    fake, author = features.index.str.startswith('fake/'), features.tem_autor.to_numpy()
    masks = {name: assignments.partition.eq(name).to_numpy() for name in ('train', 'validation', 'test')}
    masks['all'] = np.ones(len(features), dtype=bool)
    for partition, mask in masks.items():
        print(f'Class composition: {partition}', flush=True)
        stats = partition_stats(events[mask], fake[mask], author[mask])
        if partition in ('validation', 'test'):
            interval = grouped_bootstrap(events[mask], fake[mask], author[mask], assignments.group_id.to_numpy()[mask], bootstrap)
            stats = pd.concat([stats, interval], axis=1)
        if partition == 'validation':
            permutation = paired_permutation(events[mask], fake[mask], assignments.group_id.to_numpy()[mask], permutations)
            stats = pd.concat([stats, permutation], axis=1)
        patterns = pd.concat([patterns, stats.add_prefix(partition+'_')], axis=1)
    validation_events = events[masks['validation']]
    full, selected = rank_select(patterns, validation_events, max_rules=max_rules)
    if selected.empty:
        raise ValueError('No pattern meets the prespecified evidence criteria')
    selected.to_csv(output/'global_top_rules.csv',index=False,encoding='utf-8')
    selected = add_fake_contrast(full, selected, validation_events, maximum=fake_contrast)
    full['comparison_selection_panel'] = full.pattern_id.map(
        selected.set_index('pattern_id').selection_panel).fillna('not_selected')
    toward_fake = selected.target_class.eq('Fake').to_numpy()
    low = np.where(toward_fake, selected.validation_author_adjusted_excess_fake_ci_low_pp,
                   -selected.validation_author_adjusted_excess_fake_ci_high_pp)
    selected['author_effect_ci_supports_target'] = low > 0
    selected['low_author_overlap'] = (selected.validation_with_author_occurrences < 20) | (selected.validation_without_author_occurrences < 20)
    selected['test_target_pct'] = np.where(toward_fake, selected.test_fake_pct, selected.test_true_pct)
    selected['test_same_class_direction'] = np.where(toward_fake, selected.test_fake_pct.ge(selected.test_baseline_fake_pct),
                                                    selected.test_true_pct.ge(selected.test_baseline_true_pct))
    full.to_csv(output/'all_93_patterns.csv', index=False, encoding='utf-8')
    selected.to_csv(output/'selected_rules_scatter.csv', index=False, encoding='utf-8')
    membership = assignments.reset_index().copy()
    membership['label'] = np.where(fake, 'Fake', 'True')
    membership['author_state'] = np.where(author == 1, 'com_autor', 'sem_autor')
    for row in selected.itertuples():
        index = patterns.index[patterns.pattern_id.eq(row.pattern_id)][0]
        membership[row.display_id] = events[:, index]
    membership.to_csv(output/'news_rule_matrix.csv', index=False, encoding='utf-8')
    # Which component explains the descriptive class composition? Remove one item,
    # recompute the same validation proportions, and report the change in points.
    ablations = []
    vitems = items.loc[assignments.index[masks['validation']]]
    for row in selected.itertuples():
        names = json.loads(row.features)
        for removed in names:
            subset = [name for name in names if name != removed]
            match = vitems[subset].all(axis=1).to_numpy()
            stats = partition_stats(match[:, None], fake[masks['validation']], author[masks['validation']]).iloc[0]
            ablations.append({'display_id':row.display_id, 'removed_item':removed,
                              'remaining_items':json.dumps(subset), 'remaining_occurrences':stats.occurrences,
                              'remaining_fake_pct':stats.fake_pct, 'remaining_true_pct':stats.true_pct,
                              'full_fake_pct':row.validation_fake_pct,
                              'fake_purity_gain_pp':row.validation_fake_pct-stats.fake_pct})
    pd.DataFrame(ablations).to_csv(output/'leave_one_item_out.csv', index=False, encoding='utf-8')
    singles = pd.DataFrame({'item':items.columns})
    for partition, mask in masks.items():
        singles = pd.concat([singles, partition_stats(items.to_numpy()[mask], fake[mask], author[mask]).add_prefix(partition+'_')],axis=1)
    singles.to_csv(output/'individual_items.csv',index=False,encoding='utf-8')
    _plots(selected, output)
    details = {'status':'executed', 'created_utc':datetime.now(timezone.utc).isoformat(), 'source_run':source.name,
               'variant':VARIANT, 'directed_rules':len(rules), 'unique_patterns':len(patterns),
               'max_requested':max_rules, 'selected':len(selected),
               'comparison_panel':{'global_top':int(selected.selection_panel.eq('global_top').sum()),
                                   'fake_contrast':int(selected.selection_panel.eq('fake_contrast').sum()),
                                   'rationale':'Global top20 contains only True-oriented patterns; add up to5 eligible Fake-oriented patterns for the requested bidirectional comparison, not as higher-ranked rules.'},
               'target_counts':selected.target_class.value_counts().to_dict(),
               'selection':'Validation class labels only; no test/all-corpus values used. Supervised post-selection of label-free discoveries.',
               'score':'100 * max(target-purity CI95 lower fraction - target baseline fraction,0) * sqrt(target class coverage fraction) * representative train-rule rediscovery fraction',
               'eligibility':{'minimum_validation_occurrences':100, 'paired_permutation_q_BY_max':.05,
                              'ranking_score_positive':True, 'max_coverage_Jaccard':.80},
               'bootstrap':{'repetitions':bootstrap,'seed':42,'unit':'whole canonical groups','interval':'pointwise percentile95; no simultaneous/selection correction'},
               'permutation':{'repetitions':permutations,'seed':42,'unit':'swap class labels within whole balanced canonical groups','two_sided':'absolute difference','adjustments':['BH','BY'],'family':len(patterns)},
               'author_control':'Standardize stratum class purity to each partition population author shares; subtract corresponding stratum baseline, not causal adjustment.',
               'percentage_scale':'0--100; pp columns are percentage-point differences',
               'occurrence_definition':'all antecedent AND consequent items present; reverse arrows share composition',
               'source_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__),source/'features.csv',source/'split_assignments.csv',source/VARIANT/'discretization.csv',source/VARIANT/'rule_metrics.csv',source/'training_rediscovery_stability.csv']},
               'notes':['Canonical test already used; exploratory and not confirmatory.', 'Ranking with labels is not wholly unsupervised.', 'Composition is not causality, external accuracy, or a factual verification system.', 'In-sample group bootstrap can understate uncertainty with zero/small minority cells; author-overlap counts are exposed.', 'Representative direction chosen by train rediscovery, train lift and train confidence, not class purity.']}
    (output/'ranking_manifest.json').write_text(json.dumps(details,ensure_ascii=False,indent=2),encoding='utf-8')
    write_report(selected, full, output, details)
    print(json.dumps({'output':str(output),'selected':len(selected),'targets':details['target_counts'],
                      'author_ci_support':int(selected.author_effect_ci_supports_target.sum())},ensure_ascii=False),flush=True)
    return output


def write_report(selected, full, output, details):
    lines = ['# Comparação das melhores regras linguísticas', '',
             f'**Recorte final: {len(selected)} padrões distintos**, a partir de {details["directed_rules"]} regras direcionais e '
             f'{details["unique_patterns"]} combinações. {details["target_counts"].get("Fake",0)} favorecem Fake e '
             f'{details["target_counts"].get("True",0)} favorecem True na validação. Não foi forçado equilíbrio entre classes.', '',
             f'O ranking global selecionou {details["comparison_panel"]["global_top"]} padrões. '
             f'Para examinar os dois sentidos da comparação, o painel acrescenta '
             f'{details["comparison_panel"]["fake_contrast"]} candidatos Fake que passam os mesmos critérios mínimos. '
             'Eles são identificados como `fake_contrast` e não são apresentados como superiores aos20 globais. '
             'Esse acréscimo é exploratório, decidido após observar que o top20 global contém apenas padrões True.', '',
             '## O que define uma regra melhor', '',
             'Para a associação Fake/True, uma regra é mais útil quando separa as classes com ocorrências suficientes, '
             'mantém a descoberta sob reamostragem e acrescenta cobertura diferente das regras já escolhidas. '
             'O lift gramatical A→B não mede a associação com Fake/True.', '',
             '`score = 100 × max(limite inferior95 da pureza da classe − baseline da classe, 0) × sqrt(cobertura da classe) × redescoberta da regra no treino`.', '',
             'As frações da fórmula estão entre0 e1. A elegibilidade exige pelo menos100 ocorrências na validação, '
             'q≤0,05 na permutação pareada com correção BY das93 comparações e scorepositivo. '
             'A seleção é gulosa, por score, omitindo cobertura com Jaccard≥0,80 de um padrão já selecionado. '
             'O máximo escolhido antes da análise foi20; não foram preenchidas vagas com candidatos sem evidência mínima.', '',
             '**A seleção agora usa os rótulos da validação:** é uma análise posterior supervisionada de regras descobertas sem classe. '
             'Teste e corpus inteiro não selecionam regras. Os intervalos são pontuais, não ajustados para a seleção do topX. '
             'Permutação pressupõe intercambiabilidade das classes dentro de grupos sob a hipótese nula, não causalidade. '
             '[Permutação pareada — SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.permutation_test.html), '
             '[controle de comparações múltiplas — SciPy](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.false_discovery_control.html).', '',
             '## Porcentagens com denominadores distintos', '',
             '- `fake_pct = Fake com padrão / todas as notícias com padrão ×100`: composição/pureza.',
             '- `fake_coverage_pct = Fake com padrão / todas as notícias Fake ×100`: frequência na classe.',
             '- As duas versões True têm os denominadores correspondentes. `support_pct` usa todas as notícias da partição.',
             '- Uma ocorrência requer todos os itens do antecedente e do consequente. Não significa que a seta cause a classe.', '',
             '## Recorte final — métricas da validação', '',
             '| ID | Padrão | Alvo | Ocorrências | Fake entre ocorrências | True entre ocorrências | Aparece nas Fake | Aparece nas True | Redescoberta treino |',
             '|---|---|---|---:|---:|---:|---:|---:|---:|']
    for row in selected.itertuples():
        lines.append(f'| {row.display_id} | `{row.pattern_text}` | {row.target_class} | {row.validation_occurrences} | '
                     f'{row.validation_fake_pct:.2f}% | {row.validation_true_pct:.2f}% | '
                     f'{row.validation_fake_coverage_pct:.2f}% | {row.validation_true_coverage_pct:.2f}% | {row.train_rule_rediscovery_pct:.0f}% |')
    lines += ['', '## Comparação com teste e corpus completo', '',
              'O teste já foi consultado anteriormente e serve como descrição de recorrência, não nova confirmação externa. '
              'O corpus completo inclui treino/validação/teste e não é um holdout adicional.', '',
              '| ID | Fake val. | Fake teste | Fake corpus | True corpus | Ocorrências corpus |',
              '|---|---:|---:|---:|---:|---:|']
    for row in selected.itertuples():
        lines.append(f'| {row.display_id} | {row.validation_fake_pct:.2f}% | {row.test_fake_pct:.2f}% | '
                     f'{row.all_fake_pct:.2f}% | {row.all_true_pct:.2f}% | {row.all_occurrences} |')
    lines += ['', '## Limites dos padrões em linguagem direta', '',
              'Os limites foram aprendidos no treino. A apresentação abaixo arredonda a duas casas; '
              '`thresholds_pct` no CSV preserva valores precisos. POS/DEP usam tokens lexicais; '
              'pontuação usa tokens sem espaço, e as medidas lexicais/caixa alta conservam as definições documentadas.', '',
              '| ID | Combinação dos atributos |', '|---|---|']
    for row in selected.itertuples():
        lines.append(f'| {row.display_id} | {row.pattern_pt} |')
    lines += ['', '## O que permanece depois de considerar autoria', '',
              'A autoria não foi usada para descobrir nem pontuar as regras, mas foi conferida como confundidor. '
              'O excesso ajustado compara a pureza dentro de cada estrato com sua baseline e padroniza os estratos à composição '
              'de autoria da população. É uma padronização descritiva, não estimativa causal nem percentual observado.', '',
              f'{int(selected.author_effect_ci_supports_target.sum())} de {len(selected)} padrões têm intervalo95 do excesso '
              'ajustado inteiramente favorável à classe indicada. Estratos sem ocorrências ficam ausentes; '
              'estratos com menos20 ocorrências são sinalizados e células minoritárias pequenas limitam os intervalos. '
              'Esses intervalos são pontuais e não corrigidos para comparações múltiplas ou escolha do recorte; '
              'esse número não constitui comprovação de efeitos independentes.', '',
              '| ID | Fake com autor | Baseline Fake com autor | Fake sem autor | Baseline Fake sem autor | Excesso Fake ajustado (pp) | Intervalo95 (pp) |',
              '|---|---:|---:|---:|---:|---:|---|']
    for row in selected.itertuples():
        lines.append(f'| {row.display_id} | {row.validation_with_author_fake_pct:.2f}% | '
                     f'{row.validation_with_author_baseline_fake_pct:.2f}% | {row.validation_without_author_fake_pct:.2f}% | '
                     f'{row.validation_without_author_baseline_fake_pct:.2f}% | {row.validation_author_adjusted_excess_fake_pp:.2f} | '
                     f'[{row.validation_author_adjusted_excess_fake_ci_low_pp:.2f}; {row.validation_author_adjusted_excess_fake_ci_high_pp:.2f}] |')
    strongest = full.sort_values('validation_fake_pct', ascending=False).iloc[0]
    lines += ['', '## Exemplo de associação forte que não deve virar explicação causal', '',
              f'O maior percentual Fake entre os93 candidatos é **{strongest.validation_fake_pct:.2f}%**, '
              f'no padrão `{strongest.pattern_text}`: {strongest.validation_fake_count} Fake e '
              f'{strongest.validation_true_count} True, em {strongest.validation_occurrences} ocorrências. '
              f'Ele aparece em **{strongest.validation_fake_coverage_pct:.2f}% das Fake**, '
              f'não em {strongest.validation_fake_pct:.2f}% de todas as Fake. '
              f'A redescoberta da sua direção representativa é {strongest.train_rule_rediscovery_pct:.0f}%. '
              f'Seu status global é `{strongest.selection_status}`, e no painel comparativo é '
              f'`{strongest.comparison_selection_panel}`.', '',
              'Para entender quais itens acrescentam separação, `leave_one_item_out.csv` remove um item por vez e '
              'recalcula as porcentagens na validação. Essa diferença é associação condicional, não causa de falsidade. '
              '`individual_items.csv` permite comparar as mesmas taxas isoladas.', '',
              '## Arquivos para a matriz de dispersão', '',
              '- [selected_rules_scatter.csv](selected_rules_scatter.csv): um ponto por padrão selecionado, contagens, '
              'porcentagens0–100, intervalos, score, estabilidade, autoria e partições.',
              '- [global_top_rules.csv](global_top_rules.csv): recorte global sem o acréscimo de candidatos Fake.',
              '- [news_rule_matrix.csv](news_rule_matrix.csv): uma linha por notícia e colunasR01…RX booleanas, '
              'com rótulo, grupo, partição e autoria apenas para análise posterior.',
              '- [all_93_patterns.csv](all_93_patterns.csv): todos os candidatos e motivos de exclusão.',
              '- [leave_one_item_out.csv](leave_one_item_out.csv): diferença das porcentagens ao remover cada item.',
              '- [individual_items.csv](individual_items.csv): frequências dos itens isolados.',
              '- [Dispersão de cobertura por classe](class_coverage_scatter.png) e [matriz de dispersão](scatter_matrix.png).', '',
              'Para visualizar separação, use `validation_true_coverage_pct` no eixoX e `validation_fake_coverage_pct` no eixoY. '
              'Pontos acima da diagonal aparecem proporcionalmente mais em Fake; abaixo, mais em True. '
              'Cor pode indicar classe predominante e tamanho o número de ocorrências. '
              'Usar Fake% e True% da composição como os dois eixos produz uma linha, pois somam100%.', '',
              'Esses padrões descrevem este corpus e uma janela de300 caracteres. Eles ajudam a formular hipóteses sobre estilo, '
              'fonte e anotação gramatical; não estabelecem o que torna uma afirmação factual falsa ou verdadeira.']
    (output/'comparison_report.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-run',type=Path,default=DEFAULT_RUN)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--max-rules',type=int,default=20)
    parser.add_argument('--bootstrap',type=int,default=1000)
    parser.add_argument('--permutations',type=int,default=4999)
    parser.add_argument('--fake-contrast',type=int,default=5)
    args = parser.parse_args()
    analyze(args.source_run,args.output,args.max_rules,args.bootstrap,args.permutations,args.fake_contrast)

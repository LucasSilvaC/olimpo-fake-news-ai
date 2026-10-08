"""Controlled expansion of collected POS/DEP metadata for reflection insights.

No label or author enters discretization, mining, rediscovery or review ranking.
Candidate families were informed by earlier exploratory analyses, so this is
not a fresh confirmatory test. Existing notebooks and outputs are read-only.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
from importlib.metadata import version
import hashlib
import json
from pathlib import Path
import sys
import unicodedata

import numpy as np
import pandas as pd
from mlxtend.frequent_patterns import association_rules, fpgrowth

ML = Path(__file__).resolve().parents[1]
PRIMARY_VARIANT = 'sintaxe_ampliada'
LEGACY_DIR = ML / 'unsupervised-learning/history/mineracao-de-padroes/fp-growth-linguistico'
if str(LEGACY_DIR) not in sys.path:
    sys.path.insert(0, str(LEGACY_DIR))
import linguistic_features as base_extraction
import linguistic_fp_growth as base

REFERENCE_RUN = ML / 'outputs/model-comparison/fp-growth-linguistic-20261006T230752Z'
SELECTION = ML / 'saida_features/selecao'
SCHEMA_SOURCE = ML / 'saida_features/dataset_features.csv'
EXCLUDED = {
    'POS_SPACE': 'diagnóstico de whitespace e formatação',
    'POS_X': 'diagnóstico de anotação/tokenização',
    'POS_SYM': 'símbolos: requer auditoria editorial própria',
    'POS_INTJ': 'tag esparsa: reservar para análise própria',
    'POS_PUNCT': 'representada por punctuationDensity_spacy com denominador próprio',
    'DEP_ROOT': 'segmentação de frases: diagnóstico de sensibilidade',
    'DEP_dep': 'diagnóstico de anotação e formatação',
    'DEP_punct': 'representada por punctuationDensity_spacy',
}
DISPLAY = {
    'POS_ADJ': 'adjetivos', 'POS_ADV': 'advérbios', 'POS_NOUN': 'substantivos',
    'POS_PROPN': 'nomes próprios', 'POS_VERB': 'verbos', 'POS_PRON': 'pronomes',
    'POS_ADP': 'preposições', 'POS_AUX': 'verbos auxiliares', 'POS_NUM': 'numerais',
    'POS_CCONJ': 'conjunções coordenativas', 'POS_SCONJ': 'conjunções subordinativas',
    'POS_DET': 'determinantes', 'POS_PART': 'partículas',
    'DEP_nsubj': 'sujeitos nominais', 'DEP_obj': 'objetos diretos',
    'DEP_amod': 'modificadores adjetivais', 'DEP_advmod': 'modificadores adverbiais',
    'DEP_ccomp': 'complementos oracionais', 'DEP_advcl': 'orações adverbiais',
    'DEP_obl': 'relações oblíquas', 'DEP_cc': 'relações de coordenação',
    'DEP_acl:relcl': 'orações relativas', 'DEP_nsubj:pass': 'sujeitos de construções passivas',
    'DEP_case': 'marcadores de caso', 'DEP_det': 'relações de determinação',
    'DEP_nmod': 'modificadores nominais', 'DEP_mark': 'marcadores de subordinação',
    'diversidade': 'diversidade lexical', 'uppercaseRatio': 'palavras inteiramente em maiúsculas',
    'punctuationDensity_spacy': 'pontuação',
}
MECHANISMS = {
    'POS_ADJ': 'adjetivacao', 'DEP_amod': 'adjetivacao',
    'POS_ADV': 'modificacao_adverbial', 'DEP_advmod': 'modificacao_adverbial',
    'POS_ADP': 'relacoes_preposicionais', 'DEP_case': 'relacoes_preposicionais',
    'POS_CCONJ': 'coordenacao', 'DEP_cc': 'coordenacao', 'DEP_conj': 'coordenacao',
    'POS_DET': 'determinacao', 'DEP_det': 'determinacao',
    'POS_AUX': 'auxiliares', 'DEP_aux': 'auxiliares', 'DEP_aux:pass': 'auxiliares',
    'POS_NUM': 'numerais', 'DEP_nummod': 'numerais',
    'POS_SCONJ': 'subordinacao', 'DEP_mark': 'subordinacao',
}


def save(table, path):
    base._save(table, path)


def configuration():
    """Use collected tag vocabulary, not class relevance, as the broad pool."""
    schema = [c for c in pd.read_csv(SCHEMA_SOURCE, nrows=0) if c.startswith(('POS_', 'DEP_'))]
    selected = set(pd.read_csv(SELECTION / 'features_selecionadas.csv').feature)
    core = list(base.CORRECTED + base.POS + base.DEP)
    pos = core + ['POS_ADP_rate', 'POS_AUX_rate', 'POS_NUM_rate']
    syntax = pos + ['DEP_obl_rate', 'DEP_cc_rate', 'DEP_acl:relcl_rate', 'DEP_nsubj:pass_rate']
    broad = list(dict.fromkeys(core + [c + '_rate' for c in schema if c not in EXCLUDED]))
    variants = {'referencia_corrigida': core, 'pos_ampliado': pos,
                'sintaxe_ampliada': syntax, 'metadados_coletados': broad}
    audit = pd.DataFrame([{'source_feature': c, 'feature': c+'_rate',
                          'selected_in_previous_supervised_eda': c in selected,
                          'included_in_broad_variant': c not in EXCLUDED,
                          'exclusion_reason': EXCLUDED.get(c, ''),
                          'denominator': 'tokens_lexical' if c not in EXCLUDED else 'diagnostic_or_separate_measure'}
                         for c in schema])
    return schema, variants, audit


def extract_collected_features(records, nlp, tags, character_limit=300):
    """Same normalized window/denominators as the corrected reference."""
    if not records.index.is_unique or not {'text', 'author'}.issubset(records):
        raise ValueError('Unique canonical IDs, text and author metadata are required')
    if not records.text.map(lambda t: isinstance(t, str)).all():
        raise ValueError('Texts must be strings')
    normalized = records.text.map(lambda t: unicodedata.normalize('NFKC', t).lstrip('\ufeff'))
    windows = normalized.str[:character_limit]
    rows = []
    for position, (rid, doc) in enumerate(zip(records.index, nlp.pipe(windows, batch_size=50), strict=True), 1):
        if doc.text != windows.at[rid]:
            raise ValueError('Pipeline changed text alignment')
        if len(doc) and not all(doc.has_annotation(a) for a in ['POS', 'DEP', 'SENT_START']):
            raise ValueError('POS, DEP and sentence annotations are required')
        nonspace = [t for t in doc if not t.is_space]
        lexical = [t for t in nonspace if not t.is_punct]
        pos, dep = Counter(t.pos_ for t in lexical), Counter(t.dep_ for t in lexical)
        punctuation = sum(t.is_punct for t in nonspace)
        ratio = lambda n, d: n/d if d else np.nan
        row = {'record_id': rid, **base_extraction._legacy_style(doc.text, records.at[rid, 'author']),
               'text_sha256': hashlib.sha256(records.at[rid, 'text'].encode('utf8')).hexdigest(),
               'text_chars_raw': len(records.at[rid, 'text']), 'text_chars_window': len(doc.text),
               'tokens_all': len(doc), 'tokens_nonspace': len(nonspace), 'tokens_lexical': len(lexical),
               'punctuation_count_spacy': punctuation,
               'punctuationDensity_spacy': ratio(punctuation, len(nonspace)),
               'quality_empty': not bool(doc.text.strip()), 'quality_noeligible': not bool(lexical),
               'quality_truncated': len(normalized.at[rid]) > character_limit,
               'diag_space_count': sum(t.is_space for t in doc),
               'diag_root_count': sum(t.dep_ == 'ROOT' for t in doc),
               'diag_dep_count': sum(t.dep_ == 'dep' for t in doc)}
        for tag in tags:
            system, label = tag.split('_', 1)
            count = (pos if system == 'POS' else dep)[label]
            row[tag+'_count'] = count
            row[tag+'_rate'] = ratio(count, len(lexical))
        rows.append(row)
        if position % 500 == 0:
            print(f'Extração: {position}/{len(records)}', flush=True)
    return pd.DataFrame(rows).set_index('record_id')


def mine(matrix):
    """Avoid quadratic comparisons of all frequent patterns during bootstrap."""
    if not len(matrix) or not matrix.shape[1]:
        return pd.DataFrame(columns=['support','itemsets','features','itemset_size','pattern_id']), base._empty_rules()
    frequent = fpgrowth(matrix, min_support=.08, use_colnames=True, max_len=3)
    frequent['features'] = frequent.itemsets.map(lambda x: sorted(x))
    frequent['itemset_size'] = frequent.itemsets.map(len)
    frequent['pattern_id'] = frequent.features.map(base.stable_id)
    if frequent.empty or not frequent.itemset_size.ge(2).any():
        return frequent, base._empty_rules()
    rules = association_rules(frequent[['support', 'itemsets']], metric='confidence', min_threshold=0)
    union = rules['antecedent support'] + rules['consequent support'] - rules.support
    rules['jaccard'] = rules.support / union
    rules['passes_filters'] = rules.confidence.ge(.5) & rules.lift.ge(1.05) & rules.jaccard.ge(.1)
    for c in ['antecedents', 'consequents']:
        rules[c] = rules[c].map(lambda x: sorted(x))
    rules['features'] = [sorted(set(a+c)) for a,c in zip(rules.antecedents, rules.consequents)]
    rules['pattern_id'] = rules.features.map(base.stable_id)
    rules['rule_id'] = [base.rule_key(a,c) for a,c in zip(rules.antecedents, rules.consequents)]
    return frequent, rules


def training_resamples(assignments, train_ids, repetitions):
    groups = assignments.set_index('record_id').loc[train_ids, 'group_id']
    names = sorted(groups.unique())
    positions = {g: np.flatnonzero(groups.to_numpy() == g) for g in names}
    rng = np.random.default_rng(42)
    return [np.concatenate([positions[names[j]] for j in rng.integers(0, len(names), len(names))])
            for _ in range(repetitions)]


def rediscover(train, columns, eligible, samples):
    counts = Counter()
    ids = set(eligible.rule_id)
    for number, positions in enumerate(samples, 1):
        matrix, _ = base.fit_discretization(train.iloc[positions].reset_index(drop=True), columns)
        _, rules = mine(matrix)
        counts.update(set(rules.loc[rules.passes_filters, 'rule_id']) & ids)
        if number % 25 == 0:
            print(f'  Redescoberta: {number}/{len(samples)}', flush=True)
    return pd.DataFrame([{'rule_id': rid, 'rediscovery_count': counts[rid],
                          'rediscovery_fraction': counts[rid]/len(samples), 'repetitions': len(samples)}
                         for rid in sorted(ids)],
                        columns=['rule_id','rediscovery_count','rediscovery_fraction','repetitions'])


def mechanism(feature):
    raw = feature.removesuffix('_rate')
    return MECHANISMS.get(raw, raw)


def pattern_candidates(metrics, matrices, criteria, reference_items):
    """Review queue ranked without class labels, preserving inverse-rule provenance."""
    rows, covers = [], {}
    reference_columns = set(reference_items.columns)
    for pid, group in metrics.groupby('pattern_id', sort=True):
        # Prefer a direction sustained in validation; stability never uses labels.
        passing = group.loc[group.validation_passes_filters]
        representative = (passing if len(passing) else group).sort_values(
            ['rediscovery_fraction', 'validation_confidence', 'rule_id'], ascending=[False, False, True]).iloc[0]
        items = representative['features']
        cover = matrices['validation'][items].all(axis=1).to_numpy()
        covers[pid] = cover
        features = [x.rsplit('_',1)[0] for x in items]
        families = sorted(set(mechanism(f) for f in features))
        support = float(cover.mean())
        eligible = bool(len(passing) and representative.rediscovery_fraction >= .8 and int(cover.sum()) >= 100)
        rows.append({'pattern_id':pid, 'features':items, 'pattern_text':' + '.join(items),
                     'directed_rule_ids':sorted(group.rule_id), 'representative_rule_id':representative.rule_id,
                     'validation_occurrences':int(cover.sum()), 'validation_support':support,
                     'validation_filters_pass':bool(len(passing)),
                     'rediscovery_fraction':float(representative.rediscovery_fraction),
                     'mechanism_families':families, 'redundancy_family':'|'.join(families),
                     'has_structural_overlap':len(families) < len(features),
                     'contains_added_item':bool(set(items)-reference_columns),
                     'eligible_for_review':eligible,
                     'review_score':float(representative.rediscovery_fraction*np.sqrt(support)) if eligible else 0.,
                     'display_status':'research_only', 'selection_status':'ineligible',
                     'redundant_with_pattern_id':''})
    table = pd.DataFrame(rows, columns=['pattern_id','features','pattern_text','directed_rule_ids',
        'representative_rule_id','validation_occurrences','validation_support','validation_filters_pass',
        'rediscovery_fraction','mechanism_families','redundancy_family','has_structural_overlap',
        'contains_added_item','eligible_for_review','review_score','display_status','selection_status',
        'redundant_with_pattern_id'])
    if table.empty:
        return table, covers
    selected, selected_families = [], set()
    ordered = table.sort_values(['review_score','has_structural_overlap','pattern_id'], ascending=[False,True,True])
    for idx, row in ordered.iterrows():
        if not row.eligible_for_review:
            continue
        if row.redundancy_family in selected_families:
            table.at[idx, 'selection_status'] = 'same_mechanism_family'
            continue
        duplicate = next((pid for pid in selected if coverage_jaccard(covers[row.pattern_id],covers[pid]) >= .8), None)
        if duplicate:
            table.at[idx, 'selection_status'] = 'redundant_coverage'
            table.at[idx, 'redundant_with_pattern_id'] = duplicate
        elif len(selected) < 20:
            selected.append(row.pattern_id)
            selected_families.add(row.redundancy_family)
            table.at[idx, 'selection_status'] = 'review_candidate'
        else:
            table.at[idx, 'selection_status'] = 'outside_review_top20'
    return table.sort_values(['review_score','pattern_id'],ascending=[False,True]), covers


def coverage_jaccard(a, b):
    union = (a | b).sum()
    return float((a & b).sum()/union) if union else 0.


def composition(frame, assignments, items):
    """Both denominators, separated by partition and author; descriptive only."""
    matches = items.all(axis=1)
    fake = pd.Series(frame.index.str.startswith('fake/'),index=frame.index)
    result = []
    for part in ['train','validation','test']:
        for author in ['all','com_autor','sem_autor']:
            population = assignments.set_index('record_id').partition.reindex(frame.index).eq(part)
            if author != 'all':
                population &= frame.tem_autor.eq(int(author == 'com_autor'))
            observed = population & matches
            nf, nt = int((population & fake).sum()), int((population & ~fake).sum())
            cf, ct = int((observed & fake).sum()), int((observed & ~fake).sum())
            n = cf+ct
            result.append({'partition':part,'author_state':author,'occurrences':n,
                           'fake_count':cf,'true_count':ct,'population_fake':nf,'population_true':nt,
                           'composition_fake':cf/n if n else None,'composition_true':ct/n if n else None,
                           'frequency_in_fake':cf/nf if nf else None,'frequency_in_true':ct/nt if nt else None,
                           'baseline_fake':nf/(nf+nt) if nf+nt else None,
                           'small_author_stratum':author!='all' and n<20})
    return result


def catalog_pattern(row, criteria, observations):
    definitions = criteria.set_index('item')
    items, parts = [], []
    for name in row.features:
        c = definitions.loc[name]
        f = c.feature
        denom = 'tokens_lexical' if f.endswith('_rate') else 'tokens_nonspace' if f=='punctuationDensity_spacy' else 'regex_words'
        raw = f.removesuffix('_rate')
        label = DISPLAY.get(raw, 'anotação '+raw)
        operator = '<=' if c.direction=='baixo' else '>='
        items.append({'item':name,'feature':f,'operator':operator,'threshold':float(c.threshold),
                      'denominator':denom,'annotation_label':label})
        parts.append(f'{label}: valor {operator} {float(c.threshold):.6g}')
    questions = ['Qual afirmação deste trecho você gostaria de verificar?',
                 'Que fonte ou evidência ajudaria a confirmar ou refutar essa afirmação?']
    if any(i['feature']=='POS_NUM_rate' for i in items):
        questions.append('Qual é a origem dos números mencionados e o que eles medem?')
    if any(i['feature'] in {'POS_ADV_rate','POS_ADJ_rate'} for i in items):
        questions.append('Quais modificadores mudam a intensidade da afirmação? Qual afirmação permanece ao retirá-los?')
    return {'patternId':row.pattern_id,'directedRuleIds':row.directed_rule_ids,
            'representativeRuleId':row.representative_rule_id,'items':items,
            'observationTitle':'Combinação observada no trecho',
            'observationTemplate':'No trecho analisado, as medidas correspondem aos limites de comparação: '+ '; '.join(parts)+'.',
            'reflectionQuestions':questions,'redundancyFamily':row.redundancy_family,
            'hasStructuralOverlap':row.has_structural_overlap,'rediscoveryFraction':row.rediscovery_fraction,
            'eligibleForReview':row.eligible_for_review,'selectionRole':row.selection_status,
            'displayStatus':'research_only','comparisonEnabled':False,
            'reviewNotes':['Descrição e perguntas automáticas aguardam revisão editorial.',
                           'Redescoberta considera nomes de itens/direção, não limites numéricos idênticos.',
                           'Intervalos da composição por classe não foram estimados neste catálogo.'],
            'classComparison':observations}


def run_experiment(output_dir=None, repetitions=100, archive_path=None):
    if isinstance(repetitions,bool) or not isinstance(repetitions,int) or repetitions < 1:
        raise ValueError('At least one rediscovery/validation bootstrap repetition is required')
    out = Path(output_dir) if output_dir else ML/'outputs/model-comparison'/f'fp-growth-principal-{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}'
    if out.exists() and (not out.is_dir() or any(out.iterdir())):
        raise FileExistsError(f'Refusing to overwrite output: {out}')
    baseline_manifest = json.loads(base.BASELINE_MANIFEST.read_text(encoding='utf8'))
    reference_manifest = json.loads((REFERENCE_RUN/'run_manifest.json').read_text(encoding='utf8'))
    archive = Path(archive_path) if archive_path else ML/'unsupervised-learning/data'/f"Fake.br-Corpus-{baseline_manifest['corpus']['revision']}.zip"
    if base.sha256(archive) != baseline_manifest['corpus']['archive_sha256']:
        raise ValueError('Frozen archive SHA-256 differs from baseline')
    records = base_extraction.load_records(archive)
    assignments = base.canonical_assignments(records,baseline_manifest)
    # Prove the newly collected rows describe these same texts; never join by row silently.
    collected = pd.read_csv(SELECTION/'dataset_filtrado.csv',usecols=['label','texto'])
    ordered = [rid for folder in ['true','fake'] for rid in sorted(records.index[records.index.str.startswith(folder+'/')])]
    if len(collected)!=len(records) or not all(t==records.at[rid,'text'] and label==int(rid.startswith('fake/'))
                                            for rid,t,label in zip(ordered,collected.texto,collected.label,strict=True)):
        raise ValueError('Collected CSV texts/labels do not match the frozen corpus in extractor order')
    tags, variants, feature_pool = configuration()
    import spacy
    nlp = spacy.load('pt_core_news_sm',disable=['ner'])
    if spacy.__version__!='3.8.16' or nlp.meta['version']!='3.8.0':
        raise ValueError('Use the pinned spaCy/model versions to compare this reference')
    features = extract_collected_features(records,nlp,tags)
    reference = pd.read_csv(REFERENCE_RUN/'linguistic_features.csv',index_col='record_id',float_precision='round_trip')
    if base.sha256(REFERENCE_RUN/'linguistic_features.csv') != reference_manifest['cache']['csv_sha256']:
        raise ValueError('Reference feature checksum mismatch')
    errors = {}
    for f in ['tem_autor']+variants['referencia_corrigida']:
        expected = reference.loc[features.index,f]
        if not np.allclose(features[f],expected,atol=1e-15,rtol=0,equal_nan=True):
            raise ValueError(f'Reference definition changed: {f}')
        errors[f] = float((features[f]-expected).abs().max())
    out.mkdir(parents=True,exist_ok=True)
    save(features.reset_index(),out/'features.csv')
    save(assignments,out/'split_assignments.csv')
    save(feature_pool,out/'feature_pool.csv')
    train_ids = assignments.loc[assignments.partition.eq('train'),'record_id'].tolist()
    samples = training_resamples(assignments,train_ids,repetitions)
    splits = {p:features.loc[g.record_id] for p,g in assignments.groupby('partition')}
    val_groups = assignments.set_index('record_id').loc[splits['validation'].index,'group_id']
    summaries, combined, comparisons, reference_items, reference_ids = [], [], [], None, set()
    union_reference = None
    variant_manifests = {}
    for variant, columns in variants.items():
        print(f'Minerando {variant}: {len(columns)} features candidatas',flush=True)
        dest = out/variant
        dest.mkdir()
        train_matrix, criteria = base.fit_discretization(splits['train'],columns)
        matrices = {'train':train_matrix,**{p:base.apply_discretization(f,criteria) for p,f in splits.items() if p!='train'}}
        frequent,rules = mine(train_matrix)
        eligible = rules.loc[rules.passes_filters.astype(bool)].copy()
        if variant=='referencia_corrigida':
            reference_items = matrices['validation']
            reference_ids = set(pd.read_csv(REFERENCE_RUN/'corrected_pos_dep/eligible_rules.csv').rule_id)
            if set(eligible.rule_id)!=reference_ids:
                raise ValueError('Expanded experiment failed to reproduce 152 reference rules')
        metrics = eligible[['rule_id','pattern_id','antecedents','consequents','features']].copy()
        for part,matrix in matrices.items():
            metrics = metrics.merge(base.evaluate_rules(matrix,eligible).rename(columns=lambda c:c if c=='rule_id' else part+'_'+c),on='rule_id',validate='one_to_one')
        metrics = metrics.merge(base.bootstrap_rules(matrices['validation'],eligible,val_groups,repetitions),on='rule_id',validate='one_to_one')
        stability = rediscover(splits['train'],columns,eligible,samples)
        metrics = metrics.merge(stability,on='rule_id',validate='one_to_one')
        candidates,covers = pattern_candidates(metrics,matrices,criteria,reference_items)
        review = candidates.loc[candidates.selection_status.eq('review_candidate')].copy()
        if variant=='referencia_corrigida':
            union_reference = np.logical_or.reduce(list(covers.values())) if covers else np.zeros(len(splits['validation']),dtype=bool)
        new_union = np.logical_or.reduce(list(covers.values())) if covers else np.zeros(len(splits['validation']),dtype=bool)
        review_union = np.logical_or.reduce([covers[p] for p in review.pattern_id]) if len(review) else np.zeros(len(splits['validation']),dtype=bool)
        summary = {'variant':variant,'candidate_features':len(columns),'active_features':int(criteria.loc[~criteria.omitted,'feature'].nunique()),
                   'omitted_features':int(criteria.loc[criteria.omitted,'feature'].nunique()),'items':train_matrix.shape[1],
                   'eligible_directed_rules':len(eligible),'eligible_patterns':len(candidates),
                   'validation_pass_rules':int(metrics.validation_passes_filters.sum()),
                   'test_pass_rules_exploratory':int(metrics.test_passes_filters.sum()),
                   'stable_validation_rules':int((metrics.rediscovery_fraction.ge(.8)&metrics.validation_passes_filters).sum()),
                   'review_candidates':len(review),'review_candidates_with_added_items':int(review.contains_added_item.sum()),
                   'validation_pattern_union_count':int(new_union.sum()),
                   'validation_added_news_vs_reference':int((new_union&~union_reference).sum()),
                   'validation_review_union_count':int(review_union.sum())}
        catalog, posthoc = [], []
        full_matrix = base.apply_discretization(features,criteria)
        for row in candidates.itertuples():
            observations = composition(features,assignments,full_matrix[row.features])
            posthoc.extend({'variant':variant,'pattern_id':row.pattern_id,**x} for x in observations)
            catalog.append(catalog_pattern(row,criteria,observations))
        payload = {'catalogVersion':'metadata-expansion-v1','sourceRun':out.name,'variant':variant,
                   'characterLimit':300,'normalization':'NFKC; strip leading BOM; first 300 characters',
                   'extractorSha256':base.sha256(__file__),'comparisonEnabled':False,
                   'status':'research_catalog_pending_editorial_review','patterns':catalog}
        (dest/'pattern_catalog.json').write_text(json.dumps(base._json_clean(payload),ensure_ascii=False,indent=2,allow_nan=False),encoding='utf8')
        for t,name in [(frequent,'frequent_itemsets.csv'),(rules,'all_rules.csv'),(eligible,'eligible_rules.csv'),
                       (criteria,'discretization.csv'),(metrics,'rule_metrics.csv'),(stability,'training_rediscovery.csv'),
                       (candidates,'pattern_candidates.csv'),(review,'review_candidates.csv'),(pd.DataFrame(posthoc),'posthoc_composition.csv')]:
            save(t,dest/name)
        metrics.insert(0,'variant',variant)
        combined.append(metrics)
        ids = set(eligible.rule_id)
        comparisons.append({'variant':variant,'new_directed_rules_vs_reference':len(ids-reference_ids),
                            'retained_reference_rules':len(ids&reference_ids),'removed_reference_rules':len(reference_ids-ids)})
        summaries.append(summary)
        variant_manifests[variant] = {'features':columns,'counts':summary}
        print(json.dumps(summary,ensure_ascii=False),flush=True)
    save(pd.DataFrame(summaries),out/'variant_summary.csv')
    save(pd.concat(combined,ignore_index=True),out/'rule_metrics.csv')
    save(pd.DataFrame(comparisons),out/'comparisons.csv')
    sources = [SCHEMA_SOURCE,*SELECTION.glob('*.csv'),REFERENCE_RUN/'run_manifest.json',base.BASELINE_MANIFEST]
    manifest = {'status':'executed','created_utc':datetime.now(timezone.utc).isoformat(),
                'primary_variant':PRIMARY_VARIANT,
                'corpus':baseline_manifest['corpus'],'archive_verified_sha256':base.sha256(archive),
                'collected_text_alignment_records':len(records),'reference_definition_errors':errors,
                'parameters':base.PARAMETERS,'variants':variant_manifests,
                'partitions':{'canonical_random_group':baseline_manifest['partitions']['canonical_random_group']},
                'bootstrap':{'repetitions':repetitions,'seed':42,'unit':'whole canonical paired/exact-duplicate groups',
                             'same_training_resamples_across_variants':True,'training_quantiles_refitted':True},
                'review_policy':{'labels_used_for_discovery_or_review_ranking':False,'min_rediscovery':.8,
                                 'min_validation_occurrences':100,'max_review_candidates':20,
                                 'coverage_jaccard_redundancy_threshold':.8,'human_review_completed':False,
                                 'display_status':'research_only','class_comparison_enabled':False},
                'environment':{p:version(p) for p in ['numpy','pandas','mlxtend','spacy','pt_core_news_sm']},
                'source_sha256':{p.name:base.sha256(p) for p in [Path(__file__),Path(base.__file__),Path(base_extraction.__file__)]},
                'input_sha256':{str(p.relative_to(ML)):base.sha256(p) for p in sources},
                'notes':['Candidate families were informed by previously observed exploratory results.',
                         'Broad vocabulary comes from collected POS/DEP columns, not the supervised top31 filter.',
                         'No labels/authorship enter discovery, thresholds, rediscovery or review ranking.',
                         'Test is already observed and remains exploratory.',
                         'Class composition has no confidence intervals here; grammar intervals are group-bootstrap percentile intervals.',
                         'Structural families and coverage deduplication do not guarantee independent evidence.',
                         'Catalog descriptions/questions are drafts requiring editorial review before display.']}
    (out/'run_manifest.json').write_text(json.dumps(base._json_clean(manifest),ensure_ascii=False,indent=2,allow_nan=False),encoding='utf8')
    write_report(out,pd.DataFrame(summaries),pd.DataFrame(comparisons),repetitions)
    print(f'Concluído: {out}',flush=True)
    return out


def write_report(out,summary,comparison,repetitions):
    lines = ['# FP-Growth principal sem autoria','',
             f'Variante principal: `{PRIMARY_VARIANT}`. As demais são referências e ablações de comparação.','',
             'Extração dos atributos coletados na janela de 300 caracteres, com denominadores corrigidos. '
             'As 152 regras direcionais da referência foram reproduzidas. Os 7.200 textos coletados foram conferidos contra o ZIP congelado validado por SHA-256.','',
             f'Redescoberta em {repetitions} reamostragens dos grupos do treino, com quantis reaprendidos. '
             'Intervalos gramaticais na validação reamostram grupos com regras/limites congelados. Teste exploratório.','',
             '| Variante | Features ativas | Regras treino | Regras válidas na validação | Estáveis e válidas | Padrões elegíveis | Candidatos à revisão | Notícias adicionais vs referência |',
             '|---|---:|---:|---:|---:|---:|---:|---:|']
    for r in summary.itertuples():
        lines.append(f'| {r.variant} | {r.active_features} | {r.eligible_directed_rules} | {r.validation_pass_rules} | {r.stable_validation_rules} | {r.eligible_patterns} | {r.review_candidates} | {r.validation_added_news_vs_reference} |')
    lines += ['','A última coluna compara a união de todos os padrões elegíveis. Não mede ganho de cobertura de padrões estáveis nem eficácia das perguntas.',
              'A lista de revisão exige regras sustentadas na validação, ≥100 ocorrências e redescoberta ≥80%. '
              'O score usa estabilidade × raiz do suporte, sem label. Ela evita repetir assinaturas de famílias e coberturas com Jaccard ≥0,80. '
              'Esses cortes são uma política exploratória, não validação de utilidade do produto.','',
              '## Exemplos de novas combinações para revisão','',
              '| Variante | Padrão | Ocorrências validação | Redescoberta | Sobreposição estrutural POS/DEP |',
              '|---|---|---:|---:|---|']
    for v in summary.variant:
        candidates = pd.read_csv(out/v/'review_candidates.csv')
        for r in candidates.loc[candidates.contains_added_item].head(5).itertuples():
            lines.append(f'| {v} | `{r.pattern_text}` | {r.validation_occurrences} | {r.rediscovery_fraction:.0%} | {r.has_structural_overlap} |')
    lines += ['','## Uso no propósito do teste.md','',
              'Os catálogos JSON contêm itens com limiares completos, denominadores, proveniência das direções, '
              'famílias de redundância, observações e perguntas preliminares. Todos permanecem `research_only` e '
              '`comparisonEnabled=false`. Nenhuma regra foi automaticamente aprovada para exibição ao usuário.','',
              'As contagens Fake/True estão separadas por partição e autoria em `posthoc_composition.csv`, '
              'com frequência em cada classe e composição entre ocorrências. Não representam probabilidade de falsidade de uma notícia nova. '
              'As descrições automáticas com termos técnicos exigem tradução/revisão editorial.','',
              'Próxima decisão: revisar exemplos das novas famílias e medir quais acrescentam observações compreensíveis. '
              'A comparação externa e a avaliação com usuários continuam pendentes. Mais regras não demonstram melhor reflexão nem generalização.']
    (out/'summary.md').write_text('\n'.join(lines)+'\n',encoding='utf8')


if __name__=='__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--repetitions',type=int,default=100)
    parser.add_argument('--archive',type=Path)
    args = parser.parse_args()
    run_experiment(args.output,args.repetitions,args.archive)

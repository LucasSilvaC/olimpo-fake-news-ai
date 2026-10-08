"""Build the observation-only product catalog without changing research files."""
from __future__ import annotations

import ast
import csv
import hashlib
import json
from pathlib import Path

ENGINE_ROOT = Path(__file__).resolve().parents[1]
RESEARCH_ROOT = ENGINE_ROOT.parent / 'machine-learning'
HERE = RESEARCH_ROOT / 'unsupervised-learning'
RUN = RESEARCH_ROOT / 'outputs/model-comparison/fp-growth-metadados-ampliados-20261008T002311Z'
SOURCE = RUN / 'sintaxe_ampliada/pattern_catalog.json'
DESTINATION = ENGINE_ROOT / 'models/unsupervised/assets/product_catalog.json'

# Editorial wording is specific to every frozen conjunction. Selection order/families
# are retained from v2, independently of all class frequencies.
THEMES = {
    '8715ac5b8fc2': ('referenciacao', 'Pronomes e descrições ligadas a nomes'),
    'afaef19656e5': ('modificacao_adverbial', 'Palavras que detalham as ações'),
    '8c3cebc0601d': ('construcoes_verbais', 'Verbos de apoio e quem recebe a ação'),
    'd1280945c7ef': ('agentes', 'Quem realiza ou recebe a ação'),
    '8b970151f163': ('objetos', 'A quem ou a que as ações se dirigem'),
    '3542b427d129': ('referenciacao', 'Pronomes, descrições e quem recebe a ação'),
    'd0c4306ce66c': ('contexto', 'Palavras de ligação e quem recebe a ação'),
    '58bd81f28dc3': ('adjetivacao', 'Palavras que caracterizam nomes'),
    '340698e8be61': ('modificacao_adverbial', 'Detalhes das ações e quem as recebe'),
    'dcc82376b8a6': ('agentes', 'Quem age e as afirmações ligadas a verbos'),
    '044b4a18072c': ('construcoes_verbais', 'Verbos e afirmações que se conectam'),
    'a33f9be1d445': ('referenciacao', 'Pronomes e quem recebe a ação'),
    '23b2cdc9d31e': ('pontuacao', 'Pontuação e quem recebe a ação'),
    '1d57b1df1486': ('referenciacao', 'Pronomes e relações entre partes da frase'),
    '6f18c83ea455': ('agentes', 'Quem age e as descrições ligadas a nomes'),
    '19c77db982d8': ('construcoes_verbais', 'Verbos e as circunstâncias das ações'),
    '9193a887d511': ('referenciacao', 'Pronomes e trechos ligados a nomes e verbos'),
    '11e010b31664': ('modificacao_adverbial', 'Detalhes e circunstâncias das ações'),
    '2465ffe4f09d': ('modificacao_adverbial', 'Detalhes das ações e descrições ligadas a nomes'),
    '9865be178551': ('contexto', 'Palavras de ligação e afirmações ligadas a verbos'),
}

# These labels describe annotation types rather than inferring journalistic quality.
DISPLAY_LABELS = {
    'DEP_acl:relcl_rate': "descrições ligadas a nomes, como 'que chegou' em 'a pessoa que chegou'",
    'POS_PRON_rate': "pronomes, como 'ele', 'ela' e 'isso'",
    'DEP_advmod_rate': "palavras que detalham uma ação ou qualidade, como 'rapidamente' e 'muito'",
    'POS_ADV_rate': "advérbios, como 'hoje', 'aqui' e 'rapidamente'",
    'DEP_nsubj:pass_rate': "referências a quem recebe a ação, como 'a proposta' em 'a proposta foi aprovada'",
    'POS_AUX_rate': "verbos de apoio, como 'foi' em 'foi aprovado'",
    'DEP_nsubj_rate': "referências a quem age, como 'a equipe' em 'a equipe publicou'",
    'DEP_obj_rate': "referências ao alvo da ação, como 'o relatório' em 'publicou o relatório'",
    'POS_ADP_rate': "palavras de ligação, como 'de', 'em' e 'para'",
    'DEP_amod_rate': "palavras que caracterizam nomes, como 'importante' em 'decisão importante'",
    'POS_ADJ_rate': "adjetivos, como 'importante' e 'novo'",
    'DEP_ccomp_rate': "afirmações ligadas a um verbo, como 'o prazo acabou' em 'disse que o prazo acabou'",
    'POS_VERB_rate': "verbos, como 'publicou' e 'informou'",
    'DEP_advcl_rate': "trechos que acrescentam circunstâncias à ação, como 'quando chegou'",
    'punctuationDensity_spacy': 'sinais de pontuação',
}


# Short descriptions used in the main card. Longer annotation explanations above
# remain in measurement details. Both forms are needed to render real counts.
SUMMARY_LABELS = {
    'DEP_acl:relcl_rate': ('descrição como “a pessoa que chegou”', 'descrições como “a pessoa que chegou”'),
    'POS_PRON_rate': ('pronome como “ele” ou “ela”', 'pronomes como “ele” ou “ela”'),
    'DEP_advmod_rate': ('detalhe como “rapidamente” em “chegou rapidamente”', 'detalhes como “rapidamente” em “chegou rapidamente”'),
    'POS_ADV_rate': ('palavra como “hoje”, “aqui” ou “rapidamente”', 'palavras como “hoje”, “aqui” ou “rapidamente”'),
    'DEP_nsubj:pass_rate': ('referência como “a proposta” em “a proposta foi aprovada”', 'referências como “a proposta” em “a proposta foi aprovada”'),
    'POS_AUX_rate': ('verbo de apoio como “foi” em “foi aprovado”', 'verbos de apoio como “foi” em “foi aprovado”'),
    'DEP_nsubj_rate': ('referência a quem age, como “a equipe” em “a equipe publicou”', 'referências a quem age, como “a equipe” em “a equipe publicou”'),
    'DEP_obj_rate': ('alvo da ação, como “o relatório” em “publicou o relatório”', 'alvos da ação, como “o relatório” em “publicou o relatório”'),
    'POS_ADP_rate': ('palavra de ligação como “de”, “em” ou “para”', 'palavras de ligação como “de”, “em” ou “para”'),
    'DEP_amod_rate': ('descrição de um nome, como “decisão importante”', 'descrições de nomes, como “decisão importante”'),
    'POS_ADJ_rate': ('palavra que caracteriza algo, como “novo” ou “importante”', 'palavras que caracterizam algo, como “novo” ou “importante”'),
    'DEP_ccomp_rate': ('afirmação como “o prazo acabou” em “disse que o prazo acabou”', 'afirmações como “o prazo acabou” em “disse que o prazo acabou”'),
    'POS_VERB_rate': ('verbo como “publicou” ou “informou”', 'verbos como “publicou” ou “informou”'),
    'DEP_advcl_rate': ('trecho que indica circunstância, como “quando chegou”', 'trechos que indicam circunstâncias, como “quando chegou”'),
    'punctuationDensity_spacy': ('sinal de pontuação', 'sinais de pontuação'),
}


def descriptive_comparison(pattern, source):
    rows = [row for row in pattern['classComparison']
            if row['partition'] == 'validation' and row['author_state'] == 'all']
    if len(rows) != 1:
        raise ValueError('Exactly one validation/all reference is required')
    row = rows[0]
    result = {'kind': 'descriptive_corpus_frequency', 'referenceDataset': 'Fake.br-Corpus',
              'partition': 'validation', 'authorScope': 'all', 'sourceRun': source['sourceRun'],
              'variant': source['variant'], 'scope': 'matched_pattern'}
    for label in ['fake', 'true']:
        count, total = row[label + '_count'], row['population_' + label]
        if type(count) is not int or type(total) is not int or total != 720 or not 0 <= count <= total:
            raise ValueError('Invalid frozen class counts')
        frequency = count / total
        if abs(row['frequency_in_' + label] - frequency) > 1e-12:
            raise ValueError('Frozen class frequency does not match count/population')
        result[label] = {'count': count, 'total': total, 'frequency': frequency}
    return result


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_serving_equations():
    """Prevent exports from pairing a new experiment with stale serving equations."""
    legacy = HERE / 'history/mineracao-de-padroes/fp-growth-linguistico'
    runtime = ENGINE_ROOT / 'models/unsupervised/features.py'
    expected = {}
    for path, names in [
        (HERE / 'fp_growth_principal.py', {'extract_collected_features'}),
        (legacy / 'linguistic_features.py', {'WORDS', 'TOKENS', '_ratio', '_legacy_style'}),
        (legacy / 'linguistic_fp_growth.py', {'apply_discretization'}),
    ]:
        text = path.read_text(encoding='utf8').replace('base_extraction._legacy_style(', '_legacy_style(')
        for node in ast.parse(text).body:
            name = node.name if isinstance(node, ast.FunctionDef) else (
                node.targets[0].id if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name) else None)
            if name in names:
                expected[name] = ast.dump(node, include_attributes=False)
    actual = {}
    for node in ast.parse(runtime.read_text(encoding='utf8')).body:
        name = node.name if isinstance(node, ast.FunctionDef) else (
            node.targets[0].id if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name) else None)
        if name in expected:
            actual[name] = ast.dump(node, include_attributes=False)
    if actual != expected:
        raise ValueError('Serving equations differ from research sources: review features.py before export')


def build_catalog():
    verify_serving_equations()
    source = json.loads(SOURCE.read_text(encoding='utf8'))
    selected = [p for p in source['patterns'] if p['selectionRole'] == 'review_candidate']
    if {p['patternId'] for p in selected} != set(THEMES):
        raise ValueError('Research candidates changed: technical template review is required')
    criteria = []
    with (SOURCE.parent / 'discretization.csv').open(encoding='utf8', newline='') as handle:
        for row in csv.DictReader(handle):
            criteria.append({'feature': row['feature'], 'item': row['item'],
                             'direction': row['direction'], 'threshold': float(row['threshold']),
                             'omitted': row['omitted'] == 'True'})
    patterns = []
    for rank, pattern in enumerate(selected):
        family, title = THEMES[pattern['patternId']]
        items = [dict(item, displayLabel=DISPLAY_LABELS[item['feature']],
                      summarySingular=SUMMARY_LABELS[item['feature']][0],
                      summaryPlural=SUMMARY_LABELS[item['feature']][1]) for item in pattern['items']]
        patterns.append({'patternId': pattern['patternId'], 'items': items,
                         'priority': rank, 'observationTitle': title,
                         'observationTemplate': 'Neste trecho, a leitura automática {summary}.',
                         'reflectionQuestions': [], 'redundancyFamily': family,
                         'displayStatus': 'descriptive_comparison', 'comparisonEnabled': True,
                         'comparison': descriptive_comparison(pattern, source)})
    return {'catalogVersion': 'sintaxe-ampliada-descriptive-comparison-v3',
            'sourceRun': source['sourceRun'], 'variant': source['variant'],
            'runtimeFeaturesSha256': sha256(ENGINE_ROOT / 'models/unsupervised/features.py'),
            'runtimeLayoutVersion': 'model-engine-v1',
            'sourceCatalogSha256': sha256(SOURCE),
            'sourceDiscretizationSha256': sha256(SOURCE.parent / 'discretization.csv'),
            'characterLimit': 300, 'normalization': source['normalization'],
            'extractorVersion': 'collected-features-v1/spacy-3.8.16/pt_core_news_sm-3.8.0',
            'extractorSourceSha256': sha256(HERE / 'fp_growth_principal.py'),
            'baseExtractionSourceSha256': sha256(HERE / 'history/mineracao-de-padroes/fp-growth-linguistico/linguistic_features.py'),
            'discretizationSourceSha256': sha256(HERE / 'history/mineracao-de-padroes/fp-growth-linguistico/linguistic_fp_growth.py'),
            'comparisonEnabled': True, 'status': 'experimental_descriptive_comparison',
            'review': {'reviewType': 'agent_technical_review', 'humanEditorialApproval': False,
                       'notes': ['Observações descrevem as medidas do trecho; anotações automáticas podem errar.',
                                 'Frequências usam a combinação completa na partição validation/all do Fake.br-Corpus.',
                                 'As duas classes são exibidas com seus próprios denominadores de 720 notícias.',
                                 'Rótulos históricos descrevem o corpus, não a veracidade da notícia analisada.',
                                 'Seleção mantém prioridades e famílias congeladas, sem usar diferenças entre classes.',
                                 'Não contém composição por classe, probabilidades ou classificação.']},
            'discretization': criteria, 'patterns': patterns}


if __name__ == '__main__':
    DESTINATION.write_text(json.dumps(build_catalog(), ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(DESTINATION)

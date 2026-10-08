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

# These templates underwent technical review by the implementing agents.
# They are experimental observations, not human editorial approval.
THEMES = {
    '8715ac5b8fc2': ('referenciacao', 'Como o trecho identifica pessoas e fatos?',
                    ['A quem cada pessoa ou instituição mencionada se refere?', 'Que informação fora deste trecho ajudaria a entender essas referências?']),
    'afaef19656e5': ('modificacao_adverbial', 'Como as ações são descritas?',
                    ['Que afirmação central aparece neste trecho?', 'Que evidência permitiria verificar essa afirmação, além da maneira como foi escrita?']),
    '8c3cebc0601d': ('construcoes_verbais', 'Quais ações aparecem no trecho?',
                    ['Quem faz o quê neste trecho?', 'Qual fonte permitiria conferir se essas ações ocorreram?']),
    'd1280945c7ef': ('agentes', 'Quem participa das ações?',
                    ['Quais pessoas ou instituições aparecem como responsáveis pelas ações?', 'O texto indica como verificar a participação delas?']),
    '8b970151f163': ('objetos', 'A que se dirigem as ações?',
                    ['Sobre quem ou sobre o que recaem as ações descritas?', 'Que registro ou documento ajudaria a verificar essas ações?']),
    '3542b427d129': ('referenciacao', 'Como o trecho identifica pessoas e fatos?',
                    ['A quem cada nome mencionado se refere?', 'Que contexto ajudaria a distinguir pessoas ou fatos com nomes semelhantes?']),
    'd0c4306ce66c': ('contexto', 'Que contexto acompanha os fatos?',
                    ['Que informações de lugar, tempo ou circunstância estão explícitas?', 'Quais delas precisam ser procuradas na notícia completa ou em outra fonte?']),
    '58bd81f28dc3': ('adjetivacao', 'Como pessoas e acontecimentos são caracterizados?',
                    ['Qual afirmação pode ser verificada neste trecho?', 'Que evidência ajudaria a avaliá-la independentemente dos adjetivos usados?']),
    '340698e8be61': ('modificacao_adverbial', 'Como as ações são descritas?',
                    ['Que afirmação central aparece neste trecho?', 'Que evidência permitiria verificar a ação descrita?']),
    'dcc82376b8a6': ('agentes', 'Quem sustenta a afirmação?',
                    ['É possível identificar quem afirma ou realiza o que é relatado?', 'Que fonte permitiria confirmar essa atribuição?']),
    '044b4a18072c': ('construcoes_verbais', 'Que acontecimento é relatado?',
                    ['Que ação ou acontecimento você consegue identificar?', 'Que informações precisaria encontrar para verificar esse acontecimento?']),
    'a33f9be1d445': ('referenciacao', 'A quem os pronomes se referem?',
                    ['Você consegue ligar cada pronome à pessoa ou instituição correspondente?', 'A notícia completa esclarece alguma referência que ficou aberta neste trecho?']),
    '23b2cdc9d31e': ('pontuacao', 'Como a pontuação organiza o trecho?',
                    ['Que partes a pontuação separa, cita ou destaca?', 'Qual afirmação dessas partes você gostaria de verificar em outra fonte?']),
    '1d57b1df1486': ('referenciacao', 'Como o trecho identifica pessoas e fatos?',
                    ['Quem e quais fatos são mencionados explicitamente?', 'Que contexto externo ajudaria a compreender a relação entre eles?']),
    '6f18c83ea455': ('agentes', 'Quem participa do acontecimento?',
                    ['Você consegue identificar os participantes do fato relatado?', 'Que detalhe deveria conferir na notícia completa antes de interpretar essa participação?']),
    '19c77db982d8': ('construcoes_verbais', 'Como os acontecimentos se conectam?',
                    ['Quais acontecimentos você consegue separar neste trecho?', 'Que evidência permitiria conferir a ordem ou a relação entre eles?']),
    '9193a887d511': ('referenciacao', 'Como o trecho identifica pessoas e fatos?',
                    ['Quais pessoas e afirmações aparecem explicitamente?', 'Que informação ajudaria a ligar cada afirmação à sua fonte?']),
    '11e010b31664': ('modificacao_adverbial', 'Que circunstâncias acompanham a afirmação?',
                    ['Onde, quando e em que condições o fato teria ocorrido?', 'Que circunstância precisa ser conferida na notícia completa ou em outra fonte?']),
    '2465ffe4f09d': ('modificacao_adverbial', 'Que circunstâncias acompanham a afirmação?',
                    ['Que circunstâncias estão explícitas neste trecho?', 'Qual informação adicional ajudaria a interpretar a afirmação principal?']),
    '9865be178551': ('contexto', 'Como o trecho situa suas afirmações?',
                    ['Que pessoas, lugares ou circunstâncias estão ligados à afirmação?', 'Que detalhe de contexto você procuraria antes de verificar o fato?']),
}


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
        family, title, questions = THEMES[pattern['patternId']]
        descriptions = []
        for item in pattern['items']:
            label = item['annotation_label']
            if item['operator'] == '<=' and item['threshold'] == 0:
                descriptions.append(f'{label}: nenhuma ocorrência anotada')
            else:
                band = 'inferior' if item['operator'] == '<=' else 'superior'
                descriptions.append(f'{label}: frequência na faixa {band} de referência do treino')
        patterns.append({'patternId': pattern['patternId'], 'items': pattern['items'],
                         'priority': rank, 'observationTitle': title,
                         'observationTemplate': 'Na janela analisada, o anotador encontrou ' + '; '.join(descriptions) + '.',
                         'reflectionQuestions': questions, 'redundancyFamily': family,
                         'displayStatus': 'observation_only', 'comparisonEnabled': False})
    return {'catalogVersion': 'sintaxe-ampliada-observation-only-v2',
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
            'comparisonEnabled': False, 'status': 'experimental_observation_only',
            'review': {'reviewType': 'agent_technical_review', 'humanEditorialApproval': False,
                       'notes': ['Observações restritas às medidas da janela de 300 caracteres.',
                                 'Perguntas não inferem intenção, qualidade jornalística ou veracidade.',
                                 'Ausência de uma anotação no trecho não implica ausência na notícia completa.',
                                 'Não contém frequências por classe, probabilidades ou classificação.']},
            'discretization': criteria, 'patterns': patterns}


if __name__ == '__main__':
    DESTINATION.write_text(json.dumps(build_catalog(), ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    print(DESTINATION)

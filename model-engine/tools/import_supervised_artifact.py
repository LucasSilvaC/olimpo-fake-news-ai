"""Offline packaging of an already fitted artifact. Never trains or calls fit."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from models.supervised.engine import POLICY, inference_version, sha256


def frozen_source(path):
    """Keep the standalone artifact's legacy import while research uses support/."""
    source = Path(path).read_bytes().replace(b'\r\n', b'\n')
    if Path(path).name == 'modelo_olimpo.py':
        source = source.replace(b'from support import metadados_spacy as ms',
                                b'import metadados_spacy as ms')
    return source


def import_artifact(source, verify_load=True):
    source = Path(source)
    assets = ROOT / 'models/supervised/assets'
    assets.mkdir(parents=True, exist_ok=True)
    filename = 'olimpo-svm-spacy-chi2k10k-svd500-v1'
    metadata_path = source / 'modelos' / (filename + '.json')
    metadata = json.loads(metadata_path.read_text(encoding='utf8'))
    artifact = source / 'modelos' / metadata['arquivo']
    if sha256(artifact) != metadata['sha256']:
        raise ValueError('Source artifact SHA-256 mismatch; refusing to import')
    shutil.copyfile(artifact, assets / artifact.name)
    # model-engine/.gitattributes requires LF; freeze that representation so checkout
    # on Linux/Windows preserves the hashes used before artifact loading.
    for original, destination in [(metadata_path, assets / metadata_path.name),
                                  (source / 'modelo_olimpo.py', ROOT / 'models/supervised/pipeline.py'),
                                  (source / 'support/metadados_spacy.py', ROOT / 'models/supervised/linguistic_features.py')]:
        destination.write_bytes(frozen_source(original))
    sources = ['models/supervised/pipeline.py', 'models/supervised/linguistic_features.py',
               'models/supervised/engine.py', 'modelo_olimpo.py', 'metadados_spacy.py']
    manifest = {'schemaVersion': 1, 'artifact': artifact.name, 'artifactSha256': metadata['sha256'],
                'artifactManifest': metadata_path.name, 'artifactManifestSha256': sha256(assets / metadata_path.name),
                'runtimeVersions': metadata['versoes'], 'policy': POLICY,
                'codeSha256': {name: sha256(ROOT / name) for name in sources}}
    manifest['inferenceVersion'] = inference_version(manifest)
    (assets / 'serving_manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    if verify_load:
        from models.supervised.engine import SupervisedEngine
        SupervisedEngine()
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT.parent / 'machine-learning/supervised-learning')
    parser.add_argument('--skip-load', action='store_true', help='Package only; verify loading in the pinned serving image before deploying')
    args = parser.parse_args()
    manifest = import_artifact(args.source, not args.skip_load)
    print(json.dumps({'artifactSha256': manifest['artifactSha256'], 'inferenceVersion': manifest['inferenceVersion'],
                      'loadVerified': not args.skip_load}))

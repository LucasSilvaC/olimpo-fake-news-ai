"""Measure the controlled artifact without training or retaining article bodies."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import statistics
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from models.supervised.engine import SupervisedEngine, InferenceBusy

TEXT = ('A prefeitura publicou documentos sobre a educação e informou os resultados da pesquisa. '
        'O relatório apresenta os investimentos realizados nas escolas durante o ano e as '
        'medidas previstas para o próximo período. ') * 4


if __name__ == '__main__':
    started = time.perf_counter()
    engine = SupervisedEngine()
    startup = time.perf_counter() - started
    timings = []
    for _ in range(20):
        started = time.perf_counter()
        result = engine.analyze_text(TEXT)
        timings.append(time.perf_counter() - started)
    def analyze(_):
        try:
            return engine.analyze_text(TEXT)['analysisStatus']
        except InferenceBusy:
            return 'unavailable'
    with ThreadPoolExecutor(max_workers=8) as executor:
        concurrency = list(executor.map(analyze, range(8)))
    peak_rss_mb = None
    if sys.platform.startswith('linux'):
        import resource
        peak_rss_mb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024
    print(json.dumps({'identity': engine.identity, 'startupSeconds': startup,
                      'serialRuns': len(timings), 'medianSeconds': statistics.median(timings),
                      'p95Seconds': sorted(timings)[18], 'peakRssMiB': peak_rss_mb,
                      'eightConcurrentRequests': {status: concurrency.count(status) for status in set(concurrency)},
                      'fakeProbability': result['fakeProbability'],
                      'fakeScore': result['fakeScore']}, indent=2))

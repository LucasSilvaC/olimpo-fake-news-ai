"""Private persistent HTTP adapter for the frozen observation engine."""
from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import logging
import os
import socket

from models.unsupervised.engine import CHARACTER_LIMIT, CATALOG_PATH, NewsInsightsEngine

LOGGER = logging.getLogger('news_insights')
MAX_BODY_BYTES = 1_000_000


def empty_response(status):
    try:
        catalog = json.loads(CATALOG_PATH.read_text(encoding='utf8'))
        catalog_version, extractor_version = catalog['catalogVersion'], catalog['extractorVersion']
    except (OSError, ValueError, KeyError, TypeError):
        catalog_version, extractor_version = 'unavailable', 'unavailable'
    return {'analysisStatus': status, 'catalogVersion': catalog_version,
            'extractorVersion': extractor_version, 'analyzedText': '',
            'characterLimit': CHARACTER_LIMIT,
            'quality': {'empty': True, 'noEligibleTokens': True, 'truncated': False}, 'insights': []}


def create_server(host='127.0.0.1', port=8010, engine=None):
    class Handler(BaseHTTPRequestHandler):
        server_version = 'NewsInsights/1'

        def setup(self):
            super().setup()
            self.connection.settimeout(20)

        def send_json(self, status, payload):
            body = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode('utf8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path != '/health':
                self.send_json(404, {'error': 'not_found'})
                return
            response = empty_response('ok' if self.server.engine is not None else 'unavailable')
            self.send_json(200 if self.server.engine is not None else 503,
                           {'status': response['analysisStatus'], 'catalogVersion': response['catalogVersion'],
                            'extractorVersion': response['extractorVersion'], 'comparisonEnabled': False})

        def do_POST(self):
            if self.path != '/analyze':
                self.send_json(404, {'error': 'not_found'})
                return
            self.close_connection = True
            try:
                length_header = self.headers.get('Content-Length', '')
                if not length_header.isdecimal() or self.headers.get('Transfer-Encoding'):
                    self.send_json(400, empty_response('invalid_text'))
                    return
                length = int(length_header)
                if length < 1 or length > MAX_BODY_BYTES:
                    self.send_json(413 if length > MAX_BODY_BYTES else 400, empty_response('invalid_text'))
                    return
                if self.headers.get_content_type() != 'application/json':
                    self.send_json(415, empty_response('invalid_text'))
                    return
                raw = self.rfile.read(length)
                if len(raw) != length:
                    self.send_json(400, empty_response('invalid_text'))
                    return
                payload = json.loads(raw.decode('utf8'))
                if not isinstance(payload, dict) or set(payload) != {'text'} or not isinstance(payload['text'], str):
                    self.send_json(400, empty_response('invalid_text'))
                    return
            except (ValueError, UnicodeError, RecursionError, socket.timeout):
                self.send_json(400, empty_response('invalid_text'))
                return
            if self.server.engine is None:
                self.send_json(503, empty_response('unavailable'))
                return
            try:
                response = self.server.engine.analyze_text(payload['text'])
                self.send_json(400 if response['analysisStatus'] == 'invalid_text' else 200, response)
            except Exception:
                LOGGER.exception('Analysis failed')
                self.send_json(503, empty_response('unavailable'))

        def log_message(self, message, *args):
            # No request text, URL query, or news body is logged.
            LOGGER.info('HTTP %s %s', self.command, args[1] if len(args) > 1 else '')

    server = ThreadingHTTPServer((host, port), Handler)
    server.daemon_threads = True
    server.engine = engine
    return server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default=os.environ.get('NEWS_INSIGHTS_HOST', '127.0.0.1'))
    parser.add_argument('--port', default=int(os.environ.get('NEWS_INSIGHTS_PORT', '8010')), type=int)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format='%(levelname)s %(name)s: %(message)s')
    try:
        engine = NewsInsightsEngine()
    except Exception:
        LOGGER.exception('Engine initialization failed; service remains unavailable')
        engine = None
    server = create_server(args.host, args.port, engine)
    LOGGER.info('Listening on %s:%s; ready=%s', args.host, args.port, engine is not None)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()

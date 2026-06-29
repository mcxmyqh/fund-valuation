import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

WATCHLIST_PATH = os.environ.get('WATCHLIST_PATH', 'watchlist.json')


def load_watchlist():
    try:
        with open(WATCHLIST_PATH, 'r') as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def save_watchlist(data):
    with open(WATCHLIST_PATH, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class Handler(BaseHTTPRequestHandler):

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length)) if length else {}

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/watchlist':
            self._send_json(load_watchlist())
        else:
            self._send_json({'error': 'not found'}, 404)

    def do_POST(self):
        if self.path == '/api/watchlist':
            body = self._read_body()
            code = body.get('code', '').strip()
            name = body.get('name', '').strip()
            if not code or not name:
                self._send_json({'error': 'code and name required'}, 400)
                return
            watchlist = load_watchlist()
            if not any(f['code'] == code for f in watchlist):
                watchlist.append({'code': code, 'name': name})
                save_watchlist(watchlist)
            self._send_json(watchlist)
        else:
            self._send_json({'error': 'not found'}, 404)

    def do_DELETE(self):
        if self.path == '/api/watchlist':
            body = self._read_body()
            code = body.get('code', '').strip()
            if not code:
                self._send_json({'error': 'code required'}, 400)
                return
            watchlist = load_watchlist()
            watchlist = [f for f in watchlist if f['code'] != code]
            save_watchlist(watchlist)
            self._send_json(watchlist)
        else:
            self._send_json({'error': 'not found'}, 404)


def main():
    port = int(os.environ.get('PORT', 5000))
    server = HTTPServer(('127.0.0.1', port), Handler)
    print(f'Watchlist server running on http://127.0.0.1:{port}')
    print(f'File: {WATCHLIST_PATH}')
    server.serve_forever()


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
GTR by Vero UK — local dev server (no-cache).
Serves this folder so the browser always loads the latest HTML/CSS/JS
(plain `python -m http.server` lets the browser cache stale files).

Usage:  python serve.py [port]   (default port 5050)
"""
import http.server
import socketserver
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5050


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print("Serving " + os.getcwd() + " at http://localhost:" + str(PORT) + "  (no-cache)")
    httpd.serve_forever()

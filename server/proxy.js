// Minimal WebSocket proxy to hide API Key from the browser
// Usage: set env GEMINI_API_KEY, then run: npm run proxy
// Frontend connects to ws://localhost:8080/live

import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

let API_KEY = process.env.GEMINI_API_KEY || '';
let SECRET_MATERIAL = process.env.PROXY_SECRET || process.env.KEYRING_SECRET || '';
let KEY_BYTES = null;
const ALGO = 'aes-256-gcm';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECRETS_DIR = path.join(__dirname, '.secrets');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
};
const KEY_FILE = path.join(SECRETS_DIR, 'gemini.key.enc');
const SECRET_FILE = path.join(SECRETS_DIR, 'proxy.secret');

function ensureSecret() {
  try {
    if (SECRET_MATERIAL && SECRET_MATERIAL.length > 0) return;
    if (!fs.existsSync(SECRETS_DIR)) fs.mkdirSync(SECRETS_DIR, { recursive: true, mode: 0o700 });
    if (fs.existsSync(SECRET_FILE)) {
      const s = fs.readFileSync(SECRET_FILE, 'utf8');
      if (s && s.length > 0) {
        SECRET_MATERIAL = s.trim();
        return;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
    SECRET_MATERIAL = generated;
  } catch (_) {}
}

function initKeyBytes() {
  try {
    KEY_BYTES = SECRET_MATERIAL ? crypto.createHash('sha256').update(SECRET_MATERIAL).digest() : null;
  } catch (_) {
    KEY_BYTES = null;
  }
}

function encrypt(text) {
  if (!KEY_BYTES) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY_BYTES, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]);
}

function decrypt(buf) {
  if (!KEY_BYTES) return null;
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(buf.length - 16);
  const data = buf.subarray(12, buf.length - 16);
  const decipher = crypto.createDecipheriv(ALGO, KEY_BYTES, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

function loadStoredKey() {
  try {
    if (!KEY_BYTES) return;
    if (!fs.existsSync(KEY_FILE)) return;
    const buf = fs.readFileSync(KEY_FILE);
    const k = decrypt(buf);
    if (k) API_KEY = k;
  } catch (_) {}
}

function persistKey(k) {
  try {
    if (!KEY_BYTES) return;
    if (!fs.existsSync(SECRETS_DIR)) fs.mkdirSync(SECRETS_DIR, { recursive: true, mode: 0o700 });
    const encrypted = encrypt(k);
    if (!encrypted) return;
    fs.writeFileSync(KEY_FILE, encrypted, { mode: 0o600 });
  } catch (_) {}
}
const HOST = 'generativelanguage.googleapis.com';
const PATH = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

ensureSecret();
initKeyBytes();
loadStoredKey();

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/key') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        if (typeof data.apiKey === 'string' && data.apiKey.length > 0) {
          API_KEY = data.apiKey;
          persistKey(API_KEY);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'invalid apiKey' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, hasKey: !!API_KEY }));
    return;
  }
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      const pathname = url.pathname;
      const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
      const abs = path.join(DIST_DIR, rel);
      const resolvedDist = path.resolve(DIST_DIR);
      const resolvedAbs = path.resolve(abs);
      if (!resolvedAbs.startsWith(resolvedDist)) {
        res.writeHead(403);
        res.end();
        return;
      }
      let fileToSend = fs.existsSync(resolvedAbs) && fs.statSync(resolvedAbs).isFile() ? resolvedAbs : path.join(DIST_DIR, 'index.html');
      const ext = path.extname(fileToSend).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      const stream = fs.createReadStream(fileToSend);
      stream.on('open', () => {
        res.writeHead(200, { 'Content-Type': type });
      });
      stream.on('error', () => {
        res.writeHead(404);
        res.end();
      });
      stream.pipe(res);
      return;
    } catch (_) {}
  }
  res.writeHead(404);
  res.end();
});
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', (client) => {
  const upstreamUrl = `wss://${HOST}${PATH}?key=${API_KEY}`;
  if (!API_KEY) {
    try { client.close(1011, 'API key not set'); } catch (_) {}
    return;
  }
  const upstream = new WebSocket(upstreamUrl);

  const buffer = [];
  let upstreamOpen = false;

  client.on('message', (msg) => {
    if (upstreamOpen && upstream.readyState === WebSocket.OPEN) {
      upstream.send(msg);
    } else {
      buffer.push(msg);
    }
  });

  upstream.on('open', () => {
    upstreamOpen = true;
    while (buffer.length > 0) {
      const msg = buffer.shift();
      try {
        if (upstream.readyState === WebSocket.OPEN) upstream.send(msg);
      } catch (_) {}
    }
  });

  upstream.on('message', (data) => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });

  upstream.on('close', (code, reason) => {
    if (client.readyState === WebSocket.OPEN) client.close(code, reason);
  });

  upstream.on('error', () => {
    try { client.close(1011, 'Upstream error'); } catch (_) {}
  });

  client.on('close', () => {
    try { upstream.close(); } catch (_) {}
  });

  client.on('error', () => {
    try { upstream.close(); } catch (_) {}
  });
});

const PORT = process.env.PORT || 27777;
server.listen(PORT, () => {
  console.log(`WS proxy listening on ws://localhost:${PORT}/live`);
});

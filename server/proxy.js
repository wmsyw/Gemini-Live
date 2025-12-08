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

function serveStatic(req, res) {
  const origin = req.headers?.origin;
  if (origin) {
    try {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    } catch (_) {}
  }

  if (req.method === 'OPTIONS') {
    try {
      res.writeHead(204);
      res.end();
      return true;
    } catch (_) {}
  }
  if (req.method === 'GET') {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      try {
        const loc = `http://localhost:5173${req.url || '/'}`;
        res.writeHead(302, { Location: loc });
        res.end();
        return true;
      } catch (_) {}
    }
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
        return true;
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
      return true;
    } catch (_) {}
  }
  return false;
}

const internalServer = http.createServer((req, res) => {
  const origin = req.headers?.origin;
  if (origin) {
    try {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    } catch (_) {}
  }
  if (req.method === 'OPTIONS') {
    try { res.writeHead(204); res.end(); return; } catch (_) {}
  }
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
      } catch (_) {
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
  res.writeHead(404);
  res.end();
});
const wssInternal = new WebSocketServer({ server: internalServer, path: '/live' });

wssInternal.on('connection', (client) => {
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

const PUBLIC_PORT = process.env.PORT_PUBLIC ? Number(process.env.PORT_PUBLIC) : 5173;
const INTERNAL_PORT = process.env.PORT_INTERNAL ? Number(process.env.PORT_INTERNAL) : (process.env.PORT ? Number(process.env.PORT) : 27777);

internalServer.listen(INTERNAL_PORT, () => {
  console.log(`Internal proxy on ws://127.0.0.1:${INTERNAL_PORT}/live`);
});

const publicServer = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/key') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const forward = http.request({
          hostname: '127.0.0.1',
          port: INTERNAL_PORT,
          path: '/api/key',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, (resp) => {
          const chunks = [];
          resp.on('data', c => chunks.push(c));
          resp.on('end', () => {
            const buf = Buffer.concat(chunks);
            res.writeHead(resp.statusCode || 200, { 'Content-Type': 'application/json' });
            res.end(buf);
          });
        });
        forward.on('error', () => { res.writeHead(502); res.end(); });
        forward.write(body);
        forward.end();
      } catch (_) { res.writeHead(500); res.end(); }
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/healthz') {
    try {
      const forward = http.request({ hostname: '127.0.0.1', port: INTERNAL_PORT, path: '/healthz', method: 'GET' }, (resp) => {
        const chunks = [];
        resp.on('data', c => chunks.push(c));
        resp.on('end', () => {
          const buf = Buffer.concat(chunks);
          res.writeHead(resp.statusCode || 200, { 'Content-Type': 'application/json' });
          res.end(buf);
        });
      });
      forward.on('error', () => { res.writeHead(502); res.end(); });
      forward.end();
    } catch (_) { res.writeHead(500); res.end(); }
    return;
  }
  if (serveStatic(req, res)) return;
  res.writeHead(404);
  res.end();
});

const wssPublic = new WebSocketServer({ server: publicServer, path: '/live' });

wssPublic.on('connection', (client) => {
  const upstream = new WebSocket(`ws://127.0.0.1:${INTERNAL_PORT}/live`);
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
      try { if (upstream.readyState === WebSocket.OPEN) upstream.send(msg); } catch (_) {}
    }
  });
  upstream.on('message', (data) => { if (client.readyState === WebSocket.OPEN) client.send(data); });
  upstream.on('close', (code, reason) => { if (client.readyState === WebSocket.OPEN) client.close(code, reason); });
  upstream.on('error', () => { try { client.close(1011, 'Upstream error'); } catch (_) {} });
  client.on('close', () => { try { upstream.close(); } catch (_) {} });
  client.on('error', () => { try { upstream.close(); } catch (_) {} });
});

publicServer.listen(PUBLIC_PORT, () => {
  console.log(`Public server on http://0.0.0.0:${PUBLIC_PORT} and ws://0.0.0.0:${PUBLIC_PORT}/live`);
});

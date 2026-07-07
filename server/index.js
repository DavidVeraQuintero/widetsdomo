import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {
  initDB, getAllState, saveDashboard, deleteDashboard, removeDashboardFromMeta,
  saveMeta, getImages, removeImage, getAllDashboards, saveHubs, getHubs, resetAllData
} from './db.js';
import { addClient, removeClient, broadcast } from './broadcast.js';
import imageRouter from './routes.js';
import hubProxyRouter from './hubProxy.js';
import {
  verifyCredentials, generateToken, setSessionCookie, clearSessionCookie,
  authMiddleware, verifyWsRequest, verifyToken
} from './auth.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,                    // máximo 5 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

await initDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Auth routes (no auth middleware) ────────────────────────────────────────
app.post('/api/login', loginLimiter, async (req, res) => {
  const { user, password } = req.body ?? {};
  if (!user || !password) return res.status(400).json({ error: 'Missing credentials' });
  const ok = await verifyCredentials(user, password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken();
  setSessionCookie(res, token);
  res.json({ ok: true });
});

app.post('/api/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const token = req.cookies?.session;
  if (!token || !verifyToken(token)) return res.status(401).json({ ok: false });
  res.json({ ok: true });
});

// ─── Hubitat webhook (no cookie auth — Hubitat sends token as query param) ───
app.post('/api/hub-webhook', async (req, res) => {
  const accessToken = req.query.access_token;
  if (!accessToken) return res.status(400).json({ error: 'Missing access_token' });
  const { hubs } = await getHubs();
  const hub = hubs.find(h => h.token === accessToken);
  if (!hub) return res.status(403).json({ error: 'Unknown token' });
  const body = req.body;
  console.log('[webhook] content-type:', req.headers['content-type'], '| body keys:', Object.keys(body));
  let evt;
  try {
    evt = body.content ? JSON.parse(body.content) : body;
  } catch {
    return res.status(400).json({ error: 'Invalid body' });
  }
  if (evt.source !== 'DEVICE') return res.json({ ok: true });
  console.log('[webhook] DEVICE event:', evt.name, '=', evt.value, 'device', evt.deviceId);
  broadcast({
    type: 'DEVICE_EVENT',
    hubId: hub.id,
    deviceId: String(evt.deviceId),
    attribute: evt.name,
    value: evt.value,
    ts: Date.now(),
  });
  res.json({ ok: true });
});

// ─── Protected API routes ────────────────────────────────────────────────────
app.use('/api', authMiddleware);
app.use('/api', imageRouter);
app.use('/api', hubProxyRouter);

app.delete('/api/dashboard/:id', async (req, res) => {
  await deleteDashboard(req.params.id);
  await removeDashboardFromMeta(req.params.id);
  const { meta } = await getAllState();
  if (meta) broadcast({ type: 'PATCH_META', meta, ts: Date.now() });
  res.json({ ok: true });
});

app.post('/api/reset', async (_req, res) => {
  const wipedAt = await resetAllData();
  try {
    fs.readdirSync(UPLOADS_DIR).forEach(f => fs.unlinkSync(path.join(UPLOADS_DIR, f)));
  } catch {}
  broadcast({ type: 'RESET', wipedAt });
  res.json({ ok: true, wipedAt });
});

// ─── Serve React build in production ────────────────────────────────────────
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// ─── WebSocket ───────────────────────────────────────────────────────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', async (ws, req) => {
  if (!verifyWsRequest(req)) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  addClient(ws);

  const fullState = await getAllState();
  ws.send(JSON.stringify({ type: 'FULL_STATE', ...fullState }));

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'PATCH_DASHBOARD': {
        const { dashboardId, name, state, ts } = msg;
        if (dashboardId && state) {
          await saveDashboard(dashboardId, name || dashboardId, JSON.stringify(state));
          broadcast({ type: 'PATCH_DASHBOARD', dashboardId, state, ts }, ws);
        }
        break;
      }
      case 'PATCH_META': {
        const { meta, ts } = msg;
        if (meta) {
          await saveMeta(JSON.stringify(meta));
          broadcast({ type: 'PATCH_META', meta, ts }, ws);
        }
        break;
      }
      case 'PATCH_HUBS': {
        const { hubs, assignments, ts } = msg;
        if (Array.isArray(hubs)) {
          await saveHubs(JSON.stringify({ hubs, assignments: assignments || {} }));
          broadcast({ type: 'PATCH_HUBS', hubs, assignments: assignments || {}, ts }, ws);
        }
        break;
      }
      case 'SEED_STATE': {
        const existing = await getAllDashboards();
        if (existing.length > 0) {
          ws.send(JSON.stringify({ type: 'FULL_STATE', ...await getAllState() }));
          break;
        }
        const { dashboards, meta, hubs } = msg;
        if (Array.isArray(dashboards)) {
          for (const { id, name, state } of dashboards) {
            await saveDashboard(id, name, JSON.stringify(state));
          }
        }
        if (meta) await saveMeta(JSON.stringify(meta));
        if (Array.isArray(hubs) && hubs.length > 0) await saveHubs(JSON.stringify(hubs));
        broadcast({ type: 'FULL_STATE', ...await getAllState() }, ws);
        break;
      }
      case 'IMAGE_REMOVED': {
        const { id } = msg;
        if (id) {
          const images = await getImages();
          const img = images.find(i => i.id === id);
          if (img) {
            const filePath = path.join(UPLOADS_DIR, img.filename);
            fs.unlink(filePath, () => {});
            await removeImage(id);
          }
          broadcast({ type: 'IMAGE_REMOVED', id, ts: Date.now() }, ws);
        }
        break;
      }
    }
  });

  ws.on('close', () => removeClient(ws));
  ws.on('error', () => removeClient(ws));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Keep Render free tier alive — ping self every 10 min so the service
// never reaches the 15-min inactivity threshold that triggers sleep.
if (process.env.RENDER_EXTERNAL_URL) {
  const selfUrl = `${process.env.RENDER_EXTERNAL_URL}/api/me`;
  setInterval(() => {
    fetch(selfUrl).catch(() => {});
  }, 10 * 60 * 1000);
}

// Server-side device state polling — broadcasts DEVICE_EVENT to all WS clients
// when a device attribute changes. Primary real-time path for mobile clients
// since Hubitat's Maker API webhook delivery is unreliable.
const SERVER_POLL_MS = 8_000;
const _devStates = {};
const WATCHED_ATTRS = new Set([
  'contact', 'switch', 'level', 'hue', 'saturation',
  'colorMode', 'colorTemperature', 'volume', 'muted', 'channel',
  'presence', 'motion', 'temperature', 'humidity', 'lock', 'door',
]);

async function pollHubDeviceStates() {
  let hubData;
  try { hubData = await getHubs(); } catch { return; }
  const hubs = hubData?.hubs ?? [];

  for (const hub of hubs) {
    if (hub.type !== 'hubitat' || !hub.cloudUrl) continue;
    try {
      const cloudUrl = new URL(hub.cloudUrl);
      const token = cloudUrl.searchParams.get('access_token') || hub.token;
      const basePath = cloudUrl.pathname;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10_000);
      let res;
      try {
        res = await fetch(
          `https://cloud.hubitat.com${basePath}/devices/all?access_token=${token}`,
          { signal: ctrl.signal }
        );
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) continue;
      const devices = await res.json();
      if (!Array.isArray(devices)) continue;

      for (const dev of devices) {
        const deviceId = String(dev.id);
        const key = `${hub.id}:${deviceId}`;
        const curr = {};
        const attrs = dev.attributes ?? {};
        for (const [name, value] of Object.entries(attrs)) {
          if (WATCHED_ATTRS.has(name) && value !== null && value !== undefined) {
            curr[name] = value;
          }
        }
        const prev = _devStates[key];
        _devStates[key] = curr;
        if (!prev) {
          // First run after server start: broadcast current state so any connected
          // clients with stale saved state sync to reality immediately.
          for (const [name, value] of Object.entries(curr)) {
            broadcast({ type: 'DEVICE_EVENT', hubId: hub.id, deviceId, attribute: name, value: String(value), ts: Date.now() });
          }
          continue;
        }
        for (const [name, value] of Object.entries(curr)) {
          if (String(prev[name]) !== String(value)) {
            broadcast({ type: 'DEVICE_EVENT', hubId: hub.id, deviceId, attribute: name, value: String(value), ts: Date.now() });
          }
        }
      }
    } catch { /* hub unreachable or network error — retry next cycle */ }
  }
}

// Seed initial state then broadcast changes every 8s
pollHubDeviceStates();
setInterval(pollHubDeviceStates, SERVER_POLL_MS);

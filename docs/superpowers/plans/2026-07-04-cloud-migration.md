# Cloud Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the dashboard from a local-only SQLite/Express setup to a cloud-hosted app with PostgreSQL, cookie-based auth, Hubitat Maker API cloud support, webhook-based real-time events, and offline-first PWA behavior.

**Architecture:** Express server deployed to Render (free tier) serves the React build and REST/WebSocket API. PostgreSQL on Neon replaces SQLite. Auth uses HTTP-only JWT cookies with a 30-day session. Hub communication tries the local Hubitat IP first and falls back to the Maker API cloud URL. Real-time device events come via Hubitat webhooks instead of eventsocket. A service worker caches the app for offline loading; when both internet and LAN are unreachable a blocking modal is shown.

**Tech Stack:** Node.js 20, Express 5, `pg` (PostgreSQL), `jsonwebtoken`, `bcryptjs`, `cookie-parser`, React 18, Vite, CSS Modules, Neon PostgreSQL, Render hosting.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add pg, jsonwebtoken, bcryptjs, cookie-parser; remove better-sqlite3 |
| `server/db.js` | Replace | Async PostgreSQL adapter, same public function signatures |
| `server/auth.js` | Create | JWT sign/verify, bcrypt verify, cookie helper, auth middleware |
| `server/index.js` | Replace | Auth routes, async db calls, webhook endpoint, WS auth |
| `src/components/Login/Login.jsx` | Create | Login form styled to match dashboard |
| `src/components/Login/Login.module.css` | Create | Login styles (dark theme) |
| `src/App.jsx` | Modify | Auth guard: show Login if not authenticated |
| `server/hubProxy.js` | Modify | Allow `cloud.hubitat.com` in addition to private IPs |
| `src/services/hubClient.js` | Replace | Cloud URL fallback, remove eventsocket, add connectivity helpers |
| `src/store/hubStore.jsx` | Modify | Add `cloudUrl` field to hub shape |
| `src/components/Hubs/HubForm.jsx` | Modify | Add Cloud URL input field |
| `src/hooks/useConnectivity.js` | Create | Monitor internet + LAN status, return current mode |
| `src/components/Modal/OfflineModal.jsx` | Create | Blocking modal when mode === 'offline' |
| `src/components/Modal/OfflineModal.module.css` | Create | Offline modal styles |
| `public/sw.js` | Create | Service worker: cache-first for app shell |
| `public/manifest.json` | Create | PWA manifest |
| `index.html` | Modify | Register service worker, link manifest |
| `render.yaml` | Create | Render deploy config |

---

## Task 1: Install / remove dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add new server dependencies**

```bash
npm install pg jsonwebtoken bcryptjs cookie-parser
```

Expected output: `added N packages`

- [ ] **Step 2: Remove better-sqlite3**

```bash
npm uninstall better-sqlite3
```

- [ ] **Step 3: Verify package.json**

`dependencies` should contain `pg`, `jsonwebtoken`, `bcryptjs`, `cookie-parser` and NOT contain `better-sqlite3`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap better-sqlite3 for pg, add jwt/bcrypt/cookie-parser"
```

---

## Task 2: PostgreSQL database adapter

**Files:**
- Replace: `server/db.js`

All functions keep the same signatures as the SQLite version but are now `async`. `initDB()` creates tables and is awaited at startup.

- [ ] **Step 1: Replace server/db.js**

```js
// server/db.js
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dashboards (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      state_json TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS images (
      id         TEXT PRIMARY KEY,
      filename   TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hubs (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

async function getConfig(key) {
  const { rows } = await pool.query('SELECT value FROM config WHERE key = $1', [key]);
  return rows[0]?.value ?? null;
}

async function setConfig(key, value) {
  await pool.query(
    'INSERT INTO config (key,value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value',
    [key, String(value)]
  );
}

export async function getWipedAt() {
  return parseInt((await getConfig('wiped_at')) || '0');
}

export async function resetAllData() {
  const wipedAt = Date.now();
  await pool.query('DELETE FROM dashboards; DELETE FROM meta; DELETE FROM images; DELETE FROM hubs;');
  await setConfig('wiped_at', String(wipedAt));
  return wipedAt;
}

export async function saveDashboard(id, name, stateJson) {
  await pool.query(
    `INSERT INTO dashboards (id,name,state_json,updated_at) VALUES ($1,$2,$3,$4)
     ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name, state_json=EXCLUDED.state_json, updated_at=EXCLUDED.updated_at`,
    [id, name, stateJson, Date.now()]
  );
}

export async function deleteDashboard(id) {
  await pool.query('DELETE FROM dashboards WHERE id = $1', [id]);
}

export async function removeDashboardFromMeta(id) {
  const { rows } = await pool.query("SELECT value FROM meta WHERE key='singleton'");
  if (!rows[0]) return;
  try {
    const meta = JSON.parse(rows[0].value);
    if (!Array.isArray(meta.dashboards)) return;
    meta.dashboards = meta.dashboards.filter(d => d.id !== id);
    await pool.query("UPDATE meta SET value=$1 WHERE key='singleton'", [JSON.stringify(meta)]);
  } catch {}
}

export async function getDashboard(id) {
  const { rows } = await pool.query('SELECT * FROM dashboards WHERE id=$1', [id]);
  return rows[0] ?? null;
}

export async function getAllDashboards() {
  const { rows } = await pool.query('SELECT * FROM dashboards');
  return rows;
}

export async function saveMeta(valueJson) {
  await pool.query(
    "INSERT INTO meta (key,value) VALUES ('singleton',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
    [valueJson]
  );
}

export async function getMeta() {
  const { rows } = await pool.query("SELECT * FROM meta WHERE key='singleton'");
  return rows[0] ?? null;
}

export async function addImage(id, filename) {
  await pool.query(
    'INSERT INTO images (id,filename,created_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
    [id, filename, Date.now()]
  );
}

export async function removeImage(id) {
  await pool.query('DELETE FROM images WHERE id=$1', [id]);
}

export async function getImages() {
  const { rows } = await pool.query('SELECT * FROM images');
  return rows;
}

export async function saveHubs(json) {
  await pool.query(
    "INSERT INTO hubs (key,value) VALUES ('singleton',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
    [json]
  );
}

export async function getHubs() {
  const { rows } = await pool.query("SELECT value FROM hubs WHERE key='singleton'");
  if (!rows[0]) return { hubs: [], assignments: {} };
  const parsed = JSON.parse(rows[0].value);
  if (Array.isArray(parsed)) return { hubs: parsed, assignments: {} };
  return { hubs: parsed.hubs || [], assignments: parsed.assignments || {} };
}

export async function getAllState() {
  const dashboards = (await getAllDashboards()).map(row => ({
    id: row.id,
    name: row.name,
    state: JSON.parse(row.state_json),
  }));
  const metaRow = await getMeta();
  const meta = metaRow ? JSON.parse(metaRow.value) : null;
  const images = await getImages();
  const { hubs, assignments } = await getHubs();
  const wipedAt = await getWipedAt();
  return { dashboards, meta, images, hubs, assignments, wipedAt };
}
```

- [ ] **Step 2: Commit**

```bash
git add server/db.js
git commit -m "feat(db): migrate from SQLite to PostgreSQL (async pg pool)"
```

---

## Task 3: Auth module

**Files:**
- Create: `server/auth.js`

- [ ] **Step 1: Create server/auth.js**

```js
// server/auth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET  = process.env.JWT_SECRET  || 'change-me-in-production';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

export async function verifyCredentials(user, password) {
  if (user !== ADMIN_USER) return false;
  return bcrypt.compare(password, ADMIN_HASH);
}

export function generateToken() {
  return jwt.sign({ user: ADMIN_USER }, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

export function authMiddleware(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// For WebSocket: parse a raw cookie header string and verify the session token
export function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
  );
}

export function verifyWsRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifyToken(cookies[COOKIE_NAME]);
}
```

- [ ] **Step 2: Generate the bcrypt hash for the initial password**

Run this once to get the hash (you'll put it in the environment variable `ADMIN_PASSWORD_HASH`):

```bash
node -e "import('bcryptjs').then(m => m.default.hash('AdMin0312', 12).then(console.log))"
```

Copy the output (a string starting with `$2a$12$...`) — it goes into the `ADMIN_PASSWORD_HASH` env var on Render and in your local `.env`.

- [ ] **Step 3: Create a .env file for local development**

Create `.env` in the project root (already in .gitignore — never commit it):

```
DATABASE_URL=postgresql://user:pass@host/dbname
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
ADMIN_USER=admin
ADMIN_PASSWORD_HASH=<hash from step 2>
NODE_ENV=development
```

- [ ] **Step 4: Commit**

```bash
git add server/auth.js
git commit -m "feat(auth): JWT + bcrypt auth module with cookie helper"
```

---

## Task 4: Replace server/index.js

**Files:**
- Replace: `server/index.js`

This version: adds `cookie-parser`, auth middleware on all API routes, async db calls throughout, login/logout/me routes, and the webhook endpoint.

- [ ] **Step 1: Replace server/index.js**

```js
// server/index.js
import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import fs from 'node:fs';
import {
  initDB, getAllState, saveDashboard, deleteDashboard, removeDashboardFromMeta,
  saveMeta, getImages, removeImage, getAllDashboards, saveHubs, getHubs, resetAllData
} from './db.js';
import { addClient, removeClient, broadcast } from './broadcast.js';
import imageRouter from './routes.js';
import hubProxyRouter from './hubProxy.js';
import {
  verifyCredentials, generateToken, setSessionCookie, clearSessionCookie,
  authMiddleware, verifyWsRequest
} from './auth.js';

const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(import.meta.dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

await initDB();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Auth routes (no middleware) ────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
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
  const { verifyToken } = await import('./auth.js');
  const token = req.cookies?.session;
  if (!token || !verifyToken(token)) return res.status(401).json({ ok: false });
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

// ─── Hubitat webhook (no auth middleware — Hubitat can't send cookies) ───────
app.post('/api/hub-webhook', async (req, res) => {
  const accessToken = req.query.access_token;
  if (!accessToken) return res.status(400).json({ error: 'Missing access_token' });

  // Find the hub whose token matches
  const { hubs } = await getHubs();
  const hub = hubs.find(h => h.token === accessToken);
  if (!hub) return res.status(403).json({ error: 'Unknown token' });

  const body = req.body;
  // Hubitat sends: { name, value, deviceId, source, ... }
  // May be wrapped in a content field (eventsocket format)
  const evt = body.content ? JSON.parse(body.content) : body;
  if (evt.source !== 'DEVICE') return res.json({ ok: true });

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

// ─── Serve React build in production ────────────────────────────────────────
const distDir = path.join(import.meta.dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

// ─── WebSocket ───────────────────────────────────────────────────────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', async (ws, req) => {
  // Verify session cookie on WebSocket upgrade
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
```

Note: `await initDB()` at the top level works because `server/index.js` is an ES module (`"type": "module"` in package.json) — top-level await is supported.

- [ ] **Step 2: Fix the /api/me dynamic import (simplify)**

The `/api/me` route above has a dynamic import that won't work cleanly. Replace that route with:

```js
app.get('/api/me', (req, res) => {
  const token = req.cookies?.session;
  if (!token || !verifyToken(token)) return res.status(401).json({ ok: false });
  res.json({ ok: true });
});
```

And add `verifyToken` to the import at the top of the file:

```js
import {
  verifyCredentials, generateToken, setSessionCookie, clearSessionCookie,
  authMiddleware, verifyWsRequest, verifyToken
} from './auth.js';
```

- [ ] **Step 3: Update server/routes.js to make image handlers async**

`server/routes.js` calls `addImage`, `removeImage`, `getImages` which are now async. Update:

```js
router.post('/images', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const filename = req.file.filename;
  await addImage(id, filename);
  const payload = { type: 'IMAGE_ADDED', id, filename, ts: Date.now() };
  broadcast(payload, null);
  res.json({ id, filename });
});

router.delete('/images/:id', async (req, res) => {
  const { id } = req.params;
  const images = await getImages();
  const img = images.find(i => i.id === id);
  if (img) {
    const filePath = path.join(UPLOADS_DIR, img.filename);
    fs.unlink(filePath, () => {});
    await removeImage(id);
    broadcast({ type: 'IMAGE_REMOVED', id, ts: Date.now() }, null);
  }
  res.json({ ok: true });
});
```

- [ ] **Step 4: Verify server starts (local test requires DATABASE_URL in .env)**

```bash
node --env-file=.env server/index.js
```

Expected: `Server running on http://0.0.0.0:3001`  
If DATABASE_URL is not set yet, it will fail to connect to pg — that's expected at this stage.

- [ ] **Step 5: Commit**

```bash
git add server/index.js server/routes.js
git commit -m "feat(server): auth middleware, async db, webhook endpoint, WS auth"
```

---

## Task 5: Login UI

**Files:**
- Create: `src/components/Login/Login.jsx`
- Create: `src/components/Login/Login.module.css`

- [ ] **Step 1: Create Login.module.css**

```css
/* src/components/Login/Login.module.css */
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base, #080f1e);
}

.card {
  width: 320px;
  background: rgba(10, 18, 40, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
  padding: 36px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.logo {
  text-align: center;
  font-size: 32px;
  margin-bottom: 4px;
}

.title {
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
}

.input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  transition: border-color 0.15s;
}

.input:focus {
  border-color: var(--accent, #3b82f6);
}

.error {
  font-size: 12px;
  color: #ef4444;
  text-align: center;
  min-height: 18px;
}

.btn {
  background: var(--accent, #3b82f6);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 11px;
  cursor: pointer;
  transition: opacity 0.15s;
  margin-top: 4px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  opacity: 0.88;
}
```

- [ ] **Step 2: Create Login.jsx**

```jsx
// src/components/Login/Login.jsx
import { useState } from 'react';
import styles from './Login.module.css';

export default function Login({ onAuth }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      if (res.ok) {
        onAuth();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}>🏠</div>
        <div className={styles.title}>Dashboard Domótica</div>

        <div className={styles.field}>
          <label className={styles.label}>Usuario</label>
          <input
            className={styles.input}
            type="text"
            value={user}
            onChange={e => setUser(e.target.value)}
            placeholder="admin"
            autoComplete="username"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Contraseña</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <div className={styles.error}>{error}</div>

        <button
          className={styles.btn}
          type="submit"
          disabled={loading || !user || !password}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Login/
git commit -m "feat(ui): login page styled to match dashboard dark theme"
```

---

## Task 6: Auth guard in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add auth state and guard to App.jsx**

Replace the `export default function App()` at the bottom of `src/App.jsx` with:

```jsx
export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? setAuthenticated(true) : null)
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) return null; // brief flash prevention

  if (!authenticated) {
    return <Login onAuth={() => setAuthenticated(true)} />;
  }

  return (
    <MetaProvider>
      <HubProvider>
        <CalendarProvider>
          <DashboardTabs />
          <DndProvider backend={HTML5Backend}>
            <AppInner />
          </DndProvider>
        </CalendarProvider>
      </HubProvider>
    </MetaProvider>
  );
}
```

- [ ] **Step 2: Add Login import and remove GoogleOAuthProvider**

At the top of `src/App.jsx`:
- Add: `import Login from './components/Login/Login.jsx';`
- Remove: `import { GoogleOAuthProvider } from '@react-oauth/google';`
- Remove the `DndAppWrapper` wrapper function (inline `DndProvider` directly as shown above)
- Keep `useState` and `useEffect` in the existing imports line

- [ ] **Step 3: Verify the app locally**

```bash
node --env-file=.env server/index.js &
npm run dev
```

Open `http://localhost:5173` — should redirect to Login (since `/api/me` returns 401). Enter admin / AdMin0312 — should load the dashboard.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat(auth): auth guard in App.jsx, show Login if session invalid"
```

---

## Task 7: Hub proxy — allow cloud URLs

**Files:**
- Modify: `server/hubProxy.js`

- [ ] **Step 1: Update the IP validation to allow cloud.hubitat.com**

Replace the `PRIVATE_IP_RE` check in `server/hubProxy.js`:

```js
// server/hubProxy.js
import { Router } from 'express';

const PRIVATE_IP_RE = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|127\.\d+\.\d+\.\d+|::1|localhost)$/;
const ALLOWED_CLOUD_HOSTS = new Set(['cloud.hubitat.com']);

const router = Router();

router.post('/hub-proxy', async (req, res) => {
  const { type, token, path, method = 'GET' } = req.body ?? {};
  let rawIp = (req.body?.ip || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  const host = rawIp.split(':')[0];

  if (!type || !rawIp || !path) return res.status(400).json({ error: 'Missing required fields' });

  const isPrivate = PRIVATE_IP_RE.test(host);
  const isAllowedCloud = ALLOWED_CLOUD_HOSTS.has(host);
  if (!isPrivate && !isAllowedCloud) return res.status(403).json({ error: 'Host not allowed' });

  const scheme = isAllowedCloud ? 'https' : 'http';
  let url, headers = {};

  if (type === 'hubitat') {
    url = `${scheme}://${rawIp}${path}`;
  } else if (type === 'homeassistant') {
    url = `${scheme}://${rawIp}${path}`;
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    return res.status(400).json({ error: 'Unknown hub type' });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const upstream = await fetch(url, { method, headers, signal: ctrl.signal });
    clearTimeout(timer);
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    clearTimeout(timer);
    res.status(502).json({ error: err?.message || 'Request failed' });
  }
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add server/hubProxy.js
git commit -m "feat(proxy): allow cloud.hubitat.com in addition to private LAN IPs"
```

---

## Task 8: Hub client — cloud URL fallback, remove eventsocket

**Files:**
- Replace: `src/services/hubClient.js`

- [ ] **Step 1: Replace src/services/hubClient.js**

```js
// src/services/hubClient.js
import { HUBITAT_CAP_TO_WIDGETS, HA_DOMAIN_TO_WIDGETS } from './hubMappings.js';

const SHORT_TIMEOUT_MS = 2000;  // local LAN attempts
const PROXY_TIMEOUT_MS = 8000;  // cloud proxy attempts

async function fetchWithTimeout(url, options = {}, timeoutMs = PROXY_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, ...options });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchViaProxy(hub, path, method = 'GET') {
  const res = await fetch('/api/hub-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: hub.type, ip: hub.ip, appId: hub.appId, token: hub.token, path, method }),
  });
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  return await res.json();
}

async function fetchViaCloudProxy(hub, path, method = 'GET') {
  // hub.cloudUrl is like: https://cloud.hubitat.com/api/{uid}/apps/{appId}
  // We pass the cloud host to the proxy for it to forward
  const cloudHost = 'cloud.hubitat.com';
  const res = await fetch('/api/hub-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: hub.type, ip: cloudHost, appId: hub.appId, token: hub.token, path, method }),
  });
  if (!res.ok) throw new Error(`Cloud proxy HTTP ${res.status}`);
  return await res.json();
}

// Try local LAN first, fall back to cloud Maker API
async function fetchHubitat(hub, path, method = 'GET') {
  if (hub.ip) {
    try {
      return await fetchViaProxy(hub, path, method);
    } catch { /* fall through */ }
  }
  if (hub.cloudUrl) {
    // Build path for cloud: cloudUrl already contains /api/{uid}/apps/{appId}
    const cloudPath = path; // same relative path works for cloud Maker API
    return await fetchViaCloudProxy(hub, cloudPath, method);
  }
  throw new Error('No connection available');
}

function normalizeHubitat(hubId, hubName, data) {
  return data.map(dev => {
    const caps = Array.isArray(dev.capabilities)
      ? dev.capabilities.map(c => (typeof c === 'string' ? c : c.capability))
      : [];
    const widgetTypes = [...new Set(caps.flatMap(c => HUBITAT_CAP_TO_WIDGETS[c] ?? []))];
    return {
      hubId, hubName,
      deviceId: String(dev.id),
      name: dev.label || dev.name || `Device ${dev.id}`,
      widgetTypes,
      reachable: true,
      lastSeen: Date.now(),
    };
  });
}

function normalizeHA(hubId, hubName, data) {
  return data
    .filter(e => e.entity_id)
    .map(ent => {
      const domain = ent.entity_id.split('.')[0];
      const widgetTypes = HA_DOMAIN_TO_WIDGETS[domain] ?? [];
      return {
        hubId, hubName,
        deviceId: ent.entity_id,
        name: ent.attributes?.friendly_name || ent.entity_id,
        widgetTypes,
        reachable: ent.state !== 'unavailable',
        lastSeen: Date.now(),
      };
    })
    .filter(d => d.widgetTypes.length > 0);
}

export async function fetchHubDevices(hub) {
  let raw, usedProxy = false;

  if (hub.type === 'hubitat') {
    const path = `/apps/api/${hub.appId}/devices?access_token=${hub.token}`;
    raw = await fetchHubitat(hub, path);
    usedProxy = true;
    return { devices: normalizeHubitat(hub.id, hub.name, raw), usedProxy };
  }

  if (hub.type === 'homeassistant') {
    const path = '/api/states';
    try {
      raw = await fetchViaProxy(hub, path);
      usedProxy = true;
    } catch {
      throw new Error('HA connection failed');
    }
    return { devices: normalizeHA(hub.id, hub.name, raw), usedProxy };
  }

  throw new Error(`Unknown hub type: ${hub.type}`);
}

export async function testHubConnection(hub) {
  try {
    const result = await fetchHubDevices(hub);
    return { ok: true, count: result.devices.length, usedProxy: result.usedProxy };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function readDeviceState(hub, deviceId) {
  if (hub.type !== 'hubitat') return {};
  const path = `/apps/api/${hub.appId}/devices/${deviceId}?access_token=${hub.token}`;
  const data = await fetchHubitat(hub, path);
  const state = {};
  if (Array.isArray(data?.attributes)) {
    for (const attr of data.attributes) {
      if (attr.currentValue !== null && attr.currentValue !== undefined) {
        state[attr.name] = attr.currentValue;
      }
    }
  }
  return state;
}

export async function triggerDeviceRefresh(hub, deviceId) {
  if (hub.type !== 'hubitat') return;
  const path = `/apps/api/${hub.appId}/devices/${deviceId}/refresh?access_token=${hub.token}`;
  try { await fetchHubitat(hub, path, 'GET'); } catch { /* not all devices support refresh */ }
}

export async function sendDeviceCommand(hub, deviceId, command, arg) {
  if (hub.type !== 'hubitat') return;
  const argPart = arg !== undefined && arg !== null ? `/${encodeURIComponent(arg)}` : '';
  const path = `/apps/api/${hub.appId}/devices/${deviceId}/${command}${argPart}?access_token=${hub.token}`;
  await fetchHubitat(hub, path, 'POST');
}

// Connectivity helper: check if the local hub is reachable
export async function checkLocalHubReachable(hub) {
  if (!hub?.ip) return false;
  try {
    await fetchWithTimeout(
      `/api/hub-proxy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: hub.type, ip: hub.ip, appId: hub.appId,
          token: hub.token,
          path: `/apps/api/${hub.appId}/devices?access_token=${hub.token}`,
          method: 'GET',
        }),
      },
      SHORT_TIMEOUT_MS
    );
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Update hubStore.jsx to remove eventsocket calls**

In `src/store/hubStore.jsx`, find the `useEffect` that calls `connectHubWebSocket` and `disconnectHubWebSocket` and replace it with a `useEffect` that handles incoming `DEVICE_EVENT` messages from the sync WebSocket. The sync WebSocket (in `syncStore.jsx`) already broadcasts all server messages — we just need to handle `DEVICE_EVENT` there.

Open `src/store/syncStore.jsx` and find where incoming WebSocket messages are handled. Add a case for `DEVICE_EVENT`:

Look for the `ws.onmessage` handler in `syncStore.jsx` and verify that `DEVICE_EVENT` messages are dispatched or passed to hub state. If the sync store doesn't have a way to forward to hub store, add a global event:

```js
// In syncStore.jsx ws.onmessage handler, add:
case 'DEVICE_EVENT': {
  window.dispatchEvent(new CustomEvent('hub:device-event', { detail: msg }));
  break;
}
```

Then in `hubStore.jsx`, replace the `connectHubWebSocket` useEffect with:

```js
useEffect(() => {
  const handler = (e) => {
    const { hubId, deviceId, attribute, value } = e.detail;
    updateDeviceState(hubId, deviceId, { [attribute]: value });
  };
  window.addEventListener('hub:device-event', handler);
  return () => window.removeEventListener('hub:device-event', handler);
}, [updateDeviceState]);
```

And remove the imports of `connectHubWebSocket` and `disconnectHubWebSocket` from `hubStore.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/services/hubClient.js src/store/hubStore.jsx src/store/syncStore.jsx
git commit -m "feat(hub): cloud URL fallback, replace eventsocket with webhook broadcast"
```

---

## Task 9: Add cloudUrl to hub form and store

**Files:**
- Modify: `src/store/hubStore.jsx`
- Modify: `src/components/Hubs/HubForm.jsx`

- [ ] **Step 1: Add cloudUrl to hubStore.jsx ADD_HUB and UPDATE_HUB**

In the `ADD_HUB` case of the reducer in `src/store/hubStore.jsx`, `cloudUrl` is already included because it spreads `action.hub`. No change needed in the reducer.

In `handleSave` of `HubForm.jsx`, add `cloudUrl` to `hubData`:

```js
const hubData = { type, name: name || ip, ip, appId, token, cloudUrl };
```

- [ ] **Step 2: Add cloudUrl state and input to HubForm.jsx**

Add to the state declarations at the top of `HubForm`:

```js
const [cloudUrl, setCloudUrl] = useState(editHub?.cloudUrl || '');
```

Add the input field after the ACCESS TOKEN field, inside the `{type === 'hubitat' && (...)}` block:

```jsx
<div className={styles.field}>
  <label className={styles.label}>CLOUD URL (Maker API)</label>
  <input
    className={styles.input}
    value={cloudUrl}
    onChange={e => setCloudUrl(e.target.value)}
    placeholder="https://cloud.hubitat.com/api/{uid}/apps/{appId}"
  />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Hubs/HubForm.jsx src/store/hubStore.jsx
git commit -m "feat(hubs): add cloudUrl field to hub config form"
```

---

## Task 10: Connectivity detection hook

**Files:**
- Create: `src/hooks/useConnectivity.js`

- [ ] **Step 1: Create useConnectivity.js**

```js
// src/hooks/useConnectivity.js
import { useState, useEffect, useRef } from 'react';

// mode: 'online' | 'lan-only' | 'offline'
export function useConnectivity(hub) {
  const [mode, setMode] = useState('online');
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Check internet by pinging our own server
      let hasInternet = false;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const r = await fetch('/api/me', { signal: ctrl.signal });
        clearTimeout(t);
        hasInternet = r.status !== 0; // any response means server is reachable
      } catch { hasInternet = false; }

      // Check LAN by trying a direct fetch to the local hub IP via proxy
      let hasLan = false;
      if (!hasInternet && hub?.ip) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 2000);
          const r = await fetch('/api/hub-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: hub.type, ip: hub.ip, appId: hub.appId,
              token: hub.token,
              path: `/apps/api/${hub.appId}/devices?access_token=${hub.token}`,
            }),
            signal: ctrl.signal,
          });
          clearTimeout(t);
          hasLan = r.ok;
        } catch { hasLan = false; }
      }

      if (cancelled) return;

      if (hasInternet) setMode('online');
      else if (hasLan)  setMode('lan-only');
      else              setMode('offline');

      timerRef.current = setTimeout(check, 10_000);
    }

    check();

    const onOnline  = () => check();
    const onOffline = () => check();
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [hub?.id]); // re-run if hub changes

  return mode;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useConnectivity.js
git commit -m "feat(connectivity): hook to detect online/lan-only/offline mode"
```

---

## Task 11: Offline modal

**Files:**
- Create: `src/components/Modal/OfflineModal.jsx`
- Create: `src/components/Modal/OfflineModal.module.css`

- [ ] **Step 1: Create OfflineModal.module.css**

```css
/* src/components/Modal/OfflineModal.module.css */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 8, 20, 0.82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.card {
  width: 300px;
  background: rgba(10, 18, 40, 0.92);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 18px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
  padding: 36px 28px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.icon {
  font-size: 40px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.5;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.7); }
}
```

- [ ] **Step 2: Create OfflineModal.jsx**

```jsx
// src/components/Modal/OfflineModal.jsx
import styles from './OfflineModal.module.css';

export default function OfflineModal() {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.dot} />
        <div className={styles.icon}>📡</div>
        <div className={styles.title}>Sin conexión</div>
        <div className={styles.subtitle}>
          No hay internet ni acceso local al hub.<br />
          Verifica tu red — el dashboard se restaurará automáticamente.
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Modal/OfflineModal.jsx src/components/Modal/OfflineModal.module.css
git commit -m "feat(ui): blocking offline modal when no internet and no LAN"
```

---

## Task 12: Wire up connectivity + offline modal + status chip in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Import and use in App.jsx**

Add these imports to `src/App.jsx`:
```js
import { useConnectivity } from './hooks/useConnectivity.js';
import OfflineModal from './components/Modal/OfflineModal.jsx';
```

In `AppContent` (or `AppInner`), add the connectivity hook and modal. Update `AppContent` to accept a `hub` prop, or read it from `useHub()` inside `AppContent`:

In `AppContent`, add after the existing `useEffect` blocks:

```jsx
function AppContent({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, pos, onMouseDown, onTouchStart }) {
  const { dispatch } = useDashboard();
  const { hubs } = useHub();
  const primaryHub = hubs[0] ?? null;
  const mode = useConnectivity(primaryHub);
  // ... rest of existing code ...

  return (
    <>
      {mode === 'offline' && <OfflineModal />}
      <ThemeApplier />
      <RulesEngine />
      {/* ... existing JSX ... */}
    </>
  );
}
```

- [ ] **Step 2: Add connection status chip**

Add a small chip to the dashboard. Inside `AppContent`'s return, after the `<RulesEngine />` and before the layout div:

```jsx
{mode !== 'offline' && (
  <div style={{
    position: 'fixed', bottom: 10, right: 10, zIndex: 200,
    background: 'rgba(10,18,40,0.7)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
    padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.55)',
    display: 'flex', alignItems: 'center', gap: 5, pointerEvents: 'none',
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: mode === 'online' ? '#22c55e' : '#f59e0b', display: 'inline-block' }} />
    {mode === 'online' ? 'Cloud' : 'Local'}
  </div>
)}
```

- [ ] **Step 3: Add useHub import if not already present in AppContent**

`useHub` is imported from `'./store/hubStore.jsx'` at the top of `src/App.jsx`. Verify it's there.

- [ ] **Step 4: Verify the indicator appears on the dashboard**

Start the server and open the app. A small chip at the bottom-right should read "Cloud" (green) when internet is available.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat(ui): connectivity status chip and offline modal wired to App"
```

---

## Task 13: PWA — service worker + manifest

**Files:**
- Create: `public/sw.js`
- Create: `public/manifest.json`
- Modify: `index.html`

- [ ] **Step 1: Create public/manifest.json**

```json
{
  "name": "Dashboard Domótica",
  "short_name": "Domótica",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#080f1e",
  "theme_color": "#080f1e",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "64x64",
      "type": "image/x-icon"
    }
  ]
}
```

- [ ] **Step 2: Create public/sw.js**

```js
// public/sw.js
const CACHE = 'domotica-v1';

const APP_SHELL = [
  '/',
  '/index.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never cache API calls or WebSocket upgrades
  if (url.pathname.startsWith('/api') || e.request.headers.get('upgrade') === 'websocket') {
    return;
  }

  // Cache-first for app shell assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});
```

- [ ] **Step 3: Register service worker and link manifest in index.html**

Replace `index.html` with:

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#080f1e" />
    <link rel="manifest" href="/manifest.json" />
    <title>Dashboard Domótica</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js');
        });
      }
    </script>
  </body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add public/sw.js public/manifest.json index.html
git commit -m "feat(pwa): service worker cache-first + PWA manifest"
```

---

## Task 14: Deploy config

**Files:**
- Create: `render.yaml`

- [ ] **Step 1: Create render.yaml**

```yaml
services:
  - type: web
    name: domotica-dashboard
    env: node
    buildCommand: npm install && npm run build
    startCommand: node server/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false   # set manually in Render dashboard
      - key: JWT_SECRET
        sync: false
      - key: ADMIN_USER
        sync: false
      - key: ADMIN_PASSWORD_HASH
        sync: false
```

- [ ] **Step 2: Deploy checklist**

On Render dashboard:
1. New Web Service → connect GitHub repo
2. Set environment variables:
   - `DATABASE_URL` — from Neon dashboard (Connection String)
   - `JWT_SECRET` — generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - `ADMIN_USER` — `admin`
   - `ADMIN_PASSWORD_HASH` — bcrypt hash from Task 3 Step 2
   - `NODE_ENV` — `production`
3. Deploy

On Hubitat Maker API:
1. Open Maker API app
2. Enable "Allow Access via Cloud" 
3. Copy cloud base URL → paste as **Cloud URL** in hub config
4. Set Webhook URL: `https://your-app.onrender.com/api/hub-webhook?access_token=YOUR_TOKEN`
5. Select devices to send webhook events

- [ ] **Step 3: Commit**

```bash
git add render.yaml
git commit -m "feat(deploy): Render deploy config with env var placeholders"
```

---

## Self-Review

**Spec coverage check:**
- ✅ PostgreSQL replacing SQLite (Task 2)
- ✅ Auth: login/logout/me routes, bcrypt, JWT, HTTP-only cookie 30 days (Tasks 3, 4, 5, 6)
- ✅ Hub proxy allows cloud.hubitat.com (Task 7)
- ✅ Hub client: local → cloud URL fallback (Task 8)
- ✅ Hub form: cloudUrl field (Task 9)
- ✅ Webhook endpoint for real-time device events (Task 4)
- ✅ Webhook → WebSocket broadcast → hub store update (Tasks 4, 8)
- ✅ Connectivity detection hook (Task 10)
- ✅ Blocking offline modal (Tasks 11, 12)
- ✅ Connection indicator chip (Task 12)
- ✅ PWA service worker + manifest (Task 13)
- ✅ Render deploy config (Task 14)
- ✅ Login UI styled to match dashboard (Task 5)

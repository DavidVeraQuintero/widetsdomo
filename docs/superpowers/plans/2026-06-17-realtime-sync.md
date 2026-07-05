# Real-Time Cross-Device Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize all dashboard configuration (widget positions, themes, colors, background images) across all devices on the same local network in real time via a Node.js + SQLite + WebSocket server.

**Architecture:** A minimal Express server runs on the host PC, holds all state in SQLite, and pushes changes to every connected client via WebSocket. The React frontend adds a `SyncProvider` that wraps the existing context dispatches — no widget or store internals change. When the server is unreachable, the app falls back to `localStorage` silently.

**Tech Stack:** Node.js 18+, Express, `ws`, `better-sqlite3`, `multer` (server) · React 18 + existing Context/useReducer (client)

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `server/index.js` | Express + WebSocket server entry point |
| `server/db.js` | SQLite init and all queries |
| `server/broadcast.js` | WebSocket client registry + broadcast |
| `server/routes.js` | HTTP endpoints for image upload/delete |
| `server/test/db.test.js` | node:test unit tests for db.js |
| `server/test/broadcast.test.js` | node:test unit tests for broadcast.js |
| `src/store/syncStore.jsx` | SyncProvider + useSyncStatus hook |
| `src/components/SyncIndicator/SyncIndicator.jsx` | Green/yellow/red sync status dot |
| `src/components/SyncIndicator/SyncIndicator.module.css` | Styles for indicator |

### Modified files
| File | Change |
|---|---|
| `package.json` | Add server deps + `"server"` script |
| `vite.config.js` | Add proxy for `/api` and `/uploads` → port 3001 |
| `src/config.js` | Add `SYNC_SERVER_URL` export |
| `src/store/dashboardStore.jsx` | Export `DashboardContext`; add `SET_STATE` action |
| `src/store/metaStore.jsx` | Export `MetaContext`; add `SET_META` action |
| `src/App.jsx` | Wrap `AppInner` children with `SyncProvider` |
| `src/components/Canvas/ThemePicker.jsx` | Upload images to server when connected |

---

## Task 1: Install dependencies and add server script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install server dependencies**

```bash
npm install express ws better-sqlite3 multer
```

If `better-sqlite3` fails on Windows with a build error, install build tools first:
```bash
npm install --global windows-build-tools
```
Then retry `npm install better-sqlite3`.

- [ ] **Step 2: Add server script to package.json**

Open `package.json` and replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "server": "node server/index.js"
},
```

- [ ] **Step 3: Create server directory**

```bash
mkdir server
mkdir server/test
mkdir server/uploads
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add server dependencies and script"
```

---

## Task 2: SQLite database module

**Files:**
- Create: `server/db.js`
- Create: `server/test/db.test.js`

- [ ] **Step 1: Write failing tests**

Create `server/test/db.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initDB, getAllState,
  saveDashboard, getDashboard,
  getMeta, saveMeta,
  addImage, removeImage, getImages,
} from '../db.js';

test('initDB creates tables without error', () => {
  initDB(':memory:');
});

test('saveDashboard and getDashboard round-trip', () => {
  initDB(':memory:');
  const state = { widgets: [{ id: 'w1' }], theme: { room: 'sala' } };
  saveDashboard('db-1', 'Home', JSON.stringify(state));
  const row = getDashboard('db-1');
  assert.equal(row.name, 'Home');
  assert.deepEqual(JSON.parse(row.state_json), state);
});

test('getMeta returns null before first save', () => {
  initDB(':memory:');
  assert.equal(getMeta(), null);
});

test('saveMeta and getMeta round-trip', () => {
  initDB(':memory:');
  const meta = { dashboards: [{ id: 'db-1', name: 'Home' }], activeDashboardId: 'db-1' };
  saveMeta(JSON.stringify(meta));
  const result = getMeta();
  assert.deepEqual(JSON.parse(result.value), meta);
});

test('addImage and getImages', () => {
  initDB(':memory:');
  addImage('img-1', 'photo.jpg');
  const images = getImages();
  assert.equal(images.length, 1);
  assert.equal(images[0].id, 'img-1');
  assert.equal(images[0].filename, 'photo.jpg');
});

test('removeImage deletes the row', () => {
  initDB(':memory:');
  addImage('img-1', 'photo.jpg');
  removeImage('img-1');
  assert.equal(getImages().length, 0);
});

test('getAllState returns combined state', () => {
  initDB(':memory:');
  saveDashboard('db-1', 'Home', JSON.stringify({ widgets: [] }));
  saveMeta(JSON.stringify({ activeDashboardId: 'db-1' }));
  addImage('img-1', 'x.jpg');
  const result = getAllState();
  assert.equal(result.dashboards.length, 1);
  assert.ok(result.meta);
  assert.equal(result.images.length, 1);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --test server/test/db.test.js
```

Expected: `ReferenceError` or module not found.

- [ ] **Step 3: Implement server/db.js**

Create `server/db.js`:

```js
import Database from 'better-sqlite3';

let db;

export function initDB(path = 'server/data.db') {
  db = new Database(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS dashboards (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS images (
      id         TEXT PRIMARY KEY,
      filename   TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  return db;
}

export function saveDashboard(id, name, stateJson) {
  db.prepare(
    'INSERT INTO dashboards (id, name, state_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, state_json=excluded.state_json, updated_at=excluded.updated_at'
  ).run(id, name, stateJson, Date.now());
}

export function getDashboard(id) {
  return db.prepare('SELECT * FROM dashboards WHERE id = ?').get(id) ?? null;
}

export function getAllDashboards() {
  return db.prepare('SELECT * FROM dashboards').all();
}

export function saveMeta(valueJson) {
  db.prepare(
    'INSERT INTO meta (key, value) VALUES (\'singleton\', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
  ).run(valueJson);
}

export function getMeta() {
  return db.prepare('SELECT * FROM meta WHERE key = \'singleton\'').get() ?? null;
}

export function addImage(id, filename) {
  db.prepare(
    'INSERT OR IGNORE INTO images (id, filename, created_at) VALUES (?, ?, ?)'
  ).run(id, filename, Date.now());
}

export function removeImage(id) {
  db.prepare('DELETE FROM images WHERE id = ?').run(id);
}

export function getImages() {
  return db.prepare('SELECT * FROM images').all();
}

export function getAllState() {
  const dashboards = getAllDashboards().map(row => ({
    id: row.id,
    name: row.name,
    state: JSON.parse(row.state_json),
  }));
  const metaRow = getMeta();
  const meta = metaRow ? JSON.parse(metaRow.value) : null;
  const images = getImages();
  return { dashboards, meta, images };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
node --test server/test/db.test.js
```

Expected: all 7 tests `pass`.

- [ ] **Step 5: Commit**

```bash
git add server/db.js server/test/db.test.js
git commit -m "feat: add SQLite database module with tests"
```

---

## Task 3: WebSocket broadcast module

**Files:**
- Create: `server/broadcast.js`
- Create: `server/test/broadcast.test.js`

- [ ] **Step 1: Write failing tests**

Create `server/test/broadcast.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addClient, removeClient, broadcast } from '../broadcast.js';

function makeFakeWs(readyState = 1) {
  const messages = [];
  return { readyState, send: (msg) => messages.push(msg), _messages: messages };
}

test('broadcast sends to all open clients except sender', () => {
  const ws1 = makeFakeWs(1); // OPEN
  const ws2 = makeFakeWs(1);
  const ws3 = makeFakeWs(3); // CLOSED

  addClient(ws1);
  addClient(ws2);
  addClient(ws3);

  const payload = { type: 'PATCH_DASHBOARD', ts: 1 };
  broadcast(payload, ws1);

  assert.equal(ws1._messages.length, 0); // sender excluded
  assert.equal(ws2._messages.length, 1);
  assert.deepEqual(JSON.parse(ws2._messages[0]), payload);
  assert.equal(ws3._messages.length, 0); // closed, skipped

  removeClient(ws1);
  removeClient(ws2);
  removeClient(ws3);
});

test('removeClient stops receiving broadcasts', () => {
  const ws = makeFakeWs(1);
  addClient(ws);
  removeClient(ws);
  broadcast({ type: 'TEST' }, null);
  assert.equal(ws._messages.length, 0);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --test server/test/broadcast.test.js
```

Expected: module not found error.

- [ ] **Step 3: Implement server/broadcast.js**

Create `server/broadcast.js`:

```js
const clients = new Set();

export function addClient(ws) {
  clients.add(ws);
}

export function removeClient(ws) {
  clients.delete(ws);
}

export function broadcast(payload, senderWs) {
  const msg = JSON.stringify(payload);
  for (const client of clients) {
    if (client === senderWs) continue;
    if (client.readyState !== 1) continue; // 1 = WebSocket.OPEN
    client.send(msg);
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
node --test server/test/broadcast.test.js
```

Expected: both tests `pass`.

- [ ] **Step 5: Commit**

```bash
git add server/broadcast.js server/test/broadcast.test.js
git commit -m "feat: add WebSocket broadcast module with tests"
```

---

## Task 4: Image HTTP routes

**Files:**
- Create: `server/routes.js`

- [ ] **Step 1: Create server/routes.js**

```js
import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { addImage, removeImage, getImages } from './db.js';
import { broadcast } from './broadcast.js';

const UPLOADS_DIR = path.join(import.meta.dirname, 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post('/images', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const filename = req.file.filename;
  addImage(id, filename);
  const payload = { type: 'IMAGE_ADDED', id, filename, ts: Date.now() };
  broadcast(payload, null);
  res.json({ id, filename });
});

router.delete('/images/:id', (req, res) => {
  const { id } = req.params;
  const images = getImages();
  const img = images.find(i => i.id === id);
  if (img) {
    const filePath = path.join(UPLOADS_DIR, img.filename);
    fs.unlink(filePath, () => {});
    removeImage(id);
    broadcast({ type: 'IMAGE_REMOVED', id, ts: Date.now() }, null);
  }
  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes.js
git commit -m "feat: add image upload/delete HTTP routes"
```

---

## Task 5: Main server entry point

**Files:**
- Create: `server/index.js`

- [ ] **Step 1: Create server/index.js**

```js
import express from 'express';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import { initDB, getAllState, saveDashboard, saveMeta, getImages, removeImage } from './db.js';
import { addClient, removeClient, broadcast } from './broadcast.js';
import imageRouter from './routes.js';
import fs from 'node:fs';

const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(import.meta.dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

initDB();

const app = express();
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/api', imageRouter);

// Serve React build in production
const distDir = path.join(import.meta.dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  addClient(ws);

  // Send full state to newly connected client
  const fullState = getAllState();
  ws.send(JSON.stringify({ type: 'FULL_STATE', ...fullState }));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'PATCH_DASHBOARD': {
        const { dashboardId, name, state, ts } = msg;
        if (dashboardId && state) {
          saveDashboard(dashboardId, name || dashboardId, JSON.stringify(state));
          broadcast({ type: 'PATCH_DASHBOARD', dashboardId, state, ts }, ws);
        }
        break;
      }
      case 'PATCH_META': {
        const { meta, ts } = msg;
        if (meta) {
          saveMeta(JSON.stringify(meta));
          broadcast({ type: 'PATCH_META', meta, ts }, ws);
        }
        break;
      }
      case 'SEED_STATE': {
        // First-run: client sends its localStorage state to seed the server.
        // Reject if the server already has data to avoid overwriting newer state.
        const existing = getAllDashboards();
        if (existing.length > 0) {
          ws.send(JSON.stringify({ type: 'FULL_STATE', ...getAllState() }));
          break;
        }
        const { dashboards, meta } = msg;
        if (Array.isArray(dashboards)) {
          dashboards.forEach(({ id, name, state }) => {
            saveDashboard(id, name, JSON.stringify(state));
          });
        }
        if (meta) saveMeta(JSON.stringify(meta));
        broadcast({ type: 'FULL_STATE', ...getAllState() }, ws);
        break;
      }
      case 'IMAGE_REMOVED': {
        // Client notifies of image removal (already handled via HTTP DELETE,
        // but handle WS path too for consistency)
        const { id } = msg;
        if (id) {
          const images = getImages();
          const img = images.find(i => i.id === id);
          if (img) {
            const filePath = path.join(UPLOADS_DIR, img.filename);
            fs.unlink(filePath, () => {});
            removeImage(id);
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
  console.log(`Sync server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket ready on ws://0.0.0.0:${PORT}`);
});
```

- [ ] **Step 2: Test the server manually**

```bash
npm run server
```

Expected output:
```
Sync server running on http://0.0.0.0:3001
WebSocket ready on ws://0.0.0.0:3001
```

Open `http://localhost:3001/api/images` in the browser — should return a 404 (GET not defined) or empty response, confirming Express is running. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add server/index.js
git commit -m "feat: add main sync server with WebSocket and Express"
```

---

## Task 6: Vite proxy and client config

**Files:**
- Modify: `vite.config.js`
- Modify: `src/config.js`

- [ ] **Step 1: Update vite.config.js**

Replace the full contents of `vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
})
```

- [ ] **Step 2: Update src/config.js**

Replace the full contents of `src/config.js`:

```js
export const MAX_DASHBOARDS = 10;

export const SYNC_WS_URL = import.meta.env.VITE_SYNC_URL || 'ws://localhost:3001';
export const SYNC_HTTP_URL = SYNC_WS_URL.replace(/^ws/, 'http');
```

- [ ] **Step 3: Commit**

```bash
git add vite.config.js src/config.js
git commit -m "feat: add vite proxy and sync server URL config"
```

---

## Task 7: Add SET_STATE and SET_META actions to existing stores

**Files:**
- Modify: `src/store/dashboardStore.jsx`
- Modify: `src/store/metaStore.jsx`

- [ ] **Step 1: Export DashboardContext and add SET_STATE to dashboardStore.jsx**

In `src/store/dashboardStore.jsx`, find the line:
```js
const DashboardContext = createContext(null);
```
Change it to:
```js
export const DashboardContext = createContext(null);
```

In the same file, find the `default:` case in the reducer (line ~385):
```js
    default:
      return state;
```
Add `SET_STATE` just before `default:`:
```js
    case 'SET_STATE': {
      persist(action.payload, storageKey);
      return action.payload;
    }
    default:
      return state;
```

- [ ] **Step 2: Export MetaContext and add SET_META to metaStore.jsx**

In `src/store/metaStore.jsx`, find:
```js
const MetaContext = createContext(null);
```
Change it to:
```js
export const MetaContext = createContext(null);
```

In the `metaReducer`, find the `default:` case:
```js
    default:
      return state;
```
Add `SET_META` just before it:
```js
    case 'SET_META': {
      persistMeta(action.payload);
      return action.payload;
    }
    default:
      return state;
```

- [ ] **Step 3: Verify the app still starts**

```bash
npm run dev
```

Open `http://localhost:5174`. Dashboard should load normally. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/store/dashboardStore.jsx src/store/metaStore.jsx
git commit -m "feat: export contexts and add SET_STATE/SET_META actions"
```

---

## Task 8: SyncProvider

**Files:**
- Create: `src/store/syncStore.jsx`

- [ ] **Step 1: Create src/store/syncStore.jsx**

```jsx
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { DashboardContext } from './dashboardStore.jsx';
import { MetaContext } from './metaStore.jsx';
import { SYNC_WS_URL, SYNC_HTTP_URL } from '../config.js';

const SyncStatusContext = createContext({ status: 'offline', httpUrl: SYNC_HTTP_URL });

export function useSyncStatus() {
  return useContext(SyncStatusContext);
}

export function SyncProvider({ children }) {
  const dashCtx = useContext(DashboardContext);
  const metaCtx = useContext(MetaContext);

  const wsRef = useRef(null);
  const [status, setStatus] = useState('offline');
  const dashPendingRemote = useRef(false);
  const metaPendingRemote = useRef(false);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);
  const serverHasData = useRef(false); // true once server sends non-empty FULL_STATE

  // --- WebSocket lifecycle ---

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(SYNC_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnectDelay.current = 1000;
    };

    ws.onclose = () => {
      setStatus('offline');
      wsRef.current = null;
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(delay * 2, 30000);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      handleIncoming(msg);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // --- Incoming message handler ---

  function handleIncoming(msg) {
    switch (msg.type) {
      case 'FULL_STATE': {
        const { dashboards, meta, images } = msg;
        if (dashboards?.length > 0 || meta) serverHasData.current = true;

        // Write all dashboard states to localStorage so DashboardProvider
        // remounts with fresh data if the active dashboard changes
        if (Array.isArray(dashboards)) {
          dashboards.forEach(({ id, state }) => {
            if (state) {
              localStorage.setItem(`domotica-dashboard-${id}`, JSON.stringify(state));
            }
          });
        }

        // Update current dashboard state
        if (Array.isArray(dashboards)) {
          const activeDash = dashboards.find(
            d => d.id === metaCtx.state.activeDashboardId
          );
          if (activeDash?.state) {
            dashPendingRemote.current = true;
            dashCtx.dispatch({ type: 'SET_STATE', payload: activeDash.state });
          }
        }

        // Update meta (may cause DashboardProvider remount via key change in App.jsx;
        // that's fine — it will load fresh data from localStorage we just wrote above)
        if (meta) {
          metaPendingRemote.current = true;
          metaCtx.dispatch({ type: 'SET_META', payload: meta });
        }
        break;
      }

      case 'PATCH_DASHBOARD': {
        const { dashboardId, state } = msg;
        if (dashboardId === metaCtx.state.activeDashboardId && state) {
          dashPendingRemote.current = true;
          dashCtx.dispatch({ type: 'SET_STATE', payload: state });
        } else if (state) {
          // Update localStorage for inactive dashboard so it loads correctly on switch
          localStorage.setItem(`domotica-dashboard-${dashboardId}`, JSON.stringify(state));
        }
        break;
      }

      case 'PATCH_META': {
        if (msg.meta) {
          metaPendingRemote.current = true;
          metaCtx.dispatch({ type: 'SET_META', payload: msg.meta });
        }
        break;
      }

      case 'IMAGE_ADDED':
      case 'IMAGE_REMOVED':
        // Images are referenced by URL; no extra client action needed.
        // Theme state sync (via PATCH_DASHBOARD) handles customBackgrounds list.
        break;
    }
  }

  // --- Outgoing sync effects ---

  const send = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  useEffect(() => {
    if (dashPendingRemote.current) {
      dashPendingRemote.current = false;
      return;
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    setStatus('syncing');
    send({
      type: 'PATCH_DASHBOARD',
      dashboardId: metaCtx.state.activeDashboardId,
      name: metaCtx.state.dashboards.find(d => d.id === metaCtx.state.activeDashboardId)?.name,
      state: dashCtx.state,
      ts: Date.now(),
    });
    setTimeout(() => setStatus('connected'), 500);
  }, [dashCtx.state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (metaPendingRemote.current) {
      metaPendingRemote.current = false;
      return;
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    send({ type: 'PATCH_META', meta: metaCtx.state, ts: Date.now() });
  }, [metaCtx.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- First-run migration: seed server if it has no data ---
  // Waits 300ms after connect to allow FULL_STATE to arrive and set serverHasData.
  // Only seeds if server sent an empty FULL_STATE (fresh install or wiped server).

  useEffect(() => {
    if (status !== 'connected') return;

    const timer = setTimeout(() => {
      if (serverHasData.current) return; // server already has data, skip seed
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      send({
        type: 'SEED_STATE',
        dashboards: metaCtx.state.dashboards.map(d => ({
          id: d.id,
          name: d.name,
          state: (() => {
            try {
              return JSON.parse(
                localStorage.getItem(`domotica-dashboard-${d.id}`) || 'null'
              );
            } catch { return null; }
          })(),
        })).filter(d => d.state !== null),
        meta: metaCtx.state,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Patch contexts ---

  const syncedDashValue = { state: dashCtx.state, dispatch: dashCtx.dispatch };
  const syncedMetaValue = { state: metaCtx.state, dispatch: metaCtx.dispatch };

  return (
    <DashboardContext.Provider value={syncedDashValue}>
      <MetaContext.Provider value={syncedMetaValue}>
        <SyncStatusContext.Provider value={{ status, httpUrl: SYNC_HTTP_URL }}>
          {children}
        </SyncStatusContext.Provider>
      </MetaContext.Provider>
    </DashboardContext.Provider>
  );
}
```

> Note: `syncedDashValue` and `syncedMetaValue` pass through the same `dispatch` for now. The outgoing sync is driven by `useEffect` on state changes, not by wrapping dispatch. This avoids state-timing issues with `useReducer`.

- [ ] **Step 2: Commit**

```bash
git add src/store/syncStore.jsx
git commit -m "feat: add SyncProvider with WebSocket sync and first-run migration"
```

---

## Task 9: Wire SyncProvider into App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Import SyncProvider in App.jsx**

At the top of `src/App.jsx`, add after the existing imports:

```jsx
import { SyncProvider } from './store/syncStore.jsx';
```

- [ ] **Step 2: Wrap AppContent with SyncProvider in AppInner**

In `src/App.jsx`, find `AppInner`:

```jsx
function AppInner() {
  const { state: metaState } = useMeta();
  const { activeDashboardId } = metaState;
  const storageKey = `domotica-dashboard-${activeDashboardId}`;

  return (
    <DashboardProvider key={activeDashboardId} storageKey={storageKey}>
      <AppContent />
    </DashboardProvider>
  );
}
```

Replace it with:

```jsx
function AppInner() {
  const { state: metaState } = useMeta();
  const { activeDashboardId } = metaState;
  const storageKey = `domotica-dashboard-${activeDashboardId}`;

  return (
    <DashboardProvider key={activeDashboardId} storageKey={storageKey}>
      <SyncProvider>
        <AppContent />
      </SyncProvider>
    </DashboardProvider>
  );
}
```

- [ ] **Step 3: Verify both dev server and sync server work together**

In one terminal:
```bash
npm run server
```

In another terminal:
```bash
npm run dev
```

Open `http://localhost:5174`. The browser console should NOT show WebSocket errors. Check DevTools → Network → WS tab — there should be a WebSocket connection to `localhost:3001`. Open two browser windows/tabs and move a widget in one — it should appear in the other within ~100ms.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: integrate SyncProvider into app tree"
```

---

## Task 10: Sync status indicator

**Files:**
- Create: `src/components/SyncIndicator/SyncIndicator.jsx`
- Create: `src/components/SyncIndicator/SyncIndicator.module.css`
- Modify: `src/components/Canvas/Canvas.jsx` (add indicator)

- [ ] **Step 1: Create SyncIndicator.module.css**

```css
.indicator {
  position: fixed;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 20px;
  padding: 4px 10px 4px 6px;
  font-size: 11px;
  color: #e5e7eb;
  z-index: 999;
  pointer-events: none;
  backdrop-filter: blur(4px);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.connected { background: #22c55e; }
.dot.syncing   { background: #f59e0b; animation: pulse 0.8s infinite; }
.dot.offline   { background: #ef4444; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
```

- [ ] **Step 2: Create SyncIndicator.jsx**

```jsx
import { useSyncStatus } from '../../store/syncStore.jsx';
import styles from './SyncIndicator.module.css';

const LABELS = {
  connected: 'Sincronizado',
  syncing:   'Sincronizando...',
  offline:   'Sin conexión',
};

export default function SyncIndicator() {
  const { status } = useSyncStatus();
  return (
    <div className={styles.indicator}>
      <span className={`${styles.dot} ${styles[status]}`} />
      {LABELS[status] ?? 'Sin conexión'}
    </div>
  );
}
```

- [ ] **Step 3: Add SyncIndicator to Canvas.jsx**

Open `src/components/Canvas/Canvas.jsx`. Find the return statement's root element and add `<SyncIndicator />` at the end, just before the closing tag:

```jsx
import SyncIndicator from '../SyncIndicator/SyncIndicator.jsx';

// In the return JSX, before the last closing tag:
<SyncIndicator />
```

- [ ] **Step 4: Verify the indicator appears**

With both servers running (`npm run server` + `npm run dev`), open `http://localhost:5174`. A green dot labeled "Sincronizado" should appear in the bottom-right corner. Stop the sync server — the dot should turn red within ~5 seconds.

- [ ] **Step 5: Commit**

```bash
git add src/components/SyncIndicator/ src/components/Canvas/Canvas.jsx
git commit -m "feat: add sync status indicator (green/yellow/red dot)"
```

---

## Task 11: Image sync via server uploads

**Files:**
- Modify: `src/components/Canvas/ThemePicker.jsx`

- [ ] **Step 1: Update handleFile to upload to server when connected**

In `src/components/Canvas/ThemePicker.jsx`, add the import for `useSyncStatus` at the top:

```jsx
import { useSyncStatus } from '../../store/syncStore.jsx';
```

Add the hook call inside the `ThemePicker` component, after the existing hooks:

```jsx
const { status, httpUrl } = useSyncStatus();
```

Replace the existing `handleFile` function:

```jsx
async function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';
  const blob = await resizeImage(file);
  const id = `custom-${Date.now()}`;

  if (status === 'connected' || status === 'syncing') {
    // Upload to sync server
    const formData = new FormData();
    formData.append('image', blob, file.name);
    formData.append('id', id);
    const res = await fetch(`${httpUrl}/api/images`, { method: 'POST', body: formData });
    if (!res.ok) { alert('Error al subir la imagen al servidor de sync.'); return; }
    const { filename } = await res.json();
    const url = `${httpUrl}/uploads/${filename}`;
    dispatch({ type: 'ADD_CUSTOM_BG', payload: { id, label: file.name, url } });
  } else {
    // Offline fallback: save to IndexedDB as before
    await saveImage(id, blob);
    dispatch({ type: 'ADD_CUSTOM_BG', payload: { id, label: file.name } });
  }
  set({ room: id });
}
```

Replace the existing `handleDelete` function:

```jsx
async function handleDelete(id) {
  const bg = theme.customBackgrounds.find(b => b.id === id);
  if (bg?.url) {
    await fetch(`${httpUrl}/api/images/${id}`, { method: 'DELETE' });
  } else {
    await deleteImage(id);
  }
  dispatch({ type: 'REMOVE_CUSTOM_BG', id });
}
```

- [ ] **Step 2: Update CustomChip to support server URLs**

Replace the existing `CustomChip` component:

```jsx
function CustomChip({ bg, isSelected, onSelect, onDelete }) {
  const [thumbUrl, setThumbUrl] = useState(bg.url || null);

  useEffect(() => {
    if (bg.url) return; // server image: URL already set
    let url;
    loadImage(bg.id).then(u => {
      url = u;
      setThumbUrl(u);
    });
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [bg.id, bg.url]);

  return (
    <button
      className={`${styles.roomBtn} ${styles.customChip} ${isSelected ? styles.sel : ''}`}
      style={thumbUrl ? { backgroundImage: `url(${thumbUrl})` } : undefined}
      onClick={() => onSelect(bg.id)}
      title={bg.label}
    >
      <span
        className={styles.deleteBtn}
        role="button"
        onClick={e => { e.stopPropagation(); onDelete(bg.id); }}
      >✕</span>
    </button>
  );
}
```

- [ ] **Step 3: Update ThemeApplier to support server image URLs**

Replace the full contents of `src/components/ThemeApplier.jsx`:

```jsx
import { useEffect, useRef } from 'react';
import { useDashboard } from '../store/dashboardStore.jsx';
import { loadImage } from '../store/imageDB.js';

export default function ThemeApplier() {
  const { state } = useDashboard();
  const { theme } = state;
  const objUrlRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;

    if (theme.room.startsWith('custom-')) {
      delete root.dataset.room;
      const customBg = theme.customBackgrounds?.find(bg => bg.id === theme.room);
      if (customBg?.url) {
        // Server image: use URL directly, no IndexedDB blob needed
        if (objUrlRef.current) { URL.revokeObjectURL(objUrlRef.current); objUrlRef.current = null; }
        root.style.setProperty('--bg-photo', `url(${customBg.url})`);
      } else {
        // IndexedDB fallback (offline-uploaded images)
        loadImage(theme.room).then(url => {
          if (!url) return;
          if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
          objUrlRef.current = url;
          root.style.setProperty('--bg-photo', `url(${url})`);
        });
      }
    } else {
      if (objUrlRef.current) {
        URL.revokeObjectURL(objUrlRef.current);
        objUrlRef.current = null;
      }
      root.style.removeProperty('--bg-photo');
      root.dataset.room = theme.room;
    }

    root.dataset.palette = theme.palette;
    root.dataset.time = theme.time;
  }, [theme.room, theme.palette, theme.time, theme.customBackgrounds]);

  useEffect(() => {
    return () => {
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    };
  }, []);

  return null;
}
```

- [ ] **Step 4: Test image sync**

With both servers running:
1. Open `http://localhost:5174` in two browser windows
2. In window A, go to Temas → upload a background image
3. In window B, the image should appear as a selectable background within ~1 second

- [ ] **Step 5: Commit**

```bash
git add src/components/Canvas/ThemePicker.jsx src/components/ThemeApplier.jsx
git commit -m "feat: sync background images via server uploads"
```

---

## Task 12: Verify full end-to-end sync

- [ ] **Step 1: Find host PC IP on local network**

```bash
ipconfig
```

Look for the IPv4 address under the WiFi adapter, e.g. `192.168.1.42`.

- [ ] **Step 2: Build the React app**

```bash
npm run build
```

- [ ] **Step 3: Start the sync server (serves both API and built frontend)**

```bash
npm run server
```

- [ ] **Step 4: Open from a second device on the same WiFi**

On the tablet or phone, navigate to: `http://192.168.1.42:3001`

The dashboard should load. Changes on the PC should appear on the tablet in real time and vice versa.

- [ ] **Step 5: Verify sync categories**

Test each scenario:
- Move a widget → appears on other device
- Change theme palette/time/room → appears on other device
- Add a background photo → appears on other device
- Create a new dashboard → appears on other device
- Delete a widget → disappears on other device

- [ ] **Step 6: Verify offline fallback**

Stop `npm run server`. The app should continue working locally. The red dot indicator should appear. Restart the server — green dot should return and the app should re-sync.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete real-time cross-device dashboard sync"
```

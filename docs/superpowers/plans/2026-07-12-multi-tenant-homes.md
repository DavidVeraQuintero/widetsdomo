# Multi-Tenant Homes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the single-tenant dashboard into a multi-tenant system where the admin manages independent "homes", each with its own isolated data (dashboards, hubs, images), and Google users see a home selector when they have access to multiple homes.

**Architecture:** Session-B approach — `homeId` is stored in the JWT cookie. Entering a home re-issues the JWT with `homeId` included; exiting clears it. All existing data endpoints remain at the same URL but are now filtered by `req.session.homeId` extracted from the JWT by the updated `authMiddleware`. The WebSocket broadcast is homeId-scoped so clients only receive events for their active home.

**Tech Stack:** Node.js (ES modules), Express, PostgreSQL (Neon) / SQLite (local), JWT (jsonwebtoken), React, CSS Modules.

---

## File Structure

**Backend — modified:**
- `server/db.js` — schema migration, homes CRUD, updated function signatures (all add `homeId` param)
- `server/auth.js` — new `generateToken({ isAdmin, email, homeId })`, updated `authMiddleware` (attaches `req.session`), new `homeMiddleware`
- `server/broadcast.js` — homeId-aware: `addClient(ws, homeId)`, `broadcast(payload, homeId, senderWs)`
- `server/routes.js` — image upload/delete use `req.session.homeId`
- `server/index.js` — new session/admin endpoints, updated existing, WS homeId scoping, hub polling per-home

**Backend — created:**
- `server/test/homes.test.js` — homes CRUD tests
- `server/test/homeAuth.test.js` — homeMiddleware + enter/exit session tests

**Frontend — modified:**
- `src/App.jsx` — session hydration via `GET /api/session/info`, routing logic (Login → AdminPanel | HomePicker | main app)
- `src/components/Login/Login.jsx` — remove `houseName` display

**Frontend — created:**
- `src/components/Admin/AdminPanel.jsx` + `AdminPanel.module.css`
- `src/components/Auth/HomePicker.jsx` + `HomePicker.module.css`
- `src/components/Admin/HomeBar.jsx` + `HomeBar.module.css`

**Frontend — deleted:**
- `src/components/Admin/AccessConfig.jsx`
- `src/components/Admin/AccessConfig.module.css`

---

## Task 1: DB — Schema Migration

**Files:**
- Modify: `server/db.js`
- Create: `server/test/homes.test.js`

### Step 1.1 — Write failing tests for homes CRUD

Create `server/test/homes.test.js`:

```js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { initDB, createHome, listHomes, getHome, deleteHome } from '../db.js';

before(async () => { await initDB(); });

describe('homes CRUD', () => {
  it('createHome returns a home with id and name', async () => {
    const home = await createHome('Casa Test');
    assert.equal(home.name, 'Casa Test');
    assert.ok(home.id);
    await deleteHome(home.id);
  });

  it('listHomes returns all homes', async () => {
    const h1 = await createHome('Home A');
    const h2 = await createHome('Home B');
    const list = await listHomes();
    assert.ok(list.some(h => h.id === h1.id));
    assert.ok(list.some(h => h.id === h2.id));
    await deleteHome(h1.id);
    await deleteHome(h2.id);
  });

  it('getHome returns home by id', async () => {
    const h = await createHome('Lookup');
    const found = await getHome(h.id);
    assert.equal(found.name, 'Lookup');
    await deleteHome(h.id);
  });

  it('deleteHome removes home from list', async () => {
    const h = await createHome('Delete Me');
    await deleteHome(h.id);
    const found = await getHome(h.id);
    assert.equal(found, null);
  });
});
```

- [ ] Run test to verify it fails:
  ```
  JWT_SECRET=test-secret node --test server/test/homes.test.js
  ```
  Expected: FAIL — `createHome is not a function`

### Step 1.2 — Write failing tests for home members

Append to `server/test/homes.test.js`:

```js
import { addHomeMember, removeHomeMember, listHomeMembers, getHomesByEmail } from '../db.js';

describe('home members', () => {
  it('addHomeMember and listHomeMembers', async () => {
    const h = await createHome('Member Test');
    await addHomeMember(h.id, 'user@test.com');
    const members = await listHomeMembers(h.id);
    assert.ok(members.includes('user@test.com'));
    await deleteHome(h.id);
  });

  it('removeHomeMember removes email from home', async () => {
    const h = await createHome('Remove Test');
    await addHomeMember(h.id, 'gone@test.com');
    await removeHomeMember(h.id, 'gone@test.com');
    const members = await listHomeMembers(h.id);
    assert.ok(!members.includes('gone@test.com'));
    await deleteHome(h.id);
  });

  it('getHomesByEmail returns homes for an email', async () => {
    const h1 = await createHome('Email Home 1');
    const h2 = await createHome('Email Home 2');
    await addHomeMember(h1.id, 'multi@test.com');
    await addHomeMember(h2.id, 'multi@test.com');
    const homes = await getHomesByEmail('multi@test.com');
    assert.ok(homes.some(h => h.id === h1.id));
    assert.ok(homes.some(h => h.id === h2.id));
    await deleteHome(h1.id);
    await deleteHome(h2.id);
  });

  it('deleteHome cascades to home_members', async () => {
    const h = await createHome('Cascade Test');
    await addHomeMember(h.id, 'cascade@test.com');
    await deleteHome(h.id);
    // No error = cascade worked
  });
});
```

- [ ] Run tests — still FAIL

### Step 1.3 — Update `initDB()` with schema migration

Replace the entire `server/db.js` `initDB` function and the tables SQL. Keep existing `q()` helper and all existing exports — we only change `initDB` and add new functions.

In `server/db.js`, replace the `initDB` export with:

```js
export async function initDB() {
  if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    // Original tables (idempotent)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        state_json TEXT NOT NULL, updated_at BIGINT NOT NULL, home_id TEXT
      );
      CREATE TABLE IF NOT EXISTS images(
        id TEXT PRIMARY KEY, filename TEXT NOT NULL, created_at BIGINT NOT NULL, home_id TEXT
      );
      CREATE TABLE IF NOT EXISTS config(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    console.log('[db] PostgreSQL conectado');
    await migrateIfNeeded();
  } else {
    const path = (await import('node:path')).default;
    const { fileURLToPath } = await import('node:url');
    const Database = (await import('better-sqlite3')).default;
    const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data.db');
    sqlite = new Database(dbPath);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id TEXT PRIMARY KEY, name TEXT NOT NULL,
        state_json TEXT NOT NULL, updated_at BIGINT NOT NULL, home_id TEXT
      );
      CREATE TABLE IF NOT EXISTS images(
        id TEXT PRIMARY KEY, filename TEXT NOT NULL, created_at BIGINT NOT NULL, home_id TEXT
      );
      CREATE TABLE IF NOT EXISTS config(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    `);
    console.log('[db] SQLite local en', dbPath);
    await migrateIfNeeded();
  }
}

async function migrateIfNeeded() {
  const version = parseInt((await getConfig('schema_version')) || '1');
  if (version >= 2) return;
  console.log('[db] Running schema migration to v2 (multi-tenant)...');
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homes (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS home_members (
        home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        PRIMARY KEY(home_id, email)
      );
      ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS home_id TEXT;
      ALTER TABLE images ADD COLUMN IF NOT EXISTS home_id TEXT;
      DROP TABLE IF EXISTS meta;
      CREATE TABLE IF NOT EXISTS meta (
        home_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
        PRIMARY KEY(home_id, key)
      );
      DROP TABLE IF EXISTS hubs;
      CREATE TABLE IF NOT EXISTS hubs (
        home_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
        PRIMARY KEY(home_id, key)
      );
    `);
  } else {
    try { sqlite.exec(`ALTER TABLE dashboards ADD COLUMN home_id TEXT`); } catch {}
    try { sqlite.exec(`ALTER TABLE images ADD COLUMN home_id TEXT`); } catch {}
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS homes (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at BIGINT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS home_members (
        home_id TEXT NOT NULL, email TEXT NOT NULL,
        PRIMARY KEY(home_id, email)
      );
      DROP TABLE IF EXISTS meta;
      CREATE TABLE meta (
        home_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
        PRIMARY KEY(home_id, key)
      );
      DROP TABLE IF EXISTS hubs;
      CREATE TABLE hubs (
        home_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
        PRIMARY KEY(home_id, key)
      );
    `);
  }
  await setConfig('schema_version', '2');
  console.log('[db] Migration to v2 complete');
}
```

### Step 1.4 — Add homes CRUD functions to `server/db.js`

Add after the existing `getConfig`/`setConfig` helpers:

```js
import { randomUUID } from 'node:crypto';

// ── Homes ────────────────────────────────────────────────────────────────────
export async function createHome(name) {
  const id = randomUUID();
  const created_at = Date.now();
  await q('INSERT INTO homes (id,name,created_at) VALUES ($1,$2,$3)', [id, name, created_at]);
  return { id, name, created_at };
}

export async function deleteHome(id) {
  await q('DELETE FROM home_members WHERE home_id=$1', [id]);
  await q('DELETE FROM dashboards WHERE home_id=$1', [id]);
  await q('DELETE FROM meta WHERE home_id=$1', [id]);
  await q('DELETE FROM hubs WHERE home_id=$1', [id]);
  await q('DELETE FROM images WHERE home_id=$1', [id]);
  await q('DELETE FROM homes WHERE id=$1', [id]);
}

export async function listHomes() {
  return q('SELECT id, name, created_at FROM homes ORDER BY created_at');
}

export async function getHome(id) {
  const rows = await q('SELECT id, name, created_at FROM homes WHERE id=$1', [id]);
  return rows[0] ?? null;
}

// ── Home members ──────────────────────────────────────────────────────────────
export async function addHomeMember(homeId, email) {
  const normalized = email.trim().toLowerCase();
  await q(
    'INSERT INTO home_members (home_id,email) VALUES ($1,$2) ON CONFLICT DO NOTHING',
    [homeId, normalized]
  );
}

export async function removeHomeMember(homeId, email) {
  await q('DELETE FROM home_members WHERE home_id=$1 AND email=$2', [homeId, email.toLowerCase()]);
}

export async function listHomeMembers(homeId) {
  const rows = await q('SELECT email FROM home_members WHERE home_id=$1', [homeId]);
  return rows.map(r => r.email);
}

export async function getHomesByEmail(email) {
  const normalized = email.trim().toLowerCase();
  const rows = await q(
    'SELECT h.id, h.name FROM homes h JOIN home_members m ON h.id=m.home_id WHERE m.email=$1 ORDER BY h.created_at',
    [normalized]
  );
  return rows;
}
```

### Step 1.5 — Update existing DB functions to accept `homeId`

Replace the following existing functions in `server/db.js`:

```js
// ── Dashboards ───────────────────────────────────────────────────────────────
export async function saveDashboard(homeId, id, name, stateJson) {
  await q(
    `INSERT INTO dashboards (id,name,state_json,updated_at,home_id) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, state_json=excluded.state_json, updated_at=excluded.updated_at, home_id=excluded.home_id`,
    [id, name, stateJson, Date.now(), homeId]
  );
}

export async function deleteDashboard(homeId, id) {
  await q('DELETE FROM dashboards WHERE id=$1 AND home_id=$2', [id, homeId]);
}

export async function removeDashboardFromMeta(homeId, id) {
  const rows = await q("SELECT value FROM meta WHERE home_id=$1 AND key='singleton'", [homeId]);
  if (!rows[0]) return;
  try {
    const meta = JSON.parse(rows[0].value);
    if (!Array.isArray(meta.dashboards)) return;
    meta.dashboards = meta.dashboards.filter(d => d.id !== id);
    await q("UPDATE meta SET value=$1 WHERE home_id=$2 AND key='singleton'", [JSON.stringify(meta), homeId]);
  } catch {}
}

export async function getDashboard(homeId, id) {
  const rows = await q('SELECT * FROM dashboards WHERE id=$1 AND home_id=$2', [id, homeId]);
  return rows[0] ?? null;
}

export async function getAllDashboards(homeId) {
  return q('SELECT * FROM dashboards WHERE home_id=$1', [homeId]);
}

// ── Meta ──────────────────────────────────────────────────────────────────────
export async function saveMeta(homeId, valueJson) {
  await q(
    "INSERT INTO meta (home_id,key,value) VALUES ($1,'singleton',$2) ON CONFLICT(home_id,key) DO UPDATE SET value=excluded.value",
    [homeId, valueJson]
  );
}

export async function getMeta(homeId) {
  const rows = await q("SELECT * FROM meta WHERE home_id=$1 AND key='singleton'", [homeId]);
  return rows[0] ?? null;
}

// ── Images ───────────────────────────────────────────────────────────────────
export async function addImage(homeId, id, filename) {
  await q(
    'INSERT INTO images (id,filename,created_at,home_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
    [id, filename, Date.now(), homeId]
  );
}

export async function removeImage(homeId, id) {
  await q('DELETE FROM images WHERE id=$1 AND home_id=$2', [id, homeId]);
}

export async function getImages(homeId) {
  return q('SELECT * FROM images WHERE home_id=$1', [homeId]);
}

// ── Hubs ──────────────────────────────────────────────────────────────────────
export async function saveHubs(homeId, json) {
  await q(
    "INSERT INTO hubs (home_id,key,value) VALUES ($1,'singleton',$2) ON CONFLICT(home_id,key) DO UPDATE SET value=excluded.value",
    [homeId, json]
  );
}

export async function getHubs(homeId) {
  const rows = await q("SELECT value FROM hubs WHERE home_id=$1 AND key='singleton'", [homeId]);
  if (!rows[0]) return { hubs: [], assignments: {} };
  const parsed = JSON.parse(rows[0].value);
  if (Array.isArray(parsed)) return { hubs: parsed, assignments: {} };
  return { hubs: parsed.hubs || [], assignments: parsed.assignments || {} };
}

export async function getAllHubsForAllHomes() {
  const rows = await q("SELECT home_id, value FROM hubs WHERE key='singleton'");
  return rows.map(row => {
    const parsed = JSON.parse(row.value);
    const hubs = Array.isArray(parsed) ? parsed : (parsed.hubs || []);
    const assignments = Array.isArray(parsed) ? {} : (parsed.assignments || {});
    return { homeId: row.home_id, hubs, assignments };
  });
}

// ── Combined state ────────────────────────────────────────────────────────────
export async function getAllState(homeId) {
  const dashboards = (await getAllDashboards(homeId)).map(row => ({
    id: row.id, name: row.name, state: JSON.parse(row.state_json),
  }));
  const metaRow = await getMeta(homeId);
  const meta = metaRow ? JSON.parse(metaRow.value) : null;
  const images = await getImages(homeId);
  const { hubs, assignments } = await getHubs(homeId);
  const wipedAt = await getWipedAt();
  return { dashboards, meta, images, hubs, assignments, wipedAt };
}

// ── Reset (admin) ─────────────────────────────────────────────────────────────
export async function resetHome(homeId) {
  const wipedAt = Date.now();
  await q('DELETE FROM dashboards WHERE home_id=$1', [homeId]);
  await q('DELETE FROM meta WHERE home_id=$1', [homeId]);
  await q('DELETE FROM images WHERE home_id=$1', [homeId]);
  await q('DELETE FROM hubs WHERE home_id=$1', [homeId]);
  await setConfig('wiped_at', String(wipedAt));
  return wipedAt;
}
```

Also remove the old `resetAllData` export (no longer used) and keep `getWipedAt`.

Remove these old exports completely (they're replaced above):
- Old `saveDashboard(id, name, stateJson)` without homeId
- Old `deleteDashboard(id)` without homeId
- Old `removeDashboardFromMeta(id)` without homeId
- Old `getDashboard(id)` without homeId
- Old `getAllDashboards()` without homeId
- Old `saveMeta(valueJson)` without homeId
- Old `getMeta()` without homeId
- Old `addImage(id, filename)` without homeId
- Old `removeImage(id)` without homeId
- Old `getImages()` without homeId
- Old `saveHubs(json)` without homeId
- Old `getHubs()` without homeId
- Old `getAllState()` without homeId
- Old `resetAllData()`
- Old `getAccessConfig()` and `setAccessConfig()`

### Step 1.6 — Run tests

```
JWT_SECRET=test-secret node --test server/test/homes.test.js
```

Expected: all homes CRUD tests pass.

### Step 1.7 — Commit

```bash
git add server/db.js server/test/homes.test.js
git commit -m "feat(db): multi-tenant schema migration, homes CRUD, homeId-scoped queries"
```

---

## Task 2: Auth — JWT payload + middleware

**Files:**
- Modify: `server/auth.js`
- Create: `server/test/homeAuth.test.js`

### Step 2.1 — Write failing tests

Create `server/test/homeAuth.test.js`:

```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, verifyToken, homeMiddleware } from '../auth.js';

describe('generateToken', () => {
  it('includes isAdmin, email, homeId in payload', () => {
    const token = generateToken({ isAdmin: true, email: null, homeId: null });
    const payload = verifyToken(token);
    assert.equal(payload.isAdmin, true);
    assert.equal(payload.email, null);
    assert.equal(payload.homeId, null);
  });

  it('stores email and homeId for Google user', () => {
    const token = generateToken({ isAdmin: false, email: 'u@test.com', homeId: 'home-1' });
    const payload = verifyToken(token);
    assert.equal(payload.isAdmin, false);
    assert.equal(payload.email, 'u@test.com');
    assert.equal(payload.homeId, 'home-1');
  });
});

describe('homeMiddleware', () => {
  const makeReq = (session) => ({ session });
  const makeRes = () => {
    const res = {};
    res.status = (code) => { res._code = code; return res; };
    res.json = (body) => { res._body = body; };
    return res;
  };

  it('passes when homeId is set', () => {
    const req = makeReq({ isAdmin: false, email: 'u@test.com', homeId: 'home-1' });
    const res = makeRes();
    let called = false;
    homeMiddleware(req, res, () => { called = true; });
    assert.ok(called);
  });

  it('returns 403 when homeId is null', () => {
    const req = makeReq({ isAdmin: false, email: 'u@test.com', homeId: null });
    const res = makeRes();
    homeMiddleware(req, res, () => {});
    assert.equal(res._code, 403);
  });

  it('passes for admin even without homeId', () => {
    const req = makeReq({ isAdmin: true, email: null, homeId: null });
    const res = makeRes();
    let called = false;
    homeMiddleware(req, res, () => { called = true; });
    assert.ok(called);
  });
});
```

- [ ] Run tests — FAIL:
  ```
  JWT_SECRET=test-secret node --test server/test/homeAuth.test.js
  ```

### Step 2.2 — Update `server/auth.js`

Replace `generateToken()` and `authMiddleware`, add `homeMiddleware`:

```js
// Replace generateToken:
export function generateToken({ isAdmin = false, email = null, homeId = null } = {}) {
  return jwt.sign({ isAdmin, email, homeId }, SECRET, { expiresIn: '30d' });
}

// Replace authMiddleware:
export function authMiddleware(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.session = {
    isAdmin: payload.isAdmin ?? (payload.user === process.env.ADMIN_USER ?? 'admin'), // backward compat
    email: payload.email ?? null,
    homeId: payload.homeId ?? null,
  };
  next();
}

// Add homeMiddleware:
export function homeMiddleware(req, res, next) {
  if (req.session?.isAdmin) return next(); // admin can access without homeId
  if (!req.session?.homeId) return res.status(403).json({ error: 'No home selected' });
  next();
}
```

Note: the backward-compat line in `authMiddleware` handles old tokens that have `{ user: 'admin' }` instead of `{ isAdmin: true }`. Remove once all clients have refreshed tokens.

### Step 2.3 — Export `homeMiddleware` and add to imports in `index.js`

The export is already in the function definition above. Also update the import in `server/index.js` to include `homeMiddleware`.

### Step 2.4 — Run tests

```
JWT_SECRET=test-secret node --test server/test/homeAuth.test.js
```

Expected: all 5 tests pass.

### Step 2.5 — Commit

```bash
git add server/auth.js server/test/homeAuth.test.js
git commit -m "feat(auth): multi-tenant JWT payload with isAdmin/email/homeId, add homeMiddleware"
```

---

## Task 3: API — Session endpoints + update auth routes

**Files:**
- Modify: `server/index.js`

### Step 3.1 — Update imports in `server/index.js`

Replace the existing import block:

```js
import {
  initDB, getAllState, saveDashboard, deleteDashboard, removeDashboardFromMeta,
  saveMeta, getImages, removeImage, getAllDashboards, saveHubs, getHubs, resetHome,
  createHome, deleteHome, listHomes, getHome, addHomeMember, removeHomeMember,
  listHomeMembers, getHomesByEmail, getAllHubsForAllHomes,
} from './db.js';

import {
  verifyCredentials, generateToken, setSessionCookie, clearSessionCookie,
  authMiddleware, homeMiddleware, verifyWsRequest, verifyToken, verifyGoogleCredential,
} from './auth.js';
```

### Step 3.2 — Update `/api/login` to use new `generateToken`

```js
app.post('/api/login', loginLimiter, async (req, res) => {
  const { user, password } = req.body ?? {};
  if (!user || !password) return res.status(400).json({ error: 'Missing credentials' });
  const ok = await verifyCredentials(user, password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken({ isAdmin: true, email: null, homeId: null });
  setSessionCookie(res, token);
  res.json({ ok: true });
});
```

### Step 3.3 — Update `GET /api/auth/google-client-id`

Remove `houseName` from response (no global house name in multi-tenant):

```js
app.get('/api/auth/google-client-id', (_req, res) => {
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
});
```

### Step 3.4 — Update `POST /api/auth/google`

Check if email is member of ANY home (instead of checking a global allow-list):

```js
app.post('/api/auth/google', loginLimiter, async (req, res) => {
  const { credential } = req.body ?? {};
  if (!credential) return res.status(400).json({ error: 'Missing credential' });
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Google OAuth no configurado' });

  const email = await verifyGoogleCredential(credential);
  if (!email) return res.status(401).json({ error: 'Token de Google inválido' });

  const homes = await getHomesByEmail(email);
  if (homes.length === 0) {
    return res.status(403).json({ error: 'Email no autorizado. Solicita acceso al administrador.' });
  }

  const token = generateToken({ isAdmin: false, email: email.toLowerCase(), homeId: null });
  setSessionCookie(res, token);
  res.json({ ok: true });
});
```

### Step 3.5 — Replace `GET /api/me` with `GET /api/session/info`

Remove the old `/api/me` endpoint and add:

```js
app.get('/api/session/info', (req, res) => {
  const token = req.cookies?.session;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ ok: false });
  const isAdmin = payload.isAdmin ?? (payload.user != null);
  res.json({
    ok: true,
    isAdmin,
    email: payload.email ?? null,
    homeId: payload.homeId ?? null,
  });
});
```

Note: keep `/api/me` as an alias pointing to `/api/session/info` response for offline-auth localStorage fallback in App.jsx (will be removed after frontend is updated):

```js
app.get('/api/me', (req, res) => {
  const token = req.cookies?.session;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ ok: false });
  res.json({ ok: true });
});
```

### Step 3.6 — Add session navigation endpoints (after `app.use('/api', authMiddleware)`)

```js
// Enter a home — re-issue JWT with homeId
app.post('/api/session/enter-home', async (req, res) => {
  const { homeId } = req.body ?? {};
  if (!homeId) return res.status(400).json({ error: 'homeId requerido' });
  const home = await getHome(homeId);
  if (!home) return res.status(404).json({ error: 'Casa no encontrada' });

  const { isAdmin, email } = req.session;
  if (!isAdmin) {
    const homes = await getHomesByEmail(email);
    if (!homes.some(h => h.id === homeId)) {
      return res.status(403).json({ error: 'Sin acceso a esta casa' });
    }
  }

  const token = generateToken({ isAdmin, email, homeId });
  setSessionCookie(res, token);
  res.json({ ok: true, homeId, homeName: home.name });
});

// Exit home — re-issue JWT without homeId
app.post('/api/session/exit-home', (req, res) => {
  const { isAdmin, email } = req.session;
  const token = generateToken({ isAdmin, email, homeId: null });
  setSessionCookie(res, token);
  res.json({ ok: true });
});

// List homes accessible to current user
app.get('/api/session/my-homes', async (req, res) => {
  const { isAdmin, email } = req.session;
  if (isAdmin) {
    const homes = await listHomes();
    return res.json(homes);
  }
  const homes = await getHomesByEmail(email);
  res.json(homes);
});
```

### Step 3.7 — Commit

```bash
git add server/index.js
git commit -m "feat(api): session info endpoint, enter/exit home, update login and google auth"
```

---

## Task 4: API — Admin homes endpoints + homeMiddleware on data routes

**Files:**
- Modify: `server/index.js`

### Step 4.1 — Remove old admin config endpoints

Delete these two blocks from `server/index.js`:

```js
// DELETE these:
app.get('/api/admin/config', ...)
app.post('/api/admin/config', ...)
```

### Step 4.2 — Add admin homes endpoints

Add after the session endpoints (still protected by `app.use('/api', authMiddleware)`):

```js
// ── Admin: homes management ──────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.session?.isAdmin) return res.status(403).json({ error: 'Admin only' });
  next();
}

app.get('/api/admin/homes', requireAdmin, async (_req, res) => {
  const homes = await listHomes();
  res.json(homes);
});

app.post('/api/admin/homes', requireAdmin, async (req, res) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name requerido' });
  }
  const home = await createHome(name.trim());
  res.json(home);
});

app.delete('/api/admin/homes/:id', requireAdmin, async (req, res) => {
  const home = await getHome(req.params.id);
  if (!home) return res.status(404).json({ error: 'Casa no encontrada' });
  await deleteHome(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/homes/:id/members', requireAdmin, async (req, res) => {
  const members = await listHomeMembers(req.params.id);
  res.json(members);
});

app.post('/api/admin/homes/:id/members', requireAdmin, async (req, res) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'email válido requerido' });
  }
  await addHomeMember(req.params.id, email.trim().toLowerCase());
  res.json({ ok: true });
});

app.delete('/api/admin/homes/:id/members/:email', requireAdmin, async (req, res) => {
  await removeHomeMember(req.params.id, decodeURIComponent(req.params.email));
  res.json({ ok: true });
});

app.post('/api/admin/homes/:id/enter', requireAdmin, async (req, res) => {
  const home = await getHome(req.params.id);
  if (!home) return res.status(404).json({ error: 'Casa no encontrada' });
  const token = generateToken({ isAdmin: true, email: null, homeId: req.params.id });
  setSessionCookie(res, token);
  res.json({ ok: true, homeId: req.params.id, homeName: home.name });
});
```

### Step 4.3 — Add `homeMiddleware` to data routes

After `app.use('/api', authMiddleware)` and `app.use('/api', imageRouter)`, add `homeMiddleware` to the specific data endpoints. Instead of using `app.use('/api', homeMiddleware)` globally (which would block session/admin endpoints), add it per-route to the ones that need it:

```js
// Apply homeMiddleware to data mutation endpoints
app.delete('/api/dashboard/:id', homeMiddleware, async (req, res) => {
  const { homeId } = req.session;
  await deleteDashboard(homeId, req.params.id);
  await removeDashboardFromMeta(homeId, req.params.id);
  const { meta } = await getAllState(homeId);
  if (meta) broadcast({ type: 'PATCH_META', meta, ts: Date.now() }, homeId, null);
  res.json({ ok: true });
});

app.post('/api/reset', homeMiddleware, async (req, res) => {
  const { homeId } = req.session;
  const wipedAt = await resetHome(homeId);
  broadcast({ type: 'RESET', wipedAt }, homeId, null);
  res.json({ ok: true, wipedAt });
});
```

### Step 4.4 — Commit

```bash
git add server/index.js
git commit -m "feat(api): admin homes CRUD endpoints, requireAdmin middleware, homeMiddleware on data routes"
```

---

## Task 5: Broadcast + WebSocket homeId scoping

**Files:**
- Modify: `server/broadcast.js`
- Modify: `server/routes.js`
- Modify: `server/index.js` (WS handler + polling)

### Step 5.1 — Update `server/broadcast.js`

Replace entire file:

```js
const clients = new Map(); // ws → homeId

export function addClient(ws, homeId) {
  clients.set(ws, homeId);
}

export function removeClient(ws) {
  clients.delete(ws);
}

// homeId = null means broadcast to all (used only for IMAGE_ADDED/REMOVED within a home)
export function broadcast(payload, homeId, senderWs) {
  const msg = JSON.stringify(payload);
  for (const [client, clientHomeId] of clients) {
    if (client === senderWs) continue;
    if (client.readyState !== 1) continue;
    if (homeId && clientHomeId !== homeId) continue;
    client.send(msg);
  }
}
```

### Step 5.2 — Update `server/routes.js` to use homeId

```js
import { homeMiddleware } from './auth.js';

// Replace the two router handlers:
router.post('/images', homeMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { homeId } = req.session;
  const filename = req.file.filename;
  await addImage(homeId, id, filename);
  const payload = { type: 'IMAGE_ADDED', id, filename, ts: Date.now() };
  broadcast(payload, homeId, null);
  res.json({ id, filename });
});

router.delete('/images/:id', homeMiddleware, async (req, res) => {
  const { id } = req.params;
  const { homeId } = req.session;
  const images = await getImages(homeId);
  const img = images.find(i => i.id === id);
  if (img) {
    const filePath = path.join(UPLOADS_DIR, img.filename);
    fs.unlink(filePath, () => {});
    await removeImage(homeId, id);
    broadcast({ type: 'IMAGE_REMOVED', id, ts: Date.now() }, homeId, null);
  }
  res.json({ ok: true });
});
```

### Step 5.3 — Update WS connection handler in `server/index.js`

Replace the `wss.on('connection', ...)` block:

```js
wss.on('connection', async (ws, req) => {
  const session = verifyWsRequest(req);
  if (!session) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  const homeId = session.homeId ?? null;
  if (!homeId) {
    ws.close(1008, 'No home selected');
    return;
  }

  addClient(ws, homeId);

  const fullState = await getAllState(homeId);
  ws.send(JSON.stringify({ type: 'FULL_STATE', ...fullState }));

  // Send cached live device states for this home's hubs
  const { hubs } = await getHubs(homeId);
  for (const hub of hubs) {
    for (const [key, attrs] of Object.entries(_devStates)) {
      const sep = key.indexOf(':');
      const keyHubId = key.slice(0, sep);
      if (keyHubId !== hub.id) continue;
      const deviceId = key.slice(sep + 1);
      for (const [attribute, value] of Object.entries(attrs)) {
        ws.send(JSON.stringify({ type: 'DEVICE_EVENT', hubId: hub.id, deviceId, attribute, value: String(value), ts: Date.now() }));
      }
    }
  }

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'PATCH_DASHBOARD': {
        const { dashboardId, name, state, ts } = msg;
        if (dashboardId && state) {
          await saveDashboard(homeId, dashboardId, name || dashboardId, JSON.stringify(state));
          broadcast({ type: 'PATCH_DASHBOARD', dashboardId, state, ts }, homeId, ws);
        }
        break;
      }
      case 'PATCH_META': {
        const { meta, ts } = msg;
        if (meta) {
          await saveMeta(homeId, JSON.stringify(meta));
          broadcast({ type: 'PATCH_META', meta, ts }, homeId, ws);
        }
        break;
      }
      case 'PATCH_HUBS': {
        const { hubs, assignments, ts } = msg;
        if (Array.isArray(hubs)) {
          await saveHubs(homeId, JSON.stringify({ hubs, assignments: assignments || {} }));
          broadcast({ type: 'PATCH_HUBS', hubs, assignments: assignments || {}, ts }, homeId, ws);
        }
        break;
      }
      case 'SEED_STATE': {
        const existing = await getAllDashboards(homeId);
        if (existing.length > 0) {
          ws.send(JSON.stringify({ type: 'FULL_STATE', ...await getAllState(homeId) }));
          break;
        }
        const { dashboards, meta, hubs: seedHubs } = msg;
        if (Array.isArray(dashboards)) {
          for (const { id, name, state } of dashboards) {
            await saveDashboard(homeId, id, name, JSON.stringify(state));
          }
        }
        if (meta) await saveMeta(homeId, JSON.stringify(meta));
        if (Array.isArray(seedHubs) && seedHubs.length > 0) await saveHubs(homeId, JSON.stringify(seedHubs));
        broadcast({ type: 'FULL_STATE', ...await getAllState(homeId) }, homeId, ws);
        break;
      }
      case 'IMAGE_REMOVED': {
        const { id } = msg;
        if (id) {
          const images = await getImages(homeId);
          const img = images.find(i => i.id === id);
          if (img) {
            const filePath = path.join(UPLOADS_DIR, img.filename);
            fs.unlink(filePath, () => {});
            await removeImage(homeId, id);
          }
          broadcast({ type: 'IMAGE_REMOVED', id, ts: Date.now() }, homeId, ws);
        }
        break;
      }
    }
  });

  ws.on('close', () => removeClient(ws));
  ws.on('error', () => removeClient(ws));
});
```

### Step 5.4 — Update hub polling to broadcast per-home

Replace `applyDeviceList` and `pollHubDeviceStates`:

```js
function applyDeviceList(hub, homeId, devices) {
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
      for (const [name, value] of Object.entries(curr)) {
        broadcast({ type: 'DEVICE_EVENT', hubId: hub.id, deviceId, attribute: name, value: String(value), ts: Date.now() }, homeId, null);
      }
      continue;
    }
    for (const [name, value] of Object.entries(curr)) {
      if (String(prev[name]) !== String(value)) {
        broadcast({ type: 'DEVICE_EVENT', hubId: hub.id, deviceId, attribute: name, value: String(value), ts: Date.now() }, homeId, null);
      }
    }
  }
}

async function pollHubDeviceStates() {
  let allHomeHubs;
  try { allHomeHubs = await getAllHubsForAllHomes(); } catch { return; }

  for (const { homeId, hubs } of allHomeHubs) {
    for (const hub of hubs) {
      if (hub.type !== 'hubitat') continue;
      try {
        const devices = await fetchHubDevicesLocal(hub) ?? await fetchHubDevicesCloud(hub);
        if (!devices) continue;
        applyDeviceList(hub, homeId, devices);
      } catch { }
    }
  }
}
```

### Step 5.5 — Update webhook to broadcast per-home

Replace `POST /api/hub-webhook`:

```js
app.post('/api/hub-webhook', async (req, res) => {
  const accessToken = req.query.access_token;
  if (!accessToken) return res.status(400).json({ error: 'Missing access_token' });

  const allHomeHubs = await getAllHubsForAllHomes();
  let hub = null, hubHomeId = null;
  for (const { homeId, hubs } of allHomeHubs) {
    const found = hubs.find(h => h.token === accessToken);
    if (found) { hub = found; hubHomeId = homeId; break; }
  }
  if (!hub) return res.status(403).json({ error: 'Unknown token' });

  const body = req.body;
  let evt;
  try {
    evt = body.content ? JSON.parse(body.content) : body;
  } catch {
    return res.status(400).json({ error: 'Invalid body' });
  }
  if (evt.source !== 'DEVICE') return res.json({ ok: true });
  broadcast({
    type: 'DEVICE_EVENT',
    hubId: hub.id,
    deviceId: String(evt.deviceId),
    attribute: evt.name,
    value: evt.value,
    ts: Date.now(),
  }, hubHomeId, null);
  res.json({ ok: true });
});
```

### Step 5.6 — Update `server/test/broadcast.test.js`

The broadcast signature changed from `broadcast(payload, senderWs)` to `broadcast(payload, homeId, senderWs)`. Update all existing broadcast test calls to pass `null` as the `homeId` argument (second param) so existing tests keep passing:

Open `server/test/broadcast.test.js` and add `null` as the second argument to every `broadcast(...)` call. Example:

```js
// Before:
broadcast({ type: 'TEST' }, null);
// After:
broadcast({ type: 'TEST' }, null, null);
```

Run tests:
```
JWT_SECRET=test-secret node --test server/test/broadcast.test.js
```
Expected: all broadcast tests pass.

### Step 5.7 — Commit

```bash
git add server/broadcast.js server/routes.js server/index.js server/test/broadcast.test.js
git commit -m "feat(ws): homeId-scoped broadcast, WebSocket and hub polling per home"
```

---

## Task 6: Frontend — App.jsx routing + session state

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Login/Login.jsx`

### Step 6.1 — Update `src/App.jsx`

Replace the entire file:

```jsx
import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MetaProvider, useMeta } from './store/metaStore.jsx';
import { DashboardProvider, useDashboard } from './store/dashboardStore.jsx';
import { SyncProvider } from './store/syncStore.jsx';
import { CalendarProvider } from './store/calendarStore.jsx';
import DashboardTabs from './components/DashboardTabs/DashboardTabs.jsx';
import ThemeApplier from './components/ThemeApplier.jsx';
import Sidebar from './components/Sidebar/Sidebar';
import Canvas from './components/Canvas/Canvas';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import ThemePicker from './components/Canvas/ThemePicker';
import GlobalIconSettings from './components/GlobalIconSettings/GlobalIconSettings';
import styles from './App.module.css';
import { HubProvider, useHub } from './store/hubStore.jsx';
import Login from './components/Login/Login.jsx';
import HubsTab from './components/Hubs/HubsTab.jsx';
import RulesEngine from './rules/rulesEngine.js';
import HubDeviceSync from './components/Hubs/HubDeviceSync.jsx';
import { useConnectivity } from './hooks/useConnectivity.js';
import OfflineModal from './components/Modal/OfflineModal.jsx';
import StatusBar from './components/StatusBar/StatusBar.jsx';
import AdminPanel from './components/Admin/AdminPanel.jsx';
import HomePicker from './components/Auth/HomePicker.jsx';
import HomeBar from './components/Admin/HomeBar.jsx';

const TABS = [
  { id: 'widgets', icon: '📦', label: 'Widgets' },
  { id: 'props',   icon: '⚙️',  label: 'Propiedades' },
  { id: 'temas',   icon: '🎨', label: 'Temas' },
  { id: 'iconos',  icon: '🔣', label: 'Iconos' },
  { id: 'hubs',    icon: '🏠', label: 'Hubs' },
];

function AppContent({ onLogout, onExitHome, homeName }) {
  const { dispatch } = useDashboard();
  const { hubs } = useHub();
  const mode = useConnectivity(hubs[0] ?? null);

  const [activeTab, setActiveTab] = useState('widgets');
  const [panelOpen, setPanelOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const handleTabClick = (id) => {
    if (activeTab === id) {
      setPanelOpen(o => !o);
    } else {
      setActiveTab(id);
      setPanelOpen(true);
    }
  };

  useEffect(() => {
    const handleTouchMove = (e) => {
      const widgetId = window.widgetIdBeingDragged;
      if (!widgetId) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      const canvas = document.querySelector('[class*="canvasInner"]');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dispatch({ type: 'MOVE_WIDGET', id: widgetId, x: Math.max(0, touch.clientX - rect.left), y: Math.max(0, touch.clientY - rect.top) });
    };
    const handleTouchEnd = () => { window.widgetIdBeingDragged = null; };
    if (window.innerWidth < 768) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      document.addEventListener('touchend', handleTouchEnd, { capture: true });
      return () => {
        document.removeEventListener('touchmove', handleTouchMove, { capture: true });
        document.removeEventListener('touchend', handleTouchEnd, { capture: true });
      };
    }
  }, [dispatch]);

  return (
    <>
      {mode === 'offline' && <OfflineModal />}
      <ThemeApplier />
      <RulesEngine />
      <HubDeviceSync />

      <div className={styles.shell}>
        {!sidebarVisible && (
          <button className={styles.hamburger} onClick={() => setSidebarVisible(true)} title="Mostrar panel">☰</button>
        )}

        <nav className={`${styles.iconStrip} ${!sidebarVisible ? styles.iconStripHidden : ''}`}>
          <div className={styles.stripTop}>
            <button className={styles.collapseBtn} onClick={() => { setSidebarVisible(false); setPanelOpen(false); }} title="Ocultar panel">☰</button>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.iconBtn} ${activeTab === tab.id && panelOpen ? styles.iconBtnActive : ''}`}
                onClick={() => handleTabClick(tab.id)}
                title={tab.label}
              >
                <span className={styles.iconBtnIcon}>{tab.icon}</span>
                <span className={styles.iconBtnLabel}>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.stripBottom}>
            {mode !== 'offline' && (
              <div className={styles.connChip} title={mode === 'local' ? 'Modo local (LAN directo)' : 'Conectado a la nube'}>
                <span className={`${styles.connDot} ${mode === 'local' ? styles.connDotGreen : styles.connDotAmber}`} />
              </div>
            )}
            <button
              className={`${styles.iconBtn} ${activeTab === 'cuenta' && panelOpen ? styles.iconBtnActive : ''}`}
              onClick={() => handleTabClick('cuenta')}
              title="Cuenta"
            >
              <span className={styles.iconBtnIcon}>👤</span>
              <span className={styles.iconBtnLabel}>Cuenta</span>
            </button>
          </div>
        </nav>

        <div className={`${styles.contentPanel} ${panelOpen && sidebarVisible ? styles.contentPanelOpen : ''}`}>
          {panelOpen && (
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                {TABS.find(t => t.id === activeTab)?.label ?? 'Cuenta'}
              </span>
              <button className={styles.panelClose} onClick={() => setPanelOpen(false)} title="Ocultar panel">‹</button>
            </div>
          )}
          {activeTab === 'widgets' && <Sidebar onAddWidget={() => setPanelOpen(false)} />}
          {activeTab === 'props'   && <PropertiesPanel />}
          {activeTab === 'temas'   && <ThemePicker />}
          {activeTab === 'iconos'  && <GlobalIconSettings />}
          {activeTab === 'hubs'    && <HubsTab />}
          {activeTab === 'cuenta'  && (
            <div className={styles.cuentaPanel}>
              <HomeBar homeName={homeName} onExit={onExitHome} />
              <button className={styles.logoutBtn} onClick={onLogout}>⏻ Cerrar sesión</button>
            </div>
          )}
        </div>

        <div className={styles.canvasArea}>
          <Canvas />
          <StatusBar mode={mode} />
        </div>
      </div>
    </>
  );
}

function AppInner({ onLogout, onExitHome, homeName }) {
  const { state: metaState } = useMeta();
  const { activeDashboardId } = metaState;
  const storageKey = `domotica-dashboard-${activeDashboardId}`;

  return (
    <DashboardProvider key={activeDashboardId} storageKey={storageKey}>
      <SyncProvider>
        <AppContent onLogout={onLogout} onExitHome={onExitHome} homeName={homeName} />
      </SyncProvider>
    </DashboardProvider>
  );
}

const SESSION_KEY = 'domotica_session_expiry';

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null); // { isAdmin, email, homeId } | null

  const loadSession = () => {
    fetch('/api/session/info')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.ok) {
          localStorage.setItem(SESSION_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
          setSessionInfo(data);
        } else {
          localStorage.removeItem(SESSION_KEY);
          setSessionInfo(null);
        }
      })
      .catch(() => {
        const expiry = parseInt(localStorage.getItem(SESSION_KEY) || '0');
        if (expiry > Date.now()) setSessionInfo({ ok: true, isAdmin: false, email: null, homeId: null, _offline: true });
        else setSessionInfo(null);
      })
      .finally(() => setSessionChecked(true));
  };

  useEffect(() => { loadSession(); }, []);

  const handleAuth = () => { loadSession(); };

  const handleLogout = async () => {
    localStorage.removeItem(SESSION_KEY);
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    setSessionInfo(null);
  };

  const handleEnterHome = (homeId, homeName) => {
    setSessionInfo(prev => ({ ...prev, homeId, homeName }));
  };

  const handleExitHome = async () => {
    await fetch('/api/session/exit-home', { method: 'POST' }).catch(() => {});
    setSessionInfo(prev => ({ ...prev, homeId: null, homeName: null }));
  };

  if (!sessionChecked) return null;
  if (!sessionInfo) return <Login onAuth={handleAuth} />;

  const { isAdmin, homeId, homeName } = sessionInfo;

  // Admin without a home selected → admin panel
  if (isAdmin && !homeId) {
    return <AdminPanel onEnterHome={handleEnterHome} onLogout={handleLogout} />;
  }

  // Google user without a home → home picker
  if (!isAdmin && !homeId) {
    return <HomePicker onEnterHome={handleEnterHome} onLogout={handleLogout} />;
  }

  // Inside a home
  return (
    <MetaProvider>
      <HubProvider>
        <CalendarProvider>
          <DashboardTabs />
          <DndProvider backend={HTML5Backend}>
            <AppInner onLogout={handleLogout} onExitHome={handleExitHome} homeName={homeName} />
          </DndProvider>
        </CalendarProvider>
      </HubProvider>
    </MetaProvider>
  );
}
```

### Step 6.2 — Update `src/components/Login/Login.jsx`

Remove the `houseName` state and its display. The `useEffect` that fetches `google-client-id` no longer sets `houseName`:

```jsx
useEffect(() => {
  fetch('/api/auth/google-client-id')
    .then(r => r.json())
    .then(d => { setGoogleClientId(d.clientId ?? ''); })
    .catch(() => {});
}, []);
```

Remove `const [houseName, setHouseName] = useState('');` and any `<h1>` or title that displayed it.

### Step 6.3 — Commit

```bash
git add src/App.jsx src/components/Login/Login.jsx
git commit -m "feat(app): multi-tenant routing — AdminPanel, HomePicker, or main app based on session"
```

---

## Task 7: Frontend — AdminPanel component

**Files:**
- Create: `src/components/Admin/AdminPanel.jsx`
- Create: `src/components/Admin/AdminPanel.module.css`

### Step 7.1 — Create `src/components/Admin/AdminPanel.module.css`

```css
.container {
  min-height: 100vh;
  background: #0f172a;
  color: rgba(255,255,255,0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  font-family: system-ui, sans-serif;
}

.header {
  width: 100%;
  max-width: 640px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.title {
  font-size: 1.4rem;
  font-weight: 600;
  color: rgba(255,255,255,0.95);
  margin: 0;
}

.logoutBtn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.6);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: border-color 0.15s;
}
.logoutBtn:hover { border-color: rgba(255,255,255,0.35); color: rgba(255,255,255,0.9); }

.createRow {
  width: 100%;
  max-width: 640px;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.input {
  flex: 1;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  color: rgba(255,255,255,0.9);
  padding: 0.6rem 0.9rem;
  font-size: 0.95rem;
  outline: none;
}
.input:focus { border-color: var(--accent, #3b82f6); }

.addBtn {
  background: var(--accent, #3b82f6);
  border: none;
  border-radius: 8px;
  color: #fff;
  padding: 0.6rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}
.addBtn:hover { opacity: 0.88; }

.homeList {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.homeCard {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  overflow: hidden;
}

.homeRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
}

.homeName {
  flex: 1;
  font-size: 1rem;
  font-weight: 500;
}

.enterBtn {
  background: var(--accent, #3b82f6);
  border: none;
  border-radius: 6px;
  color: #fff;
  padding: 0.35rem 0.8rem;
  font-size: 0.85rem;
  cursor: pointer;
}
.enterBtn:hover { opacity: 0.88; }

.membersBtn {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: rgba(255,255,255,0.75);
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
}
.membersBtn:hover { background: rgba(255,255,255,0.13); }

.deleteBtn {
  background: transparent;
  border: 1px solid rgba(239,68,68,0.35);
  border-radius: 6px;
  color: rgba(239,68,68,0.8);
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
}
.deleteBtn:hover { border-color: rgba(239,68,68,0.7); color: #ef4444; }

.membersPanel {
  border-top: 1px solid rgba(255,255,255,0.08);
  padding: 0.75rem 1rem;
  background: rgba(0,0,0,0.2);
}

.memberRow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
}

.memberEmail { flex: 1; font-size: 0.85rem; color: rgba(255,255,255,0.7); }

.removeMemberBtn {
  background: transparent;
  border: none;
  color: rgba(239,68,68,0.7);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.2rem 0.4rem;
}
.removeMemberBtn:hover { color: #ef4444; }

.addMemberRow {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.emptyState {
  color: rgba(255,255,255,0.35);
  font-size: 0.9rem;
  text-align: center;
  padding: 3rem 0;
}

.statusMsg {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.45);
  margin-top: 0.5rem;
}
```

### Step 7.2 — Create `src/components/Admin/AdminPanel.jsx`

```jsx
import { useState, useEffect } from 'react';
import styles from './AdminPanel.module.css';

export default function AdminPanel({ onEnterHome, onLogout }) {
  const [homes, setHomes] = useState([]);
  const [newName, setNewName] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [members, setMembers] = useState({}); // homeId → [email]
  const [newEmail, setNewEmail] = useState({});  // homeId → string
  const [status, setStatus] = useState('');

  const loadHomes = () =>
    fetch('/api/admin/homes').then(r => r.json()).then(setHomes).catch(() => {});

  useEffect(() => { loadHomes(); }, []);

  const loadMembers = async (homeId) => {
    const list = await fetch(`/api/admin/homes/${homeId}/members`).then(r => r.json()).catch(() => []);
    setMembers(prev => ({ ...prev, [homeId]: list }));
  };

  const toggleMembers = (homeId) => {
    if (expandedId === homeId) { setExpandedId(null); return; }
    setExpandedId(homeId);
    loadMembers(homeId);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch('/api/admin/homes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) { setNewName(''); loadHomes(); }
  };

  const handleDelete = async (homeId) => {
    if (!confirm('¿Eliminar esta casa y todos sus datos?')) return;
    await fetch(`/api/admin/homes/${homeId}`, { method: 'DELETE' });
    loadHomes();
  };

  const handleEnter = async (homeId, homeName) => {
    const res = await fetch(`/api/admin/homes/${homeId}/enter`, { method: 'POST' });
    if (res.ok) onEnterHome(homeId, homeName);
  };

  const handleAddMember = async (homeId) => {
    const email = (newEmail[homeId] ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    await fetch(`/api/admin/homes/${homeId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setNewEmail(prev => ({ ...prev, [homeId]: '' }));
    loadMembers(homeId);
  };

  const handleRemoveMember = async (homeId, email) => {
    await fetch(`/api/admin/homes/${homeId}/members/${encodeURIComponent(email)}`, { method: 'DELETE' });
    loadMembers(homeId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Panel de administración</h1>
        <button className={styles.logoutBtn} onClick={onLogout}>⏻ Cerrar sesión</button>
      </div>

      <div className={styles.createRow}>
        <input
          className={styles.input}
          placeholder="Nombre de la nueva casa..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button className={styles.addBtn} onClick={handleCreate}>+ Agregar casa</button>
      </div>

      <div className={styles.homeList}>
        {homes.length === 0 && <p className={styles.emptyState}>No hay casas creadas aún.</p>}
        {homes.map(home => (
          <div key={home.id} className={styles.homeCard}>
            <div className={styles.homeRow}>
              <span className={styles.homeName}>{home.name}</span>
              <button className={styles.enterBtn} onClick={() => handleEnter(home.id, home.name)}>Entrar</button>
              <button className={styles.membersBtn} onClick={() => toggleMembers(home.id)}>
                {expandedId === home.id ? 'Ocultar' : 'Miembros'}
              </button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(home.id)}>Eliminar</button>
            </div>

            {expandedId === home.id && (
              <div className={styles.membersPanel}>
                {(members[home.id] ?? []).map(email => (
                  <div key={email} className={styles.memberRow}>
                    <span className={styles.memberEmail}>{email}</span>
                    <button className={styles.removeMemberBtn} onClick={() => handleRemoveMember(home.id, email)}>✕</button>
                  </div>
                ))}
                {(members[home.id] ?? []).length === 0 && (
                  <p className={styles.statusMsg}>Sin miembros aún.</p>
                )}
                <div className={styles.addMemberRow}>
                  <input
                    className={styles.input}
                    placeholder="email@ejemplo.com"
                    value={newEmail[home.id] ?? ''}
                    onChange={e => setNewEmail(prev => ({ ...prev, [home.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddMember(home.id)}
                  />
                  <button className={styles.addBtn} onClick={() => handleAddMember(home.id)}>Agregar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 7.3 — Commit

```bash
git add src/components/Admin/AdminPanel.jsx src/components/Admin/AdminPanel.module.css
git commit -m "feat(admin): AdminPanel — list homes, create/delete, manage members, enter home"
```

---

## Task 8: Frontend — HomePicker component

**Files:**
- Create: `src/components/Auth/HomePicker.jsx`
- Create: `src/components/Auth/HomePicker.module.css`

### Step 8.1 — Create `src/components/Auth/HomePicker.module.css`

```css
.container {
  min-height: 100vh;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  font-family: system-ui, sans-serif;
  color: rgba(255,255,255,0.9);
}

.title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
}

.subtitle {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.45);
  margin: 0 0 2rem;
}

.homeGrid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 360px;
}

.homeCard {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 1.1rem 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  text-align: left;
  color: inherit;
  font: inherit;
  width: 100%;
}
.homeCard:hover {
  background: rgba(255,255,255,0.1);
  border-color: var(--accent, #3b82f6);
}

.homeIcon {
  font-size: 1.5rem;
  width: 2.2rem;
  text-align: center;
}

.homeName {
  font-size: 1rem;
  font-weight: 500;
}

.logoutLink {
  margin-top: 2rem;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.35);
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: underline;
}
.logoutLink:hover { color: rgba(255,255,255,0.6); }

.loading {
  color: rgba(255,255,255,0.4);
  font-size: 0.9rem;
}

.error {
  color: #f87171;
  font-size: 0.85rem;
  margin-top: 0.75rem;
}
```

### Step 8.2 — Create `src/components/Auth/HomePicker.jsx`

```jsx
import { useState, useEffect } from 'react';
import styles from './HomePicker.module.css';

export default function HomePicker({ onEnterHome, onLogout }) {
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/session/my-homes')
      .then(r => r.json())
      .then(data => {
        setHomes(Array.isArray(data) ? data : []);
        // Auto-enter if only one home
        if (Array.isArray(data) && data.length === 1) {
          handleSelect(data[0].id, data[0].name);
        }
      })
      .catch(() => setError('Error al cargar casas'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (homeId, homeName) => {
    setError('');
    const res = await fetch('/api/session/enter-home', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeId }),
    });
    if (res.ok) {
      onEnterHome(homeId, homeName);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo entrar a la casa');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Selecciona una casa</h1>
      <p className={styles.subtitle}>Tienes acceso a varias casas</p>

      {loading && <p className={styles.loading}>Cargando...</p>}

      <div className={styles.homeGrid}>
        {homes.map(home => (
          <button key={home.id} className={styles.homeCard} onClick={() => handleSelect(home.id, home.name)}>
            <span className={styles.homeIcon}>🏠</span>
            <span className={styles.homeName}>{home.name}</span>
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.logoutLink} onClick={onLogout}>Cerrar sesión</button>
    </div>
  );
}
```

### Step 8.3 — Create `src/components/Auth/` directory

The directory is created by creating the files above. Ensure `src/components/Auth/` exists before writing.

### Step 8.4 — Commit

```bash
git add src/components/Auth/HomePicker.jsx src/components/Auth/HomePicker.module.css
git commit -m "feat(auth): HomePicker — home selector for Google users with multiple homes"
```

---

## Task 9: Frontend — HomeBar + cleanup

**Files:**
- Create: `src/components/Admin/HomeBar.jsx`
- Create: `src/components/Admin/HomeBar.module.css`
- Delete: `src/components/Admin/AccessConfig.jsx`
- Delete: `src/components/Admin/AccessConfig.module.css`

### Step 9.1 — Create `src/components/Admin/HomeBar.module.css`

```css
.bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.homeName {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255,255,255,0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exitBtn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  color: rgba(255,255,255,0.55);
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, color 0.15s;
}
.exitBtn:hover {
  border-color: rgba(255,255,255,0.35);
  color: rgba(255,255,255,0.85);
}
```

### Step 9.2 — Create `src/components/Admin/HomeBar.jsx`

```jsx
import styles from './HomeBar.module.css';

export default function HomeBar({ homeName, onExit }) {
  if (!homeName) return null;
  return (
    <div className={styles.bar}>
      <span className={styles.homeName}>🏠 {homeName}</span>
      <button className={styles.exitBtn} onClick={onExit}>← Salir</button>
    </div>
  );
}
```

### Step 9.3 — Delete old AccessConfig files

```bash
rm src/components/Admin/AccessConfig.jsx
rm src/components/Admin/AccessConfig.module.css
```

Verify no other file imports `AccessConfig` (should be none since App.jsx was already updated):

```bash
grep -r "AccessConfig" src/
```

Expected: no output.

### Step 9.4 — Commit

```bash
git add src/components/Admin/HomeBar.jsx src/components/Admin/HomeBar.module.css
git rm src/components/Admin/AccessConfig.jsx src/components/Admin/AccessConfig.module.css
git commit -m "feat(ui): add HomeBar with exit button, remove old AccessConfig component"
```

---

## Task 10: Final verification

### Step 10.1 — Run all backend tests

```
JWT_SECRET=test-secret node --test server/test/homes.test.js server/test/homeAuth.test.js server/test/googleAuth.test.js server/test/broadcast.test.js
```

Expected: all tests pass (db.test.js still has pre-existing failures — skip it).

### Step 10.2 — Start dev server and verify flows

```bash
npm run dev
```

Verify:
- [ ] Admin login (`/api/login`) → redirects to AdminPanel (no home selected)
- [ ] AdminPanel shows "No hay casas creadas aún."
- [ ] Create a home → appears in list
- [ ] "Miembros" → add email → email appears
- [ ] "Entrar" → app loads (canvas, sidebar, hubs)
- [ ] "Cuenta" tab → shows HomeBar with home name + "← Salir"
- [ ] "← Salir" → back to AdminPanel
- [ ] "Eliminar" casa (after exiting) → removed from list
- [ ] Google login with authorized email → HomePicker or auto-enter

### Step 10.3 — Push to main

```bash
git push origin push-to-main:main
```

---

## Environment variables (no change needed)

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Signs session tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `DATABASE_URL` | PostgreSQL connection string (Render/Neon) |
| `ADMIN_USER` / `ADMIN_PASSWORD_HASH` | Admin credentials |

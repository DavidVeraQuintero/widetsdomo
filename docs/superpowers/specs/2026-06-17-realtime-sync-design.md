# Real-Time Cross-Device Dashboard Sync

**Date:** 2026-06-17
**Status:** Approved

## Goal

Synchronize all dashboard configuration (widget positions, themes, colors, background images) across all devices on the same local network in real time. A change made on a PC must appear immediately on a tablet or any other device connected to the same WiFi.

---

## Architecture

A minimal Node.js server runs on the host PC. All other devices connect to it via WebSocket. SQLite is the single source of truth. The React frontend does not change internally — a sync layer wraps the existing dispatch system.

```
┌─────────────────────────────────────────────────────┐
│                   RED LOCAL (WiFi)                   │
│                                                     │
│  ┌──────────────┐      ┌──────────────────────┐     │
│  │   PC / host  │      │  Tablet / Móvil / PC  │     │
│  │              │      │                      │     │
│  │  React app   │◄────►│      React app       │     │
│  │  + servidor  │  WS  │   (solo frontend)    │     │
│  │              │      │                      │     │
│  └──────┬───────┘      └──────────────────────┘     │
│         │                                           │
│   ┌─────▼──────┐                                    │
│   │   SQLite   │ ← source of truth                  │
│   │ + /uploads │ ← background images                │
│   └────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

**Stack:**

| Component | Technology | Role |
|---|---|---|
| Server | Node.js + Express | Serves frontend + API |
| Real-time | `ws` (native WebSocket) | Push changes to all clients |
| Database | SQLite (`better-sqlite3`) | Persistent source of truth |
| Images | Files in `/uploads` | Custom background photos |
| Client sync | `useSyncedDispatch` hook | Intercepts and propagates changes |

**Cloud scaling path:** Replace `better-sqlite3` with `pg` (PostgreSQL) and the local WebSocket with Supabase Realtime or Firebase — the frontend does not change.

---

## Data Model (SQLite)

```sql
-- Dashboard state (widgets, theme, colors, global icons)
CREATE TABLE dashboards (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  state_json TEXT NOT NULL,    -- full JSON, replaces localStorage
  updated_at INTEGER NOT NULL  -- timestamp for last-write-wins
);

-- Global meta (dashboard list, active dashboard, compact mode, etc.)
CREATE TABLE meta (
  key   TEXT PRIMARY KEY,  -- always "singleton"
  value TEXT NOT NULL      -- JSON matching current metaStore shape
);

-- Image references (file stored in /uploads)
CREATE TABLE images (
  id         TEXT PRIMARY KEY,  -- same id used today in IndexedDB
  filename   TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

**What each table syncs:**

| Table | Content | Trigger |
|---|---|---|
| `dashboards` | Widget positions, sizes, configs, theme, colors, global icons | Any dashboard dispatch |
| `meta` | Dashboard list, active dashboard, compact mode | Any meta dispatch |
| `images` | Reference to each background photo file | Upload or delete a photo |

Images are stored as files in `/uploads/`, not as BLOBs in SQLite. Express serves them as static assets. Maximum 30 images (3 per dashboard × 10 dashboards).

**First-run migration:** On first connection, if a client has data in `localStorage`/IndexedDB with no server data, the client uploads its local state to the server as the initial seed.

---

## Server Structure

```
server/
  index.js        ← Express + WebSocket + SQLite bootstrap
  db.js           ← SQLite init and queries
  routes.js       ← HTTP endpoints for images
  broadcast.js    ← WebSocket broadcast logic
  uploads/        ← background image files
```

**Start command:**
```bash
npm run server
# Starts on port 3001
# Serves /uploads as static files
# Serves React build as SPA (production)
```

In development, Vite runs on port 5173 and proxies `/api` and `/uploads` to port 3001.

---

## WebSocket Protocol

All messages are JSON.

**Client → Server:**
```js
{ type: 'PATCH_DASHBOARD', dashboardId: 'db-xxx', state: {...}, ts: 1234567890 }
{ type: 'PATCH_META', meta: {...}, ts: 1234567890 }
{ type: 'IMAGE_ADDED', id: 'img-xxx', filename: 'abc.jpg', ts: ... }
{ type: 'IMAGE_REMOVED', id: 'img-xxx', ts: ... }
```

**Server → all other clients (broadcast):**
```js
{ ...same payload, from: 'client-uuid' }
```

**Server → new client on connect (full state):**
```js
{ type: 'FULL_STATE', dashboards: [...], meta: {...}, images: [...] }
```

**Conflict resolution:** Last-write-wins via `updated_at` timestamp. Sufficient for a home dashboard where simultaneous edits on different devices are rare.

---

## HTTP Endpoints (Images Only)

```
POST   /api/images        ← upload a photo (multipart/form-data) → returns { id, filename }
GET    /uploads/:filename ← serve image as static file
DELETE /api/images/:id    ← delete image file + SQLite row + broadcast IMAGE_REMOVED
```

---

## Frontend Integration

**No changes to existing stores.** `dashboardStore.jsx` and `metaStore.jsx` remain untouched.

**New file: `src/store/syncStore.jsx`**

Provides a React context that holds the WebSocket connection and exposes synced dispatch functions.

```jsx
const SyncContext = createContext(null);

export function SyncProvider({ children }) {
  // maintains WS connection
  // listens for incoming messages and applies them to local state
  // exposes dispatchDashboard and dispatchMeta
}

export function useSyncedDashboard() { ... }
export function useSyncedMeta() { ... }
```

**Change in `App.jsx`:**
```jsx
// Add SyncProvider around existing providers
<MetaProvider>
  <SyncProvider>
    <DashboardProvider>
      ...
```

**No component changes needed.** `SyncProvider` sits inside the existing providers and patches the context dispatch values, so `useDashboard()` and `useMeta()` already return the synced dispatch transparently.

**Optimistic updates:** Local state updates instantly. The WebSocket message is sent in parallel. No waiting for server confirmation on the UI.

**Change flow:**
```
dispatch({ type: 'MOVE_WIDGET', ... })
  │
  ├─► Local React state (immediate)
  │
  └─► WebSocket → server → SQLite
                          └─► broadcast → other devices → their dispatch
```

**Image upload flow:**
```
User uploads photo on Device A
  │
  ├─► POST /api/images → server saves to /uploads/
  │
  └─► server broadcasts IMAGE_ADDED to all clients
        └─► Device B fetches image via GET /uploads/filename
```

---

## Connection Management

**Reconnection:** Automatic with exponential backoff: 1s → 2s → 4s → 8s → max 30s.

**On reconnect:** Server sends `FULL_STATE`. Client replaces its full local state. Guarantees a device that was offline comes back up to date.

**Offline fallback:** If WebSocket cannot connect (server off), the dashboard continues working with `localStorage` exactly as today. Sync is an enhancement, not a requirement.

**Sync status indicator** (small icon in canvas header):
- Green — connected, all saved
- Yellow — syncing (change in transit)
- Red — offline (working locally)

---

## Configuration

```js
// src/config.js (already exists, add one line)
export const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_URL || 'ws://localhost:3001';
```

On LAN, other devices set: `VITE_SYNC_URL=ws://192.168.1.X:3001`

---

## Files Changed / Added

**New:**
- `server/index.js`
- `server/db.js`
- `server/routes.js`
- `server/broadcast.js`
- `server/uploads/` (directory)
- `src/store/syncStore.jsx`

**Modified:**
- `src/App.jsx` — add `SyncProvider`
- `src/config.js` — add `SYNC_SERVER_URL`
- `vite.config.js` — add proxy for `/api` and `/uploads`
- `package.json` — add `better-sqlite3`, `ws`, `multer`, `express`; add `server` script
- No component changes needed — `SyncProvider` patches the context dispatch transparently

**Unchanged:**
- `src/store/dashboardStore.jsx`
- `src/store/metaStore.jsx`
- `src/store/calendarStore.jsx`
- All widget components (no dispatch API change)

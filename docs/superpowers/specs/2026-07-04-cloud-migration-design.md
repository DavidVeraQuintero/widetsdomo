# Cloud Migration Design — Domotica Dashboard

**Date:** 2026-07-04  
**Status:** Approved

## Overview

Migrate the current local-only Express + SQLite dashboard to a cloud-hosted architecture with PostgreSQL, simple auth, Hubitat webhook integration, and offline-first PWA support. The app must work from anywhere (cloud path) and degrade gracefully to direct LAN access when internet is unavailable.

---

## 1. Architecture

```
[Browser / Tablet]
      │
      ├── HTTPS ──→ [Cloud Server - Render (Node.js free tier)]
      │                   │
      │                   ├── PostgreSQL (Neon free tier)
      │                   ├── Serves React build (dist/)
      │                   ├── REST API + WebSocket sync
      │                   └── Receives Hubitat webhooks
      │
      └── HTTP direct ──→ [Hubitat C8 Pro - LAN 192.168.x.x]
                                │
                           WiFi/Zigbee/Z-Wave devices
```

**Cloud services (all free tier):**
- **Server:** Render — Node.js web service
- **Database:** Neon — PostgreSQL
- **Images:** Cloudinary — deferred (addressed in a follow-up)

---

## 2. Authentication

### Credentials
- Single admin account stored as environment variables: `ADMIN_USER`, `ADMIN_PASSWORD_HASH` (bcrypt)
- Password never stored in plain text or committed to the repo
- Initial credentials configured at deploy time via env vars

### Session
- On successful login: server generates a signed JWT
- JWT stored as an **HTTP-only cookie** (inaccessible to JavaScript)
- Cookie expiration: **30 days**, renewed automatically on each request
- All API routes and WebSocket connections verify the cookie via middleware
- On expiry: server clears cookie and redirects to `/login`

### Login UI
- Styled to match the dashboard (dark theme, same typography/palette)
- Fields: username + password
- On success: redirects to dashboard
- Logout button in dashboard → clears cookie → redirects to `/login`

### Routes
```
POST /api/login     — verifies credentials, sets cookie
POST /api/logout    — clears cookie
GET  /api/me        — returns { ok: true } if authenticated (used by frontend on load)
```

All other `/api/*` routes and WebSocket connections require valid cookie.

---

## 3. Database (SQLite → PostgreSQL)

### Schema
```sql
CREATE TABLE dashboards (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  state      JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meta (
  id   INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB
);

CREATE TABLE hubs (
  id   INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB
);

CREATE TABLE images (
  id         TEXT PRIMARY KEY,
  filename   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Code changes
- `server/db.js` — replace `better-sqlite3` with `pg`. Keep the same exported function signatures (`getAllState`, `saveDashboard`, `saveMeta`, `saveHubs`, etc.) so the rest of the server requires no changes.
- Connection via `DATABASE_URL` environment variable (Neon provides this string).
- On startup: run `CREATE TABLE IF NOT EXISTS` for each table (simple migration, no ORM needed).

### Images
- Image file storage is deferred to a follow-up (Cloudinary integration).
- For now, uploaded images continue to be stored on disk. Render's disk is ephemeral — images are lost on redeploy. This is an accepted known limitation until the follow-up is implemented.

---

## 4. Hub Communication

### Hub config fields (added to existing UI)
| Field | Description |
|-------|-------------|
| `ip` | Local LAN IP (existing) e.g. `192.168.1.100` |
| `appId` | Maker API app ID (existing) |
| `token` | Maker API access token (existing) |
| `cloudUrl` | **New** — full Maker API cloud base URL: `https://cloud.hubitat.com/api/{uid}/apps/{appId}` |

### Connection priority (hubClient.js)
```
1. Try local IP (timeout 2s)
2. If fails → try Cloud URL (Maker API)
3. If both fail → trigger offline modal
```

### Server proxy (hubProxy.js)
- Relax `PRIVATE_IP_RE` restriction to also allow `cloud.hubitat.com`
- The proxy continues to exist so the Maker API token is never exposed in the browser

### Real-time events (replaces eventsocket)
Hubitat Maker API webhook configured to POST to:
```
https://your-server.onrender.com/api/hub-webhook
```

Flow:
```
Device changes state
  → Hubitat detects change
  → POST /api/hub-webhook  (includes hub token for verification)
  → Server verifies token
  → Broadcasts via WebSocket to all connected browsers
  → Widgets update in real time
```

New server endpoint: `POST /api/hub-webhook`

---

## 5. PWA & Offline Behavior

### Service Worker
- Caches the full app shell (HTML, JS, CSS, assets) on first load
- Subsequent loads served from cache — app opens instantly even offline

### Connectivity detection
The app monitors two signals in parallel:
1. `navigator.onLine` → internet availability
2. Periodic fetch to Hubitat local IP → LAN availability

### Operating modes
| Mode | Internet | LAN | Commands | Real-time events |
|------|----------|-----|----------|-----------------|
| Normal | ✅ | ✅ | LAN direct (~10ms) | Webhooks |
| Cloud only | ✅ | ❌ | Maker API cloud (~300ms) | Webhooks |
| LAN only | ❌ | ✅ | LAN direct (~10ms) | Polling every 5s |
| **Offline total** | ❌ | ❌ | **Blocked** | **Blocked** |

### Offline total — blocking modal
- A full-screen modal overlays the dashboard
- Message: no connection detected, prompts user to check network
- Widgets are visible but non-interactive beneath the modal
- Last known device states are displayed (from in-memory state)
- Modal dismisses automatically when any connection is restored
- No command queuing — if both connections are down, something serious happened

### Connection indicator
Small status chip in the dashboard UI:
- `● Local` — using LAN direct
- `● Cloud` — using Maker API cloud
- `● Offline` — modal active

---

## 6. Environment Variables

```env
# Server
PORT=3001
DATABASE_URL=postgresql://...         # Neon connection string
JWT_SECRET=<random 64-char string>
ADMIN_USER=admin
ADMIN_PASSWORD_HASH=<bcrypt hash>

# Optional future
CLOUDINARY_URL=...
```

---

## 7. Deployment

### Render setup
- Build command: `npm run build`
- Start command: `node server/index.js`
- Environment: set all env vars in Render dashboard
- Free tier: spins down after 15min inactivity (first request ~30s cold start)

### Hubitat Maker API setup
1. Open Maker API app in Hubitat
2. Enable "Allow Access via Cloud"
3. Copy cloud base URL → paste into dashboard hub config as `cloudUrl`
4. Set webhook URL to `https://your-app.onrender.com/api/hub-webhook`
5. Select which devices send webhook events

---

## 8. Files Changed

| File | Change |
|------|--------|
| `server/db.js` | Replace SQLite with pg, same function signatures |
| `server/index.js` | Add auth middleware, webhook endpoint, login/logout routes |
| `server/hubProxy.js` | Allow cloud.hubitat.com in addition to private IPs |
| `server/auth.js` | New — JWT generation, verification, bcrypt comparison |
| `src/services/hubClient.js` | Add cloud URL fallback, remove eventsocket, add connectivity detection |
| `src/store/hubStore.jsx` | Add cloudUrl field to hub config |
| `src/components/Hubs/HubForm.jsx` | Add cloudUrl input field |
| `src/components/Login/Login.jsx` | New — login page styled to match dashboard |
| `src/App.jsx` | Add auth guard, redirect to /login if not authenticated |
| `public/sw.js` | New — service worker for PWA caching |
| `public/manifest.json` | New — PWA manifest |
| `src/components/Modal/OfflineModal.jsx` | New — blocking offline modal |
| `src/hooks/useConnectivity.js` | New — monitors internet + LAN status |

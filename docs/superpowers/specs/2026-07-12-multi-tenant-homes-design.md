# Multi-Tenant Homes — Design Spec

**Date:** 2026-07-12
**Status:** Approved

## Overview

Convert the single-tenant dashboard into a multi-tenant system where the admin manages multiple independent "homes" (families). Each home has its own isolated environment (dashboards, hubs, images, rules). A Google account can belong to multiple homes and sees a selector on login. The admin has a dedicated panel to create, manage, and enter any home.

---

## 1. Database Schema

### New tables

```sql
CREATE TABLE homes (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE home_members (
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  email   TEXT NOT NULL,
  PRIMARY KEY (home_id, email)
);
```

### Existing tables — add `home_id`

| Table        | Change |
|-------------|--------|
| `dashboards` | Add `home_id TEXT NOT NULL` |
| `meta`       | Change PK from `(key)` to `(home_id, key)` — one meta row per home per key |
| `hubs`       | Change PK from `(key)` to `(home_id, key)` |
| `images`     | Add `home_id TEXT NOT NULL` |

### Config table

No structural changes. Remove `house_name` and `google_allowed_emails` keys (replaced by `homes` and `home_members` tables).

### Migration

None required — fresh start. `initDB()` creates all tables clean.

### Removed

- `getAccessConfig()`, `setAccessConfig()` in `server/db.js` — replaced by new homes CRUD functions.

---

## 2. Session and Auth

### JWT payload

```js
// Admin, no home selected (admin panel view)
{ isAdmin: true,  email: null,             homeId: null }

// Admin inside a home
{ isAdmin: true,  email: null,             homeId: 'abc123' }

// Google user, no home selected (HomePicker view)
{ isAdmin: false, email: 'user@gmail.com', homeId: null }

// Google user inside a home
{ isAdmin: false, email: 'user@gmail.com', homeId: 'abc123' }
```

Expiry stays 30 days. Cookie settings unchanged.

### Auth functions (server/auth.js)

- `generateToken({ isAdmin, email, homeId })` — replaces current `generateToken()` that hardcoded `{ user: ADMIN_USER }`
- `authMiddleware` — validates JWT, attaches `req.session = { isAdmin, email, homeId }` to request
- `homeMiddleware` — new; validates `req.session.homeId` is set and user has access (admin always passes; Google user must have email in `home_members` for that home)

### Entering / exiting homes

Re-issuing the JWT (new cookie) is how the home changes. No server-side session store needed.

---

## 3. API Endpoints

### Session endpoints (require auth, no home needed)

| Method | Path | Description |
|--------|------|-------------|
| GET  | `/api/session/info`         | Returns `{ isAdmin, email, homeId, homeName }` |
| GET  | `/api/session/my-homes`     | List homes accessible to current user (by email) |
| POST | `/api/session/enter-home`   | `{ homeId }` → validate access → re-issue JWT with homeId |
| POST | `/api/session/exit-home`    | Re-issue JWT with `homeId: null` |

### Admin endpoints (require `isAdmin: true`)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/admin/homes`                        | List all homes |
| POST   | `/api/admin/homes`               `{name}` | Create home (generate UUID id) |
| DELETE | `/api/admin/homes/:id`                    | Delete home + cascade all its data |
| GET    | `/api/admin/homes/:id/members`            | List member emails |
| POST   | `/api/admin/homes/:id/members`  `{email}` | Add member email |
| DELETE | `/api/admin/homes/:id/members/:email`     | Remove member email |
| POST   | `/api/admin/homes/:id/enter`              | Admin enters that home (calls enter-home internally) |

### Removed endpoints

- `GET /api/admin/config`
- `POST /api/admin/config`

### Existing data endpoints (unchanged URLs)

All existing endpoints (`/api/state`, `/api/dashboard`, `/api/hubs`, `/api/images/upload`, etc.) are now protected by `homeMiddleware` and automatically scoped to `req.session.homeId`. No URL changes.

---

## 4. Frontend

### Navigation flow after login

```
Login
  ↓
GET /api/session/info
  ↓
homeId present? ──Yes──→ App principal (existing behavior)
  │
  No
  ↓
isAdmin? ──Yes──→ AdminPanel
  │
  No
  ↓
GET /api/session/my-homes
  ↓
1 home? ──Yes──→ auto enter-home → App principal
  │
  No (multiple)
  ↓
HomePicker → user selects → enter-home → App principal
```

### New components

**`src/components/Admin/AdminPanel.jsx`**
- Replaces `AccessConfig` in the "Cuenta" sidebar tab (admin only, when no homeId in session)
- Lists all homes with "Entrar" and "Eliminar" buttons
- Create home form (name input + button)
- Each home row opens an inline member list (add/remove emails)
- "Entrar" calls `POST /api/admin/homes/:id/enter` → app navigates to home environment

**`src/components/Auth/HomePicker.jsx`**
- Full-screen selector shown when Google user has multiple homes
- Dark theme, matches Login style
- Home name cards — click to enter
- Shown only when `homeId === null && !isAdmin && homes.length > 1`

**`src/components/Admin/HomeBar.jsx`** — small strip fixed at the top of the sidebar, above the tab icons
- Shows current home name (from store `homeName`)
- "← Salir" button → calls `POST /api/session/exit-home` → clears homeId from store → returns to AdminPanel or HomePicker
- Only rendered when `homeId` is set in session (hidden on AdminPanel / HomePicker views)

### Changes to existing files

**`src/App.jsx`**
- On mount: fetch `GET /api/session/info` to hydrate `isAdmin`, `homeId`, `userEmail`
- Render logic: `<Login>` → `<AdminPanel>` | `<HomePicker>` | main app
- Remove `<AccessConfig>` import

**`src/components/Admin/AccessConfig.jsx`** — deleted (replaced by AdminPanel)
**`src/components/Admin/AccessConfig.module.css`** — deleted

**Store (`useStore`)**
- Add fields: `homeId`, `isAdmin`, `userEmail`, `homeName`
- Hydrated from `GET /api/session/info` on app init

### Sidebar "Cuenta" tab

- When inside a home: shows logout button only (same as before)
- When admin is in AdminPanel view: not shown (AdminPanel is the main view)

---

## 5. Data isolation contract

Every DB read/write for home-scoped data receives `homeId` as a parameter. The `homeMiddleware` enforces this at the API boundary. No endpoint can accidentally read another home's data because all queries include `WHERE home_id = $1`.

Admin bypass: admin can enter any home via `POST /api/admin/homes/:id/enter`, which sets `homeId` in their JWT exactly like a normal user would. Once inside, there is no difference between admin and a regular user of that home.

---

## 6. Security

- `homeMiddleware` verifies both: (a) `homeId` is in JWT, (b) user is admin OR email is in `home_members` for that home — prevents a valid JWT from accessing an unauthorized home if somehow forged or reused
- Delete home requires admin; no Google user can delete a home
- Case-insensitive email comparison throughout (same as existing auth)
- `POST /api/session/enter-home` validates access before issuing new JWT — a Google user cannot enter a home they are not a member of

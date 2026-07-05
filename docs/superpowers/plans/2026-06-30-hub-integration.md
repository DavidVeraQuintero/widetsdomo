# Hub Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional Hubitat + Home Assistant hub connectivity to the dashboard; demo mode is fully preserved when no hub is configured.

**Architecture:** Local-first hybrid — browser calls hub directly over LAN, falls back to `/api/hub-proxy` on the backend when remote. Hub configs stored in `localStorage` + synced to server via existing WebSocket channel (`PATCH_HUBS`). Device lists are in-memory only, fetched at runtime.

**Tech Stack:** React context + useReducer (matching existing metaStore pattern), Express Router (hub proxy), better-sqlite3 (hub config persistence via `server/db.js`), react-dnd (existing DnD already in place).

---

### Task 1: Hub mapping tables

**Files:**
- Create: `src/services/hubMappings.js`

- [ ] **Step 1: Create file**

```js
// Hubitat Maker API capability → widget type IDs
export const HUBITAT_CAP_TO_WIDGETS = {
  Switch:                 ['lampara-simple', 'enchufe'],
  SwitchLevel:            ['lampara-dimmer', 'tira-led'],
  ColorControl:           ['lampara-rgb', 'tira-led-rgb'],
  ColorTemperature:       ['lampara-cct'],
  Thermostat:             ['termostato', 'aire-acondicionado', 'calefactor'],
  FanControl:             ['ventilador'],
  Lock:                   ['cerradura'],
  ContactSensor:          ['puerta', 'ventana'],
  MotionSensor:           ['sensor-movimiento'],
  PresenceSensor:         ['sensor-presencia'],
  TemperatureMeasurement: ['sensor-temp'],
  AirQuality:             ['sensor-aire'],
  SmokeDetector:          ['sensor-humo'],
  WaterSensor:            ['sensor-inundacion'],
  IlluminanceMeasurement: ['sensor-luz'],
  WindowShade:            ['persiana-roller', 'cortina', 'toldo', 'veneciana'],
};

// Home Assistant entity domain → widget type IDs
export const HA_DOMAIN_TO_WIDGETS = {
  light:         ['lampara-simple', 'lampara-dimmer', 'lampara-rgb', 'lampara-cct', 'tira-led-rgb', 'tira-led'],
  switch:        ['enchufe'],
  climate:       ['termostato', 'aire-acondicionado', 'calefactor'],
  fan:           ['ventilador'],
  lock:          ['cerradura'],
  binary_sensor: ['puerta', 'ventana', 'sensor-movimiento', 'sensor-presencia', 'sensor-humo', 'sensor-inundacion'],
  sensor:        ['sensor-temp', 'sensor-aire', 'sensor-luz'],
  cover:         ['persiana-roller', 'cortina', 'toldo', 'veneciana'],
};

// Widget types that show a device count badge and lock (0 devices) when a hub is configured
export const HUB_LOCKABLE_WIDGET_TYPES = new Set([
  'lampara-simple', 'lampara-dimmer', 'lampara-rgb', 'lampara-cct',
  'tira-led-rgb', 'tira-led', 'termostato', 'aire-acondicionado',
  'calefactor', 'ventilador', 'puerta', 'ventana', 'cerradura',
  'sensor-movimiento', 'sensor-presencia', 'sensor-temp', 'sensor-aire',
  'sensor-humo', 'sensor-inundacion', 'sensor-luz', 'enchufe',
  'persiana-roller', 'cortina', 'toldo', 'veneciana',
]);
```

- [ ] **Step 2: Commit**

```bash
git add src/services/hubMappings.js
git commit -m "feat: hub mapping tables (capability → widget type)"
```

---

### Task 2: hubClient.js — connection service

**Files:**
- Create: `src/services/hubClient.js`

- [ ] **Step 1: Create file**

```js
import { HUBITAT_CAP_TO_WIDGETS, HA_DOMAIN_TO_WIDGETS } from './hubMappings.js';

const DIRECT_TIMEOUT_MS = 5000;

async function fetchDirect(url, headers = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DIRECT_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchViaProxy(hub, path) {
  const res = await fetch('/api/hub-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: hub.type, ip: hub.ip, appId: hub.appId, token: hub.token, path }),
  });
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  return await res.json();
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
    try {
      raw = await fetchDirect(`http://${hub.ip}${path}`);
    } catch {
      usedProxy = true;
      raw = await fetchViaProxy(hub, path);
    }
    return { devices: normalizeHubitat(hub.id, hub.name, raw), usedProxy };
  }

  if (hub.type === 'homeassistant') {
    const path = '/api/states';
    const headers = { Authorization: `Bearer ${hub.token}` };
    try {
      raw = await fetchDirect(`http://${hub.ip}${path}`, headers);
    } catch {
      usedProxy = true;
      raw = await fetchViaProxy(hub, path);
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
```

- [ ] **Step 2: Commit**

```bash
git add src/services/hubClient.js
git commit -m "feat: hubClient — direct fetch with proxy fallback for Hubitat + HA"
```

---

### Task 3: hubStore.jsx — state management

**Files:**
- Create: `src/store/hubStore.jsx`

- [ ] **Step 1: Create file**

```jsx
import { createContext, useContext, useReducer, useState, useMemo, useCallback, useEffect } from 'react';
import { fetchHubDevices } from '../services/hubClient.js';

const HUB_KEY = 'domotica-hubs';

function load() {
  try {
    const raw = localStorage.getItem(HUB_KEY);
    return raw ? JSON.parse(raw) : { hubs: [] };
  } catch {
    return { hubs: [] };
  }
}

function persist(hubs) {
  localStorage.setItem(HUB_KEY, JSON.stringify({ hubs }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_HUB': {
      const hub = { id: `hub-${Date.now()}`, enabled: true, ...action.hub };
      const next = { ...state, hubs: [...state.hubs, hub] };
      persist(next.hubs);
      return next;
    }
    case 'UPDATE_HUB': {
      const next = { ...state, hubs: state.hubs.map(h => h.id === action.id ? { ...h, ...action.changes } : h) };
      persist(next.hubs);
      return next;
    }
    case 'DELETE_HUB': {
      const next = { ...state, hubs: state.hubs.filter(h => h.id !== action.id) };
      persist(next.hubs);
      return next;
    }
    case 'SET_HUBS': {
      persist(action.hubs);
      return { ...state, hubs: action.hubs };
    }
    default:
      return state;
  }
}

export const HubContext = createContext(null);

export function HubProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [devices, setDevices] = useState({}); // { [hubId]: Device[] }

  const deviceCounts = useMemo(() => {
    const counts = {};
    for (const devList of Object.values(devices)) {
      for (const dev of devList) {
        for (const wt of (dev.widgetTypes || [])) {
          counts[wt] = (counts[wt] || 0) + 1;
        }
      }
    }
    return counts;
  }, [devices]);

  const refreshHub = useCallback(async (hubId) => {
    const hub = state.hubs.find(h => h.id === hubId);
    if (!hub?.enabled) return;
    try {
      const { devices: devs } = await fetchHubDevices(hub);
      setDevices(prev => ({ ...prev, [hubId]: devs }));
    } catch {
      // keep stale data on failure
    }
  }, [state.hubs]);

  const refreshAll = useCallback(async () => {
    await Promise.all(state.hubs.filter(h => h.enabled).map(h => refreshHub(h.id)));
  }, [state.hubs, refreshHub]);

  // Fetch devices on mount and when hubs list changes
  const hubsKey = state.hubs.map(h => h.id).join(',');
  useEffect(() => {
    if (state.hubs.length > 0) refreshAll();
  }, [hubsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HubContext.Provider value={{
      hubs: state.hubs,
      devices,
      deviceCounts,
      hubsConfigured: state.hubs.length > 0,
      dispatch,
      refreshHub,
      refreshAll,
    }}>
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used inside HubProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/store/hubStore.jsx
git commit -m "feat: hubStore — local-first hub config + in-memory device cache"
```

---

### Task 4: Backend — DB + proxy endpoint

**Files:**
- Modify: `server/db.js`
- Create: `server/hubProxy.js`
- Create: `server/test/hubDb.test.js`
- Create: `server/test/hubProxy.test.js`
- Modify: `server/index.js`

- [ ] **Step 1: Add hubs table and functions to server/db.js**

In `initDB`, extend the `db.exec(...)` string with the new table (add after the `images` table CREATE):
```sql
CREATE TABLE IF NOT EXISTS hubs (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Add two functions at the bottom of `server/db.js`:
```js
export function saveHubs(json) {
  db.prepare(
    "INSERT INTO hubs (key, value) VALUES ('singleton', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  ).run(json);
}

export function getHubs() {
  const row = db.prepare("SELECT * FROM hubs WHERE key = 'singleton'").get();
  return row ? JSON.parse(row.value) : [];
}
```

Update `getAllState` to include hubs:
```js
export function getAllState() {
  const dashboards = getAllDashboards().map(row => ({
    id: row.id,
    name: row.name,
    state: JSON.parse(row.state_json),
  }));
  const metaRow = getMeta();
  const meta = metaRow ? JSON.parse(metaRow.value) : null;
  const images = getImages();
  const hubs = getHubs();
  return { dashboards, meta, images, hubs };
}
```

- [ ] **Step 2: Write DB test**

Create `server/test/hubDb.test.js`:
```js
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { initDB, saveHubs, getHubs } from '../db.js';

describe('hub db', () => {
  before(() => initDB(':memory:'));

  it('getHubs returns [] when empty', () => {
    assert.deepEqual(getHubs(), []);
  });

  it('saveHubs + getHubs round-trips data', () => {
    const hubs = [{ id: 'hub-1', name: 'Test', type: 'hubitat', ip: '192.168.1.1', appId: '1', token: 'tok', enabled: true }];
    saveHubs(JSON.stringify(hubs));
    assert.deepEqual(getHubs(), hubs);
  });

  it('saveHubs overwrites previous value', () => {
    const hubs2 = [{ id: 'hub-2', name: 'Second', type: 'homeassistant', ip: '192.168.1.2', token: 'tok2', enabled: true }];
    saveHubs(JSON.stringify(hubs2));
    assert.deepEqual(getHubs(), hubs2);
  });
});
```

- [ ] **Step 3: Run DB test**

```bash
node --test server/test/hubDb.test.js
```

Expected output: `✓ getHubs returns [] when empty`, `✓ saveHubs + getHubs round-trips data`, `✓ saveHubs overwrites previous value` — all passing.

- [ ] **Step 4: Create server/hubProxy.js**

```js
import { Router } from 'express';

const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1$|localhost$)/;

const router = Router();

router.post('/hub-proxy', async (req, res) => {
  const { type, ip, appId, token, path } = req.body ?? {};
  if (!type || !ip || !path) return res.status(400).json({ error: 'Missing required fields' });
  if (!PRIVATE_IP_RE.test(ip)) return res.status(403).json({ error: 'Only private/LAN IPs allowed' });

  let url, headers = {};
  if (type === 'hubitat') {
    url = `http://${ip}${path}`;
  } else if (type === 'homeassistant') {
    url = `http://${ip}${path}`;
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    return res.status(400).json({ error: 'Unknown hub type' });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const upstream = await fetch(url, { headers, signal: ctrl.signal });
    clearTimeout(timer);
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    clearTimeout(timer);
    res.status(502).json({ error: err.message });
  }
});

export default router;
```

- [ ] **Step 5: Write proxy IP-validation test**

Create `server/test/hubProxy.test.js`:
```js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const PRIVATE_IP_RE = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|::1$|localhost$)/;

describe('hubProxy IP validation', () => {
  it('allows 192.168.x.x', () => assert.ok(PRIVATE_IP_RE.test('192.168.11.15')));
  it('allows 10.x.x.x',    () => assert.ok(PRIVATE_IP_RE.test('10.0.0.1')));
  it('allows 127.x.x.x',   () => assert.ok(PRIVATE_IP_RE.test('127.0.0.1')));
  it('allows localhost',    () => assert.ok(PRIVATE_IP_RE.test('localhost')));
  it('allows 172.16.x.x',  () => assert.ok(PRIVATE_IP_RE.test('172.16.0.1')));
  it('blocks 8.8.8.8',     () => assert.ok(!PRIVATE_IP_RE.test('8.8.8.8')));
  it('blocks example.com', () => assert.ok(!PRIVATE_IP_RE.test('example.com')));
});
```

- [ ] **Step 6: Run proxy test**

```bash
node --test server/test/hubProxy.test.js
```

Expected: 7 passing tests.

- [ ] **Step 7: Wire hubProxy into server/index.js**

Add import alongside existing imports at top of `server/index.js`:
```js
import { saveHubs, getHubs } from './db.js';
import hubProxyRouter from './hubProxy.js';
```

Add route after `app.use('/api', imageRouter)`:
```js
app.use('/api', hubProxyRouter);
```

Inside the WebSocket `switch (msg.type)` block, add before the closing `}`:
```js
case 'PATCH_HUBS': {
  const { hubs, ts } = msg;
  if (Array.isArray(hubs)) {
    saveHubs(JSON.stringify(hubs));
    broadcast({ type: 'PATCH_HUBS', hubs, ts }, ws);
  }
  break;
}
```

In the existing `SEED_STATE` case, add hub seeding after the dashboards loop:
```js
case 'SEED_STATE': {
  const existing = getAllDashboards();
  if (existing.length > 0) {
    ws.send(JSON.stringify({ type: 'FULL_STATE', ...getAllState() }));
    break;
  }
  const { dashboards, meta, hubs } = msg;
  if (Array.isArray(dashboards)) {
    dashboards.forEach(({ id, name, state }) => { saveDashboard(id, name, JSON.stringify(state)); });
  }
  if (meta) saveMeta(JSON.stringify(meta));
  if (Array.isArray(hubs) && hubs.length > 0) saveHubs(JSON.stringify(hubs));
  broadcast({ type: 'FULL_STATE', ...getAllState() }, ws);
  break;
}
```

- [ ] **Step 8: Commit**

```bash
git add server/db.js server/hubProxy.js server/index.js server/test/hubDb.test.js server/test/hubProxy.test.js
git commit -m "feat: hub proxy endpoint, DB persistence, WS PATCH_HUBS handler"
```

---

### Task 5: Hub sync — extend syncStore

**Files:**
- Modify: `src/store/syncStore.jsx`

- [ ] **Step 1: Import HubContext**

At the top of `src/store/syncStore.jsx`, add:
```js
import { HubContext } from './hubStore.jsx';
```

- [ ] **Step 2: Consume hub context inside SyncProvider**

Inside `SyncProvider`, alongside the existing context reads:
```js
const hubCtx = useContext(HubContext);
```

Add a pending ref alongside the existing ones:
```js
const hubPendingRemote = useRef(false);
```

- [ ] **Step 3: Handle incoming hub messages**

In `handleIncoming`, inside `case 'FULL_STATE'`, add after the existing meta block:
```js
if (Array.isArray(msg.hubs) && msg.hubs.length > 0) {
  serverHasData.current = true;
  hubPendingRemote.current = true;
  hubCtx.dispatch({ type: 'SET_HUBS', hubs: msg.hubs });
}
```

Add a new case after `PATCH_META`:
```js
case 'PATCH_HUBS': {
  if (Array.isArray(msg.hubs)) {
    hubPendingRemote.current = true;
    hubCtx.dispatch({ type: 'SET_HUBS', hubs: msg.hubs });
  }
  break;
}
```

- [ ] **Step 4: Add outgoing hub sync effect**

After the existing meta `useEffect`, add:
```js
useEffect(() => {
  if (hubPendingRemote.current) {
    hubPendingRemote.current = false;
    return;
  }
  if (wsRef.current?.readyState !== WebSocket.OPEN) return;
  send({ type: 'PATCH_HUBS', hubs: hubCtx.hubs, ts: Date.now() });
}, [hubCtx.hubs]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 5: Include hubs in SEED_STATE payload**

In the `SEED_STATE` `useEffect` (the one that calls `send({ type: 'SEED_STATE', ... })`), add `hubs: hubCtx.hubs` to the payload:
```js
send({
  type: 'SEED_STATE',
  dashboards: metaCtx.state.dashboards.map(/* existing mapper */),
  meta: metaToSync,
  hubs: hubCtx.hubs,
});
```

- [ ] **Step 6: Commit**

```bash
git add src/store/syncStore.jsx
git commit -m "feat: hub config sync via WebSocket PATCH_HUBS"
```

---

### Task 6: Wire HubProvider + add 🏠 tab

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add imports**

At the top of `src/App.jsx`, add:
```js
import { HubProvider } from './store/hubStore.jsx';
import HubsTab from './components/Hubs/HubsTab.jsx';
```

- [ ] **Step 2: Add 🏠 to TABS**

Replace the TABS constant:
```js
const TABS = [
  { id: 'widgets', icon: '📦', label: 'Widgets' },
  { id: 'props',   icon: '⚙',  label: 'Propiedades' },
  { id: 'temas',   icon: '🎨', label: 'Temas' },
  { id: 'iconos',  icon: '🔣', label: 'Iconos' },
  { id: 'hubs',    icon: '🏠', label: 'Hubs' },
];
```

- [ ] **Step 3: Add HubsTab to tabContent**

In `AppContent`, inside `<div className={styles.tabContent}>`, add:
```jsx
{activeTab === 'hubs' && <HubsTab />}
```

- [ ] **Step 4: Wrap root with HubProvider**

In `export default function App()`, wrap so HubProvider is inside MetaProvider but outside CalendarProvider:
```jsx
export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'unconfigured_client_id';
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <MetaProvider>
        <HubProvider>
          <CalendarProvider>
            <DashboardTabs />
            <DndAppWrapper />
          </CalendarProvider>
        </HubProvider>
      </MetaProvider>
    </GoogleOAuthProvider>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add HubProvider + 🏠 Hubs tab to floating panel"
```

---

### Task 7: Hub UI — CSS + HubsTab + HubForm + DeviceCatalog

**Files:**
- Create: `src/components/Hubs/Hubs.module.css`
- Create: `src/components/Hubs/DeviceCatalog.jsx`
- Create: `src/components/Hubs/HubForm.jsx`
- Create: `src/components/Hubs/HubsTab.jsx`

- [ ] **Step 1: Create Hubs.module.css**

```css
/* Container */
.container { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

/* Section headers */
.section { padding: 10px 12px 6px; }
.sectionTitle { color: #6366f1; font-size: 10px; font-weight: 700; letter-spacing: .08em; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.addBtn { background: #6366f1; color: #fff; border: none; border-radius: 5px; padding: 3px 10px; font-size: 10px; cursor: pointer; }
.addBtn:hover { background: #818cf8; }
.divider { height: 1px; background: #2a2a3e; }
.empty { color: #64748b; font-size: 11px; text-align: center; padding: 20px 12px; }

/* Hub list */
.hubItem { background: #2a2a3e; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; border: 1px solid #3a3a5e; cursor: pointer; }
.hubItem:last-child { margin-bottom: 0; }
.statusDot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.statusDot.online { background: #22c55e; }
.statusDot.offline { background: #f59e0b; }
.hubInfo { flex: 1; overflow: hidden; }
.hubName { color: #e2e8f0; font-weight: 600; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hubMeta { color: #64748b; font-size: 9px; }
.iconBtn { background: none; border: none; color: #64748b; cursor: pointer; font-size: 13px; padding: 2px 4px; line-height: 1; }
.iconBtn:hover { color: #e2e8f0; }

/* Device catalog */
.deviceList { flex: 1; overflow-y: auto; padding: 4px 12px 8px; }
.pills { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
.pill { background: #2a2a3e; color: #94a3b8; border-radius: 20px; padding: 2px 10px; font-size: 9px; cursor: pointer; border: none; }
.pill.active { background: #6366f1; color: #fff; }
.deviceItem { background: #2a2a3e; border-radius: 6px; padding: 7px 10px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
.deviceIcon { font-size: 15px; flex-shrink: 0; }
.deviceInfo { flex: 1; overflow: hidden; }
.deviceName { color: #e2e8f0; font-size: 10px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.deviceMeta { color: #64748b; font-size: 9px; }
.reachDot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.reachDot.on { background: #22c55e; }
.reachDot.off { background: #475569; }

/* Form */
.form { padding: 10px 12px; overflow-y: auto; flex: 1; }
.formHeader { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.backBtn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; padding: 0; line-height: 1; }
.backBtn:hover { color: #e2e8f0; }
.formTitle { color: #e2e8f0; font-size: 12px; font-weight: 600; }
.typeSelector { display: flex; gap: 6px; margin-bottom: 10px; }
.typeBtn { flex: 1; background: #2a2a3e; border: 2px solid transparent; border-radius: 7px; padding: 7px 8px; text-align: center; cursor: pointer; }
.typeBtn.selected { border-color: #6366f1; }
.typeEmoji { font-size: 16px; display: block; margin-bottom: 2px; }
.typeName { color: #94a3b8; font-size: 9px; display: block; }
.typeBtn.selected .typeName { color: #e2e8f0; }
.field { margin-bottom: 8px; }
.label { color: #64748b; font-size: 9px; font-weight: 700; letter-spacing: .08em; margin-bottom: 4px; display: block; }
.input { width: 100%; background: #2a2a3e; border: 1px solid #3a3a5e; border-radius: 6px; padding: 7px 10px; color: #e2e8f0; font-size: 11px; box-sizing: border-box; }
.input:focus { outline: none; border-color: #6366f1; }
.fieldRow { display: flex; gap: 6px; }
.fieldRow .field { flex: 1; }
.testResult { border-radius: 6px; padding: 7px 10px; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; font-size: 10px; }
.testResult.ok { background: #0d2d1a; border: 1px solid #22c55e; color: #22c55e; }
.testResult.proxy { background: #2d2200; border: 1px solid #f59e0b; color: #f59e0b; }
.testResult.error { background: #2d0d0d; border: 1px solid #ef4444; color: #ef4444; }
.testResult.checking { background: transparent; border: 1px solid #2a2a3e; color: #64748b; }
.testDot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.saveBtn { width: 100%; background: #6366f1; color: #fff; border: none; border-radius: 8px; padding: 9px; font-size: 11px; font-weight: 600; cursor: pointer; }
.saveBtn:hover { background: #818cf8; }
.saveBtn:disabled { opacity: 0.5; cursor: not-allowed; }
.deleteBtn { width: 100%; background: transparent; color: #ef4444; border: 1px solid #3a3a5e; border-radius: 8px; padding: 7px; font-size: 11px; cursor: pointer; margin-top: 6px; }
.deleteBtn:hover { background: #2d0d0d; }

/* Device picker modal */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
.modal { background: #1e1e2e; border-radius: 14px; width: 100%; max-width: 340px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.7); }
.modalHeader { padding: 14px 16px 0; }
.modalTitleRow { display: flex; align-items: center; gap: 10px; }
.modalIcon { font-size: 22px; }
.modalTitle { color: #e2e8f0; font-size: 13px; font-weight: 700; }
.modalSub { color: #64748b; font-size: 10px; margin-top: 2px; }
.modalDivider { height: 1px; background: #2a2a3e; margin: 12px 0 8px; }
.pickerList { padding: 0 12px; display: flex; flex-direction: column; gap: 6px; max-height: 220px; overflow-y: auto; }
.pickerItem { background: #2a2a3e; border-radius: 9px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; border: 2px solid transparent; }
.pickerItem.selected { border-color: #6366f1; }
.pickerInfo { flex: 1; overflow: hidden; }
.pickerName { color: #e2e8f0; font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pickerMeta { color: #64748b; font-size: 9px; }
.radio { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #3a3a5e; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.radio.checked { background: #6366f1; border-color: #6366f1; }
.radioInner { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
.modalFooter { padding: 12px; display: flex; gap: 8px; }
.cancelBtn { flex: 1; background: #2a2a3e; color: #94a3b8; border: none; border-radius: 8px; padding: 9px; font-size: 11px; cursor: pointer; }
.confirmBtn { flex: 2; background: #6366f1; color: #fff; border: none; border-radius: 8px; padding: 9px; font-size: 11px; font-weight: 600; cursor: pointer; }
.confirmBtn:disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 2: Create DeviceCatalog.jsx**

```jsx
import { useState } from 'react';
import styles from './Hubs.module.css';

const WIDGET_ICONS = {
  'lampara-simple': '💡', 'lampara-dimmer': '🔆', 'lampara-rgb': '🎨', 'lampara-cct': '💫',
  'tira-led-rgb': '✨', 'tira-led': '✨', 'enchufe': '🔌', 'termostato': '🌡',
  'aire-acondicionado': '❄', 'calefactor': '🔥', 'ventilador': '🌀',
  'sensor-temp': '🌡', 'sensor-aire': '💨', 'sensor-humo': '🔥',
  'sensor-inundacion': '💧', 'sensor-luz': '☀', 'sensor-movimiento': '👁',
  'sensor-presencia': '🧑', 'puerta': '🚪', 'ventana': '🪟', 'cerradura': '🔒',
  'persiana-roller': '📋', 'cortina': '🎭', 'toldo': '⛺', 'veneciana': '🪞',
};

const TYPE_LABELS = {
  'lampara-simple': 'Luz', 'lampara-dimmer': 'Dimmer', 'lampara-rgb': 'RGB',
  'lampara-cct': 'CCT', 'tira-led-rgb': 'Tira RGB', 'tira-led': 'Tira LED',
  'enchufe': 'Enchufe', 'termostato': 'Termostato', 'aire-acondicionado': 'AC',
  'calefactor': 'Calefactor', 'ventilador': 'Ventilador',
  'sensor-temp': 'Temp/Hum', 'sensor-aire': 'Calidad Aire', 'sensor-humo': 'Humo',
  'sensor-inundacion': 'Agua', 'sensor-luz': 'Luz', 'sensor-movimiento': 'Movimiento',
  'sensor-presencia': 'Presencia', 'puerta': 'Puerta', 'ventana': 'Ventana',
  'cerradura': 'Cerradura', 'persiana-roller': 'Persiana', 'cortina': 'Cortina',
  'toldo': 'Toldo', 'veneciana': 'Veneciana',
};

export default function DeviceCatalog({ hub, devList }) {
  const [filter, setFilter] = useState('all');

  if (!hub) return <div className={styles.empty}>Seleccioná un hub para ver sus dispositivos</div>;
  if (!devList?.length) return <div className={styles.empty}>Sin dispositivos — usá ↻ para sincronizar</div>;

  // Unique widget types present in this hub's devices (max 5 pills + "all")
  const presentTypes = [...new Set(devList.flatMap(d => d.widgetTypes))].slice(0, 5);
  const filtered = filter === 'all' ? devList : devList.filter(d => d.widgetTypes.includes(filter));

  return (
    <div className={styles.deviceList}>
      <div className={styles.pills}>
        <button className={`${styles.pill} ${filter === 'all' ? styles.active : ''}`} onClick={() => setFilter('all')}>
          Todos ({devList.length})
        </button>
        {presentTypes.map(t => (
          <button key={t} className={`${styles.pill} ${filter === t ? styles.active : ''}`} onClick={() => setFilter(t)}>
            {WIDGET_ICONS[t] || '📦'} {TYPE_LABELS[t] || t}
          </button>
        ))}
      </div>
      {filtered.map(dev => (
        <div key={dev.deviceId} className={styles.deviceItem}>
          <span className={styles.deviceIcon}>{WIDGET_ICONS[dev.widgetTypes[0]] || '📦'}</span>
          <div className={styles.deviceInfo}>
            <div className={styles.deviceName}>{dev.name}</div>
            <div className={styles.deviceMeta}>{TYPE_LABELS[dev.widgetTypes[0]] || dev.widgetTypes[0] || '—'}</div>
          </div>
          <div className={`${styles.reachDot} ${dev.reachable ? styles.on : styles.off}`} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create HubForm.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useHub } from '../../store/hubStore.jsx';
import { testHubConnection } from '../../services/hubClient.js';
import styles from './Hubs.module.css';

export default function HubForm({ editHub, onDone }) {
  const { dispatch, refreshHub } = useHub();
  const [type, setType]   = useState(editHub?.type  || 'hubitat');
  const [name, setName]   = useState(editHub?.name  || '');
  const [ip,   setIp]     = useState(editHub?.ip    || '');
  const [appId, setAppId] = useState(editHub?.appId || '');
  const [token, setToken] = useState(editHub?.token || '');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Auto-test connection 800ms after user stops typing key fields
  useEffect(() => {
    const hasRequired = ip && token && (type === 'hubitat' ? !!appId : true);
    if (!hasRequired) { setTestResult(null); return; }
    const t = setTimeout(async () => {
      setTesting(true);
      const r = await testHubConnection({ type, ip, appId, token, id: editHub?.id || 'preview', name: name || ip });
      setTestResult(r);
      setTesting(false);
    }, 800);
    return () => clearTimeout(t);
  }, [type, ip, appId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    const hubData = { type, name: name || ip, ip, appId, token };
    if (editHub) {
      dispatch({ type: 'UPDATE_HUB', id: editHub.id, changes: hubData });
      refreshHub(editHub.id);
    } else {
      dispatch({ type: 'ADD_HUB', hub: hubData });
    }
    onDone();
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_HUB', id: editHub.id });
    onDone();
  };

  const canSave = !!(name && ip && token && (type === 'hubitat' ? appId : true));

  return (
    <div className={styles.form}>
      <div className={styles.formHeader}>
        <button className={styles.backBtn} onClick={onDone}>←</button>
        <span className={styles.formTitle}>{editHub ? 'Editar Hub' : 'Agregar Hub'}</span>
      </div>

      <div className={styles.typeSelector}>
        {[{ id: 'hubitat', emoji: '🏠', label: 'Hubitat' }, { id: 'homeassistant', emoji: '🤖', label: 'Home Assistant' }].map(t => (
          <button key={t.id} className={`${styles.typeBtn} ${type === t.id ? styles.selected : ''}`} onClick={() => setType(t.id)}>
            <span className={styles.typeEmoji}>{t.emoji}</span>
            <span className={styles.typeName}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>NOMBRE</label>
        <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Casa Principal" />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>IP / URL</label>
        <input className={styles.input} value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.11.15" />
      </div>

      {type === 'hubitat' && (
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>APP ID</label>
            <input className={styles.input} value={appId} onChange={e => setAppId(e.target.value)} placeholder="12" />
          </div>
          <div className={styles.field} style={{ flex: 2 }}>
            <label className={styles.label}>ACCESS TOKEN</label>
            <input className={styles.input} type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="••••••••" />
          </div>
        </div>
      )}

      {type === 'homeassistant' && (
        <div className={styles.field}>
          <label className={styles.label}>LONG-LIVED TOKEN</label>
          <input className={styles.input} type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="eyJ..." />
        </div>
      )}

      {testing && (
        <div className={`${styles.testResult} ${styles.checking}`}>
          <div className={styles.testDot} />Probando conexión...
        </div>
      )}
      {!testing && testResult && (
        <div className={`${styles.testResult} ${testResult.ok ? (testResult.usedProxy ? styles.proxy : styles.ok) : styles.error}`}>
          <div className={styles.testDot} />
          {testResult.ok
            ? `${testResult.usedProxy ? 'Proxy' : 'Directo'} OK · ${testResult.count} dispositivos`
            : `Error: ${testResult.error}`}
        </div>
      )}

      <button className={styles.saveBtn} onClick={handleSave} disabled={!canSave}>
        {editHub ? 'Guardar cambios' : 'Agregar hub'}
      </button>
      {editHub && (
        <button className={styles.deleteBtn} onClick={handleDelete}>Eliminar hub</button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create HubsTab.jsx**

```jsx
import { useState } from 'react';
import { useHub } from '../../store/hubStore.jsx';
import HubForm from './HubForm.jsx';
import DeviceCatalog from './DeviceCatalog.jsx';
import styles from './Hubs.module.css';

export default function HubsTab() {
  const { hubs, devices, refreshHub } = useHub();
  // null = list view, 'new' = add form, hub object = edit form
  const [formHub, setFormHub] = useState(null);
  const [selectedHubId, setSelectedHubId] = useState(() => hubs[0]?.id ?? null);

  if (formHub !== null) {
    return (
      <HubForm
        editHub={formHub === 'new' ? null : formHub}
        onDone={() => setFormHub(null)}
      />
    );
  }

  const selectedHub = hubs.find(h => h.id === selectedHubId) ?? null;
  const devList = selectedHubId ? (devices[selectedHubId] || []) : [];

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          HUBS CONECTADOS
          <button className={styles.addBtn} onClick={() => setFormHub('new')}>+ Agregar</button>
        </div>
        {hubs.length === 0 && (
          <div className={styles.empty}>Sin hubs — conectá Hubitat o Home Assistant</div>
        )}
        {hubs.map(hub => {
          const devCount = (devices[hub.id] || []).length;
          return (
            <div
              key={hub.id}
              className={styles.hubItem}
              onClick={() => setSelectedHubId(hub.id)}
              style={{ outline: selectedHubId === hub.id ? '2px solid #6366f1' : 'none', outlineOffset: '-2px' }}
            >
              <div className={`${styles.statusDot} ${devCount > 0 ? styles.online : styles.offline}`} />
              <div className={styles.hubInfo}>
                <div className={styles.hubName}>{hub.name}</div>
                <div className={styles.hubMeta}>{hub.ip} · {devCount > 0 ? `${devCount} dispositivos` : 'sin conexión'}</div>
              </div>
              <button className={styles.iconBtn} title="Sincronizar" onClick={e => { e.stopPropagation(); refreshHub(hub.id); }}>↻</button>
              <button className={styles.iconBtn} title="Editar" onClick={e => { e.stopPropagation(); setFormHub(hub); }}>✎</button>
            </div>
          );
        })}
      </div>

      {hubs.length > 0 && (
        <>
          <div className={styles.divider} />
          <div className={styles.section} style={{ paddingBottom: 2 }}>
            <div className={styles.sectionTitle}>
              DISPOSITIVOS{selectedHub ? ` · ${selectedHub.name}` : ''}
            </div>
          </div>
          <DeviceCatalog hub={selectedHub} devList={devList} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Hubs/
git commit -m "feat: HubsTab, HubForm, DeviceCatalog UI with auto-test connection"
```

---

### Task 8: Sidebar badges + WidgetItem lock

**Files:**
- Modify: `src/components/Sidebar/WidgetItem.jsx`
- Modify: `src/components/Sidebar/Sidebar.module.css`

- [ ] **Step 1: Replace WidgetItem.jsx**

Full file replacement — this replaces the entire content of `src/components/Sidebar/WidgetItem.jsx`:

```jsx
import { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { useHub } from '../../store/hubStore.jsx';
import { HUB_LOCKABLE_WIDGET_TYPES } from '../../services/hubMappings.js';
import DevicePickerModal from '../Hubs/DevicePickerModal.jsx';
import styles from './Sidebar.module.css';

export default function WidgetItem({ def, onAddWidget }) {
  const { dispatch } = useDashboard();
  const { hubsConfigured, deviceCounts, devices: allDevices } = useHub();
  const isMobile = typeof window !== 'undefined'
    ? !window.matchMedia('(any-pointer: fine)').matches
    : false;
  const longPressTimer = useRef(null);
  const touchStartPos = useRef(null);
  const [pickerData, setPickerData] = useState(null); // { matchingDevices, doAdd }

  const isLockable = HUB_LOCKABLE_WIDGET_TYPES.has(def.id);
  const count = deviceCounts[def.id] ?? 0;
  const isLocked = hubsConfigured && isLockable && count === 0;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'WIDGET',
    item: { widgetType: def.id, def },
    canDrag: () => !isLocked,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const doAdd = (config, touch) => {
    const canvas = document.querySelector('[class*="canvasInner"]');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, touch.clientX - rect.left);
    const y = Math.max(0, touch.clientY - rect.top);
    const widgetId = `${def.id}-${Date.now()}`;
    dispatch({
      type: 'ADD_WIDGET',
      payload: { id: widgetId, type: def.id, x, y, size: def.sizes[Math.min(1, def.sizes.length - 1)], config },
    });
    if (typeof window !== 'undefined') window.widgetIdBeingDragged = widgetId;
    if (onAddWidget) {
      setTimeout(() => {
        if (typeof window !== 'undefined') window.closingSidebar = true;
        onAddWidget();
        setTimeout(() => { if (typeof window !== 'undefined') window.closingSidebar = false; }, 200);
      }, 50);
    }
  };

  const handleMobileLongPress = (e) => {
    if (isLocked) return;
    const touch = e.touches[0];

    if (hubsConfigured && isLockable) {
      const matchingDevs = Object.values(allDevices).flat().filter(d => d.widgetTypes.includes(def.id));
      if (matchingDevs.length === 1) {
        const dev = matchingDevs[0];
        doAdd({ ...def.defaultConfig, hubId: dev.hubId, deviceId: dev.deviceId, hubDeviceName: dev.name }, touch);
      } else if (matchingDevs.length >= 2) {
        setPickerData({
          matchingDevices: matchingDevs,
          doAdd: (dev) => doAdd({ ...def.defaultConfig, hubId: dev.hubId, deviceId: dev.deviceId, hubDeviceName: dev.name }, touch),
        });
      }
      return;
    }
    doAdd({ ...def.defaultConfig }, touch);
  };

  const handleTouchStart = (e) => {
    if (!isMobile || isLocked) return;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimer.current = setTimeout(() => handleMobileLongPress(e), 500);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !touchStartPos.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    touchStartPos.current = null;
  };

  return (
    <>
      <div
        ref={!isMobile && !isLocked ? drag : null}
        onTouchStart={isMobile ? handleTouchStart : null}
        onTouchMove={isMobile ? handleTouchMove : null}
        onTouchCancel={isMobile ? handleTouchCancel : null}
        className={`${styles.item} ${isDragging ? styles.dragging : ''} ${isLocked ? styles.locked : ''}`}
        title={isLocked
          ? `Sin dispositivos de tipo "${def.name}" en tus hubs`
          : `${isMobile ? 'Presiona y sostén' : 'Arrastra al canvas'} · Tamaños: ${def.sizes.join(', ')}`}
      >
        <span className={`${styles.itemIcon} ${isLocked ? styles.lockedIcon : ''}`}>{def.icon}</span>
        <span className={styles.itemName}>{def.name}</span>
        {isLocked
          ? <span className={styles.itemLock}>🔒</span>
          : hubsConfigured && isLockable && count > 0
            ? <span className={styles.itemDeviceBadge}>{count}</span>
            : <span className={styles.itemBadge}>{def.sizes.length}</span>
        }
      </div>
      {pickerData && (
        <DevicePickerModal
          widgetType={def.id}
          def={def}
          devices={pickerData.matchingDevices}
          onConfirm={(dev) => { pickerData.doAdd(dev); setPickerData(null); }}
          onCancel={() => setPickerData(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Add locked styles to Sidebar.module.css**

Append to `src/components/Sidebar/Sidebar.module.css`:
```css
.locked { opacity: 0.4; cursor: not-allowed; filter: grayscale(0.5); }
.lockedIcon { filter: grayscale(1); }
.itemLock { font-size: 10px; margin-left: auto; }
.itemDeviceBadge { background: #22c55e; color: #fff; border-radius: 20px; padding: 1px 7px; font-size: 9px; font-weight: 700; margin-left: auto; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar/WidgetItem.jsx src/components/Sidebar/Sidebar.module.css
git commit -m "feat: sidebar device badges + locked state + mobile picker"
```

---

### Task 9: DevicePickerModal + Canvas drop wiring

**Files:**
- Create: `src/components/Hubs/DevicePickerModal.jsx`
- Modify: `src/components/Canvas/Canvas.jsx`

- [ ] **Step 1: Create DevicePickerModal.jsx**

```jsx
import { useState } from 'react';
import styles from './Hubs.module.css';

export default function DevicePickerModal({ widgetType, def, devices, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(devices[0]?.deviceId ?? null);
  const selectedDevice = devices.find(d => d.deviceId === selected) ?? null;

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <span className={styles.modalIcon}>{def.icon}</span>
            <div>
              <div className={styles.modalTitle}>{def.name}</div>
              <div className={styles.modalSub}>Seleccioná el dispositivo a controlar</div>
            </div>
          </div>
          <div className={styles.modalDivider} />
        </div>

        <div className={styles.pickerList}>
          {devices.map(dev => (
            <div
              key={dev.deviceId}
              className={`${styles.pickerItem} ${selected === dev.deviceId ? styles.selected : ''}`}
              onClick={() => setSelected(dev.deviceId)}
            >
              <div className={`${styles.reachDot} ${dev.reachable ? styles.on : styles.off}`} />
              <div className={styles.pickerInfo}>
                <div className={styles.pickerName}>{dev.name}</div>
                <div className={styles.pickerMeta}>{dev.hubName}</div>
              </div>
              <div className={`${styles.radio} ${selected === dev.deviceId ? styles.checked : ''}`}>
                {selected === dev.deviceId && <div className={styles.radioInner} />}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
          <button className={styles.confirmBtn} disabled={!selectedDevice} onClick={() => onConfirm(selectedDevice)}>
            Agregar widget →
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add imports to Canvas.jsx**

At the top of `src/components/Canvas/Canvas.jsx`, add to existing imports:
```js
import { useState } from 'react';
import { useHub } from '../../store/hubStore.jsx';
import { HUB_LOCKABLE_WIDGET_TYPES } from '../../services/hubMappings.js';
import DevicePickerModal from '../Hubs/DevicePickerModal.jsx';
```

Note: `useState` may already be imported — add it to the existing destructure if so.

- [ ] **Step 3: Add hub state inside Canvas component**

Inside `export default function Canvas()`, after the existing `const { state, dispatch }` line, add:
```js
const { hubsConfigured, devices: hubDevices } = useHub();
const [pendingDrop, setPendingDrop] = useState(null);
// pendingDrop: { widgetType, def, x, y, matchingDevices } | null
```

- [ ] **Step 4: Replace the drop callback in useDrop**

Find the current `drop: (item, monitor) => { ... dispatch({ type: 'ADD_WIDGET', ... }) }` block inside `useDrop` and replace the entire callback body with:

```js
drop: (item, monitor) => {
  if (monitor.didDrop()) return;
  const offset = monitor.getClientOffset();
  if (!offset || !innerRef.current) return;

  const rect = innerRef.current.getBoundingClientRect();
  const type = item.widgetType;
  const def = getCatalogEntry(type);
  if (!def) return;

  const wSize = WIDGET_SIZES[def.sizes[Math.min(1, def.sizes.length - 1)]] || WIDGET_SIZES['2x2'];
  const maxX = Math.max(0, canvasW - wSize.width);
  const maxY = Math.max(0, canvasH - wSize.height);
  const x = snap(Math.min(maxX, Math.max(0, (offset.x - rect.left) / 1 - 45)));
  const y = snap(Math.min(maxY, Math.max(0, (offset.y - rect.top) / 1 - 45)));

  const addDirect = (extraConfig = {}) => {
    dispatch({
      type: 'ADD_WIDGET',
      payload: {
        id: `${type}-${Date.now()}`, type, x, y,
        size: def.sizes[Math.min(1, def.sizes.length - 1)],
        config: { ...def.defaultConfig, ...extraConfig },
      },
    });
  };

  if (hubsConfigured && HUB_LOCKABLE_WIDGET_TYPES.has(type)) {
    const matchingDevices = Object.values(hubDevices).flat().filter(d => d.widgetTypes.includes(type));
    if (matchingDevices.length === 1) {
      const dev = matchingDevices[0];
      addDirect({ hubId: dev.hubId, deviceId: dev.deviceId, hubDeviceName: dev.name });
    } else if (matchingDevices.length >= 2) {
      setPendingDrop({ widgetType: type, def, x, y, matchingDevices });
    }
    return;
  }

  addDirect();
},
```

- [ ] **Step 5: Render picker modal in Canvas JSX**

Find the outermost `<div>` returned by `Canvas` (the one with `ref={canvasRef}`). Just before its closing tag, add:

```jsx
{pendingDrop && (
  <DevicePickerModal
    widgetType={pendingDrop.widgetType}
    def={pendingDrop.def}
    devices={pendingDrop.matchingDevices}
    onConfirm={(dev) => {
      dispatch({
        type: 'ADD_WIDGET',
        payload: {
          id: `${pendingDrop.widgetType}-${Date.now()}`,
          type: pendingDrop.widgetType,
          x: pendingDrop.x,
          y: pendingDrop.y,
          size: pendingDrop.def.sizes[Math.min(1, pendingDrop.def.sizes.length - 1)],
          config: { ...pendingDrop.def.defaultConfig, hubId: dev.hubId, deviceId: dev.deviceId, hubDeviceName: dev.name },
        },
      });
      setPendingDrop(null);
    }}
    onCancel={() => setPendingDrop(null)}
  />
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Hubs/DevicePickerModal.jsx src/components/Canvas/Canvas.jsx
git commit -m "feat: DevicePickerModal + Canvas drop wiring (auto-assign 1 device, picker 2+)"
```

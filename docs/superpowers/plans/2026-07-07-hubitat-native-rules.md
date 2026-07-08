# Hubitat Native Automation Rules — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy automation rules created in the frontend directly to a Hubitat C8 Pro as a Groovy app, so they execute natively 24/7 without the browser open.

**Architecture:** A Groovy app installed on Hubitat exposes 4 OAuth HTTP endpoints (GET/POST/PUT/DELETE rules). The frontend saves rules to the hub via the existing hub proxy. The browser rules engine skips synced rules to avoid double-firing. A "Probar" button tests rules locally; "Guardar en Hubitat" deploys to the hub.

**Tech Stack:** Groovy (Hubitat SDK), React, node:test (server tests), existing hubClient/hubProxy infrastructure.

---

## File Map

| File | Change |
|---|---|
| `hubitat-app/WidetsDemoAutomations.groovy` | **NEW** — Groovy app with 4 HTTP endpoints |
| `src/services/hubClient.js` | Add `syncRuleToHubitat`, `setRuleEnabledOnHubitat`, `deleteRuleFromHubitat` |
| `src/components/Hubs/HubForm.jsx` | Add `autoAppId` + `autoToken` fields (Automation App section) — `autoToken` es el OAuth token de la Groovy app, distinto de `hub.token` (Maker API). Hubitat requiere OAuth por app; no es posible reutilizar hub.token para el path HTTP de la Groovy app. |
| `src/store/hubStore.jsx` | Expose `syncRuleToHub`, `setRuleEnabledOnHub`, `deleteRuleFromHub` via context |
| `src/rules/rulesEngine.js` | Filter out `hubitatSynced && !_testing` rules |
| `src/components/widgets/ReglaAutomatica.jsx` | Probar/Guardar buttons, test modal, badge, toggle + delete behavior |
| `src/components/PropertiesPanel/PropertiesPanel.jsx` | Delete confirmation for synced rules |
| `server/test/hubitatRuleClient.test.js` | **NEW** — tests for hubClient functions |

---

## Task 1: Groovy App

**Files:**
- Create: `hubitat-app/WidetsDemoAutomations.groovy`

- [ ] **Step 1: Create the directory and file**

```
mkdir hubitat-app
```

Create `hubitat-app/WidetsDemoAutomations.groovy` with this content:

```groovy
definition(
    name: "WidetsDomo Automations",
    namespace: "widetsdomo",
    author: "WidetsDomo",
    description: "Motor de reglas para dashboard WidetsDomo. Ejecuta automatizaciones 24/7 sin necesitar el browser.",
    category: "Convenience",
    iconUrl: "",
    iconX2Url: "",
    oauth: true
)

preferences {
    section("Autenticación") {
        input "accessToken", "text",
            title: "Token de acceso (copia el valor del campo 'autoToken' que aparece en esta página)",
            required: true
    }
    section("Dispositivos") {
        input "managedDevices", "capability.*",
            title: "Todos los dispositivos a monitorear y controlar",
            multiple: true, required: false
    }
}

mappings {
    path("/rules") {
        action: [GET: "getRules", POST: "upsertRule"]
    }
    path("/rules/:id") {
        action: [DELETE: "deleteRule"]
    }
    path("/rules/:id/enable") {
        action: [PUT: "setRuleEnabled"]
    }
    path("/ping") {
        action: [GET: "ping"]
    }
}

def installed() {
    if (!state.accessToken) createAccessToken()
    initialize()
    log.info "WidetsDomo Automations installed. App ID: ${app.id} | Token: ${state.accessToken}"
}

def updated() {
    unsubscribe()
    initialize()
}

def uninstalled() {
    unsubscribe()
}

def initialize() {
    if (!state.rules) state.rules = [:]
    if (!state.lastResults) state.lastResults = [:]
    subscribeAll()
}

// ── Auth ──────────────────────────────────────────────────────────

private boolean authorized() {
    return params.access_token && params.access_token == settings.accessToken
}

// ── HTTP Endpoints ────────────────────────────────────────────────

def ping() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson([ok: true, appId: app.id])
}

def getRules() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    def list = state.rules?.values()?.toList() ?: []
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson(list)
}

def upsertRule() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    def body = request.JSON
    if (!body?.id) { httpError(400, "Missing id"); return }
    if (!state.rules) state.rules = [:]
    state.rules[body.id] = body
    if (state.lastResults[body.id] == null) state.lastResults[body.id] = false
    unsubscribe()
    subscribeAll()
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson([ok: true])
}

def deleteRule() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    def id = params.id
    state.rules?.remove(id)
    state.lastResults?.remove(id)
    unsubscribe()
    subscribeAll()
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson([ok: true])
}

def setRuleEnabled() {
    if (!authorized()) { httpError(403, "Unauthorized"); return }
    def id = params.id
    if (!state.rules?.containsKey(id)) { httpError(404, "Rule not found"); return }
    def body = request.JSON
    state.rules[id].enabled = (body.enabled == true || body.enabled == "true")
    if (!state.rules[id].enabled) state.lastResults[id] = false
    unsubscribe()
    subscribeAll()
    render contentType: "application/json", data: groovy.json.JsonOutput.toJson([ok: true])
}

// ── Subscriptions ─────────────────────────────────────────────────

private void subscribeAll() {
    def rules = state.rules?.values()?.findAll { it?.enabled } ?: []
    def subscribed = [] as Set
    for (rule in rules) {
        def nodes = collectDeviceNodes(rule.condition)
        for (node in nodes) {
            def key = "${node.deviceId}:${node.attribute}"
            if (subscribed.contains(key)) continue
            subscribed.add(key)
            def dev = findDevice(node.deviceId)
            if (dev) subscribe(dev, node.attribute, "onDeviceEvent")
        }
    }
}

private List collectDeviceNodes(node) {
    if (node == null) return []
    if (node.type == "group") return (node.children ?: []).collectMany { collectDeviceNodes(it) }
    if (node.type == "device") return [node]
    return []
}

private def findDevice(String deviceId) {
    return managedDevices?.find { String.valueOf(it.id) == deviceId }
}

// ── Event Handler ─────────────────────────────────────────────────

def onDeviceEvent(evt) {
    def rules = state.rules?.values()?.findAll { it?.enabled } ?: []
    for (rule in rules) {
        def refs = collectDeviceNodes(rule.condition).any { it.deviceId == String.valueOf(evt.deviceId) }
        if (!refs) continue
        def result = evalNode(rule.condition)
        def prev = state.lastResults?[rule.id] ?: false
        if (result && !prev) executeActions(rule.actions ?: [])
        if (!state.lastResults) state.lastResults = [:]
        state.lastResults[rule.id] = result
    }
}

// ── Evaluation ────────────────────────────────────────────────────

private boolean evalNode(node) {
    if (node == null) return false
    if (node.type == "group") {
        def children = node.children ?: []
        if (children.isEmpty()) return false
        def result = evalNode(children[0])
        for (int i = 1; i < children.size(); i++) {
            def child = children[i]
            def op = child.joinOp ?: node.operator ?: "AND"
            def val = evalNode(child)
            result = (op == "OR") ? (result || val) : (result && val)
        }
        return result
    }
    if (node.type == "device") return evalDeviceCondition(node)
    return false // time conditions not evaluated natively (v1)
}

private boolean evalDeviceCondition(cond) {
    def dev = findDevice(cond.deviceId)
    if (!dev) return false
    def actual = dev.currentValue(cond.attribute)
    if (actual == null) return false
    def op = cond.operator
    def expected = cond.value
    if (op == "eq") return String.valueOf(actual) == String.valueOf(expected)
    try {
        def a = actual as Double
        def e = expected as Double
        if (op == "gte") return a >= e
        if (op == "lte") return a <= e
    } catch (ex) { return false }
    return false
}

// ── Actions ───────────────────────────────────────────────────────

private void executeActions(actions) {
    for (action in actions) {
        def dev = findDevice(action.deviceId)
        if (!dev) { log.warn "WidetsDomo: device ${action.deviceId} not found"; continue }
        try {
            if (action.arg != null) dev."${action.command}"(action.arg)
            else dev."${action.command}"()
        } catch (ex) {
            log.warn "WidetsDomo: failed ${action.command} on ${action.deviceId}: ${ex.message}"
        }
    }
}
```

- [ ] **Step 2: Verify file exists**

```
dir hubitat-app
```

Expected: `WidetsDemoAutomations.groovy` listed.

- [ ] **Step 3: Commit**

```bash
git add hubitat-app/WidetsDemoAutomations.groovy
git commit -m "feat(groovy): add WidetsDomo Automations Hubitat app"
```

---

## Task 2: Tests for hubClient functions (TDD — write first)

**Files:**
- Create: `server/test/hubitatRuleClient.test.js`

- [ ] **Step 1: Write the failing tests**

Create `server/test/hubitatRuleClient.test.js`:

```js
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

// ── Mock fetch before importing hubClient ──────────────────────

let lastFetchArgs = null;

global.fetch = async (url, opts) => {
  lastFetchArgs = { url, opts };
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  };
};

// Mock window for browser env check
global.window = { __hubLanReachable: false };

const { syncRuleToHubitat, setRuleEnabledOnHubitat, deleteRuleFromHubitat } =
  await import('../../src/services/hubClient.js');

const HUB = {
  type: 'hubitat',
  ip: '192.168.1.10',
  autoAppId: '47',
  autoToken: 'test-token-abc',
  cloudUrl: null,
};

const RULE = {
  id: 'widget-1',
  name: 'Test',
  enabled: true,
  condition: { id: 'root', type: 'group', children: [] },
  actions: [],
};

// ── syncRuleToHubitat ──────────────────────────────────────────

test('syncRuleToHubitat: calls proxy with POST to /rules', async () => {
  await syncRuleToHubitat(HUB, RULE);
  assert.ok(lastFetchArgs, 'fetch was called');
  assert.equal(lastFetchArgs.opts.method, 'POST');
  const body = JSON.parse(lastFetchArgs.opts.body);
  assert.equal(body.path, `/apps/api/47/rules?access_token=test-token-abc`);
  const sentRule = JSON.parse(body.body ?? '{}');
  assert.equal(sentRule.id, 'widget-1');
});

// ── setRuleEnabledOnHubitat ────────────────────────────────────

test('setRuleEnabledOnHubitat: calls PUT to /rules/:id/enable', async () => {
  await setRuleEnabledOnHubitat(HUB, 'widget-1', false);
  const body = JSON.parse(lastFetchArgs.opts.body);
  assert.equal(body.path, `/apps/api/47/rules/widget-1/enable?access_token=test-token-abc`);
  assert.equal(body.method, 'PUT');
  const sent = JSON.parse(body.body ?? '{}');
  assert.equal(sent.enabled, false);
});

// ── deleteRuleFromHubitat ──────────────────────────────────────

test('deleteRuleFromHubitat: calls DELETE to /rules/:id', async () => {
  await deleteRuleFromHubitat(HUB, 'widget-1');
  const body = JSON.parse(lastFetchArgs.opts.body);
  assert.equal(body.path, `/apps/api/47/rules/widget-1?access_token=test-token-abc`);
  assert.equal(body.method, 'DELETE');
});

test('syncRuleToHubitat: throws if hub has no autoAppId', async () => {
  const hubNoApp = { ...HUB, autoAppId: null };
  await assert.rejects(
    () => syncRuleToHubitat(hubNoApp, RULE),
    /autoAppId/
  );
});
```

- [ ] **Step 2: Run tests — expect failures**

```
node --test server/test/hubitatRuleClient.test.js
```

Expected: `syncRuleToHubitat is not a function` or similar import errors (functions don't exist yet).

- [ ] **Step 3: Commit tests**

```bash
git add server/test/hubitatRuleClient.test.js
git commit -m "test(hubClient): add failing tests for Hubitat rule sync functions"
```

---

## Task 3: Add hubClient functions

**Files:**
- Modify: `src/services/hubClient.js` (add at bottom, after `checkLocalHubReachable`)

- [ ] **Step 1: Add three exported functions**

In `src/services/hubClient.js`, add after the `checkLocalHubReachable` export:

```js
// ── Automation rule management ────────────────────────────────────

function autoPath(hub, suffix) {
  if (!hub.autoAppId) throw new Error('Hub has no autoAppId configured');
  return `/apps/api/${hub.autoAppId}${suffix}?access_token=${hub.autoToken}`;
}

async function callAutoApp(hub, path, method, bodyObj) {
  const res = await fetch('/api/hub-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: hub.type,
      ip: hub.cloudUrl ? 'cloud.hubitat.com' : hub.ip,
      token: hub.autoToken,
      path,
      method,
      body: bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined,
    }),
  });
  if (!res.ok) throw new Error(`AutoApp HTTP ${res.status}`);
  return res.json();
}

export async function syncRuleToHubitat(hub, rule) {
  return callAutoApp(hub, autoPath(hub, '/rules'), 'POST', rule);
}

export async function setRuleEnabledOnHubitat(hub, ruleId, enabled) {
  return callAutoApp(hub, autoPath(hub, `/rules/${ruleId}/enable`), 'PUT', { enabled });
}

export async function deleteRuleFromHubitat(hub, ruleId) {
  return callAutoApp(hub, autoPath(hub, `/rules/${ruleId}`), 'DELETE');
}

export async function pingAutoApp(hub) {
  try {
    return await callAutoApp(hub, autoPath(hub, '/ping'), 'GET');
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
```

Note: `callAutoApp` sends `body` as a JSON string in the proxy payload. The proxy (`server/hubProxy.js`) needs to forward it — see Task 4.

- [ ] **Step 2: Run the tests — expect they may still fail if proxy body isn't forwarded**

```
node --test server/test/hubitatRuleClient.test.js
```

Expected: at least 3 tests PASS (URL construction), 1 test (throws without autoAppId) should pass.

- [ ] **Step 3: Commit**

```bash
git add src/services/hubClient.js
git commit -m "feat(hubClient): add syncRuleToHubitat, setRuleEnabled, deleteRule, ping"
```

---

## Task 4: Update hub proxy to forward body

**Files:**
- Modify: `server/hubProxy.js`

The proxy currently only forwards the HTTP method. For PUT/POST to the Groovy app, it needs to forward the body.

- [ ] **Step 1: Read current proxy handler (lines 8–44 in server/hubProxy.js) — already read above**

- [ ] **Step 2: Update the proxy to forward body**

In `server/hubProxy.js`, replace the `upstream` fetch call:

```js
// Old:
const upstream = await fetch(url, { method, headers, signal: ctrl.signal });

// New (replace that single line):
const fetchOpts = { method, headers, signal: ctrl.signal };
if (req.body?.body) {
  fetchOpts.body = req.body.body;
  fetchOpts.headers = { ...headers, 'Content-Type': 'application/json' };
}
const upstream = await fetch(url, fetchOpts);
```

- [ ] **Step 3: Run the tests again**

```
node --test server/test/hubitatRuleClient.test.js
```

Expected: all 4 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add server/hubProxy.js
git commit -m "fix(hubProxy): forward body payload for PUT/POST to Groovy app"
```

---

## Task 5: Update HubForm to add Automation App fields

**Files:**
- Modify: `src/components/Hubs/HubForm.jsx`

- [ ] **Step 1: Add state and field inside the hubitat-only section**

In `HubForm.jsx`, add two new state vars after the existing ones:

```js
const [autoAppId, setAutoAppId] = useState(editHub?.autoAppId || '');
const [autoToken, setAutoToken]  = useState(editHub?.autoToken  || '');
```

- [ ] **Step 2: Add the fields to the JSX (inside the `type === 'hubitat'` block)**

After the existing Cloud URL `<div className={styles.field}>` block (around line 93), add:

```jsx
<div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
  <div className={styles.label}>AUTOMATIZACIONES (GROOVY APP)</div>
  <div className={styles.fieldRow}>
    <div className={styles.field}>
      <label className={styles.label}>APP ID AUTO</label>
      <input
        className={styles.input}
        value={autoAppId}
        onChange={e => setAutoAppId(e.target.value)}
        placeholder="47"
      />
    </div>
    <div className={styles.field} style={{ flex: 2 }}>
      <label className={styles.label}>TOKEN AUTO</label>
      <input
        className={styles.input}
        type="password"
        value={autoToken}
        onChange={e => setAutoToken(e.target.value)}
        placeholder="••••••••"
      />
    </div>
  </div>
  <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
    Instala WidetsDomo Automations en Hubitat → Apps Code. El App ID y Token aparecen en la página de la app.
  </div>
</div>
```

- [ ] **Step 3: Include autoAppId and autoToken in handleSave**

Update `handleSave`:

```js
const handleSave = () => {
  const hubData = { type, name: name || ip, ip, appId, token, cloudUrl, autoAppId, autoToken };
  // ... rest unchanged
```

- [ ] **Step 4: Verify visually (run dev server)**

```
npm run dev
```

Open Hubs tab → edit a Hubitat hub → confirm new "Automatizaciones" section appears below Cloud URL field.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hubs/HubForm.jsx
git commit -m "feat(hubs): add autoAppId and autoToken fields for Groovy automation app"
```

---

## Task 6: Add hub wrappers to hubStore

**Files:**
- Modify: `src/store/hubStore.jsx`

- [ ] **Step 1: Import new hubClient functions**

At the top of `src/store/hubStore.jsx`, update the import:

```js
import {
  fetchHubDevices,
  sendDeviceCommand,
  syncRuleToHubitat,
  setRuleEnabledOnHubitat,
  deleteRuleFromHubitat,
  pingAutoApp,
} from '../services/hubClient.js';
```

- [ ] **Step 2: Add wrapper functions inside HubProvider (before ctxValue)**

After `updateDeviceState` definition (~line 114), add:

```js
const getAutoHub = useCallback((hubId) => {
  const hub = state.hubs.find(h => h.id === hubId);
  if (!hub?.autoAppId) return null;
  return hub;
}, [state.hubs]);

const syncRule = useCallback(async (widgetId, config, hubId) => {
  const hub = getAutoHub(hubId) ?? state.hubs.find(h => h.autoAppId);
  if (!hub) throw new Error('No hub configured with autoAppId');
  const rule = { id: widgetId, ...config };
  await syncRuleToHubitat(hub, rule);
  return hub.id;
}, [state.hubs, getAutoHub]);

const setRuleEnabled = useCallback(async (widgetId, enabled, hubId) => {
  const hub = getAutoHub(hubId) ?? state.hubs.find(h => h.autoAppId);
  if (!hub) throw new Error('No hub configured with autoAppId');
  await setRuleEnabledOnHubitat(hub, widgetId, enabled);
}, [state.hubs, getAutoHub]);

const deleteRule = useCallback(async (widgetId, hubId) => {
  const hub = getAutoHub(hubId) ?? state.hubs.find(h => h.autoAppId);
  if (!hub) throw new Error('No hub configured with autoAppId');
  await deleteRuleFromHubitat(hub, widgetId);
}, [state.hubs, getAutoHub]);

const pingHubAutoApp = useCallback(async (hubId) => {
  const hub = state.hubs.find(h => h.id === hubId);
  if (!hub) return { ok: false, error: 'Hub not found' };
  return pingAutoApp(hub);
}, [state.hubs]);
```

- [ ] **Step 3: Expose in ctxValue**

Add to the `ctxValue` object:

```js
const ctxValue = useMemo(() => ({
  // ... existing fields ...
  syncRule,
  setRuleEnabled,
  deleteRule,
  pingHubAutoApp,
}), [
  // ... existing deps ...
  syncRule, setRuleEnabled, deleteRule, pingHubAutoApp,
]);
```

- [ ] **Step 4: Commit**

```bash
git add src/store/hubStore.jsx
git commit -m "feat(hubStore): add syncRule, setRuleEnabled, deleteRule wrappers"
```

---

## Task 7: Update rulesEngine to skip synced rules

**Files:**
- Modify: `src/rules/rulesEngine.js`

- [ ] **Step 1: Update the filter in runAll**

In `src/rules/rulesEngine.js`, update the `runAll` function's filter line:

```js
// Old:
const rules = state.widgets.filter(w => w.type === 'regla-auto');

// New:
const rules = state.widgets.filter(
  w => w.type === 'regla-auto' && (!w.config.hubitatSynced || w.config._testing)
);
```

- [ ] **Step 2: Update the time-check filter too**

In the second `useEffect` (time interval), same filter:

```js
// Old:
const rules = state.widgets.filter(w => w.type === 'regla-auto');

// New:
const rules = state.widgets.filter(
  w => w.type === 'regla-auto' && (!w.config.hubitatSynced || w.config._testing)
);
```

- [ ] **Step 3: Write a quick test to verify filtering**

Create `server/test/rulesEngineFilter.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the filter logic from rulesEngine (extracted for testability)
function filterRules(widgets) {
  return widgets.filter(
    w => w.type === 'regla-auto' && (!w.config.hubitatSynced || w.config._testing)
  );
}

test('includes local (non-synced) rule', () => {
  const widgets = [{ type: 'regla-auto', config: { hubitatSynced: false } }];
  assert.equal(filterRules(widgets).length, 1);
});

test('excludes synced rule', () => {
  const widgets = [{ type: 'regla-auto', config: { hubitatSynced: true } }];
  assert.equal(filterRules(widgets).length, 0);
});

test('includes synced rule in _testing mode', () => {
  const widgets = [{ type: 'regla-auto', config: { hubitatSynced: true, _testing: true } }];
  assert.equal(filterRules(widgets).length, 1);
});

test('ignores non-regla-auto widgets', () => {
  const widgets = [
    { type: 'lampara-simple', config: {} },
    { type: 'regla-auto', config: { hubitatSynced: false } },
  ];
  assert.equal(filterRules(widgets).length, 1);
});
```

- [ ] **Step 4: Run the test**

```
node --test server/test/rulesEngineFilter.test.js
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/rules/rulesEngine.js server/test/rulesEngineFilter.test.js
git commit -m "feat(rulesEngine): skip hubitatSynced rules unless in _testing mode"
```

---

## Task 8: Update ReglaAutomatica modal

**Files:**
- Modify: `src/components/widgets/ReglaAutomatica.jsx`

This task adds to the `ConfigModal` component: Probar/Guardar buttons, status badge, test sub-modal, and time-condition warning.

- [ ] **Step 1: Add hubStore import and state to ConfigModal**

In the `ConfigModal` function (around line 374), add after existing state:

```js
const { syncRule, hubs } = useHub();
const [syncing, setSyncing] = useState(false);
const [syncError, setSyncError] = useState(null);
const [testing, setTesting] = useState(false);
```

- [ ] **Step 2: Add helper to detect time conditions**

Add this helper before ConfigModal:

```js
function hasTimeConditions(condition) {
  if (!condition) return false;
  if (condition.type === 'time') return true;
  if (condition.type === 'group') return (condition.children ?? []).some(hasTimeConditions);
  return false;
}
```

- [ ] **Step 3: Add handleSaveToHubitat function inside ConfigModal**

Add before the `return` of ConfigModal:

```js
const handleSaveToHubitat = async () => {
  const autoHub = hubs.find(h => h.autoAppId);
  if (!autoHub) {
    setSyncError('Configura el App ID de automatizaciones en la configuración del hub.');
    return;
  }
  setSyncing(true);
  setSyncError(null);
  try {
    // config.id is the stable Hubitat rule ID — generate once on first sync, reuse on updates
    const ruleId = config.id ?? nanoid();
    const newConfig = { ...config, id: ruleId, name: localName, condition, conditionGroups: undefined, actions };
    const hubId = await syncRule(ruleId, newConfig, autoHub.id);
    onSave({ ...newConfig, hubitatSynced: true, hubitatHubId: hubId, _testing: undefined });
  } catch (err) {
    setSyncError(err.message || 'Error al guardar en Hubitat');
  } finally {
    setSyncing(false);
  }
};

const handleProbar = () => {
  const newConfig = { ...config, name: localName, condition, conditionGroups: undefined, actions };
  onSave({ ...newConfig, _testing: true });
  setTesting(true);
};

const handleCerrarPrueba = () => {
  onSave({ ...config, _testing: undefined });
  setTesting(false);
};
```

- [ ] **Step 4: Replace the bottom "Guardar" button block in ConfigModal JSX**

The current last element is:
```jsx
<button className="w-btn" style={{ width:'100%' }} onMouseDown={stop} onClick={save}>Guardar</button>
```

Replace it with:

```jsx
{/* ── Hubitat sync section ─────────────────────────────── */}
<div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>

  {/* Status badge */}
  <div style={{ fontSize: 11, color: config.hubitatSynced ? '#48bb78' : 'var(--text-dim)' }}>
    {config.hubitatSynced ? '● En Hubitat' : '○ Solo local'}
  </div>

  {/* Time condition warning */}
  {hasTimeConditions(condition) && (
    <div style={{ fontSize: 11, color: '#ed8936', background: 'rgba(237,137,54,0.12)', borderRadius: 6, padding: '5px 8px' }}>
      Esta regla tiene condiciones de hora. Esas condiciones solo se evaluarán mientras el dashboard esté abierto.
    </div>
  )}

  {/* Error */}
  {syncError && (
    <div style={{ fontSize: 11, color: '#fc8181', background: 'rgba(252,129,129,0.1)', borderRadius: 6, padding: '5px 8px' }}>
      {syncError}
    </div>
  )}

  <div style={{ display: 'flex', gap: 8 }}>
    <button
      className="w-btn"
      style={{ flex: 1 }}
      onMouseDown={stop}
      onClick={handleProbar}
      disabled={syncing}
    >
      Probar
    </button>
    <button
      className="w-btn"
      style={{ flex: 1, background: syncing ? undefined : 'rgba(72,187,120,0.15)', borderColor: '#48bb78' }}
      onMouseDown={stop}
      onClick={handleSaveToHubitat}
      disabled={syncing}
    >
      {syncing ? 'Guardando…' : 'Guardar en Hubitat'}
    </button>
  </div>

  <button className="w-btn" style={{ width: '100%' }} onMouseDown={stop} onClick={save}>
    Guardar local
  </button>
</div>

{/* ── Test modal ───────────────────────────────────────── */}
{testing && createPortal(
  <div style={{ position: 'fixed', inset: 0, zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
    <div style={{ ...modalBox, width: '22rem', gap: '1rem' }}>
      <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.92rem' }}>
        Probando: "{localName}"
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Activa manualmente las condiciones de la regla para verificar que las acciones se ejecuten correctamente.
        <br /><br />
        El motor local está escuchando.
      </div>
      <button className="w-btn" style={{ width: '100%' }} onClick={handleCerrarPrueba}>
        Cerrar prueba
      </button>
    </div>
  </div>,
  document.body
)}
```

- [ ] **Step 5: Verify in browser**

```
npm run dev
```

Open a ReglaAutomatica widget (long press) → confirm:
- "Probar" and "Guardar en Hubitat" buttons appear
- "Guardar local" button appears below
- Status badge shows "○ Solo local"
- Clicking Probar opens test modal with close button
- Closing test modal removes it

- [ ] **Step 6: Commit**

```bash
git add src/components/widgets/ReglaAutomatica.jsx
git commit -m "feat(ReglaAutomatica): add Probar/Guardar en Hubitat buttons, test modal, sync badge"
```

---

## Task 9: Update widget toggle to sync with Hubitat

**Files:**
- Modify: `src/components/widgets/ReglaAutomatica.jsx`

- [ ] **Step 1: Update the toggle handler in the main `ReglaAutomatica` component**

Currently (around line 442):
```js
const toggle = e => { e?.stopPropagation(); onConfigChange({ ...config, enabled: !enabled }); };
```

Replace with:

```js
const { setRuleEnabled } = useHub();

const toggle = async (e) => {
  e?.stopPropagation();
  const newEnabled = !enabled;
  // config.id is the Hubitat rule ID — always present when hubitatSynced is true
  if (config.hubitatSynced && config.hubitatHubId && config.id) {
    try {
      await setRuleEnabled(config.id, newEnabled, config.hubitatHubId);
    } catch (err) {
      console.warn('[ReglaAutomatica] toggle sync failed:', err.message);
    }
  }
  onConfigChange({ ...config, enabled: newEnabled });
};
```

Note: `ReglaAutomatica` already imports `useHub` at line 7.

- [ ] **Step 2: Add Hubitat badge to the 2x2 widget face**

In the 2x2 render block (default case, around line 480), add a badge after the toggle:

```jsx
{/* Hubitat badge — add right before the SI/ENTONCES sections */}
{config.hubitatSynced && (
  <div style={{ position: 'absolute', top: 4, left: 8, fontSize: 9, color: '#48bb78',
    background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.4)',
    borderRadius: 4, padding: '1px 5px', fontWeight: 700, letterSpacing: 0.5 }}>
    HUBITAT
  </div>
)}
```

Add the same badge to the `1x2` and `2x1` faces at the same position.

- [ ] **Step 3: Verify toggle behavior**

```
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/ReglaAutomatica.jsx
git commit -m "feat(ReglaAutomatica): sync toggle with Hubitat and show badge when deployed"
```

---

## Task 10: Delete confirmation for synced rules

**Files:**
- Modify: `src/components/PropertiesPanel/PropertiesPanel.jsx`

- [ ] **Step 1: Import useHub and useState**

At the top of `PropertiesPanel.jsx`:

```js
import { useState } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { useHub } from '../../store/hubStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import styles from './PropertiesPanel.module.css';
```

- [ ] **Step 2: Add state and update handleDelete**

Inside `PropertiesPanel`, add after the existing declarations:

```js
const { deleteRule } = useHub();
const [confirmDelete, setConfirmDelete] = useState(false);

const isSyncedRule = selected?.type === 'regla-auto' && selected?.config?.hubitatSynced;

const handleDelete = () => {
  if (isSyncedRule) {
    setConfirmDelete(true);
    return;
  }
  dispatch(
    parentGroupId
      ? { type: 'REMOVE_FROM_GROUP', groupId: parentGroupId, childId: selected.id }
      : { type: 'REMOVE_WIDGET', id: selected.id }
  );
};

const handleConfirmDelete = async () => {
  // Use config.id (Hubitat rule ID), NOT selected.id (dashboard widget ID) — they differ
  const hubitatRuleId = selected.config.id;
  try {
    if (hubitatRuleId) await deleteRule(hubitatRuleId, selected.config.hubitatHubId);
  } catch (err) {
    console.warn('[PropertiesPanel] delete from Hubitat failed:', err.message);
  }
  dispatch(
    parentGroupId
      ? { type: 'REMOVE_FROM_GROUP', groupId: parentGroupId, childId: selected.id }
      : { type: 'REMOVE_WIDGET', id: selected.id }
  );
  setConfirmDelete(false);
};
```

- [ ] **Step 3: Add confirmation modal to the JSX**

After the closing `</div>` of the panel, add:

```jsx
{confirmDelete && (
  <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
    <div style={{ background: 'linear-gradient(135deg,#0f172a,#0a1f3d)', border: '2px solid #1e3a5f',
      borderRadius: '1rem', padding: '1.4rem', width: '22rem', display: 'flex',
      flexDirection: 'column', gap: '1rem', boxShadow: '0 0 40px rgba(0,0,0,0.7)' }}>
      <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.92rem' }}>
        Eliminar regla
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Esta regla está activa en Hubitat. ¿Eliminarla también del hub?
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="w-btn" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>
          Cancelar
        </button>
        <button className="w-btn" style={{ flex: 1, color: '#fc8181', borderColor: '#fc8181',
          background: 'rgba(252,129,129,0.1)' }} onClick={handleConfirmDelete}>
          Eliminar todo
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Verify confirmation flow**

```
npm run dev
```

Drag a ReglaAutomatica widget, sync it to Hubitat (or manually set `hubitatSynced: true` in config), select it, click delete in Properties Panel → confirm modal appears → "Cancelar" closes it, "Eliminar todo" removes widget.

- [ ] **Step 5: Commit**

```bash
git add src/components/PropertiesPanel/PropertiesPanel.jsx
git commit -m "feat(PropertiesPanel): confirm before deleting Hubitat-synced rule"
```

---

## Task 11: Run all tests and final verification

- [ ] **Step 1: Run all server tests**

```
node --test server/test/evaluateRule.test.js server/test/hubitatRuleClient.test.js server/test/rulesEngineFilter.test.js
```

Expected: all tests PASS.

- [ ] **Step 2: Build to verify no TypeScript/Vite errors**

```
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 3: Run dev and smoke test full flow**

```
npm run dev
```

Verify:
1. Hub form shows Automatizaciones section with App ID + Token fields
2. ReglaAutomatica modal shows Probar, Guardar en Hubitat, Guardar local buttons
3. Badge shows "○ Solo local" before sync, "● En Hubitat" after
4. Probar opens test modal; closing removes it
5. Toggle on a synced rule doesn't cause errors in console (may fail to reach Hubitat without real credentials — that's expected)
6. Properties Panel → delete synced rule → confirmation modal appears
7. Rules without `hubitatSynced` still run in browser as before

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Hubitat native automation rules — complete implementation"
```

---

## Groovy App Installation Guide

Include this in the `hubitat-app/README.md` (or print it in the app description):

```
1. Hubitat → Apps Code → + New App → paste WidetsDemoAutomations.groovy
2. Apps → + Add User App → "WidetsDomo Automations"
3. En preferencias:
   - "Access Token": escribe el mismo token que usás en el Maker API
   - "Devices": selecciona TODOS los dispositivos que tus reglas usarán
4. Click Done
5. Vuelve a abrir la app → en la URL verás el App ID: /installedapp/configure/47 → "47"
6. El Token aparece en los logs de Hubitat al instalar (o en la página de la app)
7. Copia App ID y Token al dashboard → Hubs → [tu hub] → sección Automatizaciones
```

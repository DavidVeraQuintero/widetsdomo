import { HUBITAT_CAP_TO_WIDGETS, HA_DOMAIN_TO_WIDGETS } from './hubMappings.js';

const LOCAL_TIMEOUT_MS = 1000;
const PROXY_TIMEOUT_MS = 8000;

// fireAndForget=true uses mode:'no-cors' so the browser skips CORS validation.
// The hub doesn't send Allow-Origin headers, so regular cross-origin reads fail.
// For commands (on/off/setLevel) we don't need the response body, so no-cors is fine.
async function fetchDirectLocal(hub, path, method = 'GET', fireAndForget = false) {
  const url = `https://${hub.ip}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LOCAL_TIMEOUT_MS);
  try {
    if (fireAndForget) {
      await fetch(url, { method, signal: ctrl.signal, mode: 'no-cors' });
      return null;
    }
    const res = await fetch(url, { method, signal: ctrl.signal });
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
  if (!hub.cloudUrl) throw new Error('No cloudUrl configured');

  // cloudUrl: https://cloud.hubitat.com/api/{hub-uuid}/apps/{appId}?access_token=TOKEN
  const cloudUrlObj = new URL(hub.cloudUrl);
  const cloudToken = cloudUrlObj.searchParams.get('access_token') || hub.token;
  const cloudBasePath = cloudUrlObj.pathname; // /api/{hub-uuid}/apps/{appId}

  // Strip local prefix: /apps/api/{appId}/devices/... → /devices/...
  const localPrefix = `/apps/api/${hub.appId}`;
  const subPath = path.replace(localPrefix, '').replace(/[?&]access_token=[^&]*/g, '');

  const cloudPath = `${cloudBasePath}${subPath}?access_token=${cloudToken}`;

  const res = await fetch('/api/hub-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: hub.type, ip: 'cloud.hubitat.com', token: cloudToken, path: cloudPath, method }),
  });
  if (!res.ok) throw new Error(`Cloud proxy HTTP ${res.status}`);
  return await res.json();
}

// Local-first for all operations when on LAN.
// Commands use fireAndForget=true (mode:no-cors, always bypasses CORS).
// Reads use regular fetch — work locally only if Hubitat has CORS enabled
// (Apps → Maker API → Allow access from any origin). Falls back to cloud proxy silently.
// Returns { data, via: 'local'|'cloud' } so callers can report which path was used.
async function fetchHubitat(hub, path, method = 'GET', fireAndForget = false) {
  if (window.__hubLanReachable && hub.ip) {
    try {
      const data = await fetchDirectLocal(hub, path, method, fireAndForget);
      return { data, via: 'local' };
    } catch {
      // CORS blocked or unreachable — fall through to cloud
    }
  }

  if (hub.cloudUrl) {
    const data = await fetchViaCloudProxy(hub, path, method);
    return { data, via: 'cloud' };
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
    const { data } = await fetchHubitat(hub, path);
    raw = data;
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
  const { data } = await fetchHubitat(hub, path);
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
  // Only refresh via direct LAN (no-cors) — cloud path returns 502 for refresh endpoints
  if (!window.__hubLanReachable || !hub.ip) return;
  const path = `/apps/api/${hub.appId}/devices/${deviceId}/refresh?access_token=${hub.token}`;
  try {
    await fetchDirectLocal(hub, path, 'GET', true);
  } catch { /* not all devices support refresh */ }
}

export async function sendDeviceCommand(hub, deviceId, command, arg) {
  if (hub.type !== 'hubitat') return;
  const argPart = arg !== undefined && arg !== null ? `/${encodeURIComponent(arg)}` : '';
  const path = `/apps/api/${hub.appId}/devices/${deviceId}/${command}${argPart}?access_token=${hub.token}`;
  const t0 = performance.now();
  const { via } = await fetchHubitat(hub, path, 'POST', true);
  const ms = Math.round(performance.now() - t0);
  window.dispatchEvent(new CustomEvent('hub:command-sent', {
    detail: { command, deviceId, via, ms },
  }));
}

export async function checkLocalHubReachable(hub) {
  if (!hub?.ip) return false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LOCAL_TIMEOUT_MS);
    try {
      // no-cors: any response means the hub is reachable on LAN
      await fetch(`https://${hub.ip}`, { signal: ctrl.signal, mode: 'no-cors' });
      return true;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

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

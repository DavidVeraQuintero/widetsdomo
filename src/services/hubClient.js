import { HUBITAT_CAP_TO_WIDGETS, HA_DOMAIN_TO_WIDGETS } from './hubMappings.js';

const LOCAL_TIMEOUT_MS = 1000;
const PROXY_TIMEOUT_MS = 8000;

async function fetchDirectLocal(hub, path, method = 'GET') {
  const url = `https://${hub.ip}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LOCAL_TIMEOUT_MS);
  try {
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
  const res = await fetch('/api/hub-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: hub.type, ip: 'cloud.hubitat.com', appId: hub.appId, token: hub.token, path, method }),
  });
  if (!res.ok) throw new Error(`Cloud proxy HTTP ${res.status}`);
  return await res.json();
}

// Local first (LAN ~10ms) → Render proxy → cloud Hubitat URL
async function fetchHubitat(hub, path, method = 'GET') {
  if (hub.ip) {
    try { return await fetchDirectLocal(hub, path, method); } catch { /* fall through */ }
  }
  if (hub.ip) {
    try { return await fetchViaProxy(hub, path, method); } catch { /* fall through */ }
  }
  if (hub.cloudUrl) {
    return await fetchViaCloudProxy(hub, path, method);
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

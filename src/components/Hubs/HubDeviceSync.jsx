import { useEffect, useRef, useCallback } from 'react';
import { useHub } from '../../store/hubStore.jsx';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { triggerDeviceRefresh, readDeviceState } from '../../services/hubClient.js';

const CMD_GRACE_MS = 10_000;
const POLL_MS = 15_000;
const LAN_WS_RECONNECT_MS = 30_000;

function applyLiveState(config, live) {
  const updates = {};

  if (live.contact !== undefined) {
    const isOpen = live.contact === 'open';
    if (isOpen !== (config.open ?? false)) updates.open = isOpen;
  }
  if (live.switch !== undefined) {
    const liveOn = live.switch === 'on';
    if (liveOn !== (config.on ?? false)) updates.on = liveOn;
  }
  if (live.volume !== undefined) {
    const liveVol = Number(live.volume);
    if (liveVol !== (config.volume ?? 30)) updates.volume = liveVol;
  }
  if (live.muted !== undefined) {
    const isMuted = live.muted === 'muted';
    if (isMuted && (config.volume ?? 30) !== 0) updates.volume = 0;
  }
  if (live.channel !== undefined) {
    const liveCh = Number(live.channel);
    if (liveCh !== (config.channel ?? 1)) updates.channel = liveCh;
  }
  if (live.level !== undefined) {
    const liveBrightness = Number(live.level);
    if (liveBrightness !== (config.brightness ?? 75)) updates.brightness = liveBrightness;
  }
  if (live.colorMode === 'CT' || (live.saturation !== undefined && Number(live.saturation) === 0)) {
    const ct = live.colorTemperature ? Number(live.colorTemperature) : 4000;
    const whiteColor = ct <= 3200 ? '#ffcc66' : '#ffffff';
    if (config.color !== whiteColor) updates.color = whiteColor;
  } else if (live.hue !== undefined && live.saturation !== undefined) {
    const h = Number(live.hue) / 100 * 360;
    const s = Number(live.saturation) / 100;
    const hex = hslToHex(h, s, 0.5);
    if (hex !== config.color) updates.color = hex;
  }

  return updates;
}

function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export default function HubDeviceSync() {
  const { hubs, updateDeviceState } = useHub();
  const { state, dispatch } = useDashboard();

  const stateRef = useRef(state);
  stateRef.current = state;
  const hubsRef = useRef(hubs);
  hubsRef.current = hubs;

  // Timestamp per deviceId of last user-initiated command
  const lastCmdRef = useRef({});
  useEffect(() => {
    const handler = (e) => {
      lastCmdRef.current[String(e.detail.deviceId)] = Date.now();
    };
    window.addEventListener('hub:command-sent', handler);
    return () => window.removeEventListener('hub:command-sent', handler);
  }, []);

  // Apply a live state object to all matching widgets, respecting grace period
  const applyToWidgets = useCallback((hubId, deviceId, live) => {
    const now = Date.now();
    const lastCmd = lastCmdRef.current[String(deviceId)];
    if (lastCmd && now - lastCmd < CMD_GRACE_MS) return;

    const { widgets } = stateRef.current;
    for (const w of widgets) {
      if (w.config?.hubId !== hubId || w.config?.deviceId !== String(deviceId)) continue;
      const updates = applyLiveState(w.config, live);
      if (Object.keys(updates).length === 0) continue;
      dispatch({ type: 'UPDATE_CONFIG', id: w.id, config: { ...w.config, ...updates } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cloud path: backend WebSocket relays Hubitat webhook events as hub:device-event
  useEffect(() => {
    const handler = (e) => {
      const { hubId, deviceId, attribute, value } = e.detail;
      applyToWidgets(hubId, deviceId, { [attribute]: value });
    };
    window.addEventListener('hub:device-event', handler);
    return () => window.removeEventListener('hub:device-event', handler);
  }, [applyToWidgets]);

  // LAN path: direct WebSocket to Hubitat EventSocket (wss://hub.ip/eventsocket)
  // Works when the user has accepted the hub's self-signed cert in the browser.
  // Fails silently when not on LAN or cert not trusted — cloud path is the fallback.
  const hub0Id = hubs[0]?.id;
  useEffect(() => {
    const hub = hubsRef.current[0];
    if (!hub?.ip) return;

    let ws = null;
    let reconnectTimer = null;
    let stopped = false;

    function connect() {
      if (stopped) return;
      try {
        ws = new WebSocket(`wss://${hub.ip}/eventsocket`);
      } catch {
        return;
      }

      ws.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt.source !== 'DEVICE') return;
          applyToWidgets(hub.id, String(evt.deviceId), { [evt.name]: evt.value });
        } catch {}
      };

      ws.onclose = () => {
        if (!stopped) reconnectTimer = setTimeout(connect, LAN_WS_RECONNECT_MS);
      };

      ws.onerror = () => ws?.close();
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [hub0Id, applyToWidgets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback polling: initial state load on mount + periodic refresh + on WS reconnect
  // Catches any events missed by WebSocket (reconnects, hub restarts, etc.)
  useEffect(() => {
    const poll = async () => {
      const { widgets } = stateRef.current;
      const seen = new Set();
      const targets = [];
      for (const w of widgets) {
        if (!w.config?.hubId || !w.config?.deviceId) continue;
        const key = `${w.config.hubId}:${w.config.deviceId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const hub = hubsRef.current.find(h => h.id === w.config.hubId);
        if (!hub || hub.enabled === false) continue;
        targets.push({ hub, hubId: w.config.hubId, deviceId: w.config.deviceId });
      }
      if (!targets.length) return;

      // Only trigger device refresh + wait when on LAN — the refresh command
      // has no effect via cloud, and the 1.5s wait is wasted on mobile/cloud path.
      if (window.__hubLanReachable) {
        await Promise.allSettled(
          targets.map(({ hub, deviceId }) => triggerDeviceRefresh(hub, deviceId))
        );
        await new Promise(r => setTimeout(r, 1500));
      }

      await Promise.allSettled(targets.map(async ({ hub, hubId, deviceId }) => {
        try {
          const live = await readDeviceState(hub, deviceId);
          if (Object.keys(live).length > 0) {
            updateDeviceState(hubId, deviceId, live);
            applyToWidgets(hubId, deviceId, live);
          }
        } catch {}
      }));
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    // Poll immediately when WebSocket reconnects to resync stale states
    window.addEventListener('sync:ws-connected', poll);
    return () => {
      clearInterval(interval);
      window.removeEventListener('sync:ws-connected', poll);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

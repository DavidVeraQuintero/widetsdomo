import { useEffect, useRef } from 'react';
import { useHub } from '../../store/hubStore.jsx';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { triggerDeviceRefresh, readDeviceState } from '../../services/hubClient.js';

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
  const { hubs, deviceStates, updateDeviceState } = useHub();
  const { state, dispatch } = useDashboard();

  const stateRef = useRef(state);
  stateRef.current = state;

  const hubsRef = useRef(hubs);
  hubsRef.current = hubs;

  // Polling: all devices refresh in parallel, single wait, then read in parallel
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
        if (hub?.enabled === false) continue;
        targets.push({ hub, hubId: w.config.hubId, deviceId: w.config.deviceId });
      }
      if (targets.length === 0) return;

      // Trigger refresh on all devices simultaneously
      await Promise.allSettled(targets.map(({ hub, deviceId }) => triggerDeviceRefresh(hub, deviceId)));

      // Single wait for Hubitat to update all device states from physical hardware
      await new Promise(r => setTimeout(r, 1500));

      // Read all updated states simultaneously
      await Promise.allSettled(targets.map(async ({ hub, hubId, deviceId }) => {
        try {
          const stateData = await readDeviceState(hub, deviceId);
          console.log('[HubSync] stateData for', deviceId, stateData);
          if (Object.keys(stateData).length > 0) updateDeviceState(hubId, deviceId, stateData);
        } catch (err) {
          console.warn('[HubSync] readDeviceState failed for', deviceId, err.message);
        }
      }));
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Aplicar cambios en tiempo real a los widgets cuando deviceStates se actualiza
  useEffect(() => {
    if (!deviceStates || Object.keys(deviceStates).length === 0) return;
    const { widgets } = stateRef.current;
    widgets.forEach(w => {
      if (!w.config?.hubId || !w.config?.deviceId) return;
      const live = deviceStates[`${w.config.hubId}:${w.config.deviceId}`];
      if (!live) return;

      const updates = applyLiveState(w.config, live);
      console.log('[HubSync] widget', w.id, 'live=', live, 'updates=', updates);
      if (Object.keys(updates).length === 0) return;

      dispatch({ type: 'UPDATE_CONFIG', id: w.id, config: { ...w.config, ...updates } });
    });
  }, [deviceStates]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

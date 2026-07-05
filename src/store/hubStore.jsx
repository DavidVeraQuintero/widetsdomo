import { createContext, useContext, useReducer, useState, useMemo, useCallback, useEffect } from 'react';
import { fetchHubDevices, sendDeviceCommand } from '../services/hubClient.js';

const HUB_KEY = 'domotica-hubs';
const pendingCmds = new Map(); // "hubId:deviceId:command" → timerId
const DEBOUNCE_MS = 300;

function load() {
  try {
    const raw = localStorage.getItem(HUB_KEY);
    return raw ? { hubs: [], assignments: {}, ...JSON.parse(raw) } : { hubs: [], assignments: {} };
  } catch {
    return { hubs: [], assignments: {} };
  }
}

function persist(state) {
  localStorage.setItem(HUB_KEY, JSON.stringify({ hubs: state.hubs, assignments: state.assignments }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_HUB': {
      const hub = { id: `hub-${Date.now()}`, enabled: true, ...action.hub };
      const next = { ...state, hubs: [...state.hubs, hub] };
      persist(next);
      return next;
    }
    case 'UPDATE_HUB': {
      const next = { ...state, hubs: state.hubs.map(h => h.id === action.id ? { ...h, ...action.changes } : h) };
      persist(next);
      return next;
    }
    case 'DELETE_HUB': {
      const prefix = `${action.id}:`;
      const assignments = Object.fromEntries(
        Object.entries(state.assignments).filter(([k]) => !k.startsWith(prefix))
      );
      const next = { ...state, hubs: state.hubs.filter(h => h.id !== action.id), assignments };
      persist(next);
      return next;
    }
    case 'SET_HUBS': {
      const next = {
        ...state,
        hubs: action.hubs,
        assignments: action.assignments != null ? action.assignments : state.assignments,
      };
      persist(next);
      return next;
    }
    case 'ASSIGN_DEVICE': {
      const assignments = { ...state.assignments };
      if (action.widgetTypeId) {
        assignments[action.key] = action.widgetTypeId;
      } else {
        delete assignments[action.key];
      }
      const next = { ...state, assignments };
      persist(next);
      return next;
    }
    case 'RESET': {
      const empty = { hubs: [], assignments: {} };
      persist(empty);
      return empty;
    }
    default:
      return state;
  }
}

export const HubContext = createContext(null);

export function HubProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [devices, setDevices] = useState({}); // { [hubId]: Device[] }
  const [deviceStates, setDeviceStates] = useState({}); // { "hubId:deviceId": { attr: value } }

  // deviceCounts based on manual assignments, not capability auto-mapping
  const deviceCounts = useMemo(() => {
    const counts = {};
    for (const widgetTypeId of Object.values(state.assignments)) {
      if (widgetTypeId) counts[widgetTypeId] = (counts[widgetTypeId] || 0) + 1;
    }
    return counts;
  }, [state.assignments]);

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

  const hubsKey = state.hubs.map(h => h.id).join(',');

  const updateDeviceState = useCallback((hubId, deviceId, stateData) => {
    const key = `${hubId}:${deviceId}`;
    setDeviceStates(prev => {
      const existing = prev[key] ?? {};
      const hasChange = Object.entries(stateData).some(([k, v]) => existing[k] !== v);
      if (!hasChange) return prev;
      return { ...prev, [key]: { ...existing, ...stateData } };
    });
  }, []);

  const sendCommand = useCallback((hubId, deviceId, command, arg) => {
    // hub se captura en el closure — si se elimina en los próximos 300ms, el comando igual viaja (edge case inofensivo)
    const hub = state.hubs.find(h => h.id === hubId);
    if (!hub) return;
    const key = `${hubId}:${deviceId}:${command}`;
    clearTimeout(pendingCmds.get(key));
    pendingCmds.set(key, setTimeout(() => {
      pendingCmds.delete(key);
      sendDeviceCommand(hub, deviceId, command, arg)
        .catch(err => console.warn('[Hub] Command failed:', command, err.message));
    }, DEBOUNCE_MS));
  }, [state.hubs]);

  // Listen for device events broadcast via the sync WebSocket (cloud webhook flow)
  useEffect(() => {
    const handler = (e) => {
      const { hubId, deviceId, attribute, value } = e.detail;
      updateDeviceState(hubId, deviceId, { [attribute]: value });
    };
    window.addEventListener('hub:device-event', handler);
    return () => window.removeEventListener('hub:device-event', handler);
  }, [updateDeviceState]);

  // Clean up device cache when a hub is removed
  useEffect(() => {
    setDevices(prev => {
      const hubIds = new Set(state.hubs.map(h => h.id));
      const stale = Object.keys(prev).filter(id => !hubIds.has(id));
      if (stale.length === 0) return prev;
      const next = { ...prev };
      stale.forEach(id => delete next[id]);
      return next;
    });
  }, [state.hubs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch devices on mount and when hub IDs change (add/remove)
  useEffect(() => {
    if (state.hubs.length > 0) refreshAll();
  }, [hubsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const ctxValue = useMemo(() => ({
    hubs: state.hubs,
    assignments: state.assignments,
    devices,
    deviceStates,
    deviceCounts,
    hubsConfigured: state.hubs.length > 0,
    dispatch,
    refreshHub,
    refreshAll,
    sendCommand,
    updateDeviceState,
  }), [state.hubs, state.assignments, devices, deviceStates, deviceCounts, refreshHub, refreshAll, sendCommand, updateDeviceState]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HubContext.Provider value={ctxValue}>
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error('useHub must be used inside HubProvider');
  return ctx;
}

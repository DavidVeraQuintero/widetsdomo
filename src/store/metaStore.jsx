import { createContext, useContext, useReducer } from 'react';
import { deleteImage } from './imageDB.js';

const META_KEY = 'domotica-meta';
const LEGACY_KEY = 'domotica-v1';

function defaultMeta() {
  return {
    dashboards: [{ id: 'db-default', name: 'Dashboard 1' }],
    activeDashboardId: 'db-default',
  };
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
    // First launch: migrate legacy data if present
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      localStorage.setItem('domotica-dashboard-db-default', legacy);
    }
    return defaultMeta();
  } catch {
    return defaultMeta();
  }
}

function persistMeta(state) {
  localStorage.setItem(META_KEY, JSON.stringify({
    dashboards: state.dashboards,
    activeDashboardId: state.activeDashboardId,
  }));
}

function metaReducer(state, action) {
  switch (action.type) {
    case 'CREATE_DASHBOARD': {
      const id = `db-${Date.now()}`;
      const next = {
        dashboards: [...state.dashboards, { id, name: action.name }],
        activeDashboardId: id,
      };
      persistMeta(next);
      return next;
    }
    case 'RENAME_DASHBOARD': {
      const next = {
        ...state,
        dashboards: state.dashboards.map(d =>
          d.id === action.id ? { ...d, name: action.name } : d
        ),
      };
      persistMeta(next);
      return next;
    }
    case 'DELETE_DASHBOARD': {
      if (state.dashboards.length <= 1) return state;
      const dbKey = `domotica-dashboard-${action.id}`;
      try {
        const raw = localStorage.getItem(dbKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          (parsed?.theme?.customBackgrounds ?? []).forEach(bg => deleteImage(bg.id));
        }
      } catch {}
      localStorage.removeItem(dbKey);
      const remaining = state.dashboards.filter(d => d.id !== action.id);
      const activeId = state.activeDashboardId === action.id
        ? remaining[0].id
        : state.activeDashboardId;
      const next = { dashboards: remaining, activeDashboardId: activeId };
      persistMeta(next);
      return next;
    }
    case 'SET_ACTIVE': {
      const next = { ...state, activeDashboardId: action.id };
      persistMeta(next);
      return next;
    }
    default:
      return state;
  }
}

const MetaContext = createContext(null);

export function MetaProvider({ children }) {
  const [state, dispatch] = useReducer(metaReducer, undefined, loadMeta);
  return (
    <MetaContext.Provider value={{ state, dispatch }}>
      {children}
    </MetaContext.Provider>
  );
}

export function useMeta() {
  const ctx = useContext(MetaContext);
  if (!ctx) throw new Error('useMeta must be used inside MetaProvider');
  return ctx;
}

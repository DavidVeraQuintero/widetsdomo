import { createContext, useContext, useReducer } from 'react';
import { deleteImage } from './imageDB.js';

const META_KEY = 'domotica-meta';
const LEGACY_KEY = 'domotica-v1';

function defaultMeta() {
  return {
    dashboards: [{ id: 'db-default', name: 'Dashboard 1' }],
    activeDashboardId: 'db-default',
    deviceView: 'auto',
    compactMode: false,
    compactGrouped: false,
    viewOriginal: false, // Toggle para ver layout original en lugar del responsivo
    viewCategorized: false, // Toggle para ver widgets por categoría
    expandedGroups: {}, // { categoryName: boolean }
  };
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    const meta = raw ? JSON.parse(raw) : defaultMeta();

    // Asegurar que expandedGroups existe
    if (!meta.expandedGroups) {
      meta.expandedGroups = {};
    }

    // Load view preferences from separate storage (device-specific)
    try {
      const viewPrefs = JSON.parse(localStorage.getItem('domotica-view-prefs') || '{}');
      meta.viewOriginal = viewPrefs.viewOriginal || false;
      meta.viewCategorized = viewPrefs.viewCategorized || false;
    } catch {
      meta.viewOriginal = false;
      meta.viewCategorized = false;
    }

    if (!raw) {
      // First launch: migrate legacy data if present
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        localStorage.setItem('domotica-dashboard-db-default', legacy);
      }
    }

    return meta;
  } catch {
    return defaultMeta();
  }
}

function persistMeta(state) {
  localStorage.setItem(META_KEY, JSON.stringify({
    dashboards: state.dashboards,
    activeDashboardId: state.activeDashboardId,
    deviceView: state.deviceView,
    compactMode: state.compactMode,
    compactGrouped: state.compactGrouped,
    expandedGroups: state.expandedGroups,
  }));
  // View preferences are device-specific, saved separately
  localStorage.setItem('domotica-view-prefs', JSON.stringify({
    viewOriginal: state.viewOriginal,
    viewCategorized: state.viewCategorized,
  }));
}

function metaReducer(state, action) {
  switch (action.type) {
    case 'CREATE_DASHBOARD': {
      const id = `db-${Date.now()}`;
      const next = {
        ...state,
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
      const next = { ...state, dashboards: remaining, activeDashboardId: activeId };
      persistMeta(next);
      return next;
    }
    case 'SET_ACTIVE': {
      const next = { ...state, activeDashboardId: action.id };
      persistMeta(next);
      return next;
    }
    case 'SET_DEVICE_VIEW': {
      const next = { ...state, deviceView: action.deviceView };
      persistMeta(next);
      return next;
    }
    case 'SET_COMPACT_MODE': {
      const next = { ...state, compactMode: action.compactMode };
      persistMeta(next);
      return next;
    }
    case 'SET_COMPACT_GRID': {
      const next = { ...state, compactGridCols: action.cols };
      persistMeta(next);
      return next;
    }
    case 'SET_COMPACT_GROUPED': {
      const next = { ...state, compactGrouped: action.compactGrouped };
      persistMeta(next);
      return next;
    }
    case 'TOGGLE_GROUP': {
      const next = {
        ...state,
        expandedGroups: {
          ...state.expandedGroups,
          [action.category]: !state.expandedGroups[action.category],
        },
      };
      persistMeta(next);
      return next;
    }
    case 'SET_VIEW_ORIGINAL': {
      const next = { ...state, viewOriginal: action.viewOriginal };
      persistMeta(next);
      return next;
    }
    case 'SET_VIEW_CATEGORIZED': {
      const next = { ...state, viewCategorized: action.viewCategorized };
      persistMeta(next);
      return next;
    }
    case 'SET_META': {
      // activeDashboardId, viewOriginal, viewCategorized are per-device — never overwrite from server sync
      const payload = {
        ...action.payload,
        activeDashboardId: state.activeDashboardId,
        viewOriginal: state.viewOriginal,
        viewCategorized: state.viewCategorized,
      };
      persistMeta(payload);
      return payload;
    }
    default:
      return state;
  }
}

export const MetaContext = createContext(null);

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

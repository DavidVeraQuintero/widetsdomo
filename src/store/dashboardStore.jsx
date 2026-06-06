import { createContext, useContext, useReducer } from 'react';

const DEFAULT_STORAGE_KEY = 'domotica-v1';

const DEFAULT_STATE = {
  widgets: [],
  selectedId: null,
  snapToGrid: true,
  accentColor: '#3b82f6',
  globalIcons: {},
  grid: { cols: 12, rows: 6 },
  theme: { room: 'sala', palette: 'calido', time: 'atardecer', rgbStyle: 'border', customBackgrounds: [] },
};

function loadState(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      widgets: saved.widgets ?? [],
      globalIcons: saved.globalIcons ?? {},
      grid: saved.grid ?? DEFAULT_STATE.grid,
      theme: { ...DEFAULT_STATE.theme, ...(saved.theme ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state, storageKey) {
  localStorage.setItem(storageKey, JSON.stringify({
    widgets: state.widgets,
    globalIcons: state.globalIcons,
    grid: state.grid,
    theme: state.theme,
  }));
}

export function reducer(state, action, storageKey = DEFAULT_STORAGE_KEY) {
  switch (action.type) {
    case 'ADD_WIDGET': {
      const next = {
        ...state,
        widgets: [...state.widgets, action.payload],
        selectedId: action.payload.id,
      };
      persist(next, storageKey);
      return next;
    }
    case 'MOVE_WIDGET': {
      const next = {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.id ? { ...w, x: action.x, y: action.y } : w
        ),
      };
      persist(next, storageKey);
      return next;
    }
    case 'RESIZE_WIDGET': {
      const next = {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.id ? { ...w, size: action.size } : w
        ),
      };
      persist(next, storageKey);
      return next;
    }
    case 'UPDATE_CONFIG': {
      const next = {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.id ? { ...w, config: action.config } : w
        ),
      };
      persist(next, storageKey);
      return next;
    }
    case 'REMOVE_WIDGET': {
      const next = {
        ...state,
        widgets: state.widgets.filter(w => w.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
      persist(next, storageKey);
      return next;
    }
    case 'MOVE_TO_GROUP': {
      const { widgetId, groupId, x, y } = action;
      const moving = state.widgets.find(w => w.id === widgetId);
      const group  = state.widgets.find(w => w.id === groupId);
      if (!moving || !group) return state;
      const newChild = { id: widgetId, type: moving.type, size: moving.size, config: { ...moving.config }, x, y };
      const next = {
        ...state,
        selectedId: state.selectedId === widgetId ? null : state.selectedId,
        widgets: state.widgets
          .filter(w => w.id !== widgetId)
          .map(w => w.id !== groupId ? w : {
            ...w, config: { ...w.config, children: [...(w.config.children || []), newChild] },
          }),
      };
      persist(next, storageKey);
      return next;
    }
    case 'RESIZE_CHILD': {
      const { groupId, childId, size } = action;
      const next = {
        ...state,
        widgets: state.widgets.map(w =>
          w.id !== groupId ? w : {
            ...w,
            config: {
              ...w.config,
              children: (w.config.children || []).map(c =>
                c.id !== childId ? c : { ...c, size }
              ),
            },
          }
        ),
      };
      persist(next, storageKey);
      return next;
    }
    case 'MOVE_CHILD': {
      const { groupId, childId, x, y } = action;
      const next = {
        ...state,
        widgets: state.widgets.map(w =>
          w.id !== groupId ? w : {
            ...w,
            config: {
              ...w.config,
              children: (w.config.children || []).map(c =>
                c.id !== childId ? c : { ...c, x, y }
              ),
            },
          }
        ),
      };
      persist(next, storageKey);
      return next;
    }
    case 'REMOVE_FROM_GROUP': {
      const { groupId, childId } = action;
      const next = {
        ...state,
        selectedId: state.selectedId === childId ? null : state.selectedId,
        widgets: state.widgets.map(w =>
          w.id !== groupId ? w : {
            ...w,
            config: {
              ...w.config,
              children: (w.config.children || []).filter(c => c.id !== childId),
            },
          }
        ),
      };
      persist(next, storageKey);
      return next;
    }
    case 'SELECT_WIDGET':
      return { ...state, selectedId: action.id };
    case 'CLEAR_CANVAS': {
      const next = { ...state, widgets: [], selectedId: null };
      persist(next, storageKey);
      return next;
    }
    case 'SET_SNAP':
      return { ...state, snapToGrid: action.value };
    case 'SET_ACCENT':
      return { ...state, accentColor: action.color };
    case 'SET_GLOBAL_ICON': {
      const next = {
        ...state,
        globalIcons: { ...state.globalIcons, [action.widgetTypeId]: action.icons },
      };
      persist(next, storageKey);
      return next;
    }
    case 'RESET_GLOBAL_ICON': {
      const { [action.widgetTypeId]: _, ...rest } = state.globalIcons;
      const next = { ...state, globalIcons: rest };
      persist(next, storageKey);
      return next;
    }
    case 'ADD_CUSTOM_BG': {
      if (state.theme.customBackgrounds.length >= 3) return state;
      const next = {
        ...state,
        theme: {
          ...state.theme,
          customBackgrounds: [...state.theme.customBackgrounds, action.payload],
        },
      };
      persist(next, storageKey);
      return next;
    }
    case 'REMOVE_CUSTOM_BG': {
      const next = {
        ...state,
        theme: {
          ...state.theme,
          customBackgrounds: state.theme.customBackgrounds.filter(bg => bg.id !== action.id),
          room: state.theme.room === action.id ? 'sala' : state.theme.room,
        },
      };
      persist(next, storageKey);
      return next;
    }
    case 'SET_THEME': {
      const next = { ...state, theme: { ...state.theme, ...action.patch } };
      persist(next, storageKey);
      return next;
    }
    case 'SET_GRID': {
      const next = { ...state, grid: { ...state.grid, ...action.patch } };
      persist(next, storageKey);
      return next;
    }
    default:
      return state;
  }
}

const DashboardContext = createContext(null);

export function DashboardProvider({ children, storageKey = DEFAULT_STORAGE_KEY }) {
  const [state, dispatch] = useReducer(
    (state, action) => reducer(state, action, storageKey),
    undefined,
    () => loadState(storageKey),
  );
  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used inside DashboardProvider');
  return ctx;
}

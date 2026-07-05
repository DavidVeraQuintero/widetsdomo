import { createContext, useContext, useReducer } from 'react';
import { WIDGET_SIZES, CELL_SIZE } from '../catalog/widgetSizes';
import { calculateCompactLayout, restoreOriginalPositions } from '../utils/compactModeUtils';

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

// Helper: Clamp position to dashboard bounds
function clampWidgetPosition(x, y, widgetSize, gridCols, gridRows) {
  const dashboardWidth = gridCols * CELL_SIZE;
  const dashboardHeight = gridRows * CELL_SIZE;
  const size = WIDGET_SIZES[widgetSize] || WIDGET_SIZES['2x2'];

  const maxX = Math.max(0, dashboardWidth - size.width);
  const maxY = Math.max(0, dashboardHeight - size.height);

  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY)),
  };
}

// Helper: Check if widget fits in grid
function widgetFitsInGrid(widget, gridCols, gridRows) {
  const dashboardWidth = gridCols * CELL_SIZE;
  const dashboardHeight = gridRows * CELL_SIZE;
  const size = WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2'];

  return (
    widget.x + size.width <= dashboardWidth &&
    widget.y + size.height <= dashboardHeight
  );
}

// Helper: Check if all widgets fit in new grid
function allWidgetsFitInGrid(widgets, gridCols, gridRows) {
  return widgets.every(w => widgetFitsInGrid(w, gridCols, gridRows));
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
      const widget = state.widgets.find(w => w.id === action.id);
      if (!widget) return state;

      // Clamp position to dashboard bounds
      const clamped = clampWidgetPosition(
        action.x,
        action.y,
        widget.size,
        state.grid.cols,
        state.grid.rows
      );

      const next = {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.id ? { ...w, x: clamped.x, y: clamped.y } : w
        ),
      };
      persist(next, storageKey);
      return next;
    }
    case 'RESIZE_WIDGET': {
      const widget = state.widgets.find(w => w.id === action.id);
      if (!widget) return state;

      // Check if new size fits in dashboard
      const testWidget = { ...widget, size: action.size };
      if (!widgetFitsInGrid(testWidget, state.grid.cols, state.grid.rows)) {
        // If widget doesn't fit, clamp its position to the new size
        const clamped = clampWidgetPosition(
          widget.x,
          widget.y,
          action.size,
          state.grid.cols,
          state.grid.rows
        );

        const next = {
          ...state,
          widgets: state.widgets.map(w =>
            w.id === action.id ? { ...w, size: action.size, x: clamped.x, y: clamped.y } : w
          ),
        };
        persist(next, storageKey);
        return next;
      }

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
    case 'EJECT_FROM_GROUP': {
      const { groupId, childId } = action;
      const group = state.widgets.find(w => w.id === groupId);
      if (!group) return state;
      const child = (group.config.children || []).find(c => c.id === childId);
      if (!child) return state;
      const size = WIDGET_SIZES[child.size] || WIDGET_SIZES['2x2'];
      const ejected = {
        id: child.id,
        type: child.type,
        size: child.size,
        config: { ...child.config },
        x: group.x + size.width + 16,
        y: group.y,
      };
      const next = {
        ...state,
        widgets: [
          ...state.widgets.map(w =>
            w.id !== groupId ? w : {
              ...w,
              config: { ...w.config, children: (w.config.children || []).filter(c => c.id !== childId) },
            }
          ),
          ejected,
        ],
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
      const newGrid = { ...state.grid, ...action.patch };

      // Solo validar si está DISMINUYENDO el grid (aumentar siempre está permitido)
      const isDecreasing = (action.patch.cols && action.patch.cols < state.grid.cols) ||
                          (action.patch.rows && action.patch.rows < state.grid.rows);

      if (isDecreasing && !allWidgetsFitInGrid(state.widgets, newGrid.cols, newGrid.rows)) {
        return state; // Rechazar disminución si widgets no cabrían
      }

      const next = { ...state, grid: newGrid };
      persist(next, storageKey);
      return next;
    }
    case 'APPLY_COMPACT_MODE': {
      // Reorganizar widgets respetando su tamaño real
      const cols = 4;
      const cellWidth = 110; // Tamaño que funciona bien
      const padding = 12;
      const maxWidth = (cols * cellWidth) + ((cols - 1) * padding); // 4*110 + 3*12 = 476px

      // Ordenar por posición original
      const sorted = [...state.widgets].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      });

      // Obtener dimensiones reales de widgets
      const getWidgetSize = (widget) => {
        const sizeMap = {
          '1x1': { width: 90,  height: 90 },
          '1x2': { width: 90,  height: 185 },
          '2x1': { width: 185, height: 90 },
          '2x2': { width: 185, height: 185 },
          '2x4': { width: 185, height: 390 },
          '4x2': { width: 390, height: 185 },
          '4x4': { width: 390, height: 390 },
          '4x6': { width: 390, height: 595 },
          '2x6': { width: 185, height: 595 },
          '2x8': { width: 185, height: 800 },
        };
        return sizeMap[widget.size] || { width: 185, height: 185 };
      };

      // Reorganizar respetando anchos reales
      const reorganized = [];
      let currentX = padding;
      let currentY = padding;
      let rowHeight = 0;

      sorted.forEach(widget => {
        const size = getWidgetSize(widget);
        const widgetWithPadding = size.width + padding;

        // Si no cabe, ir a siguiente fila
        if (currentX + widgetWithPadding > maxWidth && currentX > padding) {
          currentY += rowHeight + padding;
          currentX = padding;
          rowHeight = 0;
        }

        reorganized.push({
          ...widget,
          originalX: widget.x,
          originalY: widget.y,
          x: Math.round(currentX),
          y: Math.round(currentY),
        });

        currentX += widgetWithPadding;
        rowHeight = Math.max(rowHeight, size.height);
      });

      const next = {
        ...state,
        widgets: reorganized,
        grid: { ...state.grid, cols: 4 },
      };
      persist(next, storageKey);
      return next;
    }
    case 'RESTORE_ORIGINAL_POSITIONS': {
      const restored = restoreOriginalPositions(state.widgets);
      const next = {
        ...state,
        widgets: restored.map(w => {
          const { originalX, originalY, ...rest } = w;
          return rest;
        }),
        grid: { ...state.grid, cols: 12 },
      };
      persist(next, storageKey);
      return next;
    }
    case 'SET_STATE': {
      persist(action.payload, storageKey);
      return action.payload;
    }
    default:
      return state;
  }
}

export const DashboardContext = createContext(null);

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

# Multi-Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add support for up to N independent dashboards, each with its own widgets, theme, accentColor, and globalIcons, navigable via a tab bar at the top of the canvas.

**Architecture:** A new `MetaProvider` wraps the app and manages the list of dashboards + which is active. The existing `DashboardProvider` receives a `storageKey` prop and re-mounts (via React `key`) when the active dashboard changes, loading the new dashboard's state from its own `localStorage` key automatically. A `DashboardTabs` bar sits above the canvas.

**Tech Stack:** React 18, CSS Modules, localStorage, Vite

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/config.js` | `MAX_DASHBOARDS` constant |
| Create | `src/store/metaStore.jsx` | `MetaProvider`, `useMeta`, meta-reducer (list + active dashboard) |
| Modify | `src/store/dashboardStore.jsx` | Accept `storageKey` prop; `loadState`/`persist` use dynamic key |
| Create | `src/components/DashboardTabs/DashboardTabs.module.css` | Styles for tab bar and dialog |
| Create | `src/components/DashboardTabs/NewDashboardDialog.jsx` | Name-entry modal |
| Create | `src/components/DashboardTabs/DashboardTabs.jsx` | Tab bar with create/rename/delete |
| Modify | `src/App.jsx` | Wrap with `MetaProvider`, split into `AppInner` + `App`, render `DashboardTabs` |
| Modify | `src/App.module.css` | Change `.layout` from `height: 100vh` to `flex: 1` |

---

## Task 1: Create `src/config.js`

**Files:**
- Create: `src/config.js`

- [ ] **Step 1: Create the file**

```js
export const MAX_DASHBOARDS = 10;
```

- [ ] **Step 2: Commit**

```bash
git add src/config.js
git commit -m "feat: add config.js with MAX_DASHBOARDS"
```

---

## Task 2: Create `src/store/metaStore.jsx`

**Files:**
- Create: `src/store/metaStore.jsx`

- [ ] **Step 1: Create the file**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/store/metaStore.jsx
git commit -m "feat: add metaStore — MetaProvider, useMeta, dashboard list"
```

---

## Task 3: Modify `src/store/dashboardStore.jsx`

**Files:**
- Modify: `src/store/dashboardStore.jsx`

The current file hardcodes `const STORAGE_KEY = 'domotica-v1'` and passes it implicitly to `persist`. We need `loadState` and `persist` to accept a dynamic key, and `reducer` to receive the key as a third parameter. `DashboardProvider` accepts a `storageKey` prop and creates a bound reducer via closure.

- [ ] **Step 1: Replace the entire file content**

```jsx
import { createContext, useContext, useReducer } from 'react';

const DEFAULT_STORAGE_KEY = 'domotica-v1';

const DEFAULT_STATE = {
  widgets: [],
  selectedId: null,
  snapToGrid: true,
  accentColor: '#3b82f6',
  globalIcons: {},
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
```

- [ ] **Step 2: Commit**

```bash
git add src/store/dashboardStore.jsx
git commit -m "feat: dashboardStore accepts storageKey prop for per-dashboard persistence"
```

---

## Task 4: Create `src/components/DashboardTabs/DashboardTabs.module.css`

**Files:**
- Create: `src/components/DashboardTabs/DashboardTabs.module.css`

- [ ] **Step 1: Create the CSS file**

```css
/* Tab bar */
.bar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px 8px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.bar::-webkit-scrollbar { display: none; }

.tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
  user-select: none;
}
.tab:hover { background: rgba(255, 255, 255, 0.07); color: white; }
.tab.active {
  background: rgba(59, 130, 246, 0.15);
  border-color: var(--accent);
  color: white;
}

.tabName { flex: 1; }

.renameInput {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--accent);
  color: white;
  font-size: 12px;
  outline: none;
  width: 80px;
  padding: 0;
}

.closeBtn {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-dim);
  font-size: 10px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
}
.tab:hover .closeBtn { display: inline; }
.closeBtn:hover { color: var(--danger); }

.addBtn {
  margin-left: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  background: transparent;
  border: 1px dashed var(--border);
  color: var(--text-dim);
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  line-height: 1;
  flex-shrink: 0;
}
.addBtn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.07);
  color: white;
}
.addBtn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Dialog overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.dialog {
  background: rgba(10, 14, 26, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 20px;
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65);
}

.dialogTitle {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.dialogInput {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: white;
  outline: none;
  width: 100%;
}
.dialogInput:focus { border-color: var(--accent); }
.dialogInput::placeholder { color: var(--text-dim); }

.dialogButtons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancelBtn {
  padding: 7px 14px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.cancelBtn:hover { background: rgba(255, 255, 255, 0.12); color: white; }

.confirmBtn {
  padding: 7px 14px;
  border-radius: 7px;
  background: var(--accent);
  border: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.confirmBtn:not(:disabled):hover { opacity: 0.85; }
.confirmBtn:disabled { opacity: 0.38; cursor: not-allowed; }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardTabs/DashboardTabs.module.css
git commit -m "feat: add DashboardTabs CSS (tab bar + dialog)"
```

---

## Task 5: Create `src/components/DashboardTabs/NewDashboardDialog.jsx`

**Files:**
- Create: `src/components/DashboardTabs/NewDashboardDialog.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';
import styles from './DashboardTabs.module.css';

export default function NewDashboardDialog({ onConfirm, onCancel }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <div className={styles.overlay} onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <form className={styles.dialog} onSubmit={handleSubmit}>
        <div className={styles.dialogTitle}>Nuevo dashboard</div>
        <input
          className={styles.dialogInput}
          placeholder="Nombre del dashboard"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          onKeyDown={e => e.key === 'Escape' && onCancel()}
        />
        <div className={styles.dialogButtons}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className={styles.confirmBtn} disabled={!name.trim()}>
            Crear
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardTabs/NewDashboardDialog.jsx
git commit -m "feat: add NewDashboardDialog component"
```

---

## Task 6: Create `src/components/DashboardTabs/DashboardTabs.jsx`

**Files:**
- Create: `src/components/DashboardTabs/DashboardTabs.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useState } from 'react';
import { useMeta } from '../../store/metaStore.jsx';
import { MAX_DASHBOARDS } from '../../config.js';
import NewDashboardDialog from './NewDashboardDialog.jsx';
import styles from './DashboardTabs.module.css';

export default function DashboardTabs() {
  const { state, dispatch } = useMeta();
  const { dashboards, activeDashboardId } = state;
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  function startRename(id, name) {
    setEditingId(id);
    setEditName(name);
  }

  function commitRename(id) {
    const trimmed = editName.trim();
    if (trimmed) dispatch({ type: 'RENAME_DASHBOARD', id, name: trimmed });
    setEditingId(null);
  }

  function handleDelete(id) {
    if (!window.confirm('¿Eliminar este dashboard y todos sus widgets?')) return;
    dispatch({ type: 'DELETE_DASHBOARD', id });
  }

  function handleCreate(name) {
    dispatch({ type: 'CREATE_DASHBOARD', name });
    setShowDialog(false);
  }

  const atLimit = dashboards.length >= MAX_DASHBOARDS;

  return (
    <div className={styles.bar}>
      {dashboards.map(d => (
        <div
          key={d.id}
          className={`${styles.tab} ${d.id === activeDashboardId ? styles.active : ''}`}
          onClick={() => dispatch({ type: 'SET_ACTIVE', id: d.id })}
        >
          {editingId === d.id ? (
            <input
              className={styles.renameInput}
              value={editName}
              autoFocus
              onChange={e => setEditName(e.target.value)}
              onBlur={() => commitRename(d.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename(d.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className={styles.tabName}
              onDoubleClick={e => { e.stopPropagation(); startRename(d.id, d.name); }}
            >
              {d.name}
            </span>
          )}
          {dashboards.length > 1 && (
            <button
              className={styles.closeBtn}
              onClick={e => { e.stopPropagation(); handleDelete(d.id); }}
              title="Eliminar dashboard"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        className={styles.addBtn}
        onClick={() => !atLimit && setShowDialog(true)}
        disabled={atLimit}
        title={atLimit ? `Límite de ${MAX_DASHBOARDS} dashboards alcanzado` : 'Nuevo dashboard'}
      >
        +
      </button>
      {showDialog && (
        <NewDashboardDialog
          onConfirm={handleCreate}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DashboardTabs/DashboardTabs.jsx
git commit -m "feat: add DashboardTabs component — tabs, rename, create, delete"
```

---

## Task 7: Wire everything in `App.jsx` and `App.module.css`

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.module.css`

`#root` in `theme.css` already has `display: flex; flex-direction: column; height: 100vh`. So the tab bar and the layout simply stack as flex children. We only need to change `.layout` from `height: 100vh` to `flex: 1`, and split `App` into `AppInner` (which uses `useMeta`) + the outer `App` shell.

- [ ] **Step 1: Replace `src/App.module.css`**

```css
.layout {
  position: relative;
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--bg-base);
}

.floatingPanel {
  position: absolute;
  z-index: 50;
  display: flex;
  flex-direction: column;
  width: 230px;
  min-height: 44px;
  max-height: 85vh;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.dragHandle {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 18px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  border-radius: 12px 12px 0 0;
  cursor: grab;
  user-select: none;
}
.dragHandle:active { cursor: grabbing; }

.dragDots {
  color: var(--text-dim);
  font-size: 14px;
}

.sidebarToggle {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 100;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 16px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sidebarToggle:hover {
  background: var(--accent-dim);
  color: var(--accent);
}
```

- [ ] **Step 2: Replace `src/App.jsx`**

```jsx
import { useState, useRef } from 'react';
import { MetaProvider, useMeta } from './store/metaStore.jsx';
import { DashboardProvider } from './store/dashboardStore.jsx';
import DashboardTabs from './components/DashboardTabs/DashboardTabs.jsx';
import ThemeApplier from './components/ThemeApplier.jsx';
import Sidebar from './components/Sidebar/Sidebar';
import Canvas from './components/Canvas/Canvas';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import styles from './App.module.css';

function AppInner() {
  const { state: metaState } = useMeta();
  const { activeDashboardId } = metaState;
  const storageKey = `domotica-dashboard-${activeDashboardId}`;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pos, setPos] = useState({ x: 80, y: 60 });
  const dragOffset = useRef(null);

  const startDrag = (e) => {
    dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    const onMove = (e) => {
      setPos({ x: e.clientX - dragOffset.current.dx, y: e.clientY - dragOffset.current.dy });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    e.preventDefault();
  };

  return (
    <DashboardProvider key={activeDashboardId} storageKey={storageKey}>
      <ThemeApplier />
      <div className={styles.layout}>
        <Canvas />
        {sidebarOpen ? (
          <div className={styles.floatingPanel} style={{ left: pos.x, top: pos.y }}>
            <div className={styles.dragHandle} onMouseDown={startDrag}>
              <span className={styles.dragDots}>⠿</span>
            </div>
            <Sidebar onClose={() => setSidebarOpen(false)} />
            <PropertiesPanel />
          </div>
        ) : (
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(true)}
            title="Mostrar panel"
          >
            ☰
          </button>
        )}
      </div>
    </DashboardProvider>
  );
}

export default function App() {
  return (
    <MetaProvider>
      <DashboardTabs />
      <AppInner />
    </MetaProvider>
  );
}
```

- [ ] **Step 3: Run the dev server and verify**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:
- The tab bar appears at the top with "Dashboard 1"
- Clicking `+` opens the name dialog; entering a name and clicking "Crear" adds a new tab and switches to it
- The new dashboard starts empty (no widgets from the previous one)
- Switching back to "Dashboard 1" restores its widgets
- Themes are independent: change the theme on each dashboard and switch between them — each keeps its own theme
- Double-clicking a tab name allows renaming it; Enter/blur commits, Escape cancels
- With 2+ dashboards, hovering a tab shows `✕`; clicking it asks for confirmation and removes the tab
- With only 1 dashboard, no `✕` appears
- After creating 10 dashboards, the `+` button is disabled with the tooltip "Límite de 10 dashboards alcanzado"
- Refreshing the browser preserves all dashboards and their contents

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/App.module.css
git commit -m "feat: wire MetaProvider + DashboardTabs into App — multi-dashboard complete"
```

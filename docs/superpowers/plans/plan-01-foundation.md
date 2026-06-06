# Plan 01 — Foundation: Setup + Tema + Store + Shell

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proyecto Vite+React funcionando con tema dark-blue, store de estado global con localStorage y layout de 3 columnas (sidebar | canvas | panel) visible en pantalla.

**Architecture:** DashboardProvider envuelve la app. `useReducer` maneja el estado del canvas. CSS custom properties definen el tema. Los 3 paneles son shells vacíos por ahora.

**Tech Stack:** React 18, Vite 5, CSS Modules, no librerías externas.

---

### Task 1: Scaffold del proyecto

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Inicializar proyecto**

```bash
cd C:/widgets
npm create vite@latest . -- --template react --yes
```

Expected: se crean `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/App.css`, `src/index.css`.

- [ ] **Step 2: Instalar dependencias**

```bash
npm install
```

Expected: `node_modules/` creado sin errores.

- [ ] **Step 3: Limpiar archivos default innecesarios**

Borrar: `src/assets/react.svg`, `public/vite.svg`, `src/App.css` (lo reemplazamos), `src/index.css` (lo reemplazamos).

```bash
del src\assets\react.svg 2>nul
del public\vite.svg 2>nul
del src\App.css 2>nul
del src\index.css 2>nul
```

- [ ] **Step 4: Reemplazar `index.html`**

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard Domótica</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Reemplazar `src/main.jsx`**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 6: Verificar que levanta**

```bash
npm run dev
```

Expected: `http://localhost:5173` abre sin errores. Ctrl+C para detener.

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold vite react project"
```

---

### Task 2: Tema CSS global

**Files:**
- Create: `src/styles/theme.css`
- Create: `src/styles/widget.css`

- [ ] **Step 1: Crear `src/styles/theme.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-base:          #060d1a;
  --bg-surface:       #0a1628;
  --bg-widget:        #0f172a;
  --border:           #1e3a5f;
  --border-accent:    #3b82f6;
  --text-primary:     #e2e8f0;
  --text-secondary:   #94a3b8;
  --text-dim:         #475569;
  --accent:           #3b82f6;
  --accent-dim:       #1e3a5f;
  --success:          #22c55e;
  --danger:           #ef4444;
  --warning:          #f59e0b;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 14px;
}

body {
  background: var(--bg-base);
  color: var(--text-primary);
  height: 100vh;
  overflow: hidden;
}

#root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-surface); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
```

- [ ] **Step 2: Crear `src/styles/widget.css`** (clases compartidas por todos los widgets)

```css
/* Importar en main.jsx una sola vez */

.w-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 6px;
  overflow: hidden;
  min-width: 0;
}
.w-center {
  align-items: center;
  justify-content: center;
  text-align: center;
}
.w-label {
  font-size: 9px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 1px;
  flex-shrink: 0;
}
.w-name  { font-size: 12px; font-weight: 600; color: var(--text-primary); }
.w-sub   { font-size: 10px; color: var(--text-secondary); }
.w-row   { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.w-col   { display: flex; flex-direction: column; gap: 4px; }
.w-fill  { flex: 1; }
.w-icon  { font-size: 28px; }
.w-icon-big { font-size: 44px; }
.w-val-big  { font-size: 32px; font-weight: 700; line-height: 1; }
.w-val-med  { font-size: 22px; font-weight: 700; line-height: 1; }
.w-status   { font-size: 10px; }
.w-divider  { height: 1px; background: var(--border); flex-shrink: 0; }

.w-btn {
  background: var(--accent-dim);
  border: 1px solid var(--border);
  color: var(--accent);
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}
.w-btn:hover { background: var(--border-accent); color: white; }
.w-btn-sm { padding: 3px 8px; font-size: 11px; }
.w-btn-row { display: flex; gap: 6px; }
.w-btn-icon {
  background: var(--accent-dim);
  border: 1px solid var(--border);
  color: var(--accent);
  border-radius: 6px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
}
.w-btn-icon:hover { background: var(--border-accent); color: white; }

.w-bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  flex: 1;
}
.w-bar {
  flex: 1;
  background: var(--accent-dim);
  border-radius: 3px 3px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}

.w-alert { color: var(--danger); }
.w-ok    { color: var(--success); }
.w-warn  { color: var(--warning); }

@keyframes widgetIn {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 3: Actualizar `src/main.jsx` para importar estilos globales**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import './styles/widget.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add global CSS theme and widget shared styles"
```

---

### Task 3: Constantes de tamaños de widget

**Files:**
- Create: `src/catalog/widgetSizes.js`

- [ ] **Step 1: Crear `src/catalog/widgetSizes.js`**

```js
// Dimensiones en píxeles para cada tamaño de widget
// Formato "colsXrows" → { width, height }
export const WIDGET_SIZES = {
  '1x1': { width: 90,  height: 90  },
  '1x2': { width: 90,  height: 185 },
  '2x1': { width: 185, height: 90  },
  '2x2': { width: 185, height: 185 },
  '2x4': { width: 185, height: 390 },
  '4x2': { width: 390, height: 185 },
  '4x4': { width: 390, height: 390 },
};

export const SNAP_SIZE = 5; // píxeles de snap a grilla
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add widget size constants"
```

---

### Task 4: Dashboard Store (useReducer + localStorage)

**Files:**
- Create: `src/store/dashboardStore.js`

- [ ] **Step 1: Crear `src/store/dashboardStore.js`**

```js
import { createContext, useContext, useReducer } from 'react';

const STORAGE_KEY = 'domotica-v1';

const DEFAULT_STATE = {
  widgets: [],
  selectedId: null,
  snapToGrid: true,
  accentColor: '#3b82f6',
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    return { ...DEFAULT_STATE, widgets: saved.widgets ?? [] };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets: state.widgets }));
}

export function reducer(state, action) {
  switch (action.type) {
    case 'ADD_WIDGET': {
      const next = {
        ...state,
        widgets: [...state.widgets, action.payload],
        selectedId: action.payload.id,
      };
      persist(next);
      return next;
    }
    case 'MOVE_WIDGET': {
      const next = {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.id ? { ...w, x: action.x, y: action.y } : w
        ),
      };
      persist(next);
      return next;
    }
    case 'RESIZE_WIDGET': {
      const next = {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.id ? { ...w, size: action.size } : w
        ),
      };
      persist(next);
      return next;
    }
    case 'UPDATE_CONFIG': {
      const next = {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.id ? { ...w, config: action.config } : w
        ),
      };
      persist(next);
      return next;
    }
    case 'REMOVE_WIDGET': {
      const next = {
        ...state,
        widgets: state.widgets.filter(w => w.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
      persist(next);
      return next;
    }
    case 'SELECT_WIDGET':
      return { ...state, selectedId: action.id };
    case 'CLEAR_CANVAS': {
      const next = { ...state, widgets: [], selectedId: null };
      persist(next);
      return next;
    }
    case 'SET_SNAP':
      return { ...state, snapToGrid: action.value };
    case 'SET_ACCENT':
      return { ...state, accentColor: action.color };
    default:
      return state;
  }
}

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
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

- [ ] **Step 2: Verificar que el reducer es puro (test mental)** — ADD_WIDGET añade al array y persiste. MOVE_WIDGET actualiza x,y. RESIZE_WIDGET cambia size. UPDATE_CONFIG reemplaza config. REMOVE_WIDGET filtra el widget y deselecciona si era el seleccionado. CLEAR_CANVAS vacía todo.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: add dashboard store with useReducer and localStorage persistence"
```

---

### Task 5: App shell — layout de 3 columnas

**Files:**
- Create: `src/App.jsx`
- Create: `src/components/Sidebar/Sidebar.jsx`
- Create: `src/components/Sidebar/Sidebar.module.css`
- Create: `src/components/Canvas/Canvas.jsx`
- Create: `src/components/Canvas/Canvas.module.css`
- Create: `src/components/PropertiesPanel/PropertiesPanel.jsx`
- Create: `src/components/PropertiesPanel/PropertiesPanel.module.css`

- [ ] **Step 1: Crear `src/App.jsx`**

```jsx
import { DashboardProvider } from './store/dashboardStore';
import Sidebar from './components/Sidebar/Sidebar';
import Canvas from './components/Canvas/Canvas';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import styles from './App.module.css';

export default function App() {
  return (
    <DashboardProvider>
      <div className={styles.layout}>
        <Sidebar />
        <Canvas />
        <PropertiesPanel />
      </div>
    </DashboardProvider>
  );
}
```

- [ ] **Step 2: Crear `src/App.module.css`**

```css
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-base);
}
```

- [ ] **Step 3: Crear `src/components/Sidebar/Sidebar.jsx`** (shell vacío por ahora)

```jsx
import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.appName}>🏠 Domótica</div>
        <input className={styles.search} placeholder="🔍 Buscar..." readOnly />
      </div>
      <div className={styles.list}>
        <div style={{ color: 'var(--text-dim)', padding: 12, fontSize: 12 }}>
          Widgets se cargarán en Plan 02
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Crear `src/components/Sidebar/Sidebar.module.css`**

```css
.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 14px 12px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.appName {
  color: var(--accent);
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 8px;
}

.search {
  width: 100%;
  background: var(--bg-widget);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  color: var(--text-secondary);
  font-size: 12px;
  outline: none;
}

.search:focus { border-color: var(--border-accent); }

.list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.category {
  padding: 8px 12px 4px;
  color: var(--accent);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  margin: 1px 6px;
  border-radius: 6px;
  cursor: grab;
  font-size: 12px;
  color: var(--text-secondary);
  transition: background 0.15s, color 0.15s;
  user-select: none;
}

.item:hover {
  background: var(--accent-dim);
  color: var(--text-primary);
}

.item:active { cursor: grabbing; }

.itemIcon { font-size: 16px; width: 20px; text-align: center; }
.itemName { flex: 1; }
.itemBadge {
  background: var(--bg-widget);
  color: var(--accent);
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
}
```

- [ ] **Step 5: Crear `src/components/Canvas/Canvas.jsx`** (shell con grilla)

```jsx
import styles from './Canvas.module.css';

export default function Canvas() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span className={styles.title}>Canvas · Arrastra widgets desde el panel</span>
        <button className={styles.btn}>🗑 Limpiar</button>
      </div>
      <div className={styles.canvas}>
        <div style={{ color: 'var(--text-dim)', padding: 20, fontSize: 12 }}>
          Drop zone se activará en Plan 02
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Crear `src/components/Canvas/Canvas.module.css`**

```css
.wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.title { color: var(--text-secondary); font-size: 12px; flex: 1; }

.btn {
  background: var(--accent-dim);
  border: 1px solid var(--border);
  color: var(--accent);
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn:hover { background: var(--border-accent); color: white; }

.canvas {
  flex: 1;
  position: relative;
  overflow: auto;
  background-color: var(--bg-base);
  background-image:
    radial-gradient(circle, var(--border) 1px, transparent 1px);
  background-size: 30px 30px;
  background-position: 15px 15px;
}

.widget {
  position: absolute;
  background: linear-gradient(135deg, var(--bg-widget), #0a1f3d);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: move;
  transition: border-color 0.15s;
  overflow: hidden;
  animation: widgetIn 0.2s ease-out;
  user-select: none;
}

.widget:hover { border-color: var(--border-accent); }

.selected {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 2px var(--accent-dim), 0 4px 20px rgba(0,0,0,0.5);
}
```

- [ ] **Step 7: Crear `src/components/PropertiesPanel/PropertiesPanel.jsx`** (shell)

```jsx
import styles from './PropertiesPanel.module.css';

export default function PropertiesPanel() {
  return (
    <aside className={styles.panel}>
      <div className={styles.title}>⚙ Propiedades</div>
      <div className={styles.empty}>
        Selecciona un widget para editar sus propiedades
      </div>
    </aside>
  );
}
```

- [ ] **Step 8: Crear `src/components/PropertiesPanel/PropertiesPanel.module.css`**

```css
.panel {
  width: 190px;
  min-width: 190px;
  background: var(--bg-surface);
  border-left: 1px solid var(--border);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.title {
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}

.label {
  color: var(--text-dim);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 12px;
  margin-bottom: 6px;
}

.sizeGrid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
}

.sizeBtn {
  background: var(--bg-widget);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: 5px;
  padding: 5px 4px;
  font-size: 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}
.sizeBtn:hover { border-color: var(--border-accent); color: var(--text-primary); }
.active { background: var(--accent-dim) !important; border-color: var(--accent) !important; color: var(--accent) !important; }

.coordRow { display: flex; gap: 8px; }
.coordInput {
  width: 100%;
  background: var(--bg-widget);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 5px 6px;
  color: var(--text-primary);
  font-size: 11px;
  text-align: center;
  outline: none;
}
.coordInput:focus { border-color: var(--border-accent); }
.coordLabel { color: var(--text-dim); font-size: 9px; text-align: center; margin-top: 2px; }

.colorRow { display: flex; gap: 5px; flex-wrap: wrap; }
.colorDot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s;
}
.activeDot { border-color: white !important; }

.snapBtn {
  background: var(--bg-widget);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.snapBtn.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }

.widgetInfo {
  margin-top: 16px;
  background: var(--bg-widget);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
}
.widgetName { font-size: 12px; color: var(--text-primary); margin-bottom: 8px; }
.deleteBtn {
  width: 100%;
  background: transparent;
  border: 1px solid var(--danger);
  color: var(--danger);
  border-radius: 6px;
  padding: 5px;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.15s;
}
.deleteBtn:hover { background: rgba(239,68,68,0.1); }

.empty {
  color: var(--text-dim);
  font-size: 11px;
  text-align: center;
  padding: 20px 10px;
  line-height: 1.6;
}
```

- [ ] **Step 9: Verificar en browser**

```bash
npm run dev
```

Expected: página con sidebar azul oscuro a la izquierda, canvas con grilla de puntos en el centro, panel de propiedades a la derecha. Sin errores en consola.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: add 3-column app shell with sidebar, canvas and properties panel"
```

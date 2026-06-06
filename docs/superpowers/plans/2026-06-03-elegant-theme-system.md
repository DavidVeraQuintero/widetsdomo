# Elegant Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark dotted canvas background with a blurred luxury interior photo and convert widget cards to glassmorphism, with a CSS-variable theme system (room + palette + time of day) controlled by a picker in the Canvas toolbar.

**Architecture:** Three CSS `data-*` attributes on `:root` (`data-room`, `data-palette`, `data-time`) drive all visual variables. The `dashboardStore` reducer stores theme state and persists it to localStorage. A null-rendering `ThemeApplier` component syncs store → DOM attributes. The Canvas gains a layered background (photo + tint + hour overlays) and widget cards switch to glassmorphism.

**Tech Stack:** React 18, CSS Modules, CSS custom properties, Unsplash CDN for background photos.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/store/dashboardStore.jsx` | Modify | Add `theme` state + `SET_THEME` reducer case |
| `src/components/ThemeApplier.jsx` | Create | Syncs `state.theme` → `document.documentElement.dataset.*` |
| `src/App.jsx` | Modify | Render `<ThemeApplier />` inside `DashboardProvider` |
| `src/styles/theme.css` | Modify | Add CSS variables for all room/palette/time combinations |
| `src/components/Canvas/Canvas.module.css` | Modify | Add `canvasArea` + bg layer classes; glassmorphism widget |
| `src/components/Canvas/Canvas.jsx` | Modify | Add bg layer divs + `canvasArea` wrapper + theme button |
| `src/components/Canvas/ThemePicker.jsx` | Create | Popover with 3 sections: Ambiente, Paleta, Hora |
| `src/components/Canvas/ThemePicker.module.css` | Create | Styles for the picker panel |

---

## Task 1: Add theme state and SET_THEME to dashboardStore

**Files:**
- Modify: `src/store/dashboardStore.jsx`

- [ ] **Step 1: Update DEFAULT_STATE to include theme**

In `src/store/dashboardStore.jsx`, replace:

```js
const DEFAULT_STATE = {
  widgets: [],
  selectedId: null,
  snapToGrid: true,
  accentColor: '#3b82f6',
  globalIcons: {},
};
```

With:

```js
const DEFAULT_STATE = {
  widgets: [],
  selectedId: null,
  snapToGrid: true,
  accentColor: '#3b82f6',
  globalIcons: {},
  theme: { room: 'sala', palette: 'calido', time: 'atardecer' },
};
```

- [ ] **Step 2: Update loadState to restore theme**

Replace:

```js
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    return { ...DEFAULT_STATE, widgets: saved.widgets ?? [], globalIcons: saved.globalIcons ?? {} };
  } catch {
    return DEFAULT_STATE;
  }
}
```

With:

```js
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      widgets: saved.widgets ?? [],
      globalIcons: saved.globalIcons ?? {},
      theme: saved.theme ?? DEFAULT_STATE.theme,
    };
  } catch {
    return DEFAULT_STATE;
  }
}
```

- [ ] **Step 3: Update persist to save theme**

Replace:

```js
function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets: state.widgets, globalIcons: state.globalIcons }));
}
```

With:

```js
function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    widgets: state.widgets,
    globalIcons: state.globalIcons,
    theme: state.theme,
  }));
}
```

- [ ] **Step 4: Add SET_THEME case to reducer**

In the `reducer` function, add this case before `default:`:

```js
case 'SET_THEME': {
  const next = { ...state, theme: { ...state.theme, ...action.patch } };
  persist(next);
  return next;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/store/dashboardStore.jsx
git commit -m "feat: add theme state and SET_THEME to dashboardStore"
```

---

## Task 2: Create ThemeApplier and wire it into App

**Files:**
- Create: `src/components/ThemeApplier.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create src/components/ThemeApplier.jsx**

```jsx
import { useEffect } from 'react';
import { useDashboard } from '../store/dashboardStore.jsx';

export default function ThemeApplier() {
  const { state } = useDashboard();
  const { theme } = state;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.room = theme.room;
    root.dataset.palette = theme.palette;
    root.dataset.time = theme.time;
  }, [theme]);

  return null;
}
```

- [ ] **Step 2: Update src/App.jsx to render ThemeApplier**

Replace the entire file with:

```jsx
import { DashboardProvider } from './store/dashboardStore.jsx';
import ThemeApplier from './components/ThemeApplier.jsx';
import Sidebar from './components/Sidebar/Sidebar';
import Canvas from './components/Canvas/Canvas';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import styles from './App.module.css';

export default function App() {
  return (
    <DashboardProvider>
      <ThemeApplier />
      <div className={styles.layout}>
        <Sidebar />
        <Canvas />
        <PropertiesPanel />
      </div>
    </DashboardProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeApplier.jsx src/App.jsx
git commit -m "feat: add ThemeApplier — syncs store theme to data-* attributes on root"
```

---

## Task 3: Add theme CSS variables to theme.css

**Files:**
- Modify: `src/styles/theme.css`

- [ ] **Step 1: Append theme variable rules to the end of src/styles/theme.css**

Add these lines at the end of the file:

```css
/* ── Theme defaults (overridden by data-* selectors below) ── */
:root {
  --bg-photo: url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80');
  --bg-blur: 4px;
  --theme-tint: rgba(180, 110, 40, 0.20);
  --theme-hour-gradient: linear-gradient(180deg, rgba(255,100,0,0.15) 0%, transparent 50%, rgba(15,8,2,0.35) 100%);
}

/* Rooms */
:root[data-room="sala"]       { --bg-photo: url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80'); }
:root[data-room="dormitorio"] { --bg-photo: url('https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80'); }
:root[data-room="cocina"]     { --bg-photo: url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80'); }
:root[data-room="jardin"]     { --bg-photo: url('https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=80'); }

/* Palettes */
:root[data-palette="calido"] { --theme-tint: rgba(180, 110, 40, 0.20); }
:root[data-palette="frio"]   { --theme-tint: rgba(30, 58, 95, 0.25); }
:root[data-palette="oscuro"] { --theme-tint: rgba(10, 10, 10, 0.35); }
:root[data-palette="neutro"] { --theme-tint: rgba(100, 100, 100, 0.15); }

/* Time of day */
:root[data-time="amanecer"]  { --theme-hour-gradient: linear-gradient(180deg, rgba(255,160,80,0.20) 0%, transparent 60%); }
:root[data-time="dia"]       { --theme-hour-gradient: linear-gradient(180deg, rgba(255,255,180,0.12) 0%, transparent 50%); }
:root[data-time="atardecer"] { --theme-hour-gradient: linear-gradient(180deg, rgba(255,100,0,0.15) 0%, transparent 50%, rgba(15,8,2,0.35) 100%); }
:root[data-time="noche"]     { --theme-hour-gradient: linear-gradient(180deg, rgba(0,0,40,0.40) 0%, transparent 60%, rgba(0,5,30,0.50) 100%); }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/theme.css
git commit -m "feat: add theme CSS variables for room/palette/time"
```

---

## Task 4: Update Canvas.module.css — background layers + glassmorphism

**Files:**
- Modify: `src/components/Canvas/Canvas.module.css`

- [ ] **Step 1: Replace the entire file**

Replace `src/components/Canvas/Canvas.module.css` with:

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
  background: rgba(10, 14, 26, 0.80);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.title { color: var(--text-secondary); font-size: 12px; flex: 1; }

.btn {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-secondary);
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn:hover { background: rgba(255, 255, 255, 0.14); color: white; }

.btnTheme {
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: white;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btnTheme:hover { background: rgba(255, 255, 255, 0.18); }

.themeWrap {
  position: relative;
}

/* ── Canvas area: clips background layers ── */
.canvasArea {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Background photo layer */
.canvasBg {
  position: absolute;
  inset: 0;
  background-image: var(--bg-photo);
  background-size: cover;
  background-position: center;
  filter: blur(var(--bg-blur)) brightness(0.65) saturate(1.1);
  transform: scale(1.04);
  pointer-events: none;
  z-index: 0;
  transition: background-image 0.6s ease, filter 0.4s ease;
}

/* Palette tint overlay */
.canvasTint {
  position: absolute;
  inset: 0;
  background: var(--theme-tint);
  pointer-events: none;
  z-index: 1;
  transition: background 0.6s ease;
}

/* Time-of-day gradient overlay */
.canvasHour {
  position: absolute;
  inset: 0;
  background: var(--theme-hour-gradient);
  pointer-events: none;
  z-index: 2;
  transition: background 0.6s ease;
}

/* Scrollable widget area */
.canvas {
  flex: 1;
  position: relative;
  overflow: auto;
  z-index: 3;
  min-height: 0;
}

/* ── Widgets — glassmorphism ── */
.widget {
  position: absolute;
  background: rgba(255, 255, 255, 0.11);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.20);
  border-radius: 10px;
  cursor: move;
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
  animation: widgetIn 0.2s ease-out;
  user-select: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.40), inset 0 1px 0 rgba(255, 255, 255, 0.10);
}

.widget:hover {
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.selected {
  border-color: rgba(255, 255, 255, 0.50) !important;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.15), 0 12px 40px rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Canvas/Canvas.module.css
git commit -m "feat: canvas background layers + glassmorphism widget cards"
```

---

## Task 5: Update Canvas.jsx — add background layers + canvasArea wrapper

**Files:**
- Modify: `src/components/Canvas/Canvas.jsx`

- [ ] **Step 1: Replace the entire file**

```jsx
import { useState, useRef } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import { SNAP_SIZE } from '../../catalog/widgetSizes';
import CanvasWidget from './CanvasWidget';
import ThemePicker from './ThemePicker';
import styles from './Canvas.module.css';

const ROOM_LABELS = {
  sala: '🛋️ Sala',
  dormitorio: '🛏️ Dormitorio',
  cocina: '🍳 Cocina',
  jardin: '🌿 Jardín',
};

export default function Canvas() {
  const { state, dispatch } = useDashboard();
  const canvasRef = useRef(null);
  const [showPicker, setShowPicker] = useState(false);

  const snap = (v) =>
    state.snapToGrid ? Math.round(v / SNAP_SIZE) * SNAP_SIZE : v;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('widgetType');
    if (!type) return;
    const def = getCatalogEntry(type);
    if (!def) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = snap(Math.max(0, e.clientX - rect.left - 45));
    const y = snap(Math.max(0, e.clientY - rect.top - 45));

    dispatch({
      type: 'ADD_WIDGET',
      payload: {
        id: `${type}-${Date.now()}`,
        type,
        x,
        y,
        size: def.sizes[Math.min(1, def.sizes.length - 1)],
        config: { ...def.defaultConfig },
      },
    });
  };

  const handleClick = (e) => {
    if (e.target === canvasRef.current || e.target === e.currentTarget) {
      dispatch({ type: 'SELECT_WIDGET', id: null });
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <span className={styles.title}>
          Canvas · Arrastra widgets desde el panel izquierdo
        </span>
        <button
          className={styles.btn}
          onClick={() => dispatch({ type: 'CLEAR_CANVAS' })}
        >
          🗑 Limpiar
        </button>
        <div className={styles.themeWrap}>
          <button
            className={styles.btnTheme}
            onClick={() => setShowPicker(v => !v)}
          >
            {ROOM_LABELS[state.theme.room] ?? '🏠 Tema'} · {state.theme.palette}
          </button>
          {showPicker && (
            <ThemePicker onClose={() => setShowPicker(false)} />
          )}
        </div>
      </div>

      <div className={styles.canvasArea}>
        <div className={styles.canvasBg} />
        <div className={styles.canvasTint} />
        <div className={styles.canvasHour} />

        <div
          ref={canvasRef}
          className={styles.canvas}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          {state.widgets.map(w => (
            <CanvasWidget key={w.id} widget={w} />
          ))}
          {state.widgets.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.35)', fontSize: 13, pointerEvents: 'none',
            }}>
              Arrastra un widget aquí para comenzar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the dev server and verify the background photo loads**

```bash
npm run dev
```

Open http://localhost:5173 in the browser. Expected:
- The canvas shows a blurred luxury living room photo (4px blur — slightly visible room)
- The toolbar has a "🛋️ Sala · calido" button on the right
- Widgets (if any are placed) render with a frosted glass look

If the background is pure black, the Unsplash URL may be blocked — check the browser console for CORS or network errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Canvas/Canvas.jsx
git commit -m "feat: canvas layout with photo background layers and theme button"
```

---

## Task 6: Create ThemePicker component

**Files:**
- Create: `src/components/Canvas/ThemePicker.jsx`
- Create: `src/components/Canvas/ThemePicker.module.css`

- [ ] **Step 1: Create ThemePicker.module.css**

Create `src/components/Canvas/ThemePicker.module.css`:

```css
.picker {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 264px;
  background: rgba(10, 14, 26, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 14px;
  z-index: 100;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.60);
}

.section {
  margin-bottom: 14px;
}
.section:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: #475569;
  margin-bottom: 8px;
}

/* Rooms */
.roomGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.roomBtn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  padding: 6px 4px;
  text-align: center;
  cursor: pointer;
  font-size: 9px;
  color: #94a3b8;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  line-height: 1.2;
}
.roomBtn:hover { background: rgba(255, 255, 255, 0.10); color: white; }
.roomBtn.sel { background: rgba(59, 130, 246, 0.20); border-color: #3b82f6; color: white; }

.emoji { font-size: 16px; }

/* Palettes */
.paletteRow {
  display: flex;
  gap: 6px;
}

.paletteChip {
  flex: 1;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
  padding: 0;
}
.paletteChip:hover { transform: scaleY(1.1); }
.paletteChip.sel { border-color: white; }

/* Time of day */
.timePills {
  display: flex;
  gap: 4px;
}

.timePill {
  flex: 1;
  padding: 6px 4px;
  border-radius: 6px;
  text-align: center;
  font-size: 9px;
  line-height: 1.4;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}
.timePill:hover { background: rgba(255, 255, 255, 0.10); color: white; }
.timePill.sel { background: rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.28); color: white; }
```

- [ ] **Step 2: Create ThemePicker.jsx**

Create `src/components/Canvas/ThemePicker.jsx`:

```jsx
import { useEffect, useRef } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import styles from './ThemePicker.module.css';

const ROOMS = [
  { id: 'sala',       emoji: '🛋️', label: 'Sala' },
  { id: 'dormitorio', emoji: '🛏️', label: 'Dorm.' },
  { id: 'cocina',     emoji: '🍳', label: 'Cocina' },
  { id: 'jardin',     emoji: '🌿', label: 'Jardín' },
];

const PALETTES = [
  { id: 'calido', label: 'Cálido',  from: '#c8852a', to: '#f4c96e' },
  { id: 'frio',   label: 'Frío',    from: '#1e3a5f', to: '#7dd3fc' },
  { id: 'oscuro', label: 'Oscuro',  from: '#1c1c1c', to: '#d4af37' },
  { id: 'neutro', label: 'Neutro',  from: '#374151', to: '#d1d5db' },
];

const TIMES = [
  { id: 'amanecer',  emoji: '🌅', label: 'Amanecer' },
  { id: 'dia',       emoji: '☀️', label: 'Día' },
  { id: 'atardecer', emoji: '🌇', label: 'Atardecer' },
  { id: 'noche',     emoji: '🌙', label: 'Noche' },
];

export default function ThemePicker({ onClose }) {
  const { state, dispatch } = useDashboard();
  const { theme } = state;
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const set = (patch) => dispatch({ type: 'SET_THEME', patch });

  return (
    <div className={styles.picker} ref={ref}>
      <div className={styles.section}>
        <div className={styles.label}>AMBIENTE</div>
        <div className={styles.roomGrid}>
          {ROOMS.map(r => (
            <button
              key={r.id}
              className={`${styles.roomBtn} ${theme.room === r.id ? styles.sel : ''}`}
              onClick={() => set({ room: r.id })}
            >
              <span className={styles.emoji}>{r.emoji}</span>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>PALETA</div>
        <div className={styles.paletteRow}>
          {PALETTES.map(p => (
            <button
              key={p.id}
              className={`${styles.paletteChip} ${theme.palette === p.id ? styles.sel : ''}`}
              style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
              title={p.label}
              onClick={() => set({ palette: p.id })}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>HORA</div>
        <div className={styles.timePills}>
          {TIMES.map(t => (
            <button
              key={t.id}
              className={`${styles.timePill} ${theme.time === t.id ? styles.sel : ''}`}
              onClick={() => set({ time: t.id })}
            >
              {t.emoji}<br />{t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run the app and verify the full feature**

```bash
npm run dev
```

Open http://localhost:5173. Expected:

1. Canvas shows the living room photo with warm tint and sunset gradient
2. Click "🛋️ Sala · calido" button → picker opens with 3 sections
3. Click "🛏️ Dorm." → background changes to bedroom photo
4. Click blue palette chip → tint shifts to cool blue
5. Click "🌙 Noche" → dark night gradient appears at top/bottom
6. Click outside the picker → it closes
7. Reload the page → the selected theme persists (localStorage)
8. Drag a widget onto the canvas → it renders with frosted glass (translucent + blur behind it)

- [ ] **Step 4: Commit**

```bash
git add src/components/Canvas/ThemePicker.jsx src/components/Canvas/ThemePicker.module.css
git commit -m "feat: ThemePicker — room, palette, and time-of-day selector"
```

# Plan 02 — Interactions: Sidebar + Drag & Drop + CanvasWidget + Properties Panel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El usuario puede arrastrar widgets del sidebar al canvas, reposicionarlos con el mouse, seleccionarlos y usar el panel de propiedades para cambiar tamaño, posición X/Y y color de acento.

**Architecture:** HTML5 Drag API para sidebar→canvas. Mouse events (document-level) para reposicionar en canvas. El catalog usa un placeholder hasta el Plan 03. Properties Panel conectado al store.

**Tech Stack:** React 18, HTML5 Drag & Drop API, mouse events nativos.

**Prerequisite:** Plan 01 completado (`npm run dev` funciona sin errores).

---

### Task 1: Catálogo placeholder

**Files:**
- Create: `src/catalog/widgetCatalog.js`

- [ ] **Step 1: Crear `src/catalog/widgetCatalog.js`** con entradas placeholder (los componentes reales se agregan en planes 03–05)

```js
// Los campos `component` se rellenan en planes 03-05.
// Por ahora usamos un componente placeholder genérico.
import { lazy } from 'react';

function Placeholder({ size, config }) {
  return (
    <div className="w-body w-center">
      <div className="w-icon">{config.icon || '❓'}</div>
      <div className="w-name">{config.name || 'Widget'}</div>
      <div className="w-sub">{size}</div>
    </div>
  );
}

export const WIDGET_CATALOG = [
  // ── ILUMINACIÓN ──
  { id: 'lampara-simple',  category: 'Iluminación', categoryIcon: '💡', icon: '💡', name: 'Lámpara Simple',   sizes: ['1x1','1x2','2x2'],          defaultConfig: { on: false, name: 'Lámpara' },           component: Placeholder },
  { id: 'lampara-dimmer',  category: 'Iluminación', categoryIcon: '💡', icon: '🔆', name: 'Lámpara Dimmer',  sizes: ['1x1','1x2','2x2'],          defaultConfig: { on: false, name: 'Lámpara', brightness: 75 }, component: Placeholder },
  { id: 'lampara-rgb',     category: 'Iluminación', categoryIcon: '💡', icon: '🎨', name: 'Lámpara RGB',     sizes: ['1x1','1x2','2x2','4x4'],    defaultConfig: { on: false, name: 'RGB', color: '#3b82f6', brightness: 75 }, component: Placeholder },
  { id: 'lampara-cct',     category: 'Iluminación', categoryIcon: '💡', icon: '💫', name: 'Lámpara CCT',     sizes: ['1x2','2x2'],                defaultConfig: { on: false, name: 'CCT', colorTemp: 50 }, component: Placeholder },
  { id: 'tira-led',        category: 'Iluminación', categoryIcon: '💡', icon: '✨', name: 'Tira LED',        sizes: ['1x2','2x2','2x4'],          defaultConfig: { on: false, name: 'LED', color: '#7c3aed', brightness: 80 }, component: Placeholder },
  // ── CLIMA ──
  { id: 'aire-acondicionado', category: 'Clima', categoryIcon: '🌡', icon: '❄',  name: 'Aire Acondicionado', sizes: ['1x1','1x2','2x2','4x2'], defaultConfig: { on: false, name: 'AC', temp: 24, mode: 'frío' }, component: Placeholder },
  { id: 'termostato',      category: 'Clima', categoryIcon: '🌡', icon: '🌡', name: 'Termostato',         sizes: ['1x2','2x2'],               defaultConfig: { name: 'Termostato', target: 22, current: 21 }, component: Placeholder },
  { id: 'ventilador',      category: 'Clima', categoryIcon: '🌡', icon: '🌀', name: 'Ventilador',         sizes: ['1x1','1x2'],               defaultConfig: { on: false, name: 'Ventilador', speed: 2 }, component: Placeholder },
  { id: 'calefactor',      category: 'Clima', categoryIcon: '🌡', icon: '🔥', name: 'Calefactor',         sizes: ['1x1','1x2'],               defaultConfig: { on: false, name: 'Calefactor', temp: 20 }, component: Placeholder },
  { id: 'humidificador',   category: 'Clima', categoryIcon: '🌡', icon: '💧', name: 'Humidificador',      sizes: ['1x1','1x2'],               defaultConfig: { on: false, name: 'Humidificador', humidity: 50 }, component: Placeholder },
  { id: 'purificador',     category: 'Clima', categoryIcon: '🌡', icon: '🌬', name: 'Purificador Aire',   sizes: ['1x2','2x2'],               defaultConfig: { on: false, name: 'Purificador', aqi: 25 }, component: Placeholder },
  // ── SEGURIDAD ──
  { id: 'puerta',          category: 'Seguridad', categoryIcon: '🔐', icon: '🚪', name: 'Puerta',            sizes: ['1x1','1x2','2x2'], defaultConfig: { open: false, locked: true, name: 'Puerta' }, component: Placeholder },
  { id: 'ventana',         category: 'Seguridad', categoryIcon: '🔐', icon: '🪟', name: 'Ventana',           sizes: ['1x1','1x2'],       defaultConfig: { open: false, name: 'Ventana' }, component: Placeholder },
  { id: 'cerradura',       category: 'Seguridad', categoryIcon: '🔐', icon: '🔒', name: 'Cerradura',         sizes: ['1x1','1x2'],       defaultConfig: { locked: true, name: 'Cerradura' }, component: Placeholder },
  { id: 'camara-ip',       category: 'Seguridad', categoryIcon: '🔐', icon: '📹', name: 'Cámara IP',         sizes: ['2x2','2x4','4x4'], defaultConfig: { recording: true, name: 'Cámara' }, component: Placeholder },
  { id: 'sensor-movimiento', category: 'Seguridad', categoryIcon: '🔐', icon: '👁', name: 'Sensor Movimiento', sizes: ['1x1','1x2'],    defaultConfig: { detected: false, name: 'Movimiento' }, component: Placeholder },
  { id: 'alarma',          category: 'Seguridad', categoryIcon: '🔐', icon: '🚨', name: 'Alarma',            sizes: ['1x1','2x2'],       defaultConfig: { armed: false, name: 'Alarma' }, component: Placeholder },
  // ── PERSIANAS ──
  { id: 'persiana-roller', category: 'Persianas', categoryIcon: '🪟', icon: '📋', name: 'Persiana Roller',  sizes: ['1x2','2x2'], defaultConfig: { position: 60, name: 'Persiana' }, component: Placeholder },
  { id: 'cortina',         category: 'Persianas', categoryIcon: '🪟', icon: '🎭', name: 'Cortina',          sizes: ['1x2','2x2'], defaultConfig: { position: 80, name: 'Cortina' }, component: Placeholder },
  { id: 'toldo',           category: 'Persianas', categoryIcon: '🪟', icon: '⛺', name: 'Toldo',            sizes: ['1x2','2x2'], defaultConfig: { position: 40, name: 'Toldo' }, component: Placeholder },
  { id: 'veneciana',       category: 'Persianas', categoryIcon: '🪟', icon: '🪞', name: 'Veneciana',        sizes: ['1x2','2x2'], defaultConfig: { position: 50, angle: 45, name: 'Veneciana' }, component: Placeholder },
  // ── SENSORES ──
  { id: 'sensor-temp',     category: 'Sensores', categoryIcon: '📡', icon: '🌡', name: 'Temp/Humedad',     sizes: ['1x1','1x2','2x2'], defaultConfig: { temp: 22, humidity: 65, name: 'Sensor' }, component: Placeholder },
  { id: 'sensor-aire',     category: 'Sensores', categoryIcon: '📡', icon: '💨', name: 'Calidad Aire',     sizes: ['1x2','2x2'],       defaultConfig: { aqi: 42, co2: 480, name: 'Aire' }, component: Placeholder },
  { id: 'sensor-humo',     category: 'Sensores', categoryIcon: '📡', icon: '🔥', name: 'Humo/Gas',         sizes: ['1x1','1x2'],       defaultConfig: { alert: false, name: 'Humo' }, component: Placeholder },
  { id: 'sensor-inundacion', category: 'Sensores', categoryIcon: '📡', icon: '💧', name: 'Inundación',     sizes: ['1x1','1x2'],       defaultConfig: { alert: false, name: 'Agua' }, component: Placeholder },
  { id: 'sensor-luz',      category: 'Sensores', categoryIcon: '📡', icon: '☀', name: 'Luminosidad',      sizes: ['1x1','1x2'],       defaultConfig: { lux: 320, name: 'Luz' }, component: Placeholder },
  { id: 'estacion-meteo',  category: 'Sensores', categoryIcon: '📡', icon: '⛅', name: 'Estación Meteo',  sizes: ['2x2','2x4'],       defaultConfig: { temp: 18, humidity: 72, pressure: 1013, wind: 12, name: 'Exterior' }, component: Placeholder },
  // ── ENERGÍA ──
  { id: 'enchufe',         category: 'Energía', categoryIcon: '⚡', icon: '🔌', name: 'Enchufe',          sizes: ['1x1','1x2','2x2'], defaultConfig: { on: false, watts: 85, name: 'Enchufe' }, component: Placeholder },
  { id: 'medidor-consumo', category: 'Energía', categoryIcon: '⚡', icon: '📊', name: 'Medidor Consumo',  sizes: ['2x2','2x4'],       defaultConfig: { kwh: 12.4, name: 'Consumo' }, component: Placeholder },
  { id: 'panel-solar',     category: 'Energía', categoryIcon: '⚡', icon: '☀', name: 'Panel Solar',       sizes: ['2x2','2x4'],       defaultConfig: { kw: 2.8, name: 'Solar' }, component: Placeholder },
  { id: 'bateria',         category: 'Energía', categoryIcon: '⚡', icon: '🔋', name: 'Batería',          sizes: ['1x2','2x2'],       defaultConfig: { percent: 78, charging: true, name: 'Batería' }, component: Placeholder },
  // ── MULTIMEDIA ──
  { id: 'tv',              category: 'Multimedia', categoryIcon: '🎵', icon: '📺', name: 'TV',              sizes: ['1x2','2x2','2x4'], defaultConfig: { on: false, source: 'HDMI 1', volume: 30, name: 'TV' }, component: Placeholder },
  { id: 'musica',          category: 'Multimedia', categoryIcon: '🎵', icon: '🎵', name: 'Música',          sizes: ['1x2','2x2','2x4','4x4'], defaultConfig: { playing: false, track: 'Blinding Lights', artist: 'The Weeknd', volume: 65, name: 'Música' }, component: Placeholder },
  { id: 'altavoz',         category: 'Multimedia', categoryIcon: '🎵', icon: '🔊', name: 'Altavoz',         sizes: ['1x1','1x2'],       defaultConfig: { on: false, volume: 50, name: 'Altavoz' }, component: Placeholder },
  // ── ESCENAS ──
  { id: 'escena-individual', category: 'Escenas', categoryIcon: '🎬', icon: '🎬', name: 'Escena',          sizes: ['1x1','1x2'],       defaultConfig: { active: false, sceneName: 'Noche', sceneIcon: '🌙', sceneColor: '#0f1f14' }, component: Placeholder },
  { id: 'panel-escenas',   category: 'Escenas', categoryIcon: '🎬', icon: '🎭', name: 'Panel Escenas',    sizes: ['2x2','2x4','4x2'], defaultConfig: { activeScene: 'película', scenes: [{ id:'noche', name:'Noche', icon:'🌙', color:'#0f1f14' }, { id:'película', name:'Película', icon:'🎬', color:'#1e1b4b' }, { id:'lectura', name:'Lectura', icon:'📖', color:'#1c1507' }, { id:'fiesta', name:'Fiesta', icon:'🎉', color:'#1f0e1a' }] }, component: Placeholder },
  { id: 'escena-activa',   category: 'Escenas', categoryIcon: '🎬', icon: '▶', name: 'Escena Activa',    sizes: ['1x2','2x2'],       defaultConfig: { activeScene: 'Película', activeIcon: '🎬', activeColor: '#1e1b4b' }, component: Placeholder },
  // ── AUTOMATIZACIÓN ──
  { id: 'temporizador',    category: 'Automatización', categoryIcon: '🤖', icon: '⏱', name: 'Temporizador',  sizes: ['1x2','2x2'], defaultConfig: { active: false, minutes: 30, name: 'Timer' }, component: Placeholder },
  { id: 'regla-auto',      category: 'Automatización', categoryIcon: '🤖', icon: '⚙', name: 'Regla Auto',    sizes: ['1x2','2x2'], defaultConfig: { enabled: true, name: 'Si anochece → luces' }, component: Placeholder },
  { id: 'estado-hogar',    category: 'Automatización', categoryIcon: '🤖', icon: '🏠', name: 'Estado Hogar',  sizes: ['2x2','2x4'], defaultConfig: { activeDevices: 8, alerts: 0, kwh: 12.4 }, component: Placeholder },
];

export function getCatalogEntry(id) {
  return WIDGET_CATALOG.find(w => w.id === id);
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat: add widget catalog with 38 placeholder entries"
```

---

### Task 2: Sidebar funcional con drag

**Files:**
- Modify: `src/components/Sidebar/Sidebar.jsx`
- Create: `src/components/Sidebar/WidgetItem.jsx`

- [ ] **Step 1: Reemplazar `src/components/Sidebar/Sidebar.jsx`**

```jsx
import { useState } from 'react';
import { WIDGET_CATALOG } from '../../catalog/widgetCatalog';
import WidgetItem from './WidgetItem';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? WIDGET_CATALOG.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase())
      )
    : WIDGET_CATALOG;

  const categories = [...new Set(WIDGET_CATALOG.map(w => w.category))];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.appName}>🏠 Domótica</div>
        <input
          className={styles.search}
          placeholder="🔍 Buscar widget..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className={styles.list}>
        {categories.map(cat => {
          const items = filtered.filter(w => w.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <div className={styles.category}>
                {items[0].categoryIcon} {cat}
              </div>
              {items.map(def => (
                <WidgetItem key={def.id} def={def} />
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Crear `src/components/Sidebar/WidgetItem.jsx`**

```jsx
import styles from './Sidebar.module.css';

export default function WidgetItem({ def }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('widgetType', def.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={styles.item}
      draggable
      onDragStart={handleDragStart}
      title={`Arrastra al canvas · Tamaños: ${def.sizes.join(', ')}`}
    >
      <span className={styles.itemIcon}>{def.icon}</span>
      <span className={styles.itemName}>{def.name}</span>
      <span className={styles.itemBadge}>{def.sizes.length}</span>
    </div>
  );
}
```

- [ ] **Step 3: Verificar en browser** — El sidebar muestra todas las categorías y widgets. Se puede buscar. Los items tienen cursor `grab`.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: sidebar with search and draggable widget items"
```

---

### Task 3: Canvas con drop zone + CanvasWidget

**Files:**
- Modify: `src/components/Canvas/Canvas.jsx`
- Create: `src/components/Canvas/CanvasWidget.jsx`

- [ ] **Step 1: Reemplazar `src/components/Canvas/Canvas.jsx`**

```jsx
import { useRef } from 'react';
import { useDashboard } from '../../store/dashboardStore';
import { getCatalogEntry } from '../../catalog/widgetCatalog';
import { SNAP_SIZE } from '../../catalog/widgetSizes';
import CanvasWidget from './CanvasWidget';
import styles from './Canvas.module.css';

export default function Canvas() {
  const { state, dispatch } = useDashboard();
  const canvasRef = useRef(null);

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
      </div>
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
            color: 'var(--text-dim)', fontSize: 13, pointerEvents: 'none',
          }}>
            Arrastra un widget aquí para comenzar
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/Canvas/CanvasWidget.jsx`**

```jsx
import { useRef } from 'react';
import { useDashboard } from '../../store/dashboardStore';
import { getCatalogEntry } from '../../catalog/widgetCatalog';
import { WIDGET_SIZES, SNAP_SIZE } from '../../catalog/widgetSizes';
import styles from './Canvas.module.css';

export default function CanvasWidget({ widget }) {
  const { state, dispatch } = useDashboard();
  const dragging = useRef(false);
  const origin = useRef(null);
  const isSelected = state.selectedId === widget.id;

  const size = WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2'];
  const def = getCatalogEntry(widget.type);
  const WidgetComponent = def?.component;

  const handleMouseDown = (e) => {
    if (e.target.closest('input, button, select, textarea')) return;
    e.stopPropagation();
    e.preventDefault();

    dispatch({ type: 'SELECT_WIDGET', id: widget.id });

    dragging.current = true;
    origin.current = {
      mx: e.clientX, my: e.clientY,
      wx: widget.x,  wy: widget.y,
    };

    const snap = (v) =>
      state.snapToGrid ? Math.round(v / SNAP_SIZE) * SNAP_SIZE : v;

    const onMove = (e) => {
      if (!dragging.current) return;
      const nx = snap(Math.max(0, origin.current.wx + (e.clientX - origin.current.mx)));
      const ny = snap(Math.max(0, origin.current.wy + (e.clientY - origin.current.my)));
      dispatch({ type: 'MOVE_WIDGET', id: widget.id, x: nx, y: ny });
    };

    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className={`${styles.widget} ${isSelected ? styles.selected : ''}`}
      style={{
        left: widget.x,
        top: widget.y,
        width: size.width,
        height: size.height,
      }}
      onMouseDown={handleMouseDown}
    >
      {WidgetComponent ? (
        <WidgetComponent
          size={widget.size}
          config={widget.config}
          accentColor={state.accentColor}
          onConfigChange={(config) =>
            dispatch({ type: 'UPDATE_CONFIG', id: widget.id, config })
          }
        />
      ) : (
        <div className="w-body w-center">
          <div className="w-sub">Widget desconocido: {widget.type}</div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verificar drag & drop en browser**

Abrir `http://localhost:5173`. Arrastrar "Lámpara Simple" del sidebar al canvas. Debe aparecer un widget azul con "Lámpara · 1x2". Se puede mover arrastrándolo. Hacer clic fuera deselecciona.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: canvas drop zone and canvas widget with mouse drag repositioning"
```

---

### Task 4: Properties Panel funcional

**Files:**
- Modify: `src/components/PropertiesPanel/PropertiesPanel.jsx`

- [ ] **Step 1: Reemplazar `src/components/PropertiesPanel/PropertiesPanel.jsx`**

```jsx
import { useDashboard } from '../../store/dashboardStore';
import { getCatalogEntry } from '../../catalog/widgetCatalog';
import styles from './PropertiesPanel.module.css';

const ALL_SIZES = ['1x1', '1x2', '2x1', '2x2', '2x4', '4x2', '4x4'];
const ACCENT_COLORS = ['#3b82f6', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function PropertiesPanel() {
  const { state, dispatch } = useDashboard();
  const selected = state.widgets.find(w => w.id === state.selectedId) ?? null;
  const def = selected ? getCatalogEntry(selected.type) : null;
  const availSizes = def ? ALL_SIZES.filter(s => def.sizes.includes(s)) : ALL_SIZES;

  if (!selected) {
    return (
      <aside className={styles.panel}>
        <div className={styles.title}>⚙ Propiedades</div>
        <div className={styles.empty}>
          Arrastra un widget al canvas o selecciona uno existente
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.title}>⚙ Propiedades</div>

      <div className={styles.label}>Tamaño</div>
      <div className={styles.sizeGrid}>
        {availSizes.map(s => (
          <button
            key={s}
            className={`${styles.sizeBtn} ${selected.size === s ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'RESIZE_WIDGET', id: selected.id, size: s })}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={styles.label}>Posición (px)</div>
      <div className={styles.coordRow}>
        <div>
          <input
            type="number"
            className={styles.coordInput}
            value={Math.round(selected.x)}
            onChange={e =>
              dispatch({ type: 'MOVE_WIDGET', id: selected.id, x: Number(e.target.value), y: selected.y })
            }
          />
          <div className={styles.coordLabel}>X</div>
        </div>
        <div>
          <input
            type="number"
            className={styles.coordInput}
            value={Math.round(selected.y)}
            onChange={e =>
              dispatch({ type: 'MOVE_WIDGET', id: selected.id, x: selected.x, y: Number(e.target.value) })
            }
          />
          <div className={styles.coordLabel}>Y</div>
        </div>
      </div>

      <div className={styles.label}>Color acento</div>
      <div className={styles.colorRow}>
        {ACCENT_COLORS.map(c => (
          <button
            key={c}
            className={`${styles.colorDot} ${state.accentColor === c ? styles.activeDot : ''}`}
            style={{ background: c }}
            onClick={() => dispatch({ type: 'SET_ACCENT', color: c })}
            title={c}
          />
        ))}
      </div>

      <div className={styles.label}>Snap a grilla</div>
      <button
        className={`${styles.snapBtn} ${state.snapToGrid ? styles.active : ''}`}
        onClick={() => dispatch({ type: 'SET_SNAP', value: !state.snapToGrid })}
      >
        {state.snapToGrid ? '● Snap ON (5px)' : '○ Snap OFF'}
      </button>

      <div className={styles.widgetInfo}>
        <div className={styles.widgetName}>{def?.icon} {def?.name}</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 10, marginBottom: 8 }}>
          {selected.type} · {selected.size}
        </div>
        <button
          className={styles.deleteBtn}
          onClick={() => dispatch({ type: 'REMOVE_WIDGET', id: selected.id })}
        >
          🗑 Eliminar widget
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verificar en browser**

Arrastrar widget al canvas → seleccionarlo → el panel derecho muestra tamaños disponibles, posición X/Y, colores de acento y botón eliminar. Cambiar tamaño y verificar que el widget se redimensiona. Cambiar color de acento y verificar que cambia el borde de selección.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: functional properties panel with size, position, accent color and delete"
```

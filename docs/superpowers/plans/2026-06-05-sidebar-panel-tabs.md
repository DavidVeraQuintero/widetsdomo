# Sidebar Panel — 4 Pestañas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el panel flotante con scroll doble por un panel de 4 pestañas (Widgets, Propiedades, Temas, Iconos) con un único scroll central.

**Architecture:** El estado `activeTab` vive en `App.jsx`. El panel flotante tiene: drag handle → tab bar → contenedor de pestaña con `overflow-y: auto`. Cada componente (Sidebar, PropertiesPanel, ThemePicker, GlobalIconSettings) se limpia de su wrapper de contenedor (aside/modal/dropdown) para ser simplemente contenido inline.

**Tech Stack:** React 18, Vite, CSS Modules

---

### Task 1: Limpiar Canvas.jsx — quitar ThemePicker

**Files:**
- Modify: `src/components/Canvas/Canvas.jsx`
- Modify: `src/components/Canvas/Canvas.module.css`

- [ ] **Step 1: Reemplazar Canvas.jsx**

```jsx
import { useRef } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
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

    if (type !== 'grupo') {
      const contentEl = e.target.closest('[data-grupo-content]');
      const groupEl   = e.target.closest('[data-widget-type="grupo"]');
      if (contentEl && groupEl) {
        const widgetId    = groupEl.dataset.widgetId;
        const targetGroup = state.widgets.find(w => w.id === widgetId);
        if (targetGroup) {
          const rect   = contentEl.getBoundingClientRect();
          const childX = snap(Math.max(0, e.clientX - rect.left));
          const childY = snap(Math.max(0, e.clientY - rect.top));
          const newChild = {
            id: `${type}-${Date.now()}`,
            type,
            size: def.sizes[Math.min(1, def.sizes.length - 1)],
            config: { ...def.defaultConfig },
            x: childX,
            y: childY,
          };
          dispatch({
            type: 'UPDATE_CONFIG',
            id: widgetId,
            config: { ...targetGroup.config, children: [...(targetGroup.config.children || []), newChild] },
          });
          return;
        }
      }
    }

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

- [ ] **Step 2: Eliminar `.btnTheme` y `.themeWrap` de Canvas.module.css**

Eliminar estas dos reglas del archivo (el resto del archivo no cambia):

```css
/* ELIMINAR estas reglas: */
.btnTheme { ... }
.btnTheme:hover { ... }
.themeWrap { ... }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Canvas/Canvas.jsx src/components/Canvas/Canvas.module.css
git commit -m "refactor: remove ThemePicker from Canvas toolbar"
```

---

### Task 2: Simplificar ThemePicker.module.css

El `.picker` wrapper ya no necesita posicionamiento absoluto — vive inline dentro de la pestaña.

**Files:**
- Modify: `src/components/Canvas/ThemePicker.module.css`

- [ ] **Step 1: Reemplazar la regla `.picker`**

Cambiar la regla `.picker` por esta versión simplificada (el resto del archivo no cambia):

```css
.picker {
  padding: 4px 2px;
}
```

Las reglas que se eliminan de `.picker`: `position`, `top`, `right`, `width`, `background`, `backdrop-filter`, `-webkit-backdrop-filter`, `border`, `border-radius`, `z-index`, `box-shadow`.

- [ ] **Step 2: Commit**

```bash
git add src/components/Canvas/ThemePicker.module.css
git commit -m "refactor: remove absolute positioning from ThemePicker — now inline in tab"
```

---

### Task 3: Refactorizar GlobalIconSettings — quitar modal overlay

**Files:**
- Modify: `src/components/GlobalIconSettings/GlobalIconSettings.jsx`

- [ ] **Step 1: Reemplazar GlobalIconSettings.jsx**

```jsx
import { useState } from 'react';
import { useDashboard } from '../../store/dashboardStore';
import { WIDGET_CATALOG } from '../../catalog/widgetCatalog';
import { WIDGET_ICON_META } from '../widgets/widgetIconMeta';
import SvgIcon from '../widgets/SvgIcon';
import IconPicker from '../widgets/IconPicker';

export default function GlobalIconSettings() {
  const { state, dispatch } = useDashboard();
  const [picker, setPicker] = useState(null);

  const categories = [...new Set(WIDGET_CATALOG.map(w => w.category))];

  const getIcon = (typeId, stateKey) => {
    return state.globalIcons?.[typeId]?.[stateKey]
      ?? WIDGET_ICON_META[typeId]?.defaults?.[stateKey]
      ?? 'home';
  };

  const setIcon = (typeId, stateKey, iconId) => {
    const current = state.globalIcons?.[typeId] || {};
    dispatch({ type: 'SET_GLOBAL_ICON', widgetTypeId: typeId, icons: { ...current, [stateKey]: iconId } });
  };

  const resetType = (typeId) => {
    dispatch({ type: 'RESET_GLOBAL_ICON', widgetTypeId: typeId });
  };

  return (
    <div style={{ padding: '10px 12px' }}>
      {categories.map(cat => {
        const items = WIDGET_CATALOG.filter(w => w.category === cat && WIDGET_ICON_META[w.id]);
        if (items.length === 0) return null;
        return (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{cat}</div>
            {items.map(def => {
              const meta = WIDGET_ICON_META[def.id];
              if (!meta) return null;
              const hasOverride = !!state.globalIcons?.[def.id];
              return (
                <div key={def.id} style={{ marginBottom: 8, background: '#0a1220', borderRadius: 10, padding: '8px 10px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: meta.states.length > 1 ? 6 : 0 }}>
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>{def.name}</span>
                    {hasOverride && (
                      <button className="w-btn" style={{ fontSize: 9, padding: '1px 6px', borderColor: '#ef4444', color: '#ef4444' }}
                        onClick={() => resetType(def.id)}>
                        Restablecer
                      </button>
                    )}
                  </div>
                  {meta.states.map(stateKey => (
                    <div key={stateKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                      {meta.states.length > 1 && (
                        <span style={{ fontSize: 10, color: '#64748b', minWidth: 80 }}>{meta.labels[stateKey]}</span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <SvgIcon id={getIcon(def.id, stateKey)} size={16} color="var(--text-secondary)" />
                        </div>
                        <span style={{ fontSize: 10, color: '#475569', minWidth: 70 }}>{getIcon(def.id, stateKey)}</span>
                        <button className="w-btn" style={{ fontSize: 10, padding: '2px 8px' }}
                          onClick={() => setPicker({ typeId: def.id, stateKey })}>
                          Cambiar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}

      {picker && (
        <IconPicker
          currentId={getIcon(picker.typeId, picker.stateKey)}
          onChange={id => setIcon(picker.typeId, picker.stateKey, id)}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GlobalIconSettings/GlobalIconSettings.jsx
git commit -m "refactor: remove modal overlay from GlobalIconSettings — now inline in tab"
```

---

### Task 4: Refactorizar Sidebar — quitar aside y botón de iconos

**Files:**
- Modify: `src/components/Sidebar/Sidebar.jsx`
- Modify: `src/components/Sidebar/Sidebar.module.css`

- [ ] **Step 1: Reemplazar Sidebar.jsx**

```jsx
import { useState } from 'react';
import { WIDGET_CATALOG } from '../../catalog/widgetCatalog.jsx';
import WidgetItem from './WidgetItem';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? WIDGET_CATALOG.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
    : WIDGET_CATALOG;

  const categories = [...new Set(WIDGET_CATALOG.map(w => w.category))];

  return (
    <div className={styles.sidebar}>
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
              <div className={styles.category}>{items[0].categoryIcon} {cat}</div>
              {items.map(def => <WidgetItem key={def.id} def={def} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Actualizar Sidebar.module.css**

Reemplazar las reglas `.sidebar` y `.list`:

```css
.sidebar {
  display: flex;
  flex-direction: column;
}

.list {
  flex: 1;
  padding: 4px 0;
}
```

El resto de reglas (`.header`, `.appName`, `.search`, `.category`, `.item`, etc.) no cambian.

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar/Sidebar.jsx src/components/Sidebar/Sidebar.module.css
git commit -m "refactor: remove aside wrapper and icon settings button from Sidebar"
```

---

### Task 5: Refactorizar PropertiesPanel — quitar aside y overflow

**Files:**
- Modify: `src/components/PropertiesPanel/PropertiesPanel.jsx`
- Modify: `src/components/PropertiesPanel/PropertiesPanel.module.css`

- [ ] **Step 1: Cambiar `<aside>` por `<div>` en PropertiesPanel.jsx**

Hay exactamente dos cambios: en la línea ~27 y en la línea ~61 del archivo. En ambas, cambiar la etiqueta de apertura `<aside` por `<div` y la de cierre `</aside>` por `</div>`. Todo lo demás dentro del componente queda sin cambios.

Resultado línea ~27 (estado sin selección):
```jsx
return (
  <div className={styles.panel}>
    <div className={styles.title}>⚙ Propiedades</div>
    <div className={styles.empty}>
      Arrastra un widget al canvas o selecciona uno existente
    </div>
  </div>
);
```

Resultado línea ~61 (estado con selección) — solo cambia la etiqueta, el interior es idéntico al original:
```jsx
return (
  <div className={styles.panel}>
    <div className={styles.title}>⚙ Propiedades</div>
    {/* ... sizeGrid, coordRow, widgetInfo — sin cambios ... */}
  </div>
);
```

- [ ] **Step 2: Actualizar la regla `.panel` en PropertiesPanel.module.css**

Reemplazar la regla `.panel` por:

```css
.panel {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
```

Las propiedades eliminadas: `width`, `min-width`, `background`, `border-left`, `overflow-y`.

- [ ] **Step 3: Commit**

```bash
git add src/components/PropertiesPanel/PropertiesPanel.jsx src/components/PropertiesPanel/PropertiesPanel.module.css
git commit -m "refactor: remove aside wrapper and overflow from PropertiesPanel"
```

---

### Task 6: Integrar las 4 pestañas en App.jsx

Este es el paso central. Añade el estado `activeTab`, el tab bar y el contenedor de pestaña con scroll único.

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.module.css`

- [ ] **Step 1: Reemplazar App.jsx**

```jsx
import { useState, useRef } from 'react';
import { MetaProvider, useMeta } from './store/metaStore.jsx';
import { DashboardProvider } from './store/dashboardStore.jsx';
import DashboardTabs from './components/DashboardTabs/DashboardTabs.jsx';
import ThemeApplier from './components/ThemeApplier.jsx';
import Sidebar from './components/Sidebar/Sidebar';
import Canvas from './components/Canvas/Canvas';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import ThemePicker from './components/Canvas/ThemePicker';
import GlobalIconSettings from './components/GlobalIconSettings/GlobalIconSettings';
import styles from './App.module.css';

const TABS = [
  { id: 'widgets', icon: '📦', label: 'Widgets' },
  { id: 'props',   icon: '⚙',  label: 'Propiedades' },
  { id: 'temas',   icon: '🎨', label: 'Temas' },
  { id: 'iconos',  icon: '🔣', label: 'Iconos' },
];

function AppInner() {
  const { state: metaState } = useMeta();
  const { activeDashboardId } = metaState;
  const storageKey = `domotica-dashboard-${activeDashboardId}`;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('widgets');
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
            <div className={styles.tabBar}>
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                >
                  {tab.icon}
                </button>
              ))}
              <button
                className={styles.tabClose}
                onClick={() => setSidebarOpen(false)}
                title="Cerrar panel"
              >
                ✕
              </button>
            </div>
            <div className={styles.tabContent}>
              {activeTab === 'widgets' && <Sidebar />}
              {activeTab === 'props'   && <PropertiesPanel />}
              {activeTab === 'temas'   && <ThemePicker />}
              {activeTab === 'iconos'  && <GlobalIconSettings />}
            </div>
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

- [ ] **Step 2: Actualizar App.module.css — añadir estilos de pestañas**

Mantener todas las reglas existentes (`.layout`, `.floatingPanel`, `.dragHandle`, `.dragDots`, `.sidebarToggle`) y añadir al final:

```css
.tabBar {
  display: flex;
  flex-shrink: 0;
  background: var(--bg-widget);
  border-bottom: 1px solid var(--border);
}

.tabBtn {
  flex: 1;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-dim);
  font-size: 15px;
  padding: 8px 4px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.tabBtn:hover { color: var(--text-secondary); }

.tabBtnActive {
  color: var(--accent);
  border-bottom-color: var(--accent);
  background: var(--bg-surface);
}

.tabClose {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-dim);
  font-size: 11px;
  padding: 8px 10px;
  cursor: pointer;
  transition: color 0.15s;
}
.tabClose:hover { color: var(--danger, #ef4444); }

.tabContent {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx src/App.module.css
git commit -m "feat: replace floating panel with 4-tab sidebar (Widgets, Props, Temas, Iconos)"
```

---

### Task 7: Verificación final

- [ ] **Step 1: Arrancar el servidor de desarrollo**

```bash
npm run dev
```

Abrir en el navegador (normalmente `http://localhost:5173`).

- [ ] **Step 2: Verificar pestaña Widgets**

- El botón ☰ abre el panel flotante con 4 iconos de pestaña (📦 ⚙ 🎨 🔣) y un ✕
- La pestaña 📦 (activa por defecto) muestra la lista de widgets con búsqueda
- La lista hace scroll cuando hay muchos widgets (un único scroll, sin scroll doble)
- Se puede arrastrar un widget desde la lista al canvas

- [ ] **Step 3: Verificar pestaña Propiedades**

- Hacer clic en un widget en el canvas → queda seleccionado (borde blanco)
- Ir a la pestaña ⚙ → se ven los controles de tamaño, posición y botón eliminar
- El panel no tiene scroll interno hasta que el contenido sea mayor que la altura disponible

- [ ] **Step 4: Verificar pestaña Temas**

- La pestaña 🎨 muestra los controles de Ambiente, Paleta, Hora y Estilo RGB
- Seleccionar una paleta → el canvas cambia de aspecto
- Ya no existe el botón de tema en la toolbar del Canvas

- [ ] **Step 5: Verificar pestaña Iconos**

- La pestaña 🔣 muestra la lista de categorías con iconos por widget
- Hacer clic en "Cambiar" → aparece el `IconPicker` como modal flotante
- Seleccionar un icono → el widget en el canvas refleja el cambio

- [ ] **Step 6: Verificar drag del panel**

- Arrastrar el panel desde el handle ⠿ → se mueve correctamente
- El botón ✕ cierra el panel y muestra el botón ☰

- [ ] **Step 7: Commit final si hay ajustes menores**

```bash
git add -p
git commit -m "fix: visual adjustments after tabs integration"
```

# Widget Agrupador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un widget contenedor que agrupa otros widgets a tamaño completo, crece dinámicamente y expone controles maestros según los tipos de dispositivos agrupados.

**Architecture:** Los hijos se guardan en `config.children` del grupo como definiciones completas `{id, type, size, config, x, y}`. El grupo calcula su propio tamaño en render a partir de los bounds de sus hijos. Todo el estado de hijos se muta vía `UPDATE_CONFIG` existente en el store — no se agregan acciones nuevas. El drag desde el sidebar al grupo se intercepta en `Canvas.handleDrop` antes del `ADD_WIDGET` normal.

**Tech Stack:** React 18, Vite, localStorage store con `useReducer`, `createPortal` para modales.

> **Nota TDD:** El proyecto no tiene framework de tests (package.json solo tiene react + vite). Cada tarea incluye verificación manual con `npm run dev`.

---

## File Map

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Create | `src/components/widgets/grupoUtils.js` | Constantes de tipos, cálculo de tamaño, funciones puras de mutación masiva |
| Create | `src/components/widgets/GrupoModal.jsx` | Modal de control masivo (RGB / brillo / persianas) |
| Create | `src/components/widgets/GrupoWidget.jsx` | Componente principal: header + canvas interno + drag hijos |
| Modify | `src/catalog/widgetCatalog.jsx` | Registrar entrada `grupo` en categoría "Organización" |
| Modify | `src/components/Canvas/CanvasWidget.jsx` | Saltar tamaño fijo y estilos RGB/ON para tipo `grupo` |
| Modify | `src/components/Canvas/Canvas.jsx` | Interceptar drop del sidebar sobre grupos en `handleDrop` |

---

## Task 1: grupoUtils.js — constantes y helpers puros

**Files:**
- Create: `src/components/widgets/grupoUtils.js`

- [ ] **Step 1: Crear el archivo con constantes de tipos y dimensiones**

```js
// src/components/widgets/grupoUtils.js
import { WIDGET_SIZES } from '../../catalog/widgetSizes';

export const HEADER_HEIGHT = 40;
export const CHILD_PADDING = 16;
export const MIN_GROUP_WIDTH = 220;
export const MIN_GROUP_HEIGHT = 140;

export const RGB_TYPES    = new Set(['lampara-rgb', 'tira-led-rgb']);
export const DIMMER_TYPES = new Set(['lampara-rgb', 'tira-led-rgb', 'lampara-dimmer', 'tira-led', 'lampara-cct']);
export const CURTAIN_TYPES = new Set(['cortina', 'persiana-roller', 'toldo', 'veneciana']);
```

- [ ] **Step 2: Agregar `computeGroupSize` — calcula width/height del grupo a partir de sus hijos**

```js
export function computeGroupSize(children) {
  if (!children || children.length === 0) {
    return { width: MIN_GROUP_WIDTH, height: MIN_GROUP_HEIGHT };
  }
  let maxW = 0, maxH = 0;
  for (const child of children) {
    const s = WIDGET_SIZES[child.size] || WIDGET_SIZES['2x2'];
    maxW = Math.max(maxW, child.x + s.width);
    maxH = Math.max(maxH, child.y + s.height);
  }
  return {
    width: Math.max(MIN_GROUP_WIDTH, maxW + CHILD_PADDING),
    height: Math.max(MIN_GROUP_HEIGHT - HEADER_HEIGHT, maxH + CHILD_PADDING),
  };
}
```

> Nota: `height` devuelto es solo el área de contenido (sin header). El header (40px) se suma en GrupoWidget al calcular la altura total del div raíz.

- [ ] **Step 3: Agregar helpers de detección de capacidades**

```js
function hasControllableProp(cfg) {
  return 'on' in cfg || 'armed' in cfg || 'recording' in cfg;
}

export function hasControllable(children) {
  return children.some(c => hasControllableProp(c.config));
}

export function getMasterState(children) {
  const list = children.filter(c => hasControllableProp(c.config));
  if (list.length === 0) return false;
  return list.some(c => c.config.on || c.config.armed || c.config.recording);
}

export function hasRGB(children)      { return children.some(c => RGB_TYPES.has(c.type)); }
export function hasDimmer(children)   { return children.some(c => DIMMER_TYPES.has(c.type)); }
export function hasCurtains(children) { return children.some(c => CURTAIN_TYPES.has(c.type)); }
```

- [ ] **Step 4: Agregar funciones de mutación masiva (inmutables, devuelven nuevo array)**

```js
export function applyMasterToggle(children, value) {
  return children.map(child => {
    const cfg = child.config;
    const patch = {};
    if ('on' in cfg)        patch.on = value;
    if ('armed' in cfg)     patch.armed = value;
    if ('recording' in cfg) patch.recording = value;
    return Object.keys(patch).length > 0
      ? { ...child, config: { ...cfg, ...patch } }
      : child;
  });
}

export function applyRGBColor(children, color) {
  return children.map(child =>
    RGB_TYPES.has(child.type)
      ? { ...child, config: { ...child.config, color } }
      : child
  );
}

export function applyBrightness(children, brightness) {
  return children.map(child => {
    if (!DIMMER_TYPES.has(child.type)) return child;
    // lampara-cct usa colorTemp en lugar de brightness
    if (child.type === 'lampara-cct') {
      return { ...child, config: { ...child.config, colorTemp: brightness } };
    }
    return { ...child, config: { ...child.config, brightness } };
  });
}

export function applyCurtainPosition(children, position) {
  return children.map(child =>
    CURTAIN_TYPES.has(child.type)
      ? { ...child, config: { ...child.config, position } }
      : child
  );
}
```

- [ ] **Step 5: Verificación — el archivo no importa nada que no exista**

```bash
# Revisar visualmente que todos los imports al tope del archivo sean correctos:
# import { WIDGET_SIZES } from '../../catalog/widgetSizes';
# No hay más dependencias externas.
```

- [ ] **Step 6: Commit**

```bash
git add src/components/widgets/grupoUtils.js
git commit -m "feat: add grupoUtils — type sets and pure helpers for group widget"
```

---

## Task 2: GrupoModal.jsx — modal de control masivo

**Files:**
- Create: `src/components/widgets/GrupoModal.jsx`
- Read first: `src/components/widgets/widgetUtils.jsx` (usa `ModalBase`), `src/components/widgets/ColorWheel.jsx` (interfaz: `color`, `onChange`, `size`), `src/components/widgets/Slider.jsx` (interfaz: `value`, `onChange`, `showVal`), `src/components/widgets/Toggle.jsx`

- [ ] **Step 1: Crear GrupoModal con esqueleto y sección RGB**

```jsx
// src/components/widgets/GrupoModal.jsx
import { useState } from 'react';
import ColorWheel from './ColorWheel';
import Slider from './Slider';
import Toggle from './Toggle';
import { ModalBase } from './widgetUtils';
import {
  hasRGB, hasDimmer, hasCurtains, hasControllable, getMasterState,
  applyMasterToggle, applyRGBColor, applyBrightness, applyCurtainPosition,
} from './grupoUtils';

const RGB_PRESETS = ['#ef4444','#f97316','#fbbf24','#22c55e','#3b82f6','#7c3aed','#ec4899','#ffffff'];

export default function GrupoModal({ config, onConfigChange, onClose }) {
  const { name = 'Grupo', children = [] } = config;

  const [rgbColor, setRgbColor]   = useState('#3b82f6');
  const [brightness, setBrightness] = useState(75);
  const [position, setPosition]   = useState(50);

  const masterOn      = getMasterState(children);
  const showToggle    = hasControllable(children);
  const showRGB       = hasRGB(children);
  const showDimmer    = hasDimmer(children);
  const showCurtains  = hasCurtains(children);
  const showMessage   = !showRGB && !showDimmer && !showCurtains;

  const patch = (newChildren) => onConfigChange({ ...config, children: newChildren });

  return (
    <ModalBase
      title={`🏠 ${name} — Control`}
      headerRight={showToggle
        ? <Toggle on={masterOn} onToggle={() => patch(applyMasterToggle(children, !masterOn))} />
        : null
      }
      onClose={onClose}
      borderColor="rgba(255,255,255,0.25)"
    >
      {showRGB && (
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            🎨 Color RGB
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <ColorWheel color={rgbColor} onChange={setRgbColor} size={130} />
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
            {RGB_PRESETS.map(c => (
              <button
                key={c}
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: rgbColor === c ? '2px solid white' : '1px solid rgba(255,255,255,0.15)',
                }}
                onClick={() => setRgbColor(c)}
                onMouseDown={e => e.stopPropagation()}
              />
            ))}
          </div>
          <button
            className="w-btn"
            style={{ width: '100%', padding: '6px 0', background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.5)', color: '#c4b5fd' }}
            onClick={() => patch(applyRGBColor(children, rgbColor))}
            onMouseDown={e => e.stopPropagation()}
          >
            Aplicar color a todos
          </button>
        </div>
      )}

      {showDimmer && (
        <div style={{ marginBottom: 16, paddingBottom: showCurtains ? 16 : 0, borderBottom: showCurtains ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
          <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            🔆 Brillo · {brightness}%
          </div>
          <Slider value={brightness} onChange={setBrightness} showVal={false} />
          <button
            className="w-btn"
            style={{ width: '100%', padding: '6px 0', marginTop: 8 }}
            onClick={() => patch(applyBrightness(children, brightness))}
            onMouseDown={e => e.stopPropagation()}
          >
            Aplicar brillo a todos
          </button>
        </div>
      )}

      {showCurtains && (
        <div>
          <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            📋 Persianas · {position}%
          </div>
          <Slider value={position} onChange={setPosition} showVal={false} />
          <button
            className="w-btn"
            style={{ width: '100%', padding: '6px 0', marginTop: 8 }}
            onClick={() => patch(applyCurtainPosition(children, position))}
            onMouseDown={e => e.stopPropagation()}
          >
            Aplicar posición a todas
          </button>
        </div>
      )}

      {showMessage && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📦</div>
          <div style={{ color: '#e2e8f0', marginBottom: 6 }}>
            {children.length} dispositivo{children.length !== 1 ? 's' : ''} agrupado{children.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 10 }}>
            Sin dimmers, RGB ni persianas —<br />usa el toggle del header para controlarlos todos
          </div>
        </div>
      )}
    </ModalBase>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/GrupoModal.jsx
git commit -m "feat: add GrupoModal — mass RGB/brightness/curtain control modal"
```

---

## Task 3: GrupoWidget.jsx — componente principal

**Files:**
- Create: `src/components/widgets/GrupoWidget.jsx`
- Read first: `src/components/Canvas/CanvasWidget.jsx` (patrón de drag), `src/catalog/widgetSizes.js` (SNAP_SIZE)

- [ ] **Step 1: Crear GrupoWidget con header + canvas interno vacío**

```jsx
// src/components/widgets/GrupoWidget.jsx
import { useState, useRef } from 'react';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import { WIDGET_SIZES, SNAP_SIZE } from '../../catalog/widgetSizes';
import Toggle from './Toggle';
import GrupoModal from './GrupoModal';
import {
  computeGroupSize, hasControllable, getMasterState, applyMasterToggle,
  HEADER_HEIGHT, CHILD_PADDING,
} from './grupoUtils';

export default function GrupoWidget({ config, onConfigChange, accentColor }) {
  const { name = 'Grupo', children = [] } = config;
  const [modal, setModal] = useState(false);
  const longPressTimer = useRef(null);

  const { width, height } = computeGroupSize(children);
  const showToggle = hasControllable(children);
  const masterOn   = getMasterState(children);

  const patchChildren = (newChildren) =>
    onConfigChange({ ...config, children: newChildren });

  // Long-press en el fondo del canvas interno (no en hijos ni header)
  const handleBgMouseDown = (e) => {
    if (e.target !== e.currentTarget) return;
    e.stopPropagation(); // no arrastrar el grupo desde el fondo
    longPressTimer.current = setTimeout(() => setModal(true), 500);
  };
  const handleBgMouseUp    = () => clearTimeout(longPressTimer.current);
  const handleBgMouseLeave = () => clearTimeout(longPressTimer.current);

  const updateChild = (childId, newCfg) =>
    patchChildren(children.map(c => c.id === childId ? { ...c, config: newCfg } : c));

  const moveChild = (childId, x, y) =>
    patchChildren(children.map(c => c.id === childId ? { ...c, x, y } : c));

  return (
    <div style={{ width, display: 'inline-flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <div style={{
        height: HEADER_HEIGHT,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15 }}>🏠</span>
          <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>{name}</span>
          <span style={{
            fontSize: 8, color: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
            padding: '1px 5px', letterSpacing: 0.5,
          }}>GRUPO</span>
        </div>
        {showToggle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>Todos</span>
            <Toggle on={masterOn} onToggle={() => patchChildren(applyMasterToggle(children, !masterOn))} />
          </div>
        )}
      </div>

      {/* ── Canvas interno ── */}
      <div
        style={{ position: 'relative', width, height, flexShrink: 0 }}
        onMouseDown={handleBgMouseDown}
        onMouseUp={handleBgMouseUp}
        onMouseLeave={handleBgMouseLeave}
      >
        {children.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.2)', fontSize: 11, gap: 5,
            pointerEvents: 'none',
          }}>
            <span>⊕</span><span>Arrastra widgets aquí</span>
          </div>
        )}
        {children.map(child => (
          <ChildWrapper
            key={child.id}
            child={child}
            accentColor={accentColor}
            onConfigChange={(cfg) => updateChild(child.id, cfg)}
            onMove={(x, y) => moveChild(child.id, x, y)}
          />
        ))}
      </div>

      {modal && (
        <GrupoModal
          config={config}
          onConfigChange={onConfigChange}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Agregar el componente `ChildWrapper` al mismo archivo (al final, antes del export default o como función en el mismo módulo)**

```jsx
// Agrega esto ANTES del export default GrupoWidget

function ChildWrapper({ child, accentColor, onConfigChange, onMove }) {
  const dragging = useRef(false);
  const origin   = useRef(null);
  const def = getCatalogEntry(child.type);
  const WidgetComponent = def?.component;
  const childSize = WIDGET_SIZES[child.size] || WIDGET_SIZES['2x2'];

  const handleMouseDown = (e) => {
    if (e.target.closest('input, button, select, textarea')) return;
    e.stopPropagation(); // no activar long-press del fondo ni drag del grupo
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, wx: child.x, wy: child.y };

    const snap = (v) => Math.round(v / SNAP_SIZE) * SNAP_SIZE;

    const onMouseMove = (ev) => {
      if (!dragging.current) return;
      const nx = snap(Math.max(0, origin.current.wx + (ev.clientX - origin.current.mx)));
      const ny = snap(Math.max(0, origin.current.wy + (ev.clientY - origin.current.my)));
      onMove(nx, ny);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: child.x,
        top: child.y,
        width: childSize.width,
        height: childSize.height,
        background: 'rgba(15,23,42,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {WidgetComponent && (
        <WidgetComponent
          size={child.size}
          config={child.config}
          accentColor={accentColor}
          onConfigChange={onConfigChange}
        />
      )}
    </div>
  );
}
```

> El orden en el archivo debe ser: imports → `ChildWrapper` (función) → `GrupoWidget` (export default).
> `ChildWrapper` usa `useRef` importado arriba junto con `useState`.

- [ ] **Step 3: Verificar dev server — el archivo compila sin errores**

```bash
npm run dev
# Abrir http://localhost:5173 — no debe haber errores en consola
# (El widget todavía no está registrado en el catálogo, así que no aparece aún)
```

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/GrupoWidget.jsx
git commit -m "feat: add GrupoWidget — container with header, internal canvas, child drag, long-press modal"
```

---

## Task 4: Registrar en catálogo + fix en CanvasWidget

**Files:**
- Modify: `src/catalog/widgetCatalog.jsx`
- Modify: `src/components/Canvas/CanvasWidget.jsx`

- [ ] **Step 1: Agregar import de GrupoWidget en widgetCatalog.jsx**

En `src/catalog/widgetCatalog.jsx`, agregar al final de los imports:

```js
import GrupoWidget from '../components/widgets/GrupoWidget';
```

- [ ] **Step 2: Agregar entrada `grupo` al catálogo al final del array `WIDGET_CATALOG`**

Agregar como último elemento del array `WIDGET_CATALOG`, después de `estado-hogar`:

```js
  // ── ORGANIZACIÓN ──
  { id: 'grupo', category: 'Organización', categoryIcon: '📦', icon: '📦', name: 'Grupo',
    sizes: ['dynamic'],
    defaultConfig: { name: 'Grupo', children: [] },
    component: GrupoWidget },
```

- [ ] **Step 3: Modificar CanvasWidget.jsx para saltar tamaño fijo y estilos para `grupo`**

Abrir `src/components/Canvas/CanvasWidget.jsx`. Localizar la línea:
```js
const size = WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2'];
```

Reemplazar con:

```js
const isGrupo = widget.type === 'grupo';
const size = isGrupo ? { width: undefined, height: undefined } : (WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2']);
```

Luego localizar el bloque de `const isRgb = ...` y reemplazarlo para excluir grupos:

```js
const isRgb = !isGrupo && RGB_TYPES.has(widget.type) && widget.config.on;
const rgbColor = isRgb ? getRgbColor(widget.type, widget.config) : null;
const widgetOn = !isGrupo && !isRgb && isOn(widget.config);
```

Luego en el `<div>` raíz del widget, reemplazar el `style` para no aplicar width/height cuando es grupo:

```jsx
<div
  className={`${styles.widget} ${isSelected ? styles.selected : ''}`}
  style={{
    left: widget.x,
    top: widget.y,
    ...(isGrupo ? { overflow: 'visible', background: 'transparent', backdropFilter: 'none', WebkitBackdropFilter: 'none' } : { width: size.width, height: size.height }),
    ...rgbCardStyle,
  }}
  onMouseDown={handleMouseDown}
>
```

> `overflow: visible` en el grupo es necesario para que los modales de los hijos (que usan `createPortal`) no sean afectados visualmente. `background: transparent` y `backdropFilter: none` evitan doble glassmorphism ya que GrupoWidget tiene su propio fondo vía la clase `.widget`.

Espera — en realidad el grupo SÍ debe tener el glassmorphism de `.widget` (background + backdropFilter). Lo que NO debe tener es `width` y `height` fijos. Corrige el style así:

```jsx
<div
  className={`${styles.widget} ${isSelected ? styles.selected : ''}`}
  style={{
    left: widget.x,
    top: widget.y,
    ...(isGrupo ? {} : { width: size.width, height: size.height }),
    ...rgbCardStyle,
  }}
  onMouseDown={handleMouseDown}
>
```

- [ ] **Step 4: Verificar en dev server**

```bash
npm run dev
# 1. Abrir http://localhost:5173
# 2. En el sidebar debe aparecer una sección "Organización" con el widget "Grupo"
# 3. Arrastrar el Grupo al canvas → debe aparecer una caja vacía con header "🏠 Grupo [GRUPO]" y el hint "⊕ Arrastra widgets aquí"
# 4. El grupo se puede mover arrastrando desde el header
```

- [ ] **Step 5: Commit**

```bash
git add src/catalog/widgetCatalog.jsx src/components/Canvas/CanvasWidget.jsx
git commit -m "feat: register grupo in catalog, fix CanvasWidget for dynamic-size group"
```

---

## Task 5: Canvas.jsx — interceptar drop del sidebar sobre grupos

**Files:**
- Modify: `src/components/Canvas/Canvas.jsx`

- [ ] **Step 1: Agregar imports necesarios en Canvas.jsx**

Al inicio de `src/components/Canvas/Canvas.jsx`, agregar:

```js
import { computeGroupSize, HEADER_HEIGHT, CHILD_PADDING } from '../widgets/grupoUtils';
```

- [ ] **Step 2: Reemplazar `handleDrop` completo en Canvas.jsx**

Localizar la función `handleDrop` y reemplazarla por:

```js
const handleDrop = (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData('widgetType');
  if (!type) return;
  const def = getCatalogEntry(type);
  if (!def) return;

  const rect = canvasRef.current.getBoundingClientRect();
  const rawX = e.clientX - rect.left;
  const rawY = e.clientY - rect.top;

  // Buscar si el drop cayó dentro del área de contenido de un grupo
  // Los grupos no pueden contener otros grupos
  const targetGroup = type !== 'grupo'
    ? state.widgets.find(w => {
        if (w.type !== 'grupo') return false;
        const { width, height } = computeGroupSize(w.config.children || []);
        const totalHeight = HEADER_HEIGHT + height;
        return (
          rawX >= w.x && rawX <= w.x + width &&
          rawY >= w.y + HEADER_HEIGHT && rawY <= w.y + totalHeight
        );
      })
    : null;

  if (targetGroup) {
    const childX = snap(Math.max(0, rawX - targetGroup.x - CHILD_PADDING));
    const childY = snap(Math.max(0, rawY - targetGroup.y - HEADER_HEIGHT - CHILD_PADDING / 2));
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
      id: targetGroup.id,
      config: {
        ...targetGroup.config,
        children: [...(targetGroup.config.children || []), newChild],
      },
    });
  } else {
    const x = snap(Math.max(0, rawX - 45));
    const y = snap(Math.max(0, rawY - 45));
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
  }
};
```

- [ ] **Step 3: Verificar en dev server**

```bash
npm run dev
# 1. Arrastrar un Grupo al canvas
# 2. Arrastrar una Lámpara RGB desde el sidebar y soltarla DENTRO del grupo →
#    debe aparecer dentro del grupo a tamaño completo
# 3. El grupo debe crecer para acomodar la lámpara
# 4. Arrastrar una Persiana y soltarla dentro del grupo → debe aparecer al lado
# 5. Arrastrar otro Grupo → debe caer en el canvas normal (no dentro del grupo)
# 6. Arrastrar cualquier widget FUERA del grupo → debe caer en el canvas normal
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Canvas/Canvas.jsx
git commit -m "feat: intercept sidebar drops onto group widgets in Canvas.handleDrop"
```

---

## Task 6: Verificación de integración completa

No hay test runner — verificar manualmente cada capacidad del widget.

- [ ] **Step 1: Verificar toggle maestro**

```
1. Crear grupo en canvas
2. Arrastrar dentro: Lámpara Simple, Enchufe, Sensor de Temperatura
3. El header debe mostrar toggle "Todos" (porque hay Lámpara + Enchufe controlables)
4. Activar el toggle → Lámpara y Enchufe deben encenderse (Sensor no cambia)
5. Desactivar → ambos se apagan
```

- [ ] **Step 2: Verificar modal — grupo con RGB + dimmer + persianas**

```
1. Crear grupo en canvas
2. Agregar: Lámpara RGB, Lámpara Dimmer, Persiana Roller
3. Long-press (mantener 500ms) sobre el fondo vacío del grupo → debe abrir el modal
4. Modal debe mostrar las 3 secciones: 🎨 Color RGB, 🔆 Brillo, 📋 Persianas
5. Cambiar color en la rueda → clic "Aplicar color a todos" → la RGB debe cambiar de color
6. Mover slider de brillo → "Aplicar brillo a todos" → RGB y Dimmer cambian brillo
7. Mover slider de persianas → "Aplicar posición a todas" → Persiana cambia posición
8. Clic fuera del modal → se cierra
```

- [ ] **Step 3: Verificar modal — grupo solo con interruptores**

```
1. Crear grupo con: Enchufe, Lámpara Simple, Ventilador
2. Long-press en fondo → abre modal
3. Modal muestra solo el mensaje informativo con count de dispositivos
4. Toggle del header del modal funciona igual que el del widget
```

- [ ] **Step 4: Verificar drag interno de hijos**

```
1. Grupo con 2+ widgets adentro
2. Arrastrar un widget dentro del grupo → debe moverse sin salir del grupo
3. El grupo crece si se arrastra un widget hacia la derecha/abajo más allá del borde actual
4. Los botones/toggles dentro de los widgets hijos siguen funcionando correctamente
```

- [ ] **Step 5: Verificar que sensores no activan toggle maestro**

```
1. Grupo con solo sensores (Sensor Temp, Sensor Movimiento)
2. El header NO debe mostrar toggle "Todos"
3. Long-press → modal muestra mensaje de 0 dispositivos controlables... 
   espera: los sensores tienen 0 hijos con "on/armed/recording" → showMessage=true → correcto
```

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "feat: complete grupo widget — container, master toggle, mass control modal"
```

---

## Notas de implementación

- **Grupos anidados:** bloqueados en `Canvas.handleDrop` por la condición `type !== 'grupo'`. No hace falta lógica extra en GrupoWidget.
- **Eliminar grupo:** usa el flujo normal de PropertiesPanel/eliminación. Los hijos se eliminan con el grupo automáticamente (están en `config.children`).
- **Persistencia:** el store ya persiste `config` en localStorage → los hijos se guardan automáticamente.
- **`lampara-cct` en sección brillo:** `applyBrightness` mapea a `colorTemp` para este tipo, no a `brightness`. Es correcto porque CCT no tiene propiedad `brightness`.

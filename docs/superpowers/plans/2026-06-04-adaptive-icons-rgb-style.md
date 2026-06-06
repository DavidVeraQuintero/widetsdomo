# Adaptive Icons + RGB Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hard-coded accent/dim icon colors with white CSS variables (dim when off, bright+glow when on), and add a global configurable card-style for RGB/color widgets (border, tint, or bar) selectable from ThemePicker.

**Architecture:** Two independent systems: (1) CSS variables `--icon-on`/`--icon-off` + `.icon-glow` class replace accentColor in every SvgIcon call across 35 widgets — a mechanical find-and-replace; (2) CanvasWidget reads `state.theme.rgbStyle` and computes inline card styles for the 3 RGB widget types, independently of the widgets themselves.

**Tech Stack:** React 18, CSS Modules, CSS custom properties. No new libraries.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/styles/theme.css` | Modify | Add `--icon-on`, `--icon-off` CSS variables |
| `src/styles/widget.css` | Modify | Add `.icon-glow` CSS class |
| `src/store/dashboardStore.jsx` | Modify | Add `rgbStyle: 'border'` to theme, persist, loadState |
| `src/components/Canvas/ThemePicker.jsx` | Modify | Add 4th section: ESTILO RGB |
| `src/components/Canvas/ThemePicker.module.css` | Modify | Style for rgbStyle buttons |
| `src/components/Canvas/CanvasWidget.jsx` | Modify | RGB card style logic |
| `src/components/Canvas/Canvas.module.css` | Modify | Add `.colorBar` class |
| 35 widget files in `src/components/widgets/` | Modify | SvgIcon color → CSS vars |

---

## Task 1: CSS foundation — icon variables and glow class

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/styles/widget.css`

- [ ] **Step 1: Add icon variables to theme.css**

Append at the end of `src/styles/theme.css` (after the existing theme variable blocks):

```css
/* ── Icon states ── */
:root {
  --icon-off: rgba(255, 255, 255, 0.38);
  --icon-on:  rgba(255, 255, 255, 0.95);
}
```

- [ ] **Step 2: Add .icon-glow to widget.css**

Append at the end of `src/styles/widget.css`:

```css
.icon-glow {
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.55));
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/theme.css src/styles/widget.css
git commit -m "feat: add --icon-on/--icon-off CSS vars and .icon-glow class"
```

---

## Task 2: Store rgbStyle + ThemePicker 4th section

**Files:**
- Modify: `src/store/dashboardStore.jsx`
- Modify: `src/components/Canvas/ThemePicker.jsx`
- Modify: `src/components/Canvas/ThemePicker.module.css`

- [ ] **Step 1: Add rgbStyle to DEFAULT_STATE**

In `src/store/dashboardStore.jsx`, change:

```js
theme: { room: 'sala', palette: 'calido', time: 'atardecer' },
```

To:

```js
theme: { room: 'sala', palette: 'calido', time: 'atardecer', rgbStyle: 'border' },
```

- [ ] **Step 2: Update loadState to safely merge rgbStyle**

In `src/store/dashboardStore.jsx`, change:

```js
theme: saved.theme ?? DEFAULT_STATE.theme,
```

To:

```js
theme: { ...DEFAULT_STATE.theme, ...(saved.theme ?? {}) },
```

This spreads the defaults first (including `rgbStyle: 'border'`) then overlays the saved values, so old localStorage saves that don't have `rgbStyle` still get the default.

- [ ] **Step 3: Add RGB_STYLES and section to ThemePicker.jsx**

In `src/components/Canvas/ThemePicker.jsx`, add after the `TIMES` const:

```js
const RGB_STYLES = [
  { id: 'border', emoji: '🔲', label: 'Borde' },
  { id: 'tint',   emoji: '🎨', label: 'Tinte' },
  { id: 'bar',    emoji: '▬',  label: 'Barra' },
];
```

In the JSX return, add a 4th section after the HORA section:

```jsx
<div className={styles.section}>
  <div className={styles.label}>ESTILO RGB</div>
  <div className={styles.timePills}>
    {RGB_STYLES.map(s => (
      <button
        key={s.id}
        className={`${styles.timePill} ${theme.rgbStyle === s.id ? styles.sel : ''}`}
        onClick={() => set({ rgbStyle: s.id })}
      >
        {s.emoji}<br />{s.label}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Build and verify no errors**

```bash
npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/store/dashboardStore.jsx src/components/Canvas/ThemePicker.jsx
git commit -m "feat: add rgbStyle to theme store and ThemePicker ESTILO RGB section"
```

---

## Task 3: CanvasWidget RGB card styles + colorBar

**Files:**
- Modify: `src/components/Canvas/CanvasWidget.jsx`
- Modify: `src/components/Canvas/Canvas.module.css`

- [ ] **Step 1: Add colorBar class to Canvas.module.css**

Append at the end of `src/components/Canvas/Canvas.module.css`:

```css
.colorBar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 5px;
  pointer-events: none;
  border-radius: 0 0 9px 9px;
}
```

- [ ] **Step 2: Replace CanvasWidget.jsx entirely**

```jsx
import { useRef } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import { WIDGET_SIZES, SNAP_SIZE } from '../../catalog/widgetSizes';
import styles from './Canvas.module.css';

const RGB_TYPES = new Set(['lampara-rgb', 'tira-led-rgb', 'lampara-cct']);

function cctToHex(t) {
  const lerp = (a, b, f) => Math.round(a + (b - a) * f);
  const hexFromRgb = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  if (t <= 50) {
    const f = t / 50;
    return hexFromRgb(lerp(0xff, 0xfc, f), lerp(0x9a, 0xd5, f), lerp(0x00, 0x90, f));
  }
  const f = (t - 50) / 50;
  return hexFromRgb(lerp(0xfc, 0xd0, f), lerp(0xd5, 0xe8, f), lerp(0x90, 0xff, f));
}

function getRgbColor(type, config) {
  if (type === 'lampara-cct') return cctToHex(config.colorTemp ?? 50);
  return config.color ?? '#3b82f6';
}

function computeRgbCardStyle(rgbStyle, color) {
  switch (rgbStyle) {
    case 'border': return {
      border: `1.5px solid ${color}CC`,
      boxShadow: `0 0 16px ${color}55, 0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)`,
    };
    case 'tint': return {
      background: `${color}38`,
      border: `1px solid ${color}66`,
    };
    case 'bar':
    default: return {};
  }
}

export default function CanvasWidget({ widget }) {
  const { state, dispatch } = useDashboard();
  const dragging = useRef(false);
  const origin = useRef(null);
  const isSelected = state.selectedId === widget.id;

  const size = WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2'];
  const def = getCatalogEntry(widget.type);
  const WidgetComponent = def?.component;

  const isRgb = RGB_TYPES.has(widget.type) && widget.config.on;
  const rgbColor = isRgb ? getRgbColor(widget.type, widget.config) : null;
  const rgbCardStyle = isRgb ? computeRgbCardStyle(state.theme.rgbStyle, rgbColor) : {};

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
        ...rgbCardStyle,
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
      {isRgb && state.theme.rgbStyle === 'bar' && (
        <div
          className={styles.colorBar}
          style={{
            background: rgbColor,
            boxShadow: `0 -2px 8px ${rgbColor}88`,
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/Canvas/CanvasWidget.jsx src/components/Canvas/Canvas.module.css
git commit -m "feat: RGB card styles (border/tint/bar) in CanvasWidget"
```

---

## Task 4: Widget icon update — Lote A (Iluminación)

**Files:** `LamparaSimple.jsx`, `LamparaDimmer.jsx`, `LamparaRGB.jsx`, `LamparaCCT.jsx`, `TiraLED.jsx`, `TiraLEDBlanca.jsx`

**All in:** `src/components/widgets/`

**The rule for all widgets in this and subsequent tasks:**

Every `<SvgIcon>` call that currently uses a dynamic color must be changed to use CSS variables. The surrounding code (borders, sliders, text colors) does NOT change — only the `color` and `className` props on `<SvgIcon>` tags.

**Pattern A — ON/OFF boolean (`config.on`):**
```jsx
// Before (find this pattern):
color={on ? accentColor : 'var(--text-dim)'}
// After:
color={on ? 'var(--icon-on)' : 'var(--icon-off)'}
className={on ? 'icon-glow' : ''}
```

**Pattern B — always active (no off state):**
```jsx
// Before:
color={accentColor}
// After:
color="var(--icon-on)" className="icon-glow"
```

**Pattern C — state variable used in many places (`const col = ...`):**
Only change the `color=` prop on `<SvgIcon>`. Leave all other uses of `col` (borders, text, backgrounds) untouched.

---

**LamparaSimple.jsx** — uses `const col = on ? accentColor : 'var(--text-dim)'`

Find and change ALL `<SvgIcon>` calls (there are 4 across the size variants):
```jsx
// Find:
<SvgIcon id={icons.default} size={22} color={col} />
<SvgIcon id={icons.default} size={44} color={col} />
<SvgIcon id={icons.default} size={22} color={col} />   // 2x1
<SvgIcon id={icons.default} size={48} color={col} />   // 2x2
// Replace each with:
<SvgIcon id={icons.default} size={22} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
// (adjust size number to match the original)
```

Also in `SimpleModal`:
```jsx
// Find:
<SvgIcon id={icons.default} size={72} color={col} />
// Replace:
<SvgIcon id={icons.default} size={72} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
```

**LamparaDimmer.jsx** — read the file first, apply Pattern A for on/off SvgIcon calls.

**LamparaRGB.jsx** — has a `ColoredIcon` sub-component. Change the inner `<SvgIcon>` inside `ColoredIcon`:
```jsx
// Find inside ColoredIcon:
<SvgIcon id={icons.default} size={iconSize} color={on ? color : 'var(--text-dim)'} />
// Replace:
<SvgIcon id={icons.default} size={iconSize} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
```

Keep all other uses of `color` in `ColoredIcon` (border, boxShadow, background) unchanged.

In `RGBModal`, the SvgIcon is shown with `color={icons.default ? ... : accentColor}` or similar — apply Pattern B (it's in a modal showing the icon always lit).

**LamparaCCT.jsx** — uses `const borderCol = cctColor(colorTemp)`. Change SvgIcon calls:
```jsx
// Find (in CCTModal):
<SvgIcon id={icons.default} size={36} color={borderCol} />
// Replace:
<SvgIcon id={icons.default} size={36} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
```

Apply the same pattern to all SvgIcon calls in the main widget body — use `on` to determine state.

**TiraLED.jsx** — uses `color={on ? color : 'var(--text-dim)'}`. Apply Pattern A.

**TiraLEDBlanca.jsx** — uses `color={on ? accentColor : 'var(--text-dim)'}`. Apply Pattern A.

- [ ] **Step 1: Read and update LamparaSimple.jsx**
- [ ] **Step 2: Read and update LamparaDimmer.jsx**
- [ ] **Step 3: Read and update LamparaRGB.jsx**
- [ ] **Step 4: Read and update LamparaCCT.jsx**
- [ ] **Step 5: Read and update TiraLED.jsx**
- [ ] **Step 6: Read and update TiraLEDBlanca.jsx**
- [ ] **Step 7: Build and verify**

```bash
npm run build
```

Expected: `✓ built` with no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/widgets/LamparaSimple.jsx src/components/widgets/LamparaDimmer.jsx src/components/widgets/LamparaRGB.jsx src/components/widgets/LamparaCCT.jsx src/components/widgets/TiraLED.jsx src/components/widgets/TiraLEDBlanca.jsx
git commit -m "feat: white icon system — Iluminación widgets"
```

---

## Task 5: Widget icon update — Lote B (Clima)

**Files:** `AireAcondicionado.jsx`, `Termostato.jsx`, `Ventilador.jsx`, `Calefactor.jsx`, `Humidificador.jsx`, `PurificadorAire.jsx`

**All in:** `src/components/widgets/`

Apply the same transformation as Task 4. Per-file notes:

**AireAcondicionado.jsx** — has `on` boolean. Apply Pattern A.

**Termostato.jsx** — uses `const col = heating ? '#f97316' : accentColor`. The thermostat has no off state — it's always monitoring. Apply Pattern B to all SvgIcon calls (always `'var(--icon-on)'` + `className="icon-glow"`):
```jsx
// Find (all variants):
<SvgIcon id={heating ? icons.heating : icons.idle} size={34} color={col} />
// Replace:
<SvgIcon id={heating ? icons.heating : icons.idle} size={34} color="var(--icon-on)" className="icon-glow" />
// (adjust size to match each variant)
```

**Ventilador.jsx** — has `on` boolean. Apply Pattern A.

**Calefactor.jsx** — has `on` boolean. Apply Pattern A.

**Humidificador.jsx** — has `on` boolean. Apply Pattern A.

**PurificadorAire.jsx** — has `on` boolean. Apply Pattern A.

- [ ] **Step 1: Read and update AireAcondicionado.jsx**
- [ ] **Step 2: Read and update Termostato.jsx**
- [ ] **Step 3: Read and update Ventilador.jsx**
- [ ] **Step 4: Read and update Calefactor.jsx**
- [ ] **Step 5: Read and update Humidificador.jsx**
- [ ] **Step 6: Read and update PurificadorAire.jsx**
- [ ] **Step 7: Build and verify**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/components/widgets/AireAcondicionado.jsx src/components/widgets/Termostato.jsx src/components/widgets/Ventilador.jsx src/components/widgets/Calefactor.jsx src/components/widgets/Humidificador.jsx src/components/widgets/PurificadorAire.jsx
git commit -m "feat: white icon system — Clima widgets"
```

---

## Task 6: Widget icon update — Lote C (Seguridad)

**Files:** `Alarma.jsx`, `CamaraIP.jsx`, `CerraduraInteligente.jsx`, `Puerta.jsx`, `SensorMovimiento.jsx`, `SensorPresencia.jsx`, `Ventana.jsx`

**All in:** `src/components/widgets/`

Per-file notes:

**Alarma.jsx** — has `armed` boolean. Use `armed` as the active state for Pattern A.

**CamaraIP.jsx** — uses `recording` boolean and `col = recording ? '#ef4444' : 'var(--text-dim)'`. Apply Pattern A using `recording` as the state:
```jsx
// Find:
<SvgIcon id={icons.default} size={...} color={col} />
// Replace:
<SvgIcon id={icons.default} size={...} color={recording ? 'var(--icon-on)' : 'var(--icon-off)'} className={recording ? 'icon-glow' : ''} />
```

**CerraduraInteligente.jsx** — uses `locked` boolean. Use `locked` as the "active" (secure) state.

**Puerta.jsx** — has `open` and `locked` booleans. Use `!open` (closed = active/secure) or read the file to find its SvgIcon color logic.

**SensorMovimiento.jsx** — uses `col = detected ? '#f59e0b' : '#22c55e'`. Apply:
```jsx
// Find:
<SvgIcon id={detected ? icons.detected : icons.idle} size={...} color={col} />
// Replace:
<SvgIcon id={detected ? icons.detected : icons.idle} size={...} color={detected ? 'var(--icon-on)' : 'var(--icon-off)'} className={detected ? 'icon-glow' : ''} />
```

**SensorPresencia.jsx** — has `present` boolean. Apply Pattern A with `present`.

**Ventana.jsx** — has `open` boolean. Apply Pattern A.

- [ ] **Step 1–7: Read and update each file**
- [ ] **Step 8: Build and verify**

```bash
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/components/widgets/Alarma.jsx src/components/widgets/CamaraIP.jsx src/components/widgets/CerraduraInteligente.jsx src/components/widgets/Puerta.jsx src/components/widgets/SensorMovimiento.jsx src/components/widgets/SensorPresencia.jsx src/components/widgets/Ventana.jsx
git commit -m "feat: white icon system — Seguridad widgets"
```

---

## Task 7: Widget icon update — Lote D (Persianas + Energía)

**Files:** `Cortina.jsx`, `PersianaRoller.jsx`, `Toldo.jsx`, `Veneciana.jsx`, `Enchufe.jsx`, `Bateria.jsx`, `MedidorConsumo.jsx`, `PanelSolar.jsx`

**All in:** `src/components/widgets/`

Per-file notes:

**PersianaRoller.jsx, Cortina.jsx, Toldo.jsx, Veneciana.jsx** — these widgets show a position (0–100%), no on/off. They are always "active" (showing data). Apply Pattern B to any SvgIcon calls: `color="var(--icon-on)" className="icon-glow"`.

**Enchufe.jsx** — uses `on` boolean with `col = on ? '#22c55e' : 'var(--text-dim)'`. Apply Pattern A:
```jsx
// Replace SvgIcon color:
color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''}
```

**Bateria.jsx** — has `charging` boolean. Use `charging` as active state OR always active (battery always shows data). Read the file — if it has `charging` as the primary state use Pattern A, otherwise Pattern B.

**MedidorConsumo.jsx** — no on/off, always shows data. Apply Pattern B.

**PanelSolar.jsx** — no on/off, always shows data. Apply Pattern B.

- [ ] **Step 1–8: Read and update each file**
- [ ] **Step 9: Build and verify**

```bash
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add src/components/widgets/Cortina.jsx src/components/widgets/PersianaRoller.jsx src/components/widgets/Toldo.jsx src/components/widgets/Veneciana.jsx src/components/widgets/Enchufe.jsx src/components/widgets/Bateria.jsx src/components/widgets/MedidorConsumo.jsx src/components/widgets/PanelSolar.jsx
git commit -m "feat: white icon system — Persianas + Energía widgets"
```

---

## Task 8: Widget icon update — Lote E (Sensores + Multimedia)

**Files:** `AltavozInteligente.jsx`, `EstacionMeteorologica.jsx`, `Musica.jsx`, `SensorCalidadAire.jsx`, `SensorHumoGas.jsx`, `SensorInundacion.jsx`, `SensorLuminosidad.jsx`, `SensorTempHumedad.jsx`, `TV.jsx`, `Temporizador.jsx`

**All in:** `src/components/widgets/`

Per-file notes:

**Musica.jsx** — uses `playing` boolean for state. The main widget SvgIcon shows the music icon. Apply Pattern A with `playing`. The playback control buttons (⏮ ⏸ ▶ ⏭) use emojis — do NOT change those. Only change `<SvgIcon>` tags.

**TV.jsx** — has `on` boolean. Apply Pattern A.

**AltavozInteligente.jsx** — has `on` boolean. Apply Pattern A.

**Temporizador.jsx** — has `active` boolean. Apply Pattern A using `active`.

**EstacionMeteorologica.jsx** — no on/off, always shows weather data. Apply Pattern B.

**SensorCalidadAire.jsx** — always shows data (AQI). Apply Pattern B.

**SensorHumoGas.jsx** — has `alert` boolean. Use `alert` as active state for Pattern A.

**SensorInundacion.jsx** — has `alert` boolean. Apply Pattern A using `alert`.

**SensorLuminosidad.jsx** — always shows lux data. Apply Pattern B.

**SensorTempHumedad.jsx** — always shows sensor data. Apply Pattern B.

- [ ] **Step 1–10: Read and update each file**
- [ ] **Step 11: Build and verify**

```bash
npm run build
```

Expected: `✓ built` with no errors. All 35 widget files updated.

- [ ] **Step 12: Commit**

```bash
git add src/components/widgets/AltavozInteligente.jsx src/components/widgets/EstacionMeteorologica.jsx src/components/widgets/Musica.jsx src/components/widgets/SensorCalidadAire.jsx src/components/widgets/SensorHumoGas.jsx src/components/widgets/SensorInundacion.jsx src/components/widgets/SensorLuminosidad.jsx src/components/widgets/SensorTempHumedad.jsx src/components/widgets/TV.jsx src/components/widgets/Temporizador.jsx
git commit -m "feat: white icon system — Sensores + Multimedia widgets"
```

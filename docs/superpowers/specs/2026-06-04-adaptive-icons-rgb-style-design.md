# Diseño: Iconos adaptativos + estilo RGB configurable

**Fecha:** 2026-06-04  
**Estado:** Aprobado

## Resumen

Dos mejoras coordinadas: (1) todos los iconos SVG pasan a blanco con brillo diferente según estado ON/OFF; (2) los widgets con color real (RGB/CCT) muestran ese color en la card con 3 estilos globales configurables desde el ThemePicker.

---

## Parte 1 — Sistema de iconos blancos

### CSS variables nuevas en `src/styles/theme.css`

```css
--icon-off: rgba(255, 255, 255, 0.38);   /* icono apagado / inactivo */
--icon-on:  rgba(255, 255, 255, 0.95);   /* icono encendido / activo */
```

### Clase nueva en `src/styles/widget.css`

```css
.icon-glow {
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.55));
}
```

### Cambio en los 35 widgets que usan SvgIcon

Cada `<SvgIcon>` que hoy recibe `color={on ? accentColor : 'var(--text-dim)'}` pasa a:

```jsx
<SvgIcon
  id={icons.default}
  size={sz}
  color={on ? 'var(--icon-on)' : 'var(--icon-off)'}
  className={on ? 'icon-glow' : ''}
/>
```

Reglas por tipo de widget:
- **ON/OFF** (`config.on`): `on ? 'var(--icon-on)' : 'var(--icon-off)'`
- **Siempre activo** (sensores, medidores, cámaras): `'var(--icon-on)'` + clase `icon-glow` siempre
- **Estado doble** (Termostato heating/idle, Puerta open/locked, etc.): mantiene la lógica de qué icono mostrar, pero ambos estados usan `'var(--icon-on)'`

`accentColor` se mantiene para sliders, barras de progreso, botones — solo cambia en los SVG.

---

## Parte 2 — Estilo RGB global configurable

### Store — nuevo campo `rgbStyle`

```js
// DEFAULT_STATE.theme
theme: {
  room: 'sala',
  palette: 'calido',
  time: 'atardecer',
  rgbStyle: 'border',   // 'border' | 'tint' | 'bar'
}
```

`loadState` y `persist` incluyen `rgbStyle` junto con el resto del tema.  
`SET_THEME` ya maneja partial patches → sin cambios en el reducer.

### Widgets tipo RGB (colores reales)

| ID en catalog | Archivo | Campo de color |
|---------------|---------|----------------|
| `lampara-rgb` | `LamparaRGB.jsx` | `config.color` (hex) |
| `tira-led-rgb` | `TiraLED.jsx` | `config.color` (hex) |
| `lampara-cct` | `LamparaCCT.jsx` | `config.colorTemp` (0–100) |

`tira-led` (TiraLEDBlanca) usa `accentColor`, NO `config.color` → no entra en el sistema RGB.

### Función de color para CCT

```js
function cctToColor(t) {
  // t: 0=cálido(#ff9a00) → 50=neutro(#fcd590) → 100=frío(#d0e8ff)
  if (t <= 50) return interpolateHex('#ff9a00', '#fcd590', t / 50);
  return interpolateHex('#fcd590', '#d0e8ff', (t - 50) / 50);
}
```

### CanvasWidget — lógica de estilos RGB

```jsx
const RGB_TYPES = new Set(['lampara-rgb', 'tira-led-rgb', 'lampara-cct']);

function getRgbColor(type, config, accentColor) {
  if (type === 'lampara-cct') return cctToColor(config.colorTemp ?? 50);
  return config.color ?? accentColor;
}

function computeRgbStyle(rgbStyle, color) {
  switch (rgbStyle) {
    case 'border': return {
      border: `1.5px solid ${color}CC`,
      boxShadow: `0 0 16px ${color}55, 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)`,
    };
    case 'tint': return {
      background: `${color}38`,
      border: `1px solid ${color}66`,
    };
    case 'bar': return {};  // handled via colorBar div element
    default: return {};
  }
}
```

En `CanvasWidget.jsx`:
```jsx
const isRgb = RGB_TYPES.has(widget.type) && widget.config.on;
const rgbColor = isRgb ? getRgbColor(widget.type, widget.config, state.accentColor) : null;
const rgbCardStyle = isRgb ? computeRgbStyle(state.theme.rgbStyle, rgbColor) : {};
// applied as inline style on the .widget div
// for 'bar': render <div className={styles.colorBar} style={{ background: rgbColor }} /> inside card
```

### Canvas.module.css — clase `.colorBar`

```css
.colorBar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 5px;
  pointer-events: none;
}
```

(El `box-shadow` del glow se aplica inline en CanvasWidget con el color dinámico.)

### ThemePicker — 4ª sección `ESTILO RGB`

```jsx
const RGB_STYLES = [
  { id: 'border', emoji: '🔲', label: 'Borde' },
  { id: 'tint',   emoji: '🎨', label: 'Tinte' },
  { id: 'bar',    emoji: '▬',  label: 'Barra' },
];
```

Renderizado igual que las `timePills` — 3 botones horizontales con `.sel` en el activo.

---

## Archivos a modificar / crear

| Archivo | Cambio |
|---------|--------|
| `src/styles/theme.css` | Añadir `--icon-on`, `--icon-off` |
| `src/styles/widget.css` | Añadir `.icon-glow` |
| `src/store/dashboardStore.jsx` | Añadir `rgbStyle: 'border'` a `DEFAULT_STATE.theme`, `loadState`, `persist` |
| `src/components/Canvas/CanvasWidget.jsx` | Lógica RGB: `getRgbColor`, `computeRgbStyle`, inline style + colorBar |
| `src/components/Canvas/Canvas.module.css` | Añadir `.colorBar` |
| `src/components/Canvas/ThemePicker.jsx` | 4ª sección RGB_STYLES |
| 35 archivos en `src/components/widgets/` | Cambio mecánico de SvgIcon color + className |

---

## Notas

- Los 35 widgets se agrupan en 5 lotes para ejecución paralela con subagentes.
- `accentColor` prop en widgets NO cambia — sigue llegando desde CanvasWidget para sliders/botones.
- LamparaCCT no tiene `config.on` — se trata como siempre activa para el estilo RGB.
- La interpolación hex puede implementarse con una función utilitaria simple en CanvasWidget.

# Iconos Personalizables por Widget — Design Spec

**Fecha:** 2026-06-03

## Objetivo

Permitir personalizar los iconos de cada widget usando una librería SVG domótica. Los iconos se pueden cambiar por instancia individual o de forma global para todos los widgets del mismo tipo. Los widgets multi-estado (sensor de movimiento, puerta, cerradura…) permiten un icono distinto por estado.

---

## Modelo de datos

### Librería de iconos (`src/components/widgets/iconLibrary.js`)

Mapa `{ id: string → svgInner: string }`. El valor es el contenido interno del SVG (sin el tag `<svg>`). Ejemplo:

```js
export const ICONS = {
  'lightbulb': '<line x1="12" y1="2" x2="12" y2="4"/>...',
  'eye':       '<path d="M1 12s4-8 11-8..."/>...',
  'motion-person': '<circle cx="12" cy="5" r="2"/>...',
  // ~150 iconos agrupados en comentarios por categoría
};

export const ICON_CATEGORIES = {
  'Iluminación': ['lightbulb','lightbulb-off','lightbulb-dim','lightbulb-color','strip-led','sun','moon'],
  'Clima':       ['thermometer','fan','snowflake','flame','droplets','wind','air'],
  'Seguridad':   ['door','door-open','window','lock','unlock','camera','eye','eye-off','motion-person','shield','bell','bell-off'],
  'Persianas':   ['blinds','blinds-open','curtain','awning','slats'],
  'Sensores':    ['temp','humidity','smoke','water-drop','light-sensor','signal','radar'],
  'Energía':     ['plug','plug-off','battery','battery-low','solar','meter','zap'],
  'Multimedia':  ['tv','tv-off','speaker','speaker-off','music','music-off','headphones'],
  'Automatización': ['clock','settings','home','robot','rule','timer'],
  'General':     ['check','alert','info','star','heart','power','refresh'],
};
```

### Metadata por tipo de widget (`src/components/widgets/widgetIconMeta.js`)

```js
export const WIDGET_ICON_META = {
  // ILUMINACIÓN
  'lampara-simple':  { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'lightbulb' } },
  'lampara-dimmer':  { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'lightbulb-dim' } },
  'lampara-rgb':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'lightbulb-color' } },
  'lampara-cct':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'lightbulb' } },
  'tira-led-rgb':    { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'strip-led' } },
  'tira-led':        { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'strip-led' } },
  // CLIMA
  'aire-acondicionado': { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'snowflake' } },
  'termostato':      { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'thermometer' } },
  'ventilador':      { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'fan' } },
  'calefactor':      { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'flame' } },
  'humidificador':   { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'droplets' } },
  'purificador':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'wind' } },
  // SEGURIDAD
  'puerta':          { states: ['closed', 'open'], labels: { closed: 'Cerrada', open: 'Abierta' }, defaults: { closed: 'door', open: 'door-open' } },
  'ventana':         { states: ['closed', 'open'], labels: { closed: 'Cerrada', open: 'Abierta' }, defaults: { closed: 'window', open: 'window' } },
  'cerradura':       { states: ['locked', 'unlocked'], labels: { locked: 'Bloqueada', unlocked: 'Desbloqueada' }, defaults: { locked: 'lock', unlocked: 'unlock' } },
  'camara-ip':       { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'camera' } },
  'sensor-movimiento': { states: ['idle', 'detected'], labels: { idle: 'Sin actividad', detected: 'Detectado' }, defaults: { idle: 'eye', detected: 'motion-person' } },
  'sensor-presencia':  { states: ['absent', 'present'], labels: { absent: 'Ausente', present: 'Presente' }, defaults: { absent: 'eye-off', present: 'motion-person' } },
  'alarma':          { states: ['disarmed', 'armed', 'triggered'], labels: { disarmed: 'Desarmada', armed: 'Armada', triggered: 'Activada' }, defaults: { disarmed: 'bell-off', armed: 'bell', triggered: 'alert' } },
  // PERSIANAS
  'persiana-roller': { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'blinds' } },
  'cortina':         { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'curtain' } },
  'toldo':           { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'awning' } },
  'veneciana':       { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'slats' } },
  // SENSORES
  'sensor-temp':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'temp' } },
  'sensor-aire':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'air' } },
  'sensor-humo':     { states: ['ok', 'alert'], labels: { ok: 'Normal', alert: 'Alerta' }, defaults: { ok: 'smoke', alert: 'alert' } },
  'sensor-inundacion': { states: ['ok', 'alert'], labels: { ok: 'Normal', alert: 'Inundación' }, defaults: { ok: 'water-drop', alert: 'alert' } },
  'sensor-luz':      { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'light-sensor' } },
  'estacion-meteo':  { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'temp' } },
  // ENERGÍA
  'enchufe':         { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'plug' } },
  'medidor-consumo': { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'meter' } },
  'panel-solar':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'solar' } },
  'bateria':         { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'battery' } },
  // MULTIMEDIA
  'tv':              { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'tv' } },
  'musica':          { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'music' } },
  'altavoz':         { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'speaker' } },
  // ESCENAS / AUTOMATIZACIÓN
  'escena-individual': { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'star' } },
  'panel-escenas':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'home' } },
  'escena-activa':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'star' } },
  'temporizador':    { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'timer' } },
  'regla-auto':      { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'rule' } },
  'estado-hogar':    { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'home' } },
};
```

### Store (`src/store/dashboardStore.jsx`)

Se añade `globalIcons: {}` al `DEFAULT_STATE` y se persiste en localStorage.

Nueva acción:
```js
case 'SET_GLOBAL_ICON': {
  const next = {
    ...state,
    globalIcons: {
      ...state.globalIcons,
      [action.widgetTypeId]: action.icons,  // { idle: 'eye', detected: 'motion-person' }
    },
  };
  persist(next);
  return next;
}
```

Persist actualizado para incluir `globalIcons`:
```js
function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    widgets: state.widgets,
    globalIcons: state.globalIcons,
  }));
}

// loadState también debe leer globalIcons:
// return { ...DEFAULT_STATE, widgets: saved.widgets ?? [], globalIcons: saved.globalIcons ?? {} };
```

### Config por instancia

`config.icons` en cada widget: objeto con los mismos keys que los estados del tipo.
```js
// Para sensor-movimiento:
config.icons = { idle: 'eye-off', detected: 'walking' }

// Para lampara-simple con un solo estado:
config.icons = { default: 'sun' }
```

Si `config.icons` es `undefined` (valor inicial), el widget usa globalIcons → defaults.

### Resolución de iconos (prioridad)

```
config.icons[state] → globalIcons[typeId][state] → WIDGET_ICON_META[typeId].defaults[state]
```

---

## Componentes nuevos

### `SvgIcon.jsx`

```jsx
import { ICONS } from './iconLibrary';

export default function SvgIcon({ id, size = 24, color = 'currentColor', style, className }) {
  const inner = ICONS[id];
  if (!inner) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}
         fill="none" stroke={color} strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round"
         style={style} className={className}
         dangerouslySetInnerHTML={{ __html: inner }} />
  );
}
```

### `IconPicker.jsx`

Modal/overlay con:
- Campo de búsqueda por nombre de icono
- Tabs de categoría (`ICON_CATEGORIES`)
- Grid de celdas 32×32px con `SvgIcon` en cada celda
- Al hacer clic en una celda: llama `onChange(iconId)` y cierra
- Prop `currentId` para marcar el seleccionado
- Prop `onClose` para cerrar sin cambiar

```jsx
function IconPicker({ currentId, onChange, onClose }) { ... }
```

### `useWidgetIcons.js`

```js
import { useDashboard } from '../../store/dashboardStore';
import { WIDGET_ICON_META } from './widgetIconMeta';

export function useWidgetIcons(typeId, instanceIcons = {}) {
  const { state } = useDashboard();
  const meta = WIDGET_ICON_META[typeId] || { states: ['default'], defaults: { default: 'home' } };
  const global = state.globalIcons?.[typeId] || {};
  return Object.fromEntries(
    meta.states.map(s => [s, instanceIcons[s] ?? global[s] ?? meta.defaults[s]])
  );
}
```

---

## Integración en cada widget

### Patrón de cambio (mecánico, igual en todos)

```jsx
// 1. Añadir import al top del archivo
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

// 2. Primera línea del componente
const icons = useWidgetIcons('sensor-movimiento', config.icons);

// 3. Reemplazar emojis hardcodeados
// Antes:  {detected ? '🚶' : '👁'}
// Después: <SvgIcon id={detected ? icons.detected : icons.idle} size={22} color={col} />
```

### Sección "Iconos" en el modal de cada widget

Al final del modal (igual que la sección PIN en Alarma), una sección con separador y título "Iconos". Para cada estado del widget:

```
Iconos
─────────────────────────────
Sin actividad  [👁 eye] [Cambiar]
Detectado      [🚶 motion-person] [Cambiar]
               [Restablecer por defecto]
```

- "Cambiar" abre `IconPicker` como un segundo modal (`zIndex: 2100`, por encima del modal del widget) con un overlay oscuro propio
- "Restablecer" borra `config.icons` → vuelve a global/default
- Aplica cambio vía `onConfigChange({ ...config, icons: { ...config.icons, [state]: iconId } })`

---

## Panel global de iconos

### Acceso

Botón `⚙` en el header del Sidebar, junto a "🏠 Domótica".

### Contenido

Modal overlay (no `ModalBase`, sino un panel más grande: `min-width: 360px`, `max-height: 80vh`, scrollable).

Lista todos los tipos de widget agrupados por categoría. Cada tipo muestra sus estados con icono actual y botón "Cambiar" que abre `IconPicker`. Botón "Restablecer" por tipo borra `globalIcons[typeId]`.

### Acción de store

```js
dispatch({ type: 'SET_GLOBAL_ICON', widgetTypeId: 'sensor-movimiento', icons: { idle: 'eye-off', detected: 'walking' } });
```

---

## Archivos a crear/modificar

### Nuevos
- `src/components/widgets/iconLibrary.js`
- `src/components/widgets/widgetIconMeta.js`
- `src/components/widgets/SvgIcon.jsx`
- `src/components/widgets/IconPicker.jsx`
- `src/components/widgets/useWidgetIcons.js`
- `src/components/GlobalIconSettings/GlobalIconSettings.jsx`

### Modificados
- `src/store/dashboardStore.jsx` — añadir `globalIcons`, `SET_GLOBAL_ICON`, persist
- `src/components/Sidebar/Sidebar.jsx` — añadir botón ⚙ + estado del modal global
- Todos los widgets en `src/components/widgets/` (38 archivos)

# Diseño: Sistema de temas elegante con fondo de interior

**Fecha:** 2026-06-03  
**Estado:** Aprobado

## Resumen

Reemplazar el fondo oscuro punteado del canvas por una foto real de interior lujoso con efecto blur suave (4px), y convertir los widget-cards en cristal semitransparente (glassmorphism). Un selector de temas en la toolbar del canvas permite cambiar ambiente (foto de fondo), paleta de color y hora del día de forma independiente mediante CSS variables.

---

## Fondo del canvas

- Elemento `::before` en `.canvas` con `background-image: var(--bg-photo)`
- `background-size: cover; background-position: center`
- `filter: blur(4px) brightness(0.65) saturate(1.1)`
- `transform: scale(1.04)` para evitar bordes blancos al aplicar blur
- Dos overlays encima del fondo:
  - **Tinte de paleta:** `div` con `background: var(--theme-tint)` (rgba semitransparente)
  - **Gradiente de hora:** `div` con `background: var(--theme-hour-gradient)`

---

## Cards / widgets (glassmorphism)

Reemplaza el gradiente oscuro actual (`.widget` en `Canvas.module.css`):

```css
.widget {
  background: rgba(255, 255, 255, 0.11);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.20);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.40),
    inset 0 1px 0 rgba(255, 255, 255, 0.10);
}
```

El texto y los iconos internos de los widgets mantienen color blanco — ya funciona sobre fondo oscuro.

---

## Sistema de temas — CSS variables

Tres atributos en `:root` controlan el tema de forma independiente:

| Atributo | Controla |
|----------|----------|
| `data-room` | Foto de fondo (`--bg-photo`) |
| `data-palette` | Tinte sobre el fondo (`--theme-tint`) y tono de acento (`--accent`, `--glass-border`) |
| `data-time` | Gradiente de hora (`--theme-hour-gradient`) |

### Ambientes (`data-room`)

| Valor | Foto (Unsplash) |
|-------|-----------------|
| `sala` | Sala de estar lujosa (photo-1616486338812-3dadae4b4ace) |
| `dormitorio` | Dormitorio moderno (photo-1560448204-603b3fc33ddc) |
| `cocina` | Cocina de diseño (photo-1556909114-f6e7ad7d3136) |
| `jardin` | Jardín exterior (photo-1585320806297-9794b3e4eeae) |

### Paletas (`data-palette`)

| Valor | `--theme-tint` | Acento |
|-------|----------------|--------|
| `calido` | `rgba(180,110,40,0.20)` | `#f59e0b` |
| `frio` | `rgba(30,58,95,0.25)` | `#3b82f6` |
| `oscuro` | `rgba(10,10,10,0.35)` | `#d4af37` |
| `neutro` | `rgba(100,100,100,0.15)` | `#94a3b8` |

### Horas (`data-time`)

| Valor | `--theme-hour-gradient` |
|-------|-------------------------|
| `amanecer` | `linear-gradient(180deg, rgba(255,160,80,0.20) 0%, transparent 60%)` |
| `dia` | `linear-gradient(180deg, rgba(255,255,180,0.12) 0%, transparent 50%)` |
| `atardecer` | `linear-gradient(180deg, rgba(255,100,0,0.15) 0%, transparent 50%, rgba(15,8,2,0.35) 100%)` |
| `noche` | `linear-gradient(180deg, rgba(0,0,40,0.40) 0%, transparent 60%, rgba(0,5,30,0.50) 100%)` |

---

## Theme picker

### Botón en toolbar
- Ubicación: barra superior del canvas, extremo derecho (junto a "Limpiar" y "+ Widget")
- Muestra: emoji del ambiente actual + nombre de paleta + 3 dots de color
- Al hacer clic: abre un `ThemePicker` flotante debajo del botón

### Panel `ThemePicker`
Componente nuevo en `src/components/Canvas/ThemePicker.jsx`:

```
┌─────────────────────────────┐
│ AMBIENTE                    │
│ [🛋️ Sala] [🛏️ Dorm] [🍳 Coc] [🌿 Jardín] │
├─────────────────────────────┤
│ PALETA                      │
│ [🟠 Cálido] [🔵 Frío] [⚫ Oscuro] [⬜ Neutro] │
├─────────────────────────────┤
│ HORA                        │
│ [🌅 Amanecer] [☀️ Día] [🌇 Atardecer] [🌙 Noche] │
└─────────────────────────────┘
```

- Se cierra al hacer clic fuera (listener en `document`)
- Ancho fijo: 260px; posición: `absolute` relativo al toolbar

---

## Estado y persistencia

### `dashboardStore.jsx`
Añadir al estado existente:

```js
theme: {
  room: 'sala',
  palette: 'calido',
  time: 'atardecer',
}
```

Añadir acción:
```js
setTheme: (patch) => set(state => ({ theme: { ...state.theme, ...patch } }))
```

La persistencia con `localStorage` ya está en el store — el campo `theme` se persiste automáticamente.

### `App.jsx`
Leer `theme` del store y aplicar atributos al elemento `:root`:

```jsx
useEffect(() => {
  document.documentElement.dataset.room = theme.room;
  document.documentElement.dataset.palette = theme.palette;
  document.documentElement.dataset.time = theme.time;
}, [theme]);
```

---

## Archivos a modificar / crear

| Archivo | Cambio |
|---------|--------|
| `src/styles/theme.css` | Añadir variables `--bg-photo`, `--theme-tint`, `--theme-hour-gradient`, `--bg-blur` por cada combinación de `data-*` |
| `src/components/Canvas/Canvas.module.css` | Fondo foto con pseudo-elemento, overlays de tinte y hora; widget glassmorphism |
| `src/components/Canvas/Canvas.jsx` | Añadir overlays al canvas, importar y renderizar `ThemePicker`, conectar al store |
| `src/store/dashboardStore.jsx` | Añadir campo `theme` + acción `setTheme` |
| `src/App.jsx` | `useEffect` que aplica `dataset.*` al root según el tema del store |
| `src/components/Canvas/ThemePicker.jsx` | **Nuevo** — panel flotante con selección de ambiente, paleta y hora |
| `src/components/Canvas/ThemePicker.module.css` | **Nuevo** — estilos del picker |

---

## Decisiones y restricciones

- Las fotos de fondo son URLs de Unsplash con parámetros `?w=1200&q=80` — no se empaquetan en el bundle.
- El blur de 4px del fondo es la preferencia del usuario; se expone como `--bg-blur: 4px` para ajuste fácil.
- El `backdrop-filter: blur(14px)` de las cards (glassmorphism) es independiente del blur del fondo.
- No se implementa subida de imagen personalizada (descartado en brainstorming).
- La sidebar y el toolbar mantienen su fondo oscuro semitransparente actual (`rgba(10,14,26,0.85)`) — solo el canvas cambia.

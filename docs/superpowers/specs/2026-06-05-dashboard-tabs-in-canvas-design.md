# Dashboard Tabs — Reubicación dentro del canvas

**Fecha:** 2026-06-05  
**Estado:** Aprobado

## Problema

`<DashboardTabs>` se renderiza fuera del `.layout` div en `App.jsx`, apareciendo como barra global full-width encima de toda la app (incluido el canvas). El usuario quiere que los tabs estén dentro del área del dashboard, centrados arriba, visualmente integrados con el canvas.

## Diseño aprobado: Cápsula flotante translúcida (Opción A)

Los tabs flotan sobre el canvas como una cápsula centrada en la parte superior, con fondo blur translúcido que deja ver el canvas detrás.

## Cambios

### `src/App.jsx`
- Mover `<DashboardTabs />` desde `App()` (fuera del layout) hacia dentro de `AppInner`, dentro del `.layout` div.

### `src/components/DashboardTabs/DashboardTabs.module.css`
Reemplazar el estilo de `.bar`:
- `position: absolute`
- `top: 10px`, `left: 50%`, `transform: translateX(-50%)`
- `z-index: 20`
- `border-radius: 999px` (cápsula)
- `background: rgba(15, 25, 50, 0.55)`
- `backdrop-filter: blur(12px)`
- `border: 1px solid rgba(255, 255, 255, 0.15)`
- `box-shadow: 0 4px 20px rgba(0,0,0,0.5)`
- Quitar `border-bottom` y `flex-shrink: 0`

## Notas

- `.layout` ya tiene `position: relative` y `overflow: hidden`, el absolute positioning funciona sin cambios adicionales.
- El `z-index: 20` queda por debajo del panel flotante (z-index 50) y el sidebarToggle (z-index 100).
- No afecta el layout de los widgets ya que los tabs flotan sobre el canvas sin ocupar espacio en el flujo del documento.

# Sidebar Panel — Rediseño con 4 Pestañas

**Fecha:** 2026-06-05  
**Estado:** Aprobado

## Problema

El panel flotante lateral (`floatingPanel`) contiene `Sidebar` y `PropertiesPanel` apilados verticalmente. Ambos componentes tienen `overflow-y: auto` propio, creando dos zonas de scroll anidadas dentro de un contenedor de altura fija (`max-height: 85vh`). El resultado es que las propiedades no se ven bien y el scroll no se comporta como el usuario espera.

Adicionalmente, `ThemePicker` vive como dropdown flotante en el Canvas y `GlobalIconSettings` es un modal overlay — ambos desconectados visualmente del panel lateral.

## Objetivo

Unificar Widgets, Propiedades, Temas e Iconos en un único panel flotante con 4 pestañas. Eliminar los scrolls internos duplicados. Integrar ThemePicker y GlobalIconSettings como pestañas coherentes dentro del panel.

## Diseño

### Estructura del panel flotante

```
┌─────────────────────────┐
│ ⠿  (drag handle)        │  ← flex-shrink: 0
├─────────────────────────┤
│ 📦  ⚙  🎨  🔣          │  ← tab bar, flex-shrink: 0
├─────────────────────────┤
│                         │
│   contenido de la       │  ← overflow-y: auto, flex: 1
│   pestaña activa        │     (único scroll del panel)
│                         │
└─────────────────────────┘
```

- El `floatingPanel` sigue siendo `position: absolute`, draggable, `max-height: 85vh`
- El tab bar es `flex-shrink: 0` — siempre visible
- Solo el área de contenido hace scroll (`overflow-y: auto`, `flex: 1`)

### Pestañas

| Icono | Nombre | Componente actual |
|-------|--------|-------------------|
| 📦 | Widgets | `Sidebar` |
| ⚙ | Propiedades | `PropertiesPanel` |
| 🎨 | Temas | `ThemePicker` |
| 🔣 | Iconos | `GlobalIconSettings` |

- El cambio de pestaña es **manual** — seleccionar un widget no cambia la pestaña automáticamente
- Estado `activeTab: 'widgets' | 'props' | 'temas' | 'iconos'` en `App.jsx` (local, no persiste)
- La pestaña inicial al abrir el panel es `'widgets'`

### Comportamiento del `IconPicker`

El `IconPicker` (selector que aparece al pulsar "Cambiar" en la pestaña Iconos) **sigue siendo un modal flotante** (`position: fixed`) — es un picker transitorio que necesita overlay.

## Cambios por archivo

### `App.jsx`
- Añadir estado `activeTab`
- Reemplazar `<Sidebar /> <PropertiesPanel />` por tab bar + renderizado condicional del componente activo
- El contenedor de la pestaña activa lleva `overflow-y: auto; flex: 1`
- Quitar el botón ⚙ que abría `GlobalIconSettings` (ya no es necesario)

### `App.module.css`
- Añadir `.tabBar` y `.tabBtn` / `.tabBtnActive` para el tab bar
- Añadir `.tabContent` con `overflow-y: auto; flex: 1`
- `.floatingPanel` no cambia estructuralmente

### `Sidebar.jsx`
- Cambiar `<aside className={styles.sidebar}>` por `<div className={styles.sidebar}>`
- Quitar el botón ⚙ de iconos globales y el estado `iconSettings`
- Quitar la importación de `GlobalIconSettings`

### `Sidebar.module.css`
- `.sidebar`: quitar `overflow: hidden`, `width`, `min-width`, `border-right` — el contenedor padre es ahora el floatingPanel
- `.list`: quitar `overflow-y: auto` — el scroll lo maneja `.tabContent` en App

### `PropertiesPanel.jsx`
- Cambiar `<aside className={styles.panel}>` por `<div className={styles.panel}>`

### `PropertiesPanel.module.css`
- `.panel`: quitar `overflow-y: auto`, `width`, `min-width`, `border-left`

### `ThemePicker.jsx`
- Sin cambios en lógica
- El wrapper `<div className={styles.picker}>` se puede convertir en `<div>` sin clase o con clase simplificada

### `ThemePicker.module.css`
- `.picker`: quitar `position: absolute`, `top`, `right`, `width`, `backdrop-filter`, `box-shadow`, `z-index` — ahora es inline dentro de la pestaña

### `GlobalIconSettings.jsx`
- Quitar el div overlay (`position: fixed; inset: 0`) y su handler `onMouseDown`
- Quitar la prop `onClose` y el botón ✕
- El contenido interno (lista de categorías + iconos) queda igual

### `Canvas.jsx`
- Quitar la importación de `ThemePicker`
- Quitar el estado `themeOpen` y el botón toggle de tema
- Quitar `<ThemePicker />` del JSX

## Lo que NO cambia

- El drag handle y el comportamiento draggable del panel
- El botón ☰ que muestra/oculta el panel
- El `IconPicker` sigue siendo modal
- La lógica interna de cada componente (store, dispatch, etc.)
- El `DashboardTabs` en la parte superior

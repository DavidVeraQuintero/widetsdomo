# NavegadorDashboard Widget — Design Spec

**Date:** 2026-06-05  
**Status:** Approved

## Summary

A new widget that allows navigating from the current dashboard to a specific target dashboard with a single click. The target dashboard is configured when placing the widget. It behaves like any other widget in the catalog.

---

## Architecture

### New files
- `src/components/widgets/NavegadorDashboard.jsx` — widget component
- (no new store or CSS module needed; uses inline styles like other widgets)

### Catalog entry (`src/catalog/widgetCatalog.jsx`)
New category **"Navegación"** with one entry:

```js
{
  id: 'nav-dashboard',
  category: 'Navegación',
  categoryIcon: '🧭',
  icon: '🏠',
  name: 'Ir a Dashboard',
  sizes: ['1x1', '1x2', '2x1', '2x2'],
  defaultConfig: { targetId: '', targetName: 'Dashboard', icon: '🏠', name: 'Ir a...' },
  component: NavegadorDashboard,
}
```

---

## Component: NavegadorDashboard

**Props:** `size`, `config`, `onConfigChange`, `accentColor`

**Reads `useMeta()`** to get the `dispatch` function and navigate via:
```js
dispatch({ type: 'SET_ACTIVE', id: config.targetId })
```

### State: no target configured
When `config.targetId` is empty or the dashboard no longer exists in `metaStore.dashboards`, the widget shows:
- Icon: ⚠
- Label: "Sin destino"
- Click: no-op

### State: target configured
Displays the configured `config.icon` and `config.targetName`. On click navigates to the target dashboard.

### Size variants

| Size | Layout |
|------|--------|
| 1x1  | Icon (large) + short name, centered |
| 1x2  | Icon + name + small "🧭 Navegar" label, centered column |
| 2x1  | Row: icon + name + arrow → |
| 2x2  | Icon (large) + name + "Ir →" button |

---

## PropertiesPanel integration

The existing `PropertiesPanel` renders config fields based on widget type. For `nav-dashboard`, it needs to expose:

1. **Destination selector** — `<select>` populated from `useMeta().state.dashboards`, saves `targetId` + `targetName` to config
2. **Icon picker** — reuses the existing `IconPicker` component, saves `icon` to config
3. **Label** — text input for `config.name` (widget label shown in canvas header)

This requires adding a `nav-dashboard` case in `PropertiesPanel`.

---

## Edge cases

| Case | Behavior |
|------|----------|
| Target dashboard deleted | Widget shows ⚠ "Sin destino", click is no-op |
| Only one dashboard exists | Widget still works; destination selector shows only that dashboard |
| Widget on destination dashboard pointing to itself | Allowed — clicking does nothing visible (already active) |

---

## Out of scope

- Animated transitions between dashboards
- Breadcrumb / back navigation
- Multiple destination slots per widget

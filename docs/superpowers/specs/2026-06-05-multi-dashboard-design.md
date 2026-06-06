# Multi-Dashboard Design

**Date:** 2026-06-05
**Status:** Approved

## Overview

Allow users to create up to N independent dashboards (default max: 10, configurable via `src/config.js`), each with its own widgets, theme, accentColor, and globalIcons. Users navigate between dashboards via a tab bar at the top of the canvas.

---

## Architecture

### Approach: Multi-store with re-mount (Option A)

Each dashboard's state keeps the exact same shape as today (`widgets`, `theme`, `globalIcons`, `accentColor`, etc.). A new "meta" layer outside the store manages the list of dashboards and which one is active. Switching tabs re-mounts `DashboardProvider` with the new dashboard's `storageKey`, which loads the correct state from localStorage automatically.

### `src/config.js` (new)

```js
export const MAX_DASHBOARDS = 10;
```

Single source of truth for the dashboard limit.

---

## Data

### Meta-state — `localStorage` key: `domotica-meta`

```json
{
  "dashboards": [
    { "id": "db-1749000000000", "name": "Sala" },
    { "id": "db-1749000001000", "name": "Dormitorio" }
  ],
  "activeDashboardId": "db-1749000000000"
}
```

Always contains at least one dashboard entry.

### Per-dashboard state — `localStorage` key: `domotica-dashboard-<id>`

Same shape as the current `domotica-v1` key: `{ widgets, globalIcons, theme }`.

### Migration (first launch)

On load, if `domotica-meta` is absent but `domotica-v1` exists:
1. Create meta entry `{ id: "db-default", name: "Dashboard 1" }`.
2. Copy `domotica-v1` contents to `domotica-dashboard-db-default`.
3. Save `domotica-meta` with `activeDashboardId: "db-default"`.
4. Leave `domotica-v1` intact (safety net).

If neither key exists, bootstrap with one empty default dashboard.

---

## New Files

| File | Purpose |
|---|---|
| `src/config.js` | `MAX_DASHBOARDS` constant |
| `src/store/metaStore.jsx` | `MetaProvider`, `useMeta`, meta-reducer |
| `src/components/DashboardTabs/DashboardTabs.jsx` | Tab bar component |
| `src/components/DashboardTabs/NewDashboardDialog.jsx` | Name-entry modal for new dashboards |
| `src/components/DashboardTabs/DashboardTabs.module.css` | Tab bar styles |

---

## Modified Files

| File | Change |
|---|---|
| `src/store/dashboardStore.jsx` | Accept `storageKey` prop in `DashboardProvider` instead of hardcoded `domotica-v1` |
| `src/App.jsx` | Wrap with `MetaProvider`, render `DashboardTabs`, pass `key` and `storageKey` to `DashboardProvider` |

---

## Components

### `MetaProvider` / `useMeta` (`src/store/metaStore.jsx`)

Reducer actions:
- `CREATE_DASHBOARD` — adds `{ id, name }` to the list; id = `db-${Date.now()}`
- `RENAME_DASHBOARD` — updates `name` for a given `id`
- `DELETE_DASHBOARD` — removes entry, deletes `domotica-dashboard-<id>` from localStorage, cleans up custom background images from IndexedDB; activates first remaining dashboard if deleted one was active
- `SET_ACTIVE` — sets `activeDashboardId`

### `DashboardTabs`

- Fixed horizontal bar above the canvas.
- One tab per dashboard showing its name.
- Active tab highlighted with the current dashboard's `accentColor`.
- Double-click on a tab → inline rename input.
- `+` button at the end → opens `NewDashboardDialog`; disabled (with tooltip "Límite alcanzado") when `dashboards.length >= MAX_DASHBOARDS`.
- `✕` button inside each tab (visible on hover) → `window.confirm` → delete; hidden when only one dashboard exists.

### `NewDashboardDialog`

- Glassmorphism modal (matches existing project style).
- Text input "Nombre del dashboard".
- Cancel / Crear buttons; Crear disabled while input is empty.
- Submit on Enter.

### `DashboardProvider` (modified)

Accepts optional `storageKey` prop. Falls back to `domotica-v1` if omitted (backward compatible).

### `App.jsx` (modified)

```
MetaProvider
  └─ DashboardTabs
  └─ DashboardProvider key={activeDashboardId} storageKey={`domotica-dashboard-${activeDashboardId}`}
       └─ ThemeApplier
       └─ layout (Canvas + floating panel)
```

---

## Edge Cases

| Case | Behavior |
|---|---|
| Only 1 dashboard | `✕` button hidden; deletion not possible |
| `MAX_DASHBOARDS` reached | `+` button disabled with tooltip |
| Empty name in dialog | "Crear" button disabled until text is entered |
| Duplicate name | Allowed (no uniqueness enforcement) |
| Deleted dashboard was active | Activate first remaining dashboard |
| localStorage full | `persist()` error caught silently (existing behavior) |
| Custom background images on deleted dashboard | Cleaned up via `deleteImage(bg.id)` for each entry in `theme.customBackgrounds` |

---

## Out of Scope

- Dashboard reordering (drag tabs).
- Exporting/importing dashboards.
- Dashboard-level icons or colors beyond what the existing theme covers.

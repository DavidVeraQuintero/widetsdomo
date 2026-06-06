# Calendar Widgets — Design Spec
**Date:** 2026-06-05  
**Status:** Approved

---

## Overview

Two new widgets that bring full calendar functionality to the domotic dashboard: a compact 1×1 mini-calendar and a full day-agenda view. Events are stored in a global shared store, independent of any specific dashboard tab.

---

## Architecture

### `calendarStore.jsx`

New Context + `useReducer` store, mirroring the pattern of `dashboardStore.jsx`.

**Initial state:**
```js
{ events: [] }
```

**Event shape:**
```js
{
  id: string,        // crypto.randomUUID()
  title: string,     // free text, e.g. "Médico"
  date: string,      // ISO date "YYYY-MM-DD"
  startTime: string, // "HH:MM" (24h)
  duration: number,  // minutes, e.g. 60
}
```

**Persistence:** `localStorage` key `calendar-events-v1`. Persists on every mutation.

**Reducer actions:**
- `ADD_EVENT` — appends a new event
- `UPDATE_EVENT` — replaces event by id
- `DELETE_EVENT` — removes event by id

**Public hook:** `useCalendar()` → `{ state, dispatch }`

**Provider:** `CalendarProvider` wraps the app in `main.jsx` alongside `DashboardProvider`.

---

## Widget 1 — `CalendarioMini` (1×1)

### Face (widget body)

- Large day-of-week abbreviation (LUN, MAR…)
- Large day number
- Month name below
- Up to 3 accent-colored dots indicating events today (one dot per event, capped at 3)

### Interaction

- **Long-press** → opens the month modal

### Modal — Full Month Calendar

- Month/year header with `←` / `→` navigation arrows
- 7-column day grid (Mon–Sun), current day highlighted with accent color, days with events show a small dot
- Clicking a day:
  - Shows a list of that day's events (title + startTime + duration)
  - A `+` button to create a new event for that day
- Clicking an existing event → opens `CalendarioEventModal` in edit mode

### Catalog entry
```js
{ id: 'calendario-mini', category: 'Utilidades', categoryIcon: '📅',
  icon: '📅', name: 'Calendario Mini',
  sizes: ['1x1'],
  defaultConfig: { name: 'Calendario' },
  component: CalendarioMini }
```

---

## Widget 2 — `CalendarioDia` (2×2 / 2×4 / 4×4)

### Face (widget body)

- **Header row:** `←` · `Jue 5 Jun` · `→` + `+` button (right-aligned)
  - Arrows navigate one day at a time; default view is today
  - `+` opens `CalendarioEventModal` in create mode, pre-filled with the currently viewed date
- **Body:** scrollable list of events for the viewed day, sorted by startTime
  - Each event: accent-colored left border, title in bold, `HH:MM · Xmin` subtitle
  - If no events: subtle "Sin eventos" message centered
- **Click on an event** → opens `CalendarioEventModal` in edit mode

### Sizes

| Size | Layout notes |
|------|-------------|
| 2×2  | Header + up to ~4 events visible, scrollable |
| 2×4  | Header + up to ~9 events visible, scrollable |
| 4×4  | Header + events in larger font, more breathing room |

### Long-press behavior

Long-press on the widget background (not on an event) → opens widget config modal (just the widget name field, standard pattern).

### Catalog entry
```js
{ id: 'calendario-dia', category: 'Utilidades', categoryIcon: '📅',
  icon: '🗓', name: 'Calendario',
  sizes: ['2x2', '2x4', '4x4'],
  defaultConfig: { name: 'Agenda' },
  component: CalendarioDia }
```

---

## Shared Component — `CalendarioEventModal`

Used by both widgets for creating and editing events.

### Props
```js
{ event?: EventObject,   // if present → edit mode; absent → create mode
  defaultDate?: string,  // pre-fills date in create mode
  onSave: fn,
  onDelete?: fn,         // only shown in edit mode
  onClose: fn,
  accentColor: string }
```

### Fields
| Field | Input type | Notes |
|-------|-----------|-------|
| Título | `<input type="text">` | Required |
| Fecha | `<input type="date">` | Required |
| Hora inicio | `<input type="time">` | 24h format |
| Duración | `<select>` | Options: 15 min, 30 min, 45 min, 1 h, 1:30 h, 2 h, 3 h |

### Buttons
- **Guardar** — dispatches `ADD_EVENT` or `UPDATE_EVENT`; closes modal
- **Eliminar** (edit mode only) — dispatches `DELETE_EVENT`; closes modal
- **✕ close** — discards changes

---

## New Files

| File | Purpose |
|------|---------|
| `src/store/calendarStore.jsx` | Global events store |
| `src/components/widgets/CalendarioMini.jsx` | 1×1 mini calendar widget |
| `src/components/widgets/CalendarioDia.jsx` | Day-agenda widget |
| `src/components/widgets/CalendarioEventModal.jsx` | Shared create/edit event modal |

## Modified Files

| File | Change |
|------|--------|
| `src/main.jsx` | Wrap app with `<CalendarProvider>` |
| `src/catalog/widgetCatalog.jsx` | Add both catalog entries |

No changes to `Canvas`, `CanvasWidget`, `dashboardStore`, or any existing widget.

---

## Event Color

All events use `accentColor` (the dashboard accent, passed as prop to widgets). No per-event color customization.

---

## Out of Scope

- Recurring events
- Reminders / notifications
- Week view
- Drag-to-resize events
- External calendar sync (Google, iCal)

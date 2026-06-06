# Notas Widget — Design Spec
**Date:** 2026-06-05  
**Status:** Approved

## Overview

A sticky-note widget that displays up to 10 notes as physically stacked paper sheets (cascada/waterfall style). The most recent note sits at the front; background notes peek out below-right, visually implying depth. Tapping a background note floats it smoothly to the front via CSS transitions.

## Requirements

- Maximum 10 active notes per widget instance.
- Each note has a **title** (free text, emojis supported) and a **body** (plain text, list format with `—` prefix encouraged via placeholder).
- Default visible note: the most recently created (first in the `notes` array).
- Navigation: tap a peeking background note to bring it to front (smooth CSS transition).
- Create: `+` button in widget header → modal.
- Edit: long-press on active note → modal with pre-filled fields.
- Delete: button inside the edit modal.
- `+` button hidden/disabled when `notes.length === 10`.

## Files Changed

| File | Change |
|---|---|
| `src/components/widgets/Notas.jsx` | New component |
| `src/catalog/widgetCatalog.jsx` | Add catalog entry `notas` |
| `src/catalog/widgetSizes.js` | Add `2x6` and `2x8` sizes |

## Config Shape

```js
{
  name: 'Mis notas',         // widget display name
  notes: [                   // ordered newest-first, max 10
    {
      id: string,            // nanoid or Date.now().toString()
      title: string,         // e.g. '🛒 Lista compras'
      body: string,          // multiline, lines may start with '— '
      createdAt: number,     // Unix ms timestamp
    }
  ],
  activeId: string | null,   // id of note currently at front; null if no notes
}
```

State persists via `onConfigChange` → `dashboardStore` → `localStorage`, identical to all other widgets.

## New Widget Sizes

```js
// widgetSizes.js additions
'2x6': { width: 185, height: 595 },
'2x8': { width: 185, height: 800 },
```

## Cascade Layout

The widget renders up to 3 paper layers in an absolutely-positioned container:

| Layer | z-index | top offset | left offset | opacity | Content |
|---|---|---|---|---|---|
| 0 (active) | 3 | 0 | 0 | 1.0 | Title + full body |
| 1 (peek) | 2 | +26px | +8px | 0.85 | Title only (cropped) |
| 2 (peek) | 1 | +48px | +14px | 0.60 | Top border only |

All layers have `transition: top 220ms ease, left 200ms ease` so that when `activeId` changes, papers animate into their new positions.

**Tap interaction:** clicking layer 1 or 2 calls `setActive(note.id)`, which sets `activeId` to that note's id and persists via `onConfigChange`. The `notes` array order (newest-first by creation) never changes — only `activeId` determines which note sits at the front. Visual cascade order at render time: `[activeNote, ...otherNotes in original order]`.

**Paper style:** warm cream gradient (`#fdf6ee → #f5ead9`), `border-radius: 8px`, `box-shadow: 0 2px 12px rgba(0,0,0,0.5)`. Dark text (`#1e293b` title, `#334155` body) for contrast against the dark dashboard background.

## Size Adaptations

| Size | Behavior |
|---|---|
| `1x2` (90×185) | Single paper, no cascade peek (too narrow). Title + truncated body. |
| `2x2` (185×185) | 3-layer cascade. Title + 2–3 body lines. |
| `2x4` (185×390) | 3-layer cascade. Title + full body. Peek papers taller. |
| `4x4` (390×390) | 3-layer cascade, wider papers. Full content + timestamp. |
| `2x6` (185×595) | 3-layer cascade. Full body + timestamp. |
| `2x8` (185×800) | 3-layer cascade. Full body + timestamp + note count indicator. |

## Modal Design

Inner component `NotasModal` (same file, same pattern as `TemporizadorModal`):

- **Create mode:** blank title input + textarea (placeholder: `— elemento\n— elemento`)
- **Edit mode:** pre-filled. Includes a red **Eliminar** button at bottom.
- Uses `ModalBase` from `widgetUtils.jsx`.
- `onSave`: prepends new note to `notes` array (newest-first), sets `activeId` to new note's id.
- `onDelete`: removes note from array, sets `activeId` to `notes[0].id` (or `null` if empty).

## Catalog Entry

```js
{
  id: 'notas',
  category: 'Organización',
  categoryIcon: '📦',
  icon: '📝',
  name: 'Notas',
  sizes: ['1x2', '2x2', '2x4', '4x4', '2x6', '2x8'],
  defaultConfig: {
    name: 'Mis notas',
    notes: [],
    activeId: null,
  },
  component: Notas,
}
```

## Interaction Summary

```
Widget idle
  ├─ Tap background note    → setActive(id) [CSS transition to front]
  ├─ Long-press active note → open NotasModal in edit mode
  └─ Tap "+" button         → open NotasModal in create mode (hidden if 10 notes)

NotasModal (create)
  ├─ Fill title + body → Save → prepend to notes, close
  └─ Cancel → close (no change)

NotasModal (edit)
  ├─ Edit title/body → Save → update note in place, close
  ├─ Eliminar        → remove note, update activeId, close
  └─ Cancel          → close (no change)
```

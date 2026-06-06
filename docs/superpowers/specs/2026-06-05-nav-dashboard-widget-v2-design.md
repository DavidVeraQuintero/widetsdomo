# NavegadorDashboard Widget v2 — Design Spec

**Date:** 2026-06-05  
**Status:** Approved  
**Replaces:** `2026-06-05-nav-dashboard-widget-design.md`

## Summary

Redesign of `NavegadorDashboard` widget to fix styling issues, replace emoji icons with the existing SVG icon system, and introduce long-press-to-configure interaction replacing the inline config form.

---

## Config Shape Change

```js
// v1 (removed)
{ targetId: '', targetName: '', icon: '🏠' }

// v2
{ targetId: '', targetName: '', iconId: 'home' }
```

`iconId` is a key from `ICONS` in `src/components/widgets/iconLibrary.js`. Rendered with `SvgIcon`.

---

## Interaction Model

| State | Short click | Long press (≥500ms) |
|-------|-------------|---------------------|
| Not configured (`targetId === ''`) | No-op | Open config modal |
| Configured + target exists | Navigate to target dashboard | Open config modal |
| Configured + target deleted | No-op | Open config modal |

**Long press feedback:** while holding, the widget fades to ~60% opacity as visual cue. On release before 500ms: fade cancels. On 500ms: modal opens.

---

## Widget Render States

### State A — Not configured
- Icon: `SvgIcon id="home"` at dim color (`var(--text-dim)`)
- Label: "Sin configurar" in dim color
- All text in white (`var(--text-primary)`)

### State B — Configured
- Icon: `SvgIcon id={config.iconId}` at `rgba(255,255,255,0.85)`
- Label: `config.targetName`
- Sub-label (1x2 and 2x2 only): "🧭 Navegar"
- Arrow (2x1 only): →
- Button (2x2 only): "Ir →"
- All text in white (`var(--text-primary)`)

### State C — Target deleted
- Same layout as State B but icon and text at dim color
- Sub-label: "Destino eliminado"
- Click: no-op, long press opens modal

---

## Size Variants

| Size | Layout |
|------|--------|
| 1x1 | `w-body w-center` — icon (28px) + name (9px, truncated) |
| 1x2 | `w-body w-center` — label "🧭 Navegar" + icon (40px) + name (13px bold) + sub (10px) |
| 2x1 | `w-row-body` — icon (28px) + name/sub info column + arrow → |
| 2x2 | `w-body w-center` — label + icon (48px) + name (15px bold) + "Ir →" button |

---

## Config Modal

A full-screen overlay (same style as `IconPicker`): dark glass, `zIndex: 2000`, centered card.

### Contents
1. **Header:** "⚙ Configurar navegador" + close ✕ button
2. **Dashboard selector:** styled `<select>` with forced dark CSS (inline styles: `background: #1e293b`, `color: #e2e8f0`, `border: 1px solid #334155`). Populated from `useMeta().state.dashboards`.
3. **Icon row:** shows current `SvgIcon` + "Cambiar ícono" button → opens `IconPicker` as sub-modal (zIndex 2100)
4. **Footer:** "Guardar" (primary, disabled if no targetId) + "Cancelar" buttons

### State management
- Modal has local state: `localTargetId`, `localIconId`
- Initialized from current `config` when modal opens
- "Guardar" calls `onConfigChange({ ...config, targetId, targetName, iconId })` then closes
- "Cancelar" discards changes and closes

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/widgets/NavegadorDashboard.jsx` | Full rewrite |
| `src/catalog/widgetCatalog.jsx` | Update `defaultConfig` to use `iconId: 'home'` |

No new files. `IconPicker` and `SvgIcon` are imported, not modified.

---

## Out of Scope

- Touch/mobile long press (only mouse events)
- Custom dashboard icon in the tab bar
- Animation on navigation

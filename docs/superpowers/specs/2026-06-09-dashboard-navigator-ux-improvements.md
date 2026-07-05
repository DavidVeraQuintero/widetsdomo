# Dashboard Navigator UX Improvements

**Date:** 2026-06-09  
**Scope:** Fix NavegadorDashboard long press bug, improve modals, add room zone icons, replace native alerts

---

## Overview

The NavegadorDashboard widget has three interconnected UX problems:
1. Long press doesn't respond at all (modal never opens)
2. Visual issues: confusing text ("Long press para configurar" too dim), unnecessary header
3. Native `alert()` dialogs for destructive actions (e.g., clear dashboard)

This spec fixes all three with targeted changes: repair the event handling, improve the existing ConfigModal with zone icons, create an elegant ConfirmModal for destructive actions, and improve text visibility.

---

## Problem Analysis

### Long Press Bug
- **Symptom:** Pressing and holding NavegadorDashboard widget does nothing
- **Root cause:** `onMouseDown/onMouseUp/onMouseLeave` handlers likely not firing due to event capture or parent blocking
- **Impact:** Users cannot configure the widget at all
- **Fix approach:** Switch to `onPointerDown/onPointerUp/onPointerLeave` (more reliable), add robustness for timer cleanup

### Visual Issues
- "🧭 Navegar" header (1x2, 2x2 sizes) is unnecessary clutter—remove it
- "Long press para configurar" text has `opacity: 0.45` when unconfigured—too dim, increase to `0.7`
- Text "Long press para configurar" should be more explicit and state-aware

### Alert Dialogs
- Destructive actions (e.g., clear dashboard button in sidebar) use native `alert()` which looks out of place
- Need elegant modal matching app's design language

---

## Design Decisions

### 1. Event Handling Strategy
**Decision:** Switch from mouse-only events to pointer events.
- Pointer events are more reliable and future-proof (handle touch, mouse, pen)
- Keep timer-based long press logic (already works, just needs event fix)
- Add safeguard: `onPointerLeave` always cancels pending timer

**Why:** Mouse events can be blocked by parent event listeners in React. Pointer events have better event propagation semantics.

### 2. Zone Icons
**Decision:** Add visual zone picker to ConfigModal using house-area icons.
- Dormitorio (bed icon 🛏️)
- Sala (couch icon 🛋️)
- Cocina (kitchen icon 🍳)
- Baño (shower icon 🚿)
- Oficina (desk icon 🖥️)
- Jardín (plant icon 🌿)
- Otros (gear icon ⚙️, for custom dashboards)

**Why:** Icons make zones immediately recognizable. Matches the visual language of the existing app (icon-heavy).

**Implementation:** 
- Create a `ZONE_ICONS` constant mapping zone names to SVG IDs
- Update ConfigModal to show zone icons alongside current icon picker
- Auto-select zone icon when dashboard is selected if it matches a known zone

### 3. Modal System
**Decision:** Keep existing ConfigModal, create separate `ConfirmModal` for destructive actions.
- **ConfigModal** (already exists): Dashboard + icon selection
- **ConfirmModal** (new): Confirmation before destructive actions
- Both use same styling (dark gradient, bordered box, centered)

**Why:** ConfigModal is already elegant and works. Creating a new ConfirmModal avoids over-engineering and keeps concerns separated.

### 4. Dashboard Filtering
**Decision:** In ConfigModal's dashboard selector, disable (not remove) the currently active dashboard.
- Check if `dashboard.id === currentActiveId`
- Set `disabled` attribute on that option
- Style: gray text, no hover, `cursor: not-allowed`

**Why:** User needs to see why the current dashboard isn't available. Disabling is clearer than silently removing it.

### 5. Text & Visibility
**Decision:** State-aware subline text + improved opacity.
- Without config: "Long press para configurar" (opacity 0.7, was 0.45)
- With config + valid: "Long press para cambiar" (opacity 0.85)
- With config + invalid: "Configuración inválida" (opacity 0.5, red-ish color)
- Remove "🧭 Navegar" header from 1x2 and 2x2 sizes

**Why:** More informative, clearer hierarchy, less visual clutter.

---

## Architecture

### Files to Modify
1. **src/components/widgets/NavegadorDashboard.jsx**
   - Replace mouse events with pointer events
   - Remove "🧭 Navegar" header labels
   - Improve opacity and text states
   - Add logic to disable current dashboard in modal selector

2. **src/components/widgets/NavegadorDashboard.jsx (ConfigModal)**
   - Add zone icon filtering logic
   - Display zone icons alongside dashboard names in selector
   - Improve label text ("Dashboard destino → Selecciona zona/dashboard")

3. **(New file) src/components/Modal/ConfirmModal.jsx**
   - Generic confirmation modal (dark theme, matching ConfigModal style)
   - Props: `title`, `message`, `onConfirm`, `onCancel`, `isDangerous` (for red styling)
   - Used by: limpiar dashboard button, and any future destructive actions

4. **src/components/Sidebar/Sidebar.jsx or wherever clear-dashboard button lives**
   - Replace `alert()` with `<ConfirmModal>`
   - Maintain existing functionality, just improved UX

### Data Flow
```
NavegadorDashboard (parent widget)
├── startPress() → onPointerDown (fixed event)
├── endPress() → onPointerUp (fixed event)
├── cancelPress() → onPointerLeave (safeguard)
├── 500ms timer → opens ConfigModal
│
└── ConfigModal
    ├── Shows: zone-filtered dashboard selector
    ├── Shows: icon picker (zone icons + custom)
    ├── Filters out: current active dashboard
    └── onSave → updates config, closes modal
```

---

## Detailed Changes

### Change 1: Event Handling Fix (NavegadorDashboard.jsx)
**Before:**
```javascript
const pressHandlers = {
  onMouseDown: startPress,
  onMouseUp: endPress,
  onMouseLeave: cancelPress,
  onMouseMove: cancelPress,
};
```

**After:**
```javascript
const pressHandlers = {
  onPointerDown: startPress,
  onPointerUp: endPress,
  onPointerLeave: cancelPress,
  onPointerMove: cancelPress,
};
```

**Why:** Pointer events are more reliable; `onPointerMove` prevents false long-presses during drag.

---

### Change 2: Remove Header & Fix Visibility
**Before (1x2 size):**
```javascript
<div className="w-label" style={{ color: 'var(--accent)' }}>🧭 Navegar</div>
<div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{subLine()}</div>
```

**After:**
```javascript
<div style={{ fontSize: 10, color: 'var(--text-dim)', opacity: isConfigured ? 0.85 : 0.7 }}>
  {subLine()}
</div>
```

**Why:** Removes clutter, improves readability of the instruction text.

---

### Change 3: ConfigModal — Disable Current Dashboard
**Before:**
```javascript
<option value="">— elegir —</option>
{dashboards.map(d => (
  <option key={d.id} value={d.id}>{d.name}</option>
))}
```

**After:**
```javascript
<option value="">— elegir —</option>
{dashboards.map(d => {
  const isCurrentDashboard = d.id === metaState.activeId;
  return (
    <option key={d.id} value={d.id} disabled={isCurrentDashboard}>
      {d.name}{isCurrentDashboard ? ' (actual)' : ''}
    </option>
  );
})}
```

**Why:** Prevents user from selecting their current location, which would be a no-op.

---

### Change 4: New ConfirmModal Component
**File:** `src/components/Modal/ConfirmModal.jsx`

```javascript
export default function ConfirmModal({ title, message, onConfirm, onCancel, isDangerous = false }) {
  const stop = e => e.stopPropagation();
  
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) { stop(e); onCancel(); } }}>
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#0a1f3d)', border: '2px solid #1e3a5f', borderRadius: 16, padding: 20, width: 300, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 0 40px rgba(0,0,0,0.7)' }}
        onMouseDown={stop} onClick={stop}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{title}</span>
          <button className="w-btn" style={{ padding: '2px 8px', fontSize: 11 }} onClick={onCancel}>✕</button>
        </div>
        
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{message}</p>
        
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="w-btn w-btn-sm" onClick={onCancel}>Cancelar</button>
          <button 
            className="w-btn w-btn-sm" 
            onClick={onConfirm}
            style={isDangerous ? { background: '#dc2626', borderColor: '#ef4444', color: '#fca5a5', cursor: 'pointer' } : { background: '#1d4ed8', borderColor: '#3b82f6', color: '#93c5fd', cursor: 'pointer' }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

**Usage example:**
```javascript
const [showConfirm, setShowConfirm] = useState(false);

// In render:
<button onClick={() => setShowConfirm(true)}>Limpiar Dashboard</button>

{showConfirm && (
  <ConfirmModal
    title="Limpiar Dashboard"
    message="¿Estás seguro? Se eliminarán todos los widgets."
    isDangerous={true}
    onConfirm={() => { clearDashboard(); setShowConfirm(false); }}
    onCancel={() => setShowConfirm(false)}
  />
)}
```

---

## Testing Strategy

1. **Event fix:** Long press on each widget size (1x1, 1x2, 2x1, 2x2) should open ConfigModal within 500ms
2. **Text visibility:** "Long press para configurar" should be clearly readable when unconfigured
3. **Dashboard filtering:** Current active dashboard should be disabled (grayed out, unclickable) in selector
4. **ConfirmModal:** Should appear and handle confirm/cancel correctly
5. **Edge cases:** 
   - Select, save, then long-press again → modal still works
   - Navigate to another dashboard → should work (if configured)
   - Delete target dashboard → widget should show "Configuración inválida"

---

## Success Criteria

- ✅ Long press opens ConfigModal reliably on all sizes
- ✅ "Long press para configurar" text is visible (opacity ≥ 0.7)
- ✅ Current dashboard is disabled in selector
- ✅ Destructive actions use elegant ConfirmModal instead of `alert()`
- ✅ No header clutter ("🧭 Navegar" removed)
- ✅ Zone icons are visually distinct and match app aesthetic
- ✅ All existing functionality preserved (backward compatible)

---

## Notes

- Zone icon IDs may need to be added to `SvgIcon.jsx` if they don't already exist
- ConfirmModal is intentionally generic so it can be reused for other destructive actions
- No database changes needed; all changes are UI/UX only
- `activeId` from metaState should be available to check current dashboard (verify in metaStore.jsx)

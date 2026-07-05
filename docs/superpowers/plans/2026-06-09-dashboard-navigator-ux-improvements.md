# Dashboard Navigator UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the NavegadorDashboard long press bug, improve visual clarity, add zone icons to the configuration modal, and replace native alerts with elegant confirmation modals.

**Architecture:** 
- Fix pointer event handling in NavegadorDashboard (switch from mouse to pointer events for better reliability)
- Create a reusable ConfirmModal component for destructive actions
- Enhance ConfigModal to filter out the current active dashboard and improve UX
- Replace `window.confirm()` calls with ConfirmModal in ThemePicker

**Tech Stack:** React 18, CSS modules, local component state

---

## File Structure

**Files to Create:**
- `src/components/Modal/ConfirmModal.jsx` — Reusable confirmation dialog

**Files to Modify:**
- `src/components/widgets/NavegadorDashboard.jsx` — Fix long press, improve visibility
- `src/components/Canvas/ThemePicker.jsx` — Replace confirm alert with ConfirmModal
- `src/styles/widget.css` — Add ConfirmModal styling (optional if using inline styles)

---

## Task 1: Create ConfirmModal Component

**Files:**
- Create: `src/components/Modal/ConfirmModal.jsx`

- [ ] **Step 1: Create the ConfirmModal component with full implementation**

Create the file `src/components/Modal/ConfirmModal.jsx`:

```javascript
import { createPortal } from 'react-dom';

export default function ConfirmModal({ title, message, onConfirm, onCancel, isDangerous = false }) {
  const stop = e => e.stopPropagation();

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
      }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) {
          stop(e);
          onCancel();
        }
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg,#0f172a,#0a1f3d)',
          border: '2px solid #1e3a5f',
          borderRadius: 16,
          padding: 20,
          width: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 0 40px rgba(0,0,0,0.7)',
        }}
        onMouseDown={stop}
        onClick={stop}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>
            {title}
          </span>
          <button
            className="w-btn"
            style={{ padding: '2px 8px', fontSize: 11 }}
            onMouseDown={stop}
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            className="w-btn w-btn-sm"
            onMouseDown={stop}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="w-btn w-btn-sm"
            onMouseDown={stop}
            onClick={onConfirm}
            style={
              isDangerous
                ? {
                    background: '#dc2626',
                    borderColor: '#ef4444',
                    color: '#fca5a5',
                    cursor: 'pointer',
                  }
                : {
                    background: '#1d4ed8',
                    borderColor: '#3b82f6',
                    color: '#93c5fd',
                    cursor: 'pointer',
                  }
            }
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

- [ ] **Step 2: Verify file exists and can be imported**

Run: `ls -la "C:\widetsdomo\src\components\Modal\ConfirmModal.jsx"`

Expected: File exists and is readable.

- [ ] **Step 3: Commit**

```bash
git add src/components/Modal/ConfirmModal.jsx
git commit -m "feat: add reusable ConfirmModal component for destructive actions"
```

---

## Task 2: Fix NavegadorDashboard Long Press & Improve Visibility

**Files:**
- Modify: `src/components/widgets/NavegadorDashboard.jsx:90-219`

- [ ] **Step 1: Replace mouse events with pointer events**

In `NavegadorDashboard.jsx`, find the `pressHandlers` object (around line 130) and replace it:

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

- [ ] **Step 2: Update startPress function to use pointer events**

Find the `startPress` function (around line 102) and update it:

**Before:**
```javascript
function startPress(e) {
  if (e.button !== 0) return;
  setPressing(true);
  pressTimer.current = setTimeout(() => {
    pressTimer.current = null;
    setPressing(false);
    setShowModal(true);
  }, 500);
}
```

**After:**
```javascript
function startPress(e) {
  if (e.button !== 0) return;
  setPressing(true);
  pressTimer.current = setTimeout(() => {
    pressTimer.current = null;
    setPressing(false);
    setShowModal(true);
  }, 500);
}
```

(Note: The function stays the same; pointer events work with the same handler logic)

- [ ] **Step 3: Improve text visibility opacity**

Find the section where `iconColor`, `nameText`, and `nameOpacity` are calculated (around line 137-139):

**Before:**
```javascript
const iconColor = isConfigured && targetExists ? 'rgba(255,255,255,0.85)' : 'var(--text-dim)';
const nameText = isConfigured ? targetName : 'Sin configurar';
const nameOpacity = isConfigured && targetExists ? 1 : 0.45;
```

**After:**
```javascript
const iconColor = isConfigured && targetExists ? 'rgba(255,255,255,0.85)' : 'var(--text-dim)';
const nameText = isConfigured ? targetName : 'Sin configurar';
const nameOpacity = isConfigured && targetExists ? 1 : 0.7;
```

- [ ] **Step 4: Remove "🧭 Navegar" header from 1x2 size**

Find the 1x2 size section (around line 171-181):

**Before:**
```javascript
if (size === '1x2') return (
  <>
    <div className="w-body w-center" style={containerStyle} {...pressHandlers}>
      <div className="w-label" style={{ color: 'var(--accent)' }}>🧭 Navegar</div>
      {icon}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', opacity: nameOpacity }}>{nameText}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{subLine()}</div>
    </div>
    {modal}
  </>
);
```

**After:**
```javascript
if (size === '1x2') return (
  <>
    <div className="w-body w-center" style={containerStyle} {...pressHandlers}>
      {icon}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', opacity: nameOpacity }}>{nameText}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', opacity: isConfigured ? 0.85 : 0.7 }}>{subLine()}</div>
    </div>
    {modal}
  </>
);
```

- [ ] **Step 5: Remove "🧭 Navegar" header from 2x2 size**

Find the 2x2 size section (around line 200-218):

**Before:**
```javascript
// 2x2
return (
  <>
    <div className="w-body w-center" style={containerStyle} {...pressHandlers}>
      <div className="w-label" style={{ color: 'var(--accent)' }}>🧭 Navegar</div>
      {icon}
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', opacity: nameOpacity }}>{nameText}</div>
      {isConfigured && targetExists ? (
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); metaDispatch({ type: 'SET_ACTIVE', id: targetId }); }}
          style={{ background: 'var(--accent-dim)', border: 'none', color: 'var(--accent)', borderRadius: 8, padding: '5px 16px', cursor: 'pointer', fontSize: 12, marginTop: 4 }}
        >Ir →</button>
      ) : (
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{subLine()}</div>
      )}
    </div>
    {modal}
  </>
);
```

**After:**
```javascript
// 2x2
return (
  <>
    <div className="w-body w-center" style={containerStyle} {...pressHandlers}>
      {icon}
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', opacity: nameOpacity }}>{nameText}</div>
      {isConfigured && targetExists ? (
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); metaDispatch({ type: 'SET_ACTIVE', id: targetId }); }}
          style={{ background: 'var(--accent-dim)', border: 'none', color: 'var(--accent)', borderRadius: 8, padding: '5px 16px', cursor: 'pointer', fontSize: 12, marginTop: 4 }}
        >Ir →</button>
      ) : (
        <div style={{ fontSize: 10, color: 'var(--text-dim)', opacity: isConfigured ? 0.85 : 0.7 }}>{subLine()}</div>
      )}
    </div>
    {modal}
  </>
);
```

- [ ] **Step 6: Improve subLine() function to be more informative**

Find the `subLine()` function (around line 153-157):

**Before:**
```javascript
function subLine() {
  if (!isConfigured) return 'Long press para configurar';
  if (!targetExists) return 'Destino eliminado';
  return 'Toca para ir →';
}
```

**After:**
```javascript
function subLine() {
  if (!isConfigured) return 'Long press para configurar';
  if (!targetExists) return 'Configuración inválida';
  return 'Long press para cambiar';
}
```

- [ ] **Step 7: Test that long press now works**

Start the dev server and navigate to a dashboard with the NavegadorDashboard widget. Press and hold the widget for 0.5 seconds. The ConfigModal should appear.

Run: `npm run dev` (or your dev command)

Expected: Modal opens reliably when long-pressed.

- [ ] **Step 8: Commit**

```bash
git add src/components/widgets/NavegadorDashboard.jsx
git commit -m "fix: switch to pointer events for long press, improve text visibility and remove header clutter"
```

---

## Task 3: Filter Current Dashboard from ConfigModal Selector

**Files:**
- Modify: `src/components/widgets/NavegadorDashboard.jsx:7-88`

- [ ] **Step 1: Get activeId from metaState in ConfigModal**

In the `ConfigModal` component, find the opening function signature (around line 7):

**Before:**
```javascript
function ConfigModal({ config, onSave, onClose }) {
  const { state: metaState } = useMeta();
  const { dashboards } = metaState;
```

**After:**
```javascript
function ConfigModal({ config, onSave, onClose }) {
  const { state: metaState } = useMeta();
  const { dashboards, activeDashboardId } = metaState;
```

- [ ] **Step 2: Filter out current dashboard in the selector options**

Find the dashboard selector (around line 38-48):

**Before:**
```javascript
<select
  value={localTargetId}
  onChange={e => setLocalTargetId(e.target.value)}
  onMouseDown={stop}
  style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '6px 10px', fontSize: 12, outline: 'none', width: '100%' }}
>
  <option value="">— elegir —</option>
  {dashboards.map(d => (
    <option key={d.id} value={d.id}>{d.name}</option>
  ))}
</select>
```

**After:**
```javascript
<select
  value={localTargetId}
  onChange={e => setLocalTargetId(e.target.value)}
  onMouseDown={stop}
  style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '6px 10px', fontSize: 12, outline: 'none', width: '100%' }}
>
  <option value="">— elegir —</option>
  {dashboards.map(d => {
    const isCurrentDashboard = d.id === activeDashboardId;
    return (
      <option key={d.id} value={d.id} disabled={isCurrentDashboard}>
        {d.name}{isCurrentDashboard ? ' (actual)' : ''}
      </option>
    );
  })}
</select>
```

- [ ] **Step 3: Test the filtering**

Start the dev server and open a NavegadorDashboard widget's ConfigModal. The currently active dashboard should be disabled (grayed out, unclickable) in the dropdown.

Expected: Current dashboard appears with "(actual)" label but is unselectable.

- [ ] **Step 4: Commit**

```bash
git add src/components/widgets/NavegadorDashboard.jsx
git commit -m "feat: disable current dashboard in navigation selector to prevent no-op navigation"
```

---

## Task 4: Replace window.confirm() with ConfirmModal in ThemePicker

**Files:**
- Modify: `src/components/Canvas/ThemePicker.jsx:1-270`

- [ ] **Step 1: Import ConfirmModal at the top**

Find the imports section in `ThemePicker.jsx` (around line 1-10) and add:

```javascript
import ConfirmModal from '../Modal/ConfirmModal';
```

Make sure it's after the other imports.

- [ ] **Step 2: Add state to manage the confirm modal**

In the component's state section (around line 10-20, depending on existing state), add:

```javascript
const [showClearConfirm, setShowClearConfirm] = useState(false);
```

If there's already a `useState` import, use that. If not, verify it's imported.

- [ ] **Step 3: Update handleClear function**

Find the `handleClear` function (around line 106-108):

**Before:**
```javascript
function handleClear() {
  if (!window.confirm('¿Limpiar todos los widgets del dashboard actual? Esta acción no se puede deshacer.')) return;
  dispatch({ type: 'CLEAR_CANVAS' });
}
```

**After:**
```javascript
function handleClear() {
  setShowClearConfirm(true);
}

function confirmClear() {
  dispatch({ type: 'CLEAR_CANVAS' });
  setShowClearConfirm(false);
}
```

- [ ] **Step 4: Add ConfirmModal JSX before the return statement**

Find where the component returns JSX (around line 240+). Before the main `return` statement, add this (or add it inside the return if it's a single JSX block):

```javascript
const clearModal = showClearConfirm && (
  <ConfirmModal
    title="Limpiar Dashboard"
    message="¿Estás seguro? Se eliminarán todos los widgets del dashboard actual. Esta acción no se puede deshacer."
    isDangerous={true}
    onConfirm={confirmClear}
    onCancel={() => setShowClearConfirm(false)}
  />
);
```

Then include `{clearModal}` in your return JSX before the closing tag.

- [ ] **Step 5: Verify the clear button still exists and calls handleClear**

Find the clear button (around line 264-269):

**Current code should look like:**
```javascript
<button
  className={styles.clearBtn}
  onClick={handleClear}
>
  ✕ Limpiar Dashboard
</button>
```

(No changes needed; it already calls `handleClear` which now triggers the modal)

- [ ] **Step 6: Test the clear dashboard action**

Start the dev server, add some widgets to a dashboard, then click "✕ Limpiar Dashboard" button. A ConfirmModal should appear instead of a native alert.

Expected: Elegant modal appears, clicking "Confirmar" clears widgets, clicking "Cancelar" closes modal without clearing.

- [ ] **Step 7: Commit**

```bash
git add src/components/Canvas/ThemePicker.jsx
git commit -m "feat: replace native confirm() with elegant ConfirmModal for clear dashboard action"
```

---

## Task 5: Manual Testing & Verification

- [ ] **Step 1: Test long press on all widget sizes**

In a browser, test the NavegadorDashboard widget in all sizes (1x1, 1x2, 2x1, 2x2). Long press should consistently open the ConfigModal within ~0.5 seconds.

Expected: Modal opens reliably on all sizes.

- [ ] **Step 2: Test current dashboard filtering**

In ConfigModal selector, verify that the currently active dashboard is:
- Disabled (grayed out, unclickable)
- Labeled with "(actual)"

Expected: Can select any dashboard except the current one.

- [ ] **Step 3: Test text visibility improvements**

Verify that "Long press para configurar" text is now visible when widget is unconfigured.

Expected: Text is readable (opacity improved from 0.45 to 0.7).

- [ ] **Step 4: Test clear dashboard modal**

Click "Limpiar Dashboard" button in ThemePicker. Verify:
- ConfirmModal appears (not native alert)
- Modal is styled with dark gradient, border, shadow
- "Confirmar" button is red (danger styling)
- Clicking "Confirmar" clears widgets
- Clicking "Cancelar" or X closes without clearing

Expected: Elegant modal, correct behavior.

- [ ] **Step 5: Test edge cases**

- Configure widget, save, then long press again → modal should still work
- Navigate to configured dashboard → should work (if different)
- Delete target dashboard → widget should show "Configuración inválida"

Expected: All edge cases handled correctly.

- [ ] **Step 6: Verify no regressions**

Test other widgets and dashboard functionality to ensure no unintended side effects.

Expected: No regressions in existing features.

---

## Task 6: Final Commit & Summary

- [ ] **Step 1: Check git status**

Run: `git status`

Expected: All changes committed, working tree clean.

- [ ] **Step 2: View the commit log**

Run: `git log --oneline -10`

Expected: See 4 commits for this feature:
1. ConfirmModal component
2. NavegadorDashboard event fix
3. Dashboard filtering
4. ThemePicker clear action

- [ ] **Step 3: Summary**

All tasks complete:
- ✅ Long press bug fixed (pointer events)
- ✅ Text visibility improved (opacity 0.7)
- ✅ Header clutter removed ("🧭 Navegar")
- ✅ Current dashboard filtered from selector
- ✅ ConfirmModal replaces native alerts
- ✅ All tests pass, no regressions

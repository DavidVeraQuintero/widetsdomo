# NavegadorDashboard Widget v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite NavegadorDashboard to use the existing SVG icon system, introduce long-press-to-configure with a dark modal, fix dropdown visibility, and enforce white text throughout.

**Architecture:** Single-file rewrite of `NavegadorDashboard.jsx`. A `ConfigModal` component (defined in the same file) handles configuration state locally and calls `onConfigChange` on save. Long press is implemented with a `useRef` timer + `onMouseDown`/`onMouseUp`/`onMouseLeave`/`onMouseMove` handlers. The catalog `defaultConfig` is updated to replace `icon: '🏠'` with `iconId: 'home'`.

**Tech Stack:** React 18, `useMeta` from `src/store/metaStore.jsx`, `SvgIcon` + `IconPicker` from `src/components/widgets/`, shared widget CSS classes from `src/styles/widget.css` (globally available).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/widgets/NavegadorDashboard.jsx` | **Rewrite** | Widget + ConfigModal — long press, icon, navigation |
| `src/catalog/widgetCatalog.jsx` | **Modify line ~98** | Update `defaultConfig` to use `iconId: 'home'` |

---

## Task 1: Rewrite NavegadorDashboard.jsx

**Files:**
- Modify: `src/components/widgets/NavegadorDashboard.jsx` (full rewrite)

**Context — how long press works:**
- `onMouseDown` starts a 500ms `setTimeout`. Stores the timer ID in `pressTimer` ref.
- Inside the timeout callback: sets `pressTimer.current = null`, then opens modal.
- `onMouseUp`: if `pressTimer.current !== null` (timer still pending = short press), clears timer and navigates (if target exists). Sets pressing = false.
- `onMouseLeave` and `onMouseMove`: if `pressTimer.current !== null`, clears timer and sets pressing = false. This cancels long press if user moves or leaves while pressing.
- `pressing` state controls opacity (0.6 while holding, 1 otherwise) for visual feedback.
- No `stopPropagation` in `onMouseDown` — lets `CanvasWidget`'s drag handler fire normally.

**Context — icons:**
- `SvgIcon` component: `<SvgIcon id="home" size={24} color="rgba(255,255,255,0.85)" />`
- Icon IDs are keys from `ICONS` in `src/components/widgets/iconLibrary.js` (e.g., `'home'`, `'star'`, `'settings'`).
- `IconPicker` is a full-screen fixed modal (`zIndex: 2100`). Props: `currentId`, `onChange(id)`, `onClose()`. It calls `onChange` and needs `onClose` called immediately after — `IconPicker` does NOT close itself.

**Context — ConfigModal overlay:**
- Sits at `zIndex: 2000` (below `IconPicker`'s 2100).
- Click on the backdrop (`e.target === e.currentTarget`) closes it.
- Has local state: `localTargetId`, `localIconId` — initialized from `config` on mount.
- "Guardar" calls `onSave({ ...config, targetId: localTargetId, targetName: db.name, iconId: localIconId })`.

**Context — CSS variables used:**
- `var(--text-primary)` → white text
- `var(--text-dim)` → dimmed text
- `var(--text-secondary)` → secondary text
- `var(--accent)` → accent color
- `var(--accent-dim)` → dim accent background

- [ ] **Step 1: Replace the file with the full rewrite**

```jsx
import { useState, useRef } from 'react';
import { useMeta } from '../../store/metaStore.jsx';
import SvgIcon from './SvgIcon';
import IconPicker from './IconPicker';

function ConfigModal({ config, onSave, onClose }) {
  const { state: metaState } = useMeta();
  const { dashboards } = metaState;
  const [localTargetId, setLocalTargetId] = useState(config.targetId ?? '');
  const [localIconId, setLocalIconId] = useState(config.iconId ?? 'home');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const stop = e => e.stopPropagation();

  function handleSave() {
    const db = dashboards.find(d => d.id === localTargetId);
    onSave({ ...config, targetId: localTargetId, targetName: db?.name ?? '', iconId: localIconId });
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) { stop(e); onClose(); } }}
    >
      <div
        style={{ background: 'linear-gradient(135deg,#0f172a,#0a1f3d)', border: '2px solid #1e3a5f', borderRadius: 16, padding: 20, width: 280, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 0 40px rgba(0,0,0,0.7)' }}
        onMouseDown={stop}
        onClick={stop}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>⚙ Configurar navegador</span>
          <button className="w-btn" style={{ padding: '2px 8px', fontSize: 11 }} onMouseDown={stop} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Dashboard destino</label>
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Ícono</label>
          <button
            className="w-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12 }}
            onMouseDown={stop}
            onClick={() => setShowIconPicker(true)}
          >
            <SvgIcon id={localIconId} size={18} color="rgba(255,255,255,0.85)" />
            <span>Cambiar ícono</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={onClose}>Cancelar</button>
          <button
            className="w-btn w-btn-sm"
            disabled={!localTargetId}
            onMouseDown={stop}
            onClick={handleSave}
            style={localTargetId
              ? { background: '#1d4ed8', borderColor: '#3b82f6', color: '#93c5fd', cursor: 'pointer' }
              : { cursor: 'not-allowed' }
            }
          >Guardar</button>
        </div>
      </div>

      {showIconPicker && (
        <IconPicker
          currentId={localIconId}
          onChange={id => { setLocalIconId(id); setShowIconPicker(false); }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  );
}

export default function NavegadorDashboard({ size, config, onConfigChange }) {
  const { state: metaState, dispatch: metaDispatch } = useMeta();
  const { dashboards } = metaState;
  const { targetId = '', targetName = '', iconId = 'home' } = config;

  const [showModal, setShowModal] = useState(false);
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef(null);

  const targetExists = !!targetId && dashboards.some(d => d.id === targetId);
  const isConfigured = !!targetId;

  function startPress(e) {
    if (e.button !== 0) return;
    setPressing(true);
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      setPressing(false);
      setShowModal(true);
    }, 500);
  }

  function endPress() {
    const timerPending = pressTimer.current !== null;
    clearTimeout(pressTimer.current);
    pressTimer.current = null;
    setPressing(false);
    if (timerPending && targetExists) {
      metaDispatch({ type: 'SET_ACTIVE', id: targetId });
    }
  }

  function cancelPress() {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      setPressing(false);
    }
  }

  const pressHandlers = {
    onMouseDown: startPress,
    onMouseUp: endPress,
    onMouseLeave: cancelPress,
    onMouseMove: cancelPress,
  };

  const iconColor = isConfigured && targetExists ? 'rgba(255,255,255,0.85)' : 'var(--text-dim)';
  const nameText = isConfigured ? targetName : 'Sin configurar';
  const nameOpacity = isConfigured && targetExists ? 1 : 0.45;
  const iconSize = size === '2x2' ? 48 : size === '1x2' ? 40 : 28;
  const icon = <SvgIcon id={iconId} size={iconSize} color={iconColor} />;
  const containerStyle = { cursor: 'pointer', opacity: pressing ? 0.6 : 1, transition: 'opacity 0.1s', userSelect: 'none' };

  const modal = showModal && (
    <ConfigModal
      config={config}
      onSave={c => { onConfigChange(c); setShowModal(false); }}
      onClose={() => setShowModal(false)}
    />
  );

  function subLine() {
    if (!isConfigured) return 'Long press para configurar';
    if (!targetExists) return 'Destino eliminado';
    return 'Toca para ir →';
  }

  if (size === '1x1') return (
    <>
      <div className="w-body w-center" style={containerStyle} {...pressHandlers}>
        {icon}
        <div style={{ fontSize: 9, color: 'var(--text-primary)', opacity: nameOpacity, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {nameText}
        </div>
      </div>
      {modal}
    </>
  );

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

  if (size === '2x1') return (
    <>
      <div className="w-row-body" style={containerStyle} {...pressHandlers}>
        {icon}
        <div className="w-info">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', opacity: nameOpacity }}>{nameText}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
            {isConfigured && targetExists ? '🧭 Navegar' : isConfigured ? 'Destino eliminado' : 'Sin configurar'}
          </div>
        </div>
        <span style={{ fontSize: 18, color: 'var(--text-dim)', opacity: isConfigured && targetExists ? 1 : 0.3 }}>→</span>
      </div>
      {modal}
    </>
  );

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
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/NavegadorDashboard.jsx
git commit -m "feat: rewrite NavegadorDashboard with long-press modal and SVG icons"
```

---

## Task 2: Update catalog defaultConfig

**Files:**
- Modify: `src/catalog/widgetCatalog.jsx`

**Context:** The catalog entry for `nav-dashboard` currently has `defaultConfig: { targetId: '', targetName: '', icon: '🏠' }`. Change `icon: '🏠'` to `iconId: 'home'`. Existing widgets already placed on the canvas will have `icon` in their stored config, but `NavegadorDashboard` defaults `iconId` to `'home'` when not present, so they degrade gracefully.

- [ ] **Step 1: Update the defaultConfig in `src/catalog/widgetCatalog.jsx`**

Find this line (near the bottom of `WIDGET_CATALOG`):
```js
    defaultConfig: { targetId: '', targetName: '', icon: '🏠' },
```

Replace with:
```js
    defaultConfig: { targetId: '', targetName: '', iconId: 'home' },
```

- [ ] **Step 2: Commit**

```bash
git add src/catalog/widgetCatalog.jsx
git commit -m "feat: update nav-dashboard defaultConfig to use iconId"
```

---

## Task 3: Verify in dev server

**Goal:** Confirm all behaviors work end-to-end.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify these behaviors in the browser**

1. **Unconfigured state:** Drop widget → shows `home` SVG icon (dim) + "Sin configurar" text. White text visible. No inline form.
2. **Long press on unconfigured widget (hold 500ms):** Modal opens with "⚙ Configurar navegador", dark dropdown, icon button.
3. **Dropdown visibility:** Options are clearly readable (dark background `#1e293b`, white text `#e2e8f0`).
4. **Change icon:** Click "Cambiar ícono" → `IconPicker` modal opens → select an icon → icon updates in the modal button.
5. **Save config:** Select a dashboard + icon, click "Guardar" → modal closes, widget now shows the SVG icon + dashboard name.
6. **Short click on configured widget:** Navigates to target dashboard (active tab changes).
7. **Long press on configured widget:** Modal opens with current values pre-selected.
8. **Cancel modal:** Closes without saving changes.
9. **Delete target dashboard:** Widget shows dim icon + "Destino eliminado".
10. **All 4 sizes (1x1, 1x2, 2x1, 2x2):** Resize via PropertiesPanel, each renders correctly.

- [ ] **Step 3: Commit any fixes**

```bash
git add src/components/widgets/NavegadorDashboard.jsx
git commit -m "fix: nav-dashboard widget adjustments after verification"
```

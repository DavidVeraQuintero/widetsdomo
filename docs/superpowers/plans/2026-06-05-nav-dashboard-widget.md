# NavegadorDashboard Widget — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "NavegadorDashboard" widget that lets the user navigate to a specific dashboard with one click, configured inline within the widget itself.

**Architecture:** A single new component `NavegadorDashboard.jsx` uses `useMeta()` to read the dashboard list and dispatch `SET_ACTIVE`. Configuration (target dashboard + icon) is done inline inside the widget — it auto-opens in config mode when first placed (empty `targetId`) and has an edit button to reconfigure later. The widget is registered as a new "Navegación" category in `widgetCatalog.jsx`.

**Tech Stack:** React 18, Vite, `useMeta` context from `src/store/metaStore.jsx`, shared widget CSS classes from `src/styles/widget.css`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/widgets/NavegadorDashboard.jsx` | **Create** | Widget component — renders config form or navigation UI depending on state |
| `src/catalog/widgetCatalog.jsx` | **Modify** | Import and register the new widget under "Navegación" category |

---

## Task 1: Create NavegadorDashboard component

**Files:**
- Create: `src/components/widgets/NavegadorDashboard.jsx`

**Context:**
- Widgets receive props: `size` (`'1x1'|'1x2'|'2x1'|'2x2'`), `config` (object from store), `onConfigChange(newConfig)` (callback), `accentColor` (string, not needed here).
- `config` shape: `{ targetId: string, targetName: string, icon: string }`
- Shared CSS classes (`w-body`, `w-center`, `w-label`, `w-row-body`, `w-info`) are in `src/styles/widget.css`, imported globally via `main.jsx` — use them freely.
- `useMeta()` from `src/store/metaStore.jsx` returns `{ state: { dashboards: [{id, name}], activeDashboardId }, dispatch }`.
- Dispatch `{ type: 'SET_ACTIVE', id: targetId }` to navigate to a dashboard.
- `CanvasWidget` already exempts `input`, `button`, `select`, `textarea` clicks from drag — forms work safely inside widgets.

- [ ] **Step 1: Create the file with the full component**

```jsx
import { useState } from 'react';
import { useMeta } from '../../store/metaStore.jsx';

export default function NavegadorDashboard({ size, config, onConfigChange }) {
  const { state: metaState, dispatch: metaDispatch } = useMeta();
  const { dashboards } = metaState;
  const { targetId = '', targetName = 'Dashboard', icon = '🏠' } = config;

  const [editing, setEditing] = useState(!targetId);

  const targetExists = !!targetId && dashboards.some(d => d.id === targetId);

  function handleTargetChange(e) {
    const id = e.target.value;
    const db = dashboards.find(d => d.id === id);
    onConfigChange({ ...config, targetId: id, targetName: db?.name ?? '' });
  }

  function handleIconChange(e) {
    onConfigChange({ ...config, icon: e.target.value });
  }

  function navigate(e) {
    e.stopPropagation();
    if (!targetExists) return;
    metaDispatch({ type: 'SET_ACTIVE', id: targetId });
  }

  const stop = e => e.stopPropagation();

  const configForm = (
    <div
      className="w-body"
      style={{ justifyContent: 'center', gap: 5 }}
      onClick={stop}
      onMouseDown={stop}
    >
      <div className="w-label" style={{ color: 'var(--accent)' }}>🧭 Configurar destino</div>
      <select
        value={targetId}
        onChange={handleTargetChange}
        onMouseDown={stop}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          padding: '3px 5px',
          fontSize: 11,
          width: '100%',
        }}
      >
        <option value="">— elegir —</option>
        {dashboards.map(d => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <input
        type="text"
        value={icon}
        onChange={handleIconChange}
        onMouseDown={stop}
        placeholder="🏠"
        maxLength={2}
        title="Ícono (emoji)"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          padding: '2px',
          fontSize: 18,
          textAlign: 'center',
          width: '100%',
        }}
      />
      <button
        onClick={e => { stop(e); setEditing(false); }}
        onMouseDown={stop}
        disabled={!targetId}
        style={{
          background: targetId ? 'var(--accent-dim)' : 'rgba(255,255,255,0.05)',
          border: 'none',
          color: targetId ? 'var(--accent)' : 'var(--text-dim)',
          borderRadius: 6,
          padding: '3px 8px',
          cursor: targetId ? 'pointer' : 'not-allowed',
          fontSize: 11,
        }}
      >
        ✓ Listo
      </button>
    </div>
  );

  const editBtn = (
    <button
      onClick={e => { stop(e); setEditing(true); }}
      onMouseDown={stop}
      title="Cambiar destino"
      style={{
        position: 'absolute',
        top: 4,
        right: 4,
        background: 'none',
        border: 'none',
        color: 'var(--text-dim)',
        cursor: 'pointer',
        fontSize: 10,
        padding: 2,
        lineHeight: 1,
      }}
    >✏</button>
  );

  if (editing) return configForm;

  if (!targetExists) return (
    <div
      className="w-body w-center"
      style={{ cursor: 'pointer' }}
      onClick={e => { stop(e); setEditing(true); }}
    >
      <span style={{ fontSize: 24 }}>⚠</span>
      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Sin destino</div>
    </div>
  );

  if (size === '1x1') return (
    <div
      className="w-body w-center"
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={navigate}
    >
      {editBtn}
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div
        style={{
          fontSize: 9,
          color: 'var(--text-secondary)',
          maxWidth: 70,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {targetName}
      </div>
    </div>
  );

  if (size === '1x2') return (
    <div
      className="w-body w-center"
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={navigate}
    >
      {editBtn}
      <div className="w-label" style={{ color: 'var(--accent)' }}>🧭 Navegar</div>
      <span style={{ fontSize: 40 }}>{icon}</span>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{targetName}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Toca para ir →</div>
    </div>
  );

  if (size === '2x1') return (
    <div
      className="w-row-body"
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={navigate}
    >
      {editBtn}
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div className="w-info">
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{targetName}</div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>🧭 Dashboard</div>
      </div>
      <span style={{ fontSize: 18, color: 'var(--text-dim)' }}>→</span>
    </div>
  );

  // 2x2
  return (
    <div
      className="w-body w-center"
      style={{ position: 'relative', cursor: 'pointer' }}
      onClick={navigate}
    >
      {editBtn}
      <div className="w-label" style={{ color: 'var(--accent)' }}>🧭 Navegar</div>
      <span style={{ fontSize: 48 }}>{icon}</span>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{targetName}</div>
      <button
        onClick={e => { stop(e); metaDispatch({ type: 'SET_ACTIVE', id: targetId }); }}
        onMouseDown={stop}
        style={{
          background: 'var(--accent-dim)',
          border: 'none',
          color: 'var(--accent)',
          borderRadius: 8,
          padding: '5px 16px',
          cursor: 'pointer',
          fontSize: 12,
          marginTop: 4,
        }}
      >
        Ir →
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/NavegadorDashboard.jsx
git commit -m "feat: add NavegadorDashboard widget component"
```

---

## Task 2: Register widget in catalog

**Files:**
- Modify: `src/catalog/widgetCatalog.jsx` — add import and catalog entry

**Context:**
- `WIDGET_CATALOG` is an array of entries. Each entry shape: `{ id, category, categoryIcon, icon, name, sizes, defaultConfig, component }`.
- New category "Navegación" with icon `'🧭'`.
- Default config must have `targetId: ''` (empty string triggers inline config mode on first placement).
- Supported sizes: `['1x1', '1x2', '2x1', '2x2']`.

- [ ] **Step 1: Add import at the top of `src/catalog/widgetCatalog.jsx`**

Add this line after the last existing import (after `import GrupoWidget`):

```js
import NavegadorDashboard from '../components/widgets/NavegadorDashboard';
```

- [ ] **Step 2: Add catalog entry**

At the end of `WIDGET_CATALOG`, before the closing `];`, add:

```js
  // ── NAVEGACIÓN ──
  { id: 'nav-dashboard', category: 'Navegación', categoryIcon: '🧭', icon: '🏠', name: 'Ir a Dashboard',
    sizes: ['1x1', '1x2', '2x1', '2x2'],
    defaultConfig: { targetId: '', targetName: '', icon: '🏠' },
    component: NavegadorDashboard },
```

- [ ] **Step 3: Commit**

```bash
git add src/catalog/widgetCatalog.jsx
git commit -m "feat: register nav-dashboard widget in catalog"
```

---

## Task 3: Verify in dev server

**Goal:** Confirm the widget works end-to-end in the browser.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify these behaviors**

1. Open the app. In the Sidebar → "Navegación" category appears with "🏠 Ir a Dashboard".
2. Drag it to the canvas. The widget immediately shows the **config form** (select + icon input + "✓ Listo").
3. Select a destination dashboard from the dropdown. Click "✓ Listo". The widget switches to navigation view.
4. Click the navigation widget → the active dashboard changes.
5. Click the ✏ button → config form reappears.
6. Delete the target dashboard from DashboardTabs → widget shows ⚠ "Sin destino".
7. All four sizes (`1x1`, `1x2`, `2x1`, `2x2`) render correctly via the PropertiesPanel size buttons.

- [ ] **Step 3: Commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: nav-dashboard widget adjustments after verification"
```

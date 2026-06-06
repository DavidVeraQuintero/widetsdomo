# Notas Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Notas" widget that displays up to 10 sticky notes as warm paper cards cascading downward (waterfall style), with smooth CSS transitions when switching the active note.

**Architecture:** All state lives in `config.notes` (array of note objects) and `config.activeId` (which note is at front), persisted via `onConfigChange` → localStorage. Three paper layers render in a `position: relative` container; each paper is `position: absolute` with `top` + `height` computed from a `ResizeObserver` measurement of the container. CSS transitions on `top`, `height`, and `left` animate reordering when `activeId` changes. Keys are `note.id` so the same DOM element gets updated styles (enabling CSS transitions).

**Tech Stack:** React 18, inline styles, `useLongPress` + `ModalBase` from `./widgetUtils`.

---

## Files

| File | Action |
|---|---|
| `src/catalog/widgetSizes.js` | Add `2x6` and `2x8` sizes |
| `src/components/widgets/Notas.jsx` | New component (cascade + modal) |
| `src/catalog/widgetCatalog.jsx` | Import and register `notas` entry |

---

## Task 1: Add new widget sizes

**Files:**
- Modify: `src/catalog/widgetSizes.js`

- [ ] **Step 1: Open widgetSizes.js and add the two new sizes**

Current file ends at `4x4`. Add after it:

```js
// src/catalog/widgetSizes.js
export const WIDGET_SIZES = {
  '1x1': { width: 90,  height: 90  },
  '1x2': { width: 90,  height: 185 },
  '2x1': { width: 185, height: 90  },
  '2x2': { width: 185, height: 185 },
  '2x4': { width: 185, height: 390 },
  '4x2': { width: 390, height: 185 },
  '4x4': { width: 390, height: 390 },
  '2x6': { width: 185, height: 595 },
  '2x8': { width: 185, height: 800 },
};

export const SNAP_SIZE  = 5;
export const CELL_SIZE  = 95;
```

- [ ] **Step 2: Verify the app still compiles**

Run the dev server (`npm run dev` or equivalent) and confirm no import errors. No visual change expected — the new sizes just extend the size map.

- [ ] **Step 3: Commit**

```bash
git add src/catalog/widgetSizes.js
git commit -m "feat: add 2x6 and 2x8 widget sizes"
```

---

## Task 2: Create Notas.jsx — cascade layout

**Files:**
- Create: `src/components/widgets/Notas.jsx`

This task creates the full component *without* the modal (modal added in Task 3). The component renders the cascade stack and handles note switching.

### Layout logic

The container (`position: relative, flex: 1`) is measured with a `ResizeObserver` to get `stackH`. Then:

```
PEEK_H = 32px   (height of a peeking background paper — shows title only)
PEEK_GAP = 6px  (gap between papers)

numPeeks = min(visibleNotes.length - 1, 2)   // 0, 1, or 2

peekTotal = numPeeks * PEEK_H + (numPeeks + 1) * PEEK_GAP

Active paper (idx 0):  top = 0,                       height = max(60, stackH - peekTotal)
Peek paper  (idx 1):   top = stackH - peekTotal + PEEK_GAP,  height = PEEK_H
Peek paper  (idx 2):   top = stackH - peekTotal + PEEK_GAP * 2 + PEEK_H, height = PEEK_H

leftOffset per idx:  [0, 8, 14]
```

All papers have `transition: top 220ms ease, height 220ms ease, left 200ms ease, opacity 200ms ease`.

Because keys are `note.id`, when `activeId` changes and `orderedNotes` is rebuilt, the same DOM element gets new `top`/`height` values and CSS transitions animate the swap.

- [ ] **Step 1: Create the file with helpers and the 1x2 layout**

```jsx
// src/components/widgets/Notas.jsx
import { useState, useRef, useEffect } from 'react';
import { useLongPress, ModalBase } from './widgetUtils';

const PEEK_H = 32;
const PEEK_GAP = 6;

function getPaperTop(idx, numPeeks, stackH) {
  const peekTotal = numPeeks * PEEK_H + (numPeeks + 1) * PEEK_GAP;
  const activeH = Math.max(60, stackH - peekTotal);
  if (idx === 0) return 0;
  if (idx === 1) return activeH + PEEK_GAP;
  return activeH + PEEK_GAP * 2 + PEEK_H;
}

function getPaperHeight(idx, numPeeks, stackH) {
  if (idx === 0) {
    const peekTotal = numPeeks * PEEK_H + (numPeeks + 1) * PEEK_GAP;
    return Math.max(60, stackH - peekTotal);
  }
  return PEEK_H;
}

export default function Notas({ size, config, onConfigChange, accentColor }) {
  const { name = 'Mis notas', notes = [], activeId = null } = config;
  const [modal, setModal]   = useState(null); // null | 'create' | 'edit'
  const containerRef        = useRef(null);
  const [stackH, setStackH] = useState(100);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setStackH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stop = e => e.stopPropagation();

  const effectiveActiveId = activeId ?? notes[0]?.id ?? null;
  const activeNote = notes.find(n => n.id === effectiveActiveId) ?? null;
  const orderedNotes = activeNote
    ? [activeNote, ...notes.filter(n => n.id !== activeNote.id)]
    : notes;

  const longPress = useLongPress(() => { if (activeNote) setModal('edit'); });

  function setActive(id) {
    onConfigChange({ ...config, activeId: id });
  }

  function handleCreate({ title, body }) {
    const newNote = { id: Date.now().toString(), title, body, createdAt: Date.now() };
    onConfigChange({ ...config, notes: [newNote, ...notes], activeId: newNote.id });
    setModal(null);
  }

  function handleEdit({ title, body }) {
    onConfigChange({
      ...config,
      notes: notes.map(n => n.id === activeNote.id ? { ...n, title, body } : n),
    });
    setModal(null);
  }

  function handleDelete() {
    const next = notes.filter(n => n.id !== activeNote.id);
    onConfigChange({ ...config, notes: next, activeId: next[0]?.id ?? null });
    setModal(null);
  }

  const canAdd = notes.length < 10;

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexShrink: 0 }}>
      <div style={{ fontSize: 9, color: accentColor, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
        📝 {name}
        {notes.length > 0 && (
          <span style={{ marginLeft: 5, background: `${accentColor}28`, color: accentColor, borderRadius: 8, padding: '1px 5px', fontSize: 8, fontWeight: 700 }}>
            {notes.length}/10
          </span>
        )}
      </div>
      {canAdd && (
        <button
          className="w-btn w-btn-sm"
          onClick={e => { stop(e); setModal('create'); }}
          onMouseDown={stop}
        >
          {size === '1x2' ? '+' : '+ Nueva'}
        </button>
      )}
    </div>
  );

  // ── 1x2: single paper, no cascade (too narrow) ──
  if (size === '1x2') {
    return (
      <div className="w-body" style={{ gap: 0 }}>
        {header}
        {activeNote ? (
          <div
            style={{
              flex: 1,
              background: 'linear-gradient(160deg, #fdf6ee, #f5ead9)',
              borderRadius: 8,
              padding: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            {...longPress}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>
              {activeNote.title}
            </div>
            <div style={{ fontSize: 9, color: '#475569', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
              {activeNote.body}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text-dim)' }}>
            Toca + para crear
          </div>
        )}
      </div>
    );
  }

  // ── Cascade layout (all other sizes) ──
  const visibleNotes = orderedNotes.slice(0, 3);
  const numPeeks = Math.min(visibleNotes.length - 1, 2);
  const leftOffsets = [0, 8, 14];
  const opacities   = [1, 0.85, 0.6];

  return (
    <div className="w-body" style={{ gap: 0 }}>
      {header}
      {notes.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-dim)' }}>
          Sin notas · toca + para crear
        </div>
      ) : (
        <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
          {visibleNotes.map((note, idx) => {
            const isActive = idx === 0;
            const left     = leftOffsets[idx] ?? 14;
            const top      = getPaperTop(idx, numPeeks, stackH);
            const height   = getPaperHeight(idx, numPeeks, stackH);
            const opacity  = opacities[idx] ?? 0.6;

            return (
              <div
                key={note.id}
                onClick={e => { stop(e); if (!isActive) setActive(note.id); }}
                onMouseDown={stop}
                {...(isActive ? longPress : {})}
                style={{
                  position: 'absolute',
                  top,
                  left,
                  right: 0,
                  height,
                  zIndex: 3 - idx,
                  opacity,
                  background: 'linear-gradient(160deg, #fdf6ee, #f5ead9)',
                  borderRadius: 8,
                  padding: isActive ? '9px 10px' : '6px 10px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                  transition: 'top 220ms ease, height 220ms ease, left 200ms ease, opacity 200ms ease',
                  cursor: isActive ? 'default' : 'pointer',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{
                  fontSize: isActive ? 11 : 10,
                  fontWeight: 700,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: isActive ? 5 : 0,
                }}>
                  {note.title}
                </div>
                {isActive && note.body && (
                  <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line', overflow: 'hidden' }}>
                    {note.body}
                  </div>
                )}
                {isActive && (
                  <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 4 }}>
                    {new Date(note.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add a temporary catalog entry to test the layout (no modal yet)**

In `src/catalog/widgetCatalog.jsx`, add at the top:

```js
import Notas from '../components/widgets/Notas';
```

And add this entry (anywhere in the array, e.g. under Organización):

```js
{ id: 'notas', category: 'Organización', categoryIcon: '📦', icon: '📝', name: 'Notas',
  sizes: ['1x2', '2x2', '2x4', '4x4', '2x6', '2x8'],
  defaultConfig: { name: 'Mis notas', notes: [], activeId: null },
  component: Notas },
```

- [ ] **Step 3: Temporarily hardcode notes in `defaultConfig` to verify cascade without modal**

In `widgetCatalog.jsx`, replace the `defaultConfig` for the `notas` entry with:

```js
defaultConfig: {
  name: 'Mis notas',
  activeId: '1',
  notes: [
    { id: '1', title: '🛒 Lista compras', body: '— Leche\n— Pan\n— Café', createdAt: Date.now() },
    { id: '2', title: '📋 Tareas del día', body: '— Reunión 10h', createdAt: Date.now() - 3600000 },
    { id: '3', title: '🔑 WiFi casa', body: '— MiRed2024', createdAt: Date.now() - 86400000 },
  ],
},
```

Open the app and add a Notas widget (2x2) from the catalog.

- [ ] **Step 4: Verify cascade appearance**

Check:
- Front paper shows title + body + date in a warm cream card
- Two peek papers visible below with titles only, slightly offset right
- Papers look like a physical stack

- [ ] **Step 5: Verify tap-to-activate transitions**

Click the second peek paper. Verify:
- It smoothly slides to the top (active position)
- The previously active paper smoothly slides to the peek position
- Transition duration ~220ms, no jarring jump

- [ ] **Step 6: Revert defaultConfig to empty notes**

```js
defaultConfig: { name: 'Mis notas', notes: [], activeId: null },
```

- [ ] **Step 7: Commit**

```bash
git add src/components/widgets/Notas.jsx src/catalog/widgetCatalog.jsx
git commit -m "feat: add Notas widget cascade layout"
```

---

## Task 3: Add NotasModal — create, edit, delete

**Files:**
- Modify: `src/components/widgets/Notas.jsx`

Add the `NotasModal` inner component before the `Notas` default export, and wire up modal rendering inside `Notas`.

- [ ] **Step 1: Add NotasModal inner component** (insert before the `export default function Notas` line)

```jsx
function NotasModal({ note, onSave, onDelete, onClose, accentColor }) {
  const isNew = !note;
  const [title, setTitle] = useState(note?.title ?? '');
  const [body,  setBody]  = useState(note?.body  ?? '');
  const stop = e => e.stopPropagation();

  return (
    <ModalBase
      title={isNew ? '📝 Nueva nota' : '📝 Editar nota'}
      onClose={onClose}
      borderColor={accentColor}
    >
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onMouseDown={stop}
        placeholder="🛒 Título de la nota"
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          padding: '8px 10px',
          fontSize: 13,
          marginBottom: 10,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        onMouseDown={stop}
        placeholder={'— elemento\n— elemento'}
        rows={6}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          padding: '8px 10px',
          fontSize: 12,
          resize: 'vertical',
          outline: 'none',
          lineHeight: 1.5,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          className="w-btn"
          style={{ flex: 1 }}
          disabled={!title.trim()}
          onClick={e => { stop(e); if (title.trim()) onSave({ title: title.trim(), body: body.trim() }); }}
          onMouseDown={stop}
        >
          {isNew ? '✓ Crear' : '✓ Guardar'}
        </button>
        {!isNew && (
          <button
            className="w-btn"
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
            onClick={e => { stop(e); onDelete(); }}
            onMouseDown={stop}
          >
            Eliminar
          </button>
        )}
      </div>
    </ModalBase>
  );
}
```

- [ ] **Step 2: Wire `modalEl` into both `1x2` and cascade render paths**

In `Notas`, add `modalEl` computation after `const canAdd = ...`:

```jsx
const modalEl = modal === 'create' ? (
  <NotasModal
    note={null}
    onSave={handleCreate}
    onClose={() => setModal(null)}
    accentColor={accentColor}
  />
) : modal === 'edit' && activeNote ? (
  <NotasModal
    note={activeNote}
    onSave={handleEdit}
    onDelete={handleDelete}
    onClose={() => setModal(null)}
    accentColor={accentColor}
  />
) : null;
```

Add `{modalEl}` as the last child in both return branches (1x2 and cascade). For the cascade return:

```jsx
  return (
    <div className="w-body" style={{ gap: 0 }}>
      {header}
      {notes.length === 0 ? (
        <div ...>Sin notas · toca + para crear</div>
      ) : (
        <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
          {visibleNotes.map(...)}
        </div>
      )}
      {modalEl}   {/* ← add this */}
    </div>
  );
```

- [ ] **Step 3: Verify create flow**

In the app:
1. Add a Notas widget (2x2)
2. Tap `+ Nueva` — modal opens with empty fields
3. Type title `🛒 Lista compras` and body `— Leche\n— Pan`
4. Tap `✓ Crear`
5. Widget shows the new note as a warm paper card

- [ ] **Step 4: Verify edit flow**

1. Long-press the active note card
2. Modal opens pre-filled with title and body
3. Edit the title → Save → widget updates

- [ ] **Step 5: Verify delete flow**

1. Long-press the active note
2. Modal opens → tap `Eliminar`
3. Note disappears; next note (if any) becomes active

- [ ] **Step 6: Verify 10-note limit**

1. Create notes until `notes.length === 10`
2. Verify `+ Nueva` button is no longer rendered
3. Delete one note → `+ Nueva` reappears

- [ ] **Step 7: Commit**

```bash
git add src/components/widgets/Notas.jsx
git commit -m "feat: add Notas modal for create, edit, delete"
```

---

## Task 4: Final catalog entry and verification

**Files:**
- Modify: `src/catalog/widgetCatalog.jsx` (ensure the final entry is correct)

- [ ] **Step 1: Verify the catalog entry in widgetCatalog.jsx is correct**

Ensure the entry reads exactly:

```js
{ id: 'notas', category: 'Organización', categoryIcon: '📦', icon: '📝', name: 'Notas',
  sizes: ['1x2', '2x2', '2x4', '4x4', '2x6', '2x8'],
  defaultConfig: { name: 'Mis notas', notes: [], activeId: null },
  component: Notas },
```

- [ ] **Step 2: Test all sizes**

Add a Notas widget in each size and verify it renders without layout breaks:
- `1x2`: single paper, no cascade
- `2x2`: 3-layer cascade visible
- `2x4`: 3-layer cascade, more body text visible
- `4x4`: wide cascade, full content
- `2x6`: tall cascade, large body area
- `2x8`: tallest size, generous content area

- [ ] **Step 3: Test cascade transition on 2x4**

With 3 notes in a 2x4 widget:
1. Click peek paper 1 → animates to front ✓
2. Click peek paper 2 → animates to front ✓
3. Original active note now peeks correctly ✓

- [ ] **Step 4: Test persistence**

1. Create a note
2. Refresh the page
3. Verify the note is still there (persisted via localStorage)

- [ ] **Step 5: Final commit**

```bash
git add src/catalog/widgetCatalog.jsx
git commit -m "feat: register Notas widget in catalog — cascade sticky notes, max 10"
```

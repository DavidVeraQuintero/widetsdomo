# Mobile Long Press Widget Management - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement long press (touch hold) as the primary interaction for adding new widgets and moving existing widgets, with auto-hiding sidebar and visual feedback on mobile.

**Architecture:** Create a custom `useLongPress` hook that detects 500-600ms holds with movement tolerance. When triggered, dispatch store actions to enter drag mode and hide sidebar. Widgets enter "dragging state" with a preview that follows the finger. Drop validation ensures widgets only place within canvas bounds. Desktop compatibility preserved via pointer events (which handle both mouse and touch).

**Tech Stack:** React 18, custom hooks, pointer events API, Zustand-like store pattern, CSS transitions

---

## File Structure

**New files:**
- `src/hooks/useLongPress.ts` — Long press detection logic

**Modified files:**
- `src/components/Sidebar/WidgetItem.jsx` — Replace drag with long press
- `src/components/Canvas/CanvasWidget.jsx` — Add long press support, drag preview
- `src/components/Canvas/Canvas.jsx` — Drop zone validation, preview rendering
- `src/store/dashboardStore.jsx` — Add drag state and actions
- `src/App.jsx` — Conditional sidebar hiding
- `src/components/Canvas/Canvas.module.css` — Styles for preview and feedback
- `src/components/Sidebar/Sidebar.module.css` — Touch-friendly sizing

---

## Tasks

### Task 1: Create useLongPress Hook

**Files:**
- Create: `src/hooks/useLongPress.ts`

- [ ] **Step 1: Write the hook with long press detection logic**

```typescript
import { useRef, useCallback } from 'react';

export function useLongPress(
  onLongPress: () => void,
  duration: number = 500,
  moveThreshold: number = 10
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      startPosRef.current = { x: e.clientX, y: e.clientY };
      timeoutRef.current = setTimeout(() => {
        onLongPress();
      }, duration);
    },
    [onLongPress, duration]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPosRef.current || !timeoutRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > moveThreshold || dy > moveThreshold) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [moveThreshold]);

  const handlePointerUp = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const handlePointerCancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };
}
```

- [ ] **Step 2: Verify hook logic is correct**

The hook should:
- Start a timer on `pointerdown`
- Cancel timer if pointer moves > 10px
- Fire callback after 500ms if pointer held and moved < 10px
- Clean up on `pointerup` or `pointercancel`

---

### Task 2: Extend Store with Drag State

**Files:**
- Modify: `src/store/dashboardStore.jsx`

- [ ] **Step 1: Add drag-related state to store**

Find the main state object in dashboardStore and add:

```javascript
export const initialState = {
  // ... existing state ...
  draggingWidgetId: null,
  draggingSource: null, // 'list' or 'canvas'
  dragStartPos: null,   // { x, y } - initial pointer position
  dragCurrentPos: null, // { x, y } - current pointer position
  sidebarHidden: false,
};
```

- [ ] **Step 2: Add dispatch actions for drag**

Add these action handlers to the dispatch switch statement:

```javascript
case 'START_DRAG': {
  return {
    ...state,
    draggingWidgetId: action.widgetId,
    draggingSource: action.source, // 'list' or 'canvas'
    dragStartPos: action.startPos,
    dragCurrentPos: action.startPos,
    sidebarHidden: true,
  };
}

case 'UPDATE_DRAG_POS': {
  return {
    ...state,
    dragCurrentPos: action.pos,
  };
}

case 'END_DRAG': {
  return {
    ...state,
    draggingWidgetId: null,
    draggingSource: null,
    dragStartPos: null,
    dragCurrentPos: null,
    sidebarHidden: false,
  };
}
```

- [ ] **Step 3: Verify store changes compile**

Check that there are no TypeScript/ESLint errors.

---

### Task 3: Update WidgetItem Component for Long Press

**Files:**
- Modify: `src/components/Sidebar/WidgetItem.jsx`

- [ ] **Step 1: Remove old drag handlers and import new hook**

Replace the existing drag/touch handlers with:

```javascript
import { useCallback, useRef } from 'react';
import { useLongPress } from '../../hooks/useLongPress';
import { useDashboard } from '../../store/dashboardStore.jsx';
import styles from './Sidebar.module.css';

export default function WidgetItem({ def }) {
  const { dispatch } = useDashboard();
  const innerRef = useRef(null);

  const handleLongPress = useCallback(() => {
    const rect = innerRef.current?.getBoundingClientRect();
    dispatch({
      type: 'START_DRAG',
      widgetId: def.id,
      source: 'list',
      startPos: { x: rect?.x || 0, y: rect?.y || 0 },
    });
  }, [def, dispatch]);

  const longPressHandlers = useLongPress(handleLongPress, 500, 10);

  return (
    <div
      ref={innerRef}
      className={styles.item}
      {...longPressHandlers}
      title={`Long press para agregar · Tamaños: ${def.sizes.join(', ')}`}
    >
      <span className={styles.itemIcon}>{def.icon}</span>
      <span className={styles.itemName}>{def.name}</span>
      <span className={styles.itemBadge}>{def.sizes.length}</span>
    </div>
  );
}
```

- [ ] **Step 2: Remove draggable attribute and old handlers**

Delete all `draggable`, `onDragStart`, `onTouchStart`, `onTouchMove`, `onTouchEnd` from the component.

- [ ] **Step 3: Verify component renders without errors**

Test in browser that WidgetItem displays correctly.

---

### Task 4: Extend Store - Add Canvas Drop Handling

**Files:**
- Modify: `src/store/dashboardStore.jsx`

- [ ] **Step 1: Add ADD_WIDGET_AT_POS action**

Add to the switch statement:

```javascript
case 'ADD_WIDGET_AT_POS': {
  const def = getCatalogEntry(action.payload.type);
  if (!def) return state;
  return {
    ...state,
    widgets: [
      ...state.widgets,
      {
        id: action.payload.id,
        type: action.payload.type,
        x: action.payload.x,
        y: action.payload.y,
        size: action.payload.size,
        config: action.payload.config,
      },
    ],
  };
}
```

Make sure `getCatalogEntry` is imported from the catalog.

---

### Task 5: Update Canvas for Drop and Drag Tracking

**Files:**
- Modify: `src/components/Canvas/Canvas.jsx`

- [ ] **Step 1: Add pointer event handlers for drag tracking**

Add these methods to Canvas component:

```javascript
const handlePointerMove = (e) => {
  if (state.draggingWidgetId && state.draggingSource === 'list') {
    dispatch({
      type: 'UPDATE_DRAG_POS',
      pos: { x: e.clientX - 50, y: e.clientY - 50 },
    });
  }
};

const handlePointerUp = (e) => {
  if (state.draggingWidgetId && state.draggingSource === 'list') {
    const rect = innerRef.current?.getBoundingClientRect();
    if (!rect) {
      dispatch({ type: 'END_DRAG' });
      return;
    }

    const canvasX = (e.clientX - rect.left) / zoom;
    const canvasY = (e.clientY - rect.top) / zoom;
    
    const def = getCatalogEntry(state.draggingWidgetId);
    if (!def) {
      dispatch({ type: 'END_DRAG' });
      return;
    }

    const wSize = WIDGET_SIZES[def.sizes[1]] || WIDGET_SIZES['2x2'];
    const isValid = canvasX >= 0 && canvasY >= 0 && 
                    canvasX + wSize.width <= canvasW &&
                    canvasY + wSize.height <= canvasH;

    if (isValid) {
      dispatch({
        type: 'ADD_WIDGET_AT_POS',
        payload: {
          id: `${state.draggingWidgetId}-${Date.now()}`,
          type: state.draggingWidgetId,
          x: snap(canvasX),
          y: snap(canvasY),
          size: def.sizes[1],
          config: { ...def.defaultConfig },
        },
      });
    }
  }
  dispatch({ type: 'END_DRAG' });
};
```

- [ ] **Step 2: Add drag preview rendering**

Add to the Canvas render before closing innerRef div:

```javascript
{state.draggingWidgetId && state.draggingSource === 'list' && state.dragCurrentPos && (
  <div
    className={styles.dragPreview}
    style={{
      left: state.dragCurrentPos.x,
      top: state.dragCurrentPos.y,
      position: 'fixed',
      pointerEvents: 'none',
    }}
  >
    <div className={styles.dragPreviewCard}>
      <span style={{ fontSize: '20px' }}>
        {getCatalogEntry(state.draggingWidgetId)?.icon || '📦'}
      </span>
      <div style={{ fontSize: '10px', marginTop: '4px' }}>
        {getCatalogEntry(state.draggingWidgetId)?.name || 'Widget'}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Add pointer event handlers to canvas div**

Find the main canvas div and add:

```javascript
onPointerMove={handlePointerMove}
onPointerUp={handlePointerUp}
```

---

### Task 6: Update CanvasWidget for Long Press

**Files:**
- Modify: `src/components/Canvas/CanvasWidget.jsx`

- [ ] **Step 1: Import useLongPress hook**

Add at top:

```javascript
import { useLongPress } from '../../hooks/useLongPress';
```

- [ ] **Step 2: Replace mouse/touch handlers with long press**

Replace the `handleMouseDown` and `handleTouchStart` functions with:

```javascript
const handleLongPress = useCallback(() => {
  dispatch({ type: 'SELECT_WIDGET', id: widget.id });
  dispatch({
    type: 'START_DRAG',
    widgetId: widget.id,
    source: 'canvas',
    startPos: { x: widget.x, y: widget.y },
  });
}, [widget, dispatch]);

const longPressHandlers = useLongPress(handleLongPress, 500, 10);
```

- [ ] **Step 3: Update JSX to use long press handlers**

Replace `onMouseDown` and `onTouchStart` with:

```javascript
<div
  className={`${styles.widget} ${isSelected ? styles.selected : ''}`}
  data-widget-id={widget.id}
  data-widget-type={widget.type}
  style={{
    left: widget.x,
    top: widget.y,
    ...(isGrupo ? {} : { width: size.width, height: size.height }),
    ...rgbCardStyle,
  }}
  {...longPressHandlers}
>
```

- [ ] **Step 4: Remove old startDrag function and all drag logic**

Delete the `startDrag` function and its event listeners completely.

---

### Task 7: Add Drag Styles to Canvas

**Files:**
- Modify: `src/components/Canvas/Canvas.module.css`

- [ ] **Step 1: Add drag preview styles**

Add to the CSS file:

```css
.dragPreview {
  z-index: 9999;
}

.dragPreviewCard {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
  padding: 12px;
  width: 100px;
  text-align: center;
  font-size: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: white;
}
```

- [ ] **Step 2: Update widget active state**

Find `.widget` rule and ensure it has:

```css
.widget {
  /* existing styles... */
  touch-action: none;
}
```

---

### Task 8: Update Sidebar Styles

**Files:**
- Modify: `src/components/Sidebar/Sidebar.module.css`

- [ ] **Step 1: Ensure touch-friendly target sizes**

Find `.item` rule and update:

```css
.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin: 1px 6px;
  border-radius: 6px;
  cursor: grab;
  font-size: 12px;
  color: var(--text-secondary);
  transition: background 0.15s, color 0.15s;
  user-select: none;
  min-height: 44px;
  touch-action: manipulation;
}
```

---

### Task 9: Update App.jsx to Hide Sidebar During Drag

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Use sidebarHidden state to conditionally render floatingPanel**

Find the conditional that renders floatingPanel:

```javascript
{sidebarOpen && !state.sidebarHidden ? (
  <div className={styles.floatingPanel} style={{ left: pos.x, top: pos.y }}>
    {/* existing sidebar content */}
  </div>
) : null}

{(!sidebarOpen || state.sidebarHidden) && (
  <button
    className={styles.sidebarToggle}
    onClick={() => setSidebarOpen(true)}
    title="Mostrar panel"
  >
    ☰
  </button>
)}
```

---

### Task 10: Integration Test - Full Flow

**Files:**
- No new files, manual testing

- [ ] **Step 1: Test adding a widget via long press**

1. Resize browser to 375x667 (mobile)
2. Tap ☰ to open sidebar
3. Long press (hold 1.5 sec) on "Lámpara Simple"
4. Verify sidebar hides
5. Verify widget preview appears
6. Drag to canvas position
7. Lift finger
8. Verify widget appears at position

- [ ] **Step 2: Test moving existing widget**

1. Long press existing widget (hold 1.5 sec)
2. Drag to new position
3. Lift finger
4. Verify widget moves

- [ ] **Step 3: Test invalid drop**

1. Long press widget from sidebar
2. Drag outside canvas bounds
3. Lift finger
4. Verify widget NOT added

- [ ] **Step 4: Test on desktop**

1. Resize to 1200x800
2. Repeat tests with mouse
3. Verify all work

---

### Task 11: Commit All Changes

**Files:**
- All modified files

- [ ] **Step 1: Stage all changes**

```bash
git add \
  src/hooks/useLongPress.ts \
  src/components/Sidebar/WidgetItem.jsx \
  src/components/Canvas/CanvasWidget.jsx \
  src/components/Canvas/Canvas.jsx \
  src/store/dashboardStore.jsx \
  src/App.jsx \
  src/components/Canvas/Canvas.module.css \
  src/components/Sidebar/Sidebar.module.css \
  docs/superpowers/specs/2026-06-09-mobile-long-press-widgets-design.md \
  docs/superpowers/plans/2026-06-09-mobile-long-press-widgets.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement long press UX for adding/dragging widgets

- Add useLongPress hook for 500ms hold detection with movement tolerance
- Replace desktop drag-and-drop with long press in WidgetItem and CanvasWidget
- Auto-hide sidebar during drag to maximize canvas visibility
- Add visual preview card that follows finger during drag
- Improve drop zone validation with visual feedback
- Update store with drag state management
- Ensure touch-friendly target sizes (44x44px minimum)
- Maintain backward compatibility with desktop mouse interactions"
```

# Mobile Long Press Widget Management

**Date:** 2026-06-09  
**Status:** Design  
**Scope:** Mobile-optimized UX for adding and dragging widgets via long press

---

## Overview

Current implementation uses desktop-style drag-and-drop which doesn't work intuitively on mobile because:
1. The sidebar covers 100% of the screen in mobile view
2. `elementFromPoint()` can't reach the canvas beneath the fullscreen sidebar
3. Synthetic `DragEvent` doesn't fire reliably on touch devices

**Solution:** Implement long press (touch hold) as the primary interaction for both adding new widgets and moving existing ones. When long press is detected, the sidebar auto-hides and the widget enters "draggable mode" — following the user's finger with a mini preview until they lift.

---

## User Flow

### Adding New Widgets
1. User taps sidebar toggle (☰) → sidebar opens
2. User **long presses** (hold 1-2 seconds) a widget in the list
3. Widget highlight/feedback indicates "grabbed"
4. Sidebar **auto-hides**
5. Widget enters **dragging state** — follows finger with mini preview
6. User drags to desired position in canvas
7. **Valid drop:** User lifts finger inside canvas → widget is added ✓
8. **Invalid drop:** User lifts finger outside canvas → operation cancels, no widget added

### Moving Existing Widgets
- Same flow: long press on canvas widget → sidebar doesn't affect (already hidden)
- Long press + drag to new position
- Lift finger to place (or cancel if outside bounds)

---

## Technical Implementation

### 1. Long Press Detection
- **Duration:** 500-600ms hold triggers long press (standard UX)
- **Movement tolerance:** Up to 10px movement still counts as "long press" (not a scroll)
- **Implementation:** Custom hook `useLongPress()` that tracks `pointerdown` → wait → `pointermove` (with tolerance) → emit `longpress` event

### 2. State Management
Add to dashboard store:
```javascript
{
  draggingWidgetId: null,      // ID of widget being dragged
  draggingSource: 'list'|'canvas',  // Where drag started
  sidebarHidden: false,         // Whether to hide sidebar during drag
  dragPreviewPos: { x, y },     // Position of preview under finger
}
```

### 3. Sidebar Auto-Hide
- When long press detected on `WidgetItem` → dispatch `HIDE_SIDEBAR`
- When drag ends → dispatch `SHOW_SIDEBAR`
- No manual close button interaction during drag

### 4. Visual Feedback
- **During long press:** Widget highlights (subtle glow/color change)
- **During drag:** Mini preview card follows finger, showing:
  - Widget icon/name
  - Semi-transparent background
  - Slight blur effect
  - Drop zone validity indicator (green outline if valid, red if outside)

### 5. Drop Zone Validation
- Canvas has clear boundaries (grid visible)
- Position is valid if: `x >= 0 && y >= 0 && x + width <= canvasWidth && y + height <= canvasHeight`
- Visual feedback: preview brightens if valid, dims/reddens if invalid
- Only add/move widget if drop is valid

---

## File Changes

### New Files
- `src/hooks/useLongPress.ts` — Long press detection logic

### Modified Files
1. **src/components/Sidebar/WidgetItem.jsx**
   - Replace desktop drag handlers with long press detector
   - Emit custom event on long press
   - No more synthetic DragEvent

2. **src/components/Canvas/CanvasWidget.jsx**
   - Add long press detection for existing widgets
   - Extend drag logic to handle long press source (canvas vs list)
   - Add visual feedback for drag preview

3. **src/components/Canvas/Canvas.jsx**
   - Simplify drag handlers (remove desktop drag-drop)
   - Add support for long press from canvas widgets
   - Improve drop zone validation and visual feedback

4. **src/store/dashboardStore.jsx**
   - Add actions: `START_DRAG`, `END_DRAG`, `HIDE_SIDEBAR`, `SHOW_SIDEBAR`
   - Add state fields for drag context

5. **src/App.jsx**
   - Use `sidebarHidden` state to conditionally hide sidebar during drag

6. **src/components/Canvas/Canvas.module.css**
   - Add styles for drag preview
   - Add drop zone validity indicators

7. **src/components/Sidebar/Sidebar.module.css**
   - Ensure touch-friendly target sizes (min 44x44px per UX guidelines)

---

## Interactions Summary

| Interaction | Desktop | Mobile | Result |
|---|---|---|---|
| **Add widget** | Drag from sidebar | Long press + drag | Widget added at touch position |
| **Move widget** | Drag on canvas | Long press + drag | Widget moved to new position |
| **Cancel** | Drag outside bounds | Lift outside canvas | No change (operation aborted) |
| **Sidebar** | Always visible | Auto-hide during drag | Reduces screen clutter |

---

## Browser Compatibility
- Touch events: `pointerdown`, `pointermove`, `pointerup` (pointer API, widely supported)
- Fallback to `touchstart`, `touchmove`, `touchend` for older devices
- Desktop mouse still works via pointer events

---

## Success Criteria
- [ ] Long press detected reliably (500-600ms)
- [ ] Sidebar auto-hides during drag
- [ ] Widget preview follows finger smoothly
- [ ] Drop zone validation visual feedback present
- [ ] Invalid drops cancel without adding widget
- [ ] Works consistently on iOS and Android
- [ ] Desktop still works (pointer events handle both)
- [ ] No console errors on mobile

---

## Known Limitations
- Long press duration slightly delays interaction (500-600ms wait)
  - Mitigation: Standard mobile UX, users expect this
- Preview doesn't show full widget state (only mini version)
  - Acceptable: Quick feedback, full widget shown after placement

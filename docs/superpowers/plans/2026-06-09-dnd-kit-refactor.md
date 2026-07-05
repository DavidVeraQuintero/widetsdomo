# Refactor Dashboard with dnd-kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace custom drag-and-drop with dnd-kit library for professional, mobile-friendly widget management.

**Architecture:** Install dnd-kit and configure Touch/Mouse sensors. Refactor Sidebar to use tap-to-add (no dragging from sidebar). Refactor Canvas to use dnd-kit's SortableContext for grid-based widget rearrangement. Remove all custom drag logic.

**Tech Stack:** React 18, dnd-kit v6.3.1, @dnd-kit/sortable v10.0.0, Vite

---

## Execution Status

- [ ] Task 1: Install dnd-kit Dependencies
- [ ] Task 2: Delete useLongPress Hook
- [ ] Task 3: Create DndContext in App.jsx
- [ ] Task 4: Refactor Sidebar to Tap-to-Add
- [ ] Task 5: Refactor Canvas for dnd-kit
- [ ] Task 6: Refactor CanvasWidget for Sortable
- [ ] Task 7: Clean Up Store Reducer
- [ ] Task 8: Remove Drag-Related CSS
- [ ] Task 9: Remove Drag Logic from App.jsx
- [ ] Task 10: Test on Desktop
- [ ] Task 11: Test on Mobile + Final Verification

---

# Implementation

## Task 1: Install dnd-kit Dependencies

1. Add to package.json dependencies
2. Run npm install
3. Verify installation
4. Commit

## Task 2: Delete useLongPress Hook

1. Delete src/hooks/useLongPress.ts
2. Commit deletion

## Task 3: Create DndContext in App.jsx

1. Import dnd-kit
2. Configure sensors (Touch 250ms, Mouse 10px)
3. Wrap with DndContext
4. Commit

## Task 4: Refactor Sidebar to Tap-to-Add

1. Simplify WidgetItem (remove drag, add tap-to-add)
2. Update CSS
3. Commit

## Task 5: Refactor Canvas for dnd-kit

1. Import dnd-kit
2. Remove old drag handlers
3. Use SortableContext
4. Commit

## Task 6: Refactor CanvasWidget for Sortable

1. Import dnd-kit Sortable
2. Use useSortable hook
3. Update JSX
4. Commit

## Task 7: Clean Store Reducer

1. Remove drag-related state
2. Remove drag-related actions
3. Keep ADD_WIDGET and MOVE_WIDGET
4. Commit

## Task 8: Remove Drag CSS

1. Remove dragPreview styles
2. Update widget CSS
3. Commit

## Task 9: Remove App.jsx Drag Logic

1. Remove sidebarHidden logic
2. Simplify sidebar rendering
3. Commit

## Task 10-11: Testing and Verification

1. Test desktop interactions
2. Test mobile interactions
3. Verify everything works

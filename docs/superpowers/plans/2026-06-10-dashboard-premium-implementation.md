# Dashboard Premium Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) to implement task-by-task with fresh context, or `superpowers:executing-plans` for inline batch execution.

**Goal:** Transform the dashboard into a modern, premium-quality interface with intelligent responsive design (REM-based units + auto-scale) and improved visual consistency across all components.

**Architecture:** 
- **Phase 1:** Base responsive system (REM + auto-scale detection)
- **Phase 2:** Widget CSS refactor + pinch-to-zoom interaction
- **Phase 3:** Improve specific high-impact components (Calendar, Notes, Grupo, Navigator)
- **Phase 4:** Unify modals and improve touch accessibility
- **Phase 5:** Comprehensive responsive testing

**Tech Stack:** React 18, CSS3 (REM, media queries, transforms), JavaScript (touch/wheel events)

---

## File Structure

**Files to create:**
- `src/utils/responsiveScale.js` - Auto-scale detection + zoom state management
- `src/styles/responsive.css` - REM breakpoints and responsive utilities

**Files to modify:**
- `src/styles/theme.css` - Add REM base per viewport, improve contrast
- `src/styles/widget.css` - Convert to REM-based units, improve spacing
- `src/App.jsx` - Integrate auto-scale detection
- `src/components/Canvas/Canvas.jsx` - Apply scaling transform
- `src/components/widgets/CalendarioDia.jsx` - Improve typography, modal styling
- `src/components/widgets/CalendarioMini.jsx` - Same improvements
- `src/components/widgets/Notas.jsx` - Improve colors, typography, padding
- `src/components/widgets/GrupoWidget.jsx` - Improve child cards, styling
- `src/components/widgets/NavegadorDashboard.jsx` - Improve modal, styling
- `src/components/widgets/widgetUtils.jsx` - Improve ModalBase styling

---

## PHASE 1: RESPONSIVE SYSTEM (Tasks 1-5)

### Task 1: Create Responsive Scale Utility Module

**Files:**
- Create: `src/utils/responsiveScale.js`

- [ ] **Step 1: Create responsiveScale.js with detection function**

```javascript
// src/utils/responsiveScale.js

/**
 * Detect dashboard width vs viewport width and calculate optimal scale
 * Returns scale factor (1.0 = no scaling, 0.33 = 33% of original size)
 */
export function detectDashboardScale(canvasElement) {
  if (!canvasElement) return 1;
  
  const viewportWidth = window.innerWidth;
  const dashboardWidth = canvasElement.scrollWidth;
  
  // If dashboard fits in viewport: scale = 1.0
  // If dashboard is wider: scale = viewport / dashboard
  return Math.min(1, viewportWidth / dashboardWidth);
}

/**
 * Apply scale transform to canvas element
 * scale: number between 0 and 1
 * origin: "top left" (default for dashboard)
 */
export function applyCanvasScale(canvasElement, scale) {
  if (!canvasElement) return;
  canvasElement.style.transform = `scale(${scale})`;
  canvasElement.style.transformOrigin = 'top left';
}

/**
 * Zoom state management for pinch-to-zoom
 * Clamps zoom between 1.0 (auto-scale) and 1.5 (max)
 */
export function clampZoom(zoom) {
  return Math.min(1.5, Math.max(1, zoom));
}

/**
 * Calculate final transform combining auto-scale + user zoom
 * baseScale: auto-detected scale (from detectDashboardScale)
 * userZoom: user pinch-to-zoom multiplier (default 1.0)
 */
export function calculateFinalScale(baseScale, userZoom = 1.0) {
  return baseScale * userZoom;
}

/**
 * Recalculate scale on window resize
 * Returns callback function for use in useEffect
 */
export function createResizeObserver(canvasElement, callback) {
  const observer = new ResizeObserver(() => {
    const scale = detectDashboardScale(canvasElement);
    callback(scale);
  });
  
  if (canvasElement) {
    observer.observe(canvasElement);
  }
  
  return observer;
}
```

- [ ] **Step 2: Verify file was created correctly**

```bash
cat src/utils/responsiveScale.js | head -20
```

Expected: Should show the first 20 lines of the function definitions

---

### Task 2: Update theme.css with REM Base Responsive

**Files:**
- Modify: `src/styles/theme.css`

- [ ] **Step 1: Read current theme.css line count**

```bash
wc -l src/styles/theme.css
```

- [ ] **Step 2: Add REM base responsive units at the top (before existing :root)**

Replace the entire file with:

```css
/* RESPONSIVE REM BASE - scales all rem units */
@media (min-width: 1024px) {
  :root {
    font-size: 14px; /* Desktop: baseline 14px */
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  :root {
    font-size: 12px; /* Tablet: baseline 12px */
  }
}

@media (max-width: 767px) {
  :root {
    font-size: 10px; /* Mobile: baseline 10px */
  }
}

:root {
  --bg-base:          #060d1a;
  --bg-surface:       #0a1628;
  --bg-widget:        #0f172a;
  --border:           #1e3a5f;
  --border-accent:    #3b82f6;
  --text-primary:     #e2e8f0;
  --text-secondary:   #cbd5e1;  /* IMPROVED from rgba(255,255,255,0.80) */
  --text-dim:         #475569;
  --accent:           #3b82f6;
  --accent-dim:       #1e3a5f;
  --success:          #22c55e;
  --danger:           #ef4444;
  --warning:          #f59e0b;
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 1rem;  /* Now uses REM from media queries above */
}

body {
  background: var(--bg-base);
  color: var(--text-primary);
  height: 100vh;
  overflow: hidden;
}

#root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg-surface); }
::-webkit-scrollbar-thumb { 
  background: var(--border); 
  border-radius: 3px; 
}
::-webkit-scrollbar-thumb:hover {
  background: var(--border-accent);
}

/* Mobile: always show scrollbar for better UX */
@media (max-width: 767px) {
  ::-webkit-scrollbar { width: 8px; }
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Theme defaults (overridden by data-* selectors below) ── */
:root {
  --bg-photo: url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80');
  --bg-blur: 4px;
  --theme-tint: rgba(180, 110, 40, 0.20);
  --theme-hour-gradient: linear-gradient(180deg, rgba(255,100,0,0.15) 0%, transparent 50%, rgba(15,8,2,0.35) 100%);
}

/* Rooms */
:root[data-room="sala"]       { --bg-photo: url('https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80'); }
:root[data-room="dormitorio"] { --bg-photo: url('https://images.unsplash.com/photo-1560448204-603b3fc33dfc?w=1200&q=80'); }
:root[data-room="cocina"]     { --bg-photo: url('https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80'); }
:root[data-room="jardin"]     { --bg-photo: url('https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=80'); }

/* Palettes */
:root[data-palette="calido"] { --theme-tint: rgba(180, 110, 40, 0.20); }
:root[data-palette="frio"]   { --theme-tint: rgba(30, 58, 95, 0.25); }
:root[data-palette="oscuro"] { --theme-tint: rgba(10, 10, 10, 0.35); }
:root[data-palette="neutro"] { --theme-tint: rgba(100, 100, 100, 0.15); }

/* Time of day */
:root[data-time="amanecer"]  { --theme-hour-gradient: linear-gradient(180deg, rgba(255,160,80,0.20) 0%, transparent 60%); }
:root[data-time="dia"]       { --theme-hour-gradient: linear-gradient(180deg, rgba(255,255,180,0.12) 0%, transparent 50%); }
:root[data-time="atardecer"] { --theme-hour-gradient: linear-gradient(180deg, rgba(255,100,0,0.15) 0%, transparent 50%, rgba(15,8,2,0.35) 100%); }
:root[data-time="noche"]     { --theme-hour-gradient: linear-gradient(180deg, rgba(0,0,40,0.40) 0%, transparent 60%, rgba(0,5,30,0.50) 100%); }

/* ── Icon states ── */
:root {
  --icon-off: rgba(255, 255, 255, 0.55);
  --icon-on:  rgba(255, 255, 255, 0.95);
}

/* ── Mobile font sizes ── */
@media (max-width: 768px) {
  :root {
    font-size: 10px;
  }
}
```

- [ ] **Step 3: Verify the changes**

```bash
grep -A 2 "font-size: 1rem" src/styles/theme.css
```

Expected: Should show the font-size definition

---

### Task 3: Create responsive.css utility file

**Files:**
- Create: `src/styles/responsive.css`

- [ ] **Step 1: Create responsive utilities**

```css
/* src/styles/responsive.css */
/* Responsive utility classes using REM base scaling */

/* TYPOGRAPHY - scales with viewport via root font-size */
.text-xs    { font-size: 0.57rem; }  /* 8px → 7px → 5px */
.text-sm    { font-size: 0.64rem; }  /* 9px → 7px → 6px */
.text-base  { font-size: 1rem; }     /* 14px → 12px → 10px */
.text-lg    { font-size: 1.06rem; }  /* 15px → 12px → 10px */
.text-xl    { font-size: 1.14rem; }  /* 16px → 13px → 11px */
.text-2xl   { font-size: 1.28rem; }  /* 18px → 15px → 12px */

/* SPACING - padding and margin */
.p-1   { padding: 0.28rem; }         /* 4px → 3px → 2px */
.p-2   { padding: 0.42rem; }         /* 6px → 5px → 4px */
.p-3   { padding: 0.57rem; }         /* 8px → 6px → 4px */
.p-4   { padding: 0.71rem; }         /* 10px → 8px → 6px */
.p-5   { padding: 0.85rem; }         /* 12px → 10px → 8px */

.m-1   { margin: 0.28rem; }
.m-2   { margin: 0.42rem; }
.m-3   { margin: 0.57rem; }
.m-4   { margin: 0.71rem; }

.gap-1 { gap: 0.28rem; }
.gap-2 { gap: 0.42rem; }
.gap-3 { gap: 0.57rem; }
.gap-4 { gap: 0.71rem; }

/* TOUCH TARGETS - ensure clickable areas are large enough */
.touch-target {
  min-height: 2.14rem;  /* 30px → 25px → 20px */
  min-width: 2.14rem;
}

.touch-target-lg {
  min-height: 2.56rem;  /* 36px → 30px → 24px */
  min-width: 2.56rem;
}

/* RESPONSIVE ICONS */
.icon-sm   { font-size: 1rem; }      /* 14px → 12px → 10px */
.icon-md   { font-size: 1.5rem; }    /* 21px → 18px → 15px */
.icon-lg   { font-size: 2rem; }      /* 28px → 24px → 20px */
.icon-xl   { font-size: 2.28rem; }   /* 32px → 26px → 20px */

/* BORDER RADIUS - scales with size */
.rounded-sm { border-radius: 0.28rem; }   /* 4px */
.rounded    { border-radius: 0.42rem; }   /* 6px */
.rounded-md { border-radius: 0.57rem; }   /* 8px */
.rounded-lg { border-radius: 0.85rem; }   /* 12px */
.rounded-xl { border-radius: 1.14rem; }   /* 16px */

/* BOX SHADOW - consistent across sizes */
.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.shadow    { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.shadow-lg { box-shadow: 0 8px 16px rgba(0,0,0,0.2); }
.shadow-xl { box-shadow: 0 12px 32px rgba(0,0,0,0.3); }

/* LINE HEIGHT - better readability on all sizes */
.leading-tight { line-height: 1.2; }
.leading-normal { line-height: 1.4; }
.leading-relaxed { line-height: 1.65; }
```

- [ ] **Step 2: Verify file created**

```bash
wc -l src/styles/responsive.css
```

Expected: Should show 50+ lines

---

### Task 4: Import responsive.css in main.jsx

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: Read main.jsx imports**

```bash
head -10 src/main.jsx
```

- [ ] **Step 2: Add import for responsive.css after theme.css**

Edit `src/main.jsx` and add the import after `import './styles/theme.css'`:

```javascript
import './styles/responsive.css'
```

- [ ] **Step 3: Verify import added**

```bash
grep "responsive.css" src/main.jsx
```

Expected: Should show the import statement

---

### Task 5: Refactor widget.css to use REM units

**Files:**
- Modify: `src/styles/widget.css`

- [ ] **Step 1: Back up original**

```bash
cp src/styles/widget.css src/styles/widget.css.bak
```

- [ ] **Step 2: Replace entire widget.css file**

Replace with:

```css
/* src/styles/widget.css */
/* Importado una vez en main.jsx — clases compartidas por todos los widgets */
/* All units use REM for automatic viewport scaling */

.w-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.71rem;          /* 10px → 8px → 6px */
  gap: 0.42rem;              /* 6px → 5px → 4px */
  overflow: hidden;
  min-width: 0;
}

.w-center {
  align-items: center;
  justify-content: center;
  text-align: center;
}

.w-label {
  font-size: 0.64rem;        /* 9px → 7px → 5px */
  color: rgba(255, 255, 255, 0.70);
  text-transform: uppercase;
  letter-spacing: 1px;
  flex-shrink: 0;
  line-height: 1.4;
}

.w-name  { 
  font-size: 1rem;           /* 14px → 12px → 10px */
  font-weight: 600; 
  color: var(--text-primary); 
}

.w-sub   { 
  font-size: 0.78rem;        /* 11px → 9px → 7px */
  color: var(--text-secondary);
  line-height: 1.4;
}

.w-row   { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  gap: 0.57rem;              /* 8px → 6px → 4px */
}

.w-col   { 
  display: flex; 
  flex-direction: column; 
  gap: 0.28rem;              /* 4px → 3px → 2px */
}

.w-fill  { flex: 1; }

.w-icon  { font-size: 2rem; }       /* 28px → 24px → 20px */
.w-icon-big { font-size: 3.14rem; } /* 44px → 37px → 30px */

.w-val-big  { 
  font-size: 2.28rem;        /* 32px → 26px → 20px */
  font-weight: 700; 
  line-height: 1; 
}

.w-val-med  { 
  font-size: 1.57rem;        /* 22px → 18px → 14px */
  font-weight: 700; 
  line-height: 1; 
}

.w-status   { font-size: 0.71rem; } /* 10px → 8px → 6px */
.w-divider  { 
  height: 1px; 
  background: var(--border); 
  flex-shrink: 0; 
}

/* BUTTONS */
.w-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
  border-radius: 0.42rem;    /* 6px → 5px → 4px */
  padding: 0.28rem 0.71rem;  /* 4px 10px → 3px 8px → 2px 6px */
  cursor: pointer;
  font-size: 0.92rem;        /* 13px → 11px → 9px */
  transition: background 0.15s;
  min-height: 2.14rem;       /* 30px → 24px → 20px, touch target */
  display: flex;
  align-items: center;
  justify-content: center;
}

.w-btn:hover { 
  background: rgba(255, 255, 255, 0.16); 
  color: white; 
}

.w-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.w-btn-sm { 
  padding: 0.21rem 0.57rem;  /* 3px 8px */
  font-size: 0.78rem;        /* 11px */
  min-height: auto;
}

.w-btn-row { 
  display: flex; 
  gap: 0.42rem;              /* 6px → 5px → 4px */
}

.w-btn-icon {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
  border-radius: 0.42rem;    /* 6px */
  width: 2.14rem;            /* 30px */
  height: 2.14rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.14rem;        /* 16px */
  transition: all 0.15s;
  flex-shrink: 0;
}

.w-btn-icon:hover { 
  background: rgba(255, 255, 255, 0.16); 
  color: white; 
}

/* CHARTS */
.w-bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.21rem;              /* 3px */
  flex: 1;
}

.w-bar {
  flex: 1;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 0.21rem 0.21rem 0 0;
  min-height: 0.28rem;       /* 4px */
  transition: height 0.3s;
}

/* LAYOUT HORIZONTAL PARA 2x1 */
.w-row-body {
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0.71rem;          /* 10px → 8px → 6px */
  gap: 0.57rem;              /* 8px → 6px → 4px */
  overflow: hidden;
  min-width: 0;
}

.w-info {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;              /* 4px → 3px → 2px */
  flex: 1;
  min-width: 0;
}

/* INPUTS */
input[type="text"],
input[type="email"],
input[type="number"],
input[type="password"],
textarea,
select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  border-radius: 0.42rem;    /* 6px */
  padding: 0.42rem 0.57rem;  /* 6px 8px → 5px 6px → 4px 5px */
  font-size: 0.85rem;        /* 12px → 10px → 8px */
  transition: all 0.15s;
  width: 100%;
  box-sizing: border-box;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 0 0.57rem rgba(59, 130, 246, 0.3);
}

input::placeholder,
textarea::placeholder {
  color: var(--text-dim);
  opacity: 0.6;
}

textarea {
  resize: vertical;
  line-height: 1.5;
}

/* SCROLLBAR - visible on mobile/tablet, auto-hide on desktop */
@media (min-width: 1024px) {
  ::-webkit-scrollbar-thumb { opacity: 0; }
  ::-webkit-scrollbar-thumb:hover { opacity: 1; }
}

@media (max-width: 1023px) {
  ::-webkit-scrollbar-thumb { opacity: 1; }
  ::-webkit-scrollbar-thumb:hover { opacity: 1; }
}
```

- [ ] **Step 2: Verify the file was updated**

```bash
grep "padding: 0.71rem" src/styles/widget.css | head -1
```

Expected: Should show at least one match

---

## ✅ CHECKPOINT 1: Tasks 1-5 Complete

**Summary of changes:**
- ✅ Created `src/utils/responsiveScale.js` with auto-scale detection
- ✅ Updated `src/styles/theme.css` with REM base responsive (14px → 12px → 10px)
- ✅ Created `src/styles/responsive.css` with utility classes
- ✅ Added import in `src/main.jsx`
- ✅ Refactored `src/styles/widget.css` to REM units

**Next:** Ready to proceed with Tasks 6-10 (Canvas integration + pinch-to-zoom)

---

## PHASE 2: CANVAS INTEGRATION & INTERACTIONS (Tasks 6-7)

(Tasks 6-7 follow in next section - showing Task 1-5 completion first for checkpoint)

**Proceed with Tasks 6-10?** Ready to continue inline execution.

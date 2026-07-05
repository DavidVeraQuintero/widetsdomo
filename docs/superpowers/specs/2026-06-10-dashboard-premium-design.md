# Dashboard Domótica - Premium Design Spec
**Fecha:** 2026-06-10  
**Versión:** 1.0  
**Objetivo:** Convertir el dashboard a un diseño moderno, fácil de usar y entender, con soporte responsive optimizado para móvil/tablet primario y desktop secundario.

---

## 1. VISIÓN GENERAL

**Principios de diseño:**
- **Moderno y limpio**: Dark theme elegante con mejores contrastes
- **Intuitivo**: Información clara, jerarquía visual fuerte
- **Responsive**: Una estructura visual única que se adapta inteligentemente a cualquier pantalla
- **Accesible**: Touch targets grandes en móvil, fuentes legibles, suficiente contraste

**Enfoque técnico:**
- Sistema de **unidades flexibles (REM)** basado en viewport
- **Auto-scale inteligente**: detecta dashboard vs pantalla, escala automáticamente
- **Pinch-to-zoom**: usuario puede ampliar detalles si lo necesita
- **Sin cambios estructurales**: mantiene el mismo layout visual en todos los dispositivos

---

## 2. SISTEMA RESPONSIVE - RESPONSIVE UNITS

### 2.1 Font Size Base (REM)

El tamaño de fuente raíz (`font-size: 14px`) se ajusta por viewport:

```css
/* Desktop */
@media (min-width: 1024px) {
  :root { font-size: 14px; }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  :root { font-size: 12px; }
}

/* Mobile */
@media (max-width: 767px) {
  :root { font-size: 10px; }
}
```

**Resultado:** Todo escalado automáticamente. Un widget de 14px se convierte en 12px (tablet) y 10px (móvil).

### 2.2 Auto-Scale para Dashboard Completo

**Problema:** Un dashboard de 12 columnas no cabe en móvil.  
**Solución:** Detectar y escalar automáticamente con `transform: scale()`.

```javascript
// En App.jsx o Canvas.jsx
function detectDashboardScale() {
  const dashboard = document.querySelector('[class*="canvas"]');
  const viewportWidth = window.innerWidth;
  
  if (!dashboard) return 1;
  
  const dashboardWidth = dashboard.scrollWidth;
  const scale = viewportWidth / dashboardWidth;
  
  // Si dashboard cabe: scale = 1.0
  // Si dashboard es mayor: scale = 0.33 (ejemplo para 12x en móvil)
  return Math.min(1, scale);
}

// Aplicar:
const scale = detectDashboardScale();
canvas.style.transform = `scale(${scale})`;
canvas.style.transformOrigin = 'top left';
```

**Casos:**
- Dashboard 4x en móvil (375px): scale = 1.0 (cabe perfecto)
- Dashboard 12x en móvil (375px): scale = 0.31 (se reduce, cabe en pantalla)
- Dashboard en tablet/desktop: scale = 1.0 (tamaño normal)

### 2.3 Pinch-to-Zoom

Encima del scale automático, el usuario puede hacer pinch para ampliar (máx 150%):

```javascript
let currentZoom = 1;

canvas.addEventListener('wheel', (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    currentZoom = Math.min(1.5, Math.max(1, currentZoom + e.deltaY * -0.001));
    canvas.style.transform = `scale(${detectDashboardScale() * currentZoom})`;
  }
});

// Touch pinch (móvil)
let lastDistance = 0;
canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    const distance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    if (lastDistance) {
      const ratio = distance / lastDistance;
      currentZoom = Math.min(1.5, Math.max(1, currentZoom * ratio));
      canvas.style.transform = `scale(${detectDashboardScale() * currentZoom})`;
    }
    lastDistance = distance;
  }
});
```

---

## 3. TIPOGRAFÍA Y ESPACIADO

### 3.1 Escala de Tipografía (en REM, escalable automáticamente)

```css
/* Títulos de widgets */
.w-name {
  font-size: 1rem;         /* 14px → 12px → 10px */
  font-weight: 600;
  color: var(--text-primary);
}

/* Subtítulos */
.w-sub {
  font-size: 0.78rem;      /* 11px → 9px → 7px */
  color: var(--text-secondary);
}

/* Labels pequeños */
.w-label {
  font-size: 0.64rem;      /* 9px → 7px → 5px */
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Valores grandes */
.w-val-big {
  font-size: 2.28rem;      /* 32px → 26px → 20px */
  font-weight: 700;
  line-height: 1;
}

/* Valores medianos */
.w-val-med {
  font-size: 1.57rem;      /* 22px → 18px → 14px */
  font-weight: 700;
  line-height: 1;
}

/* Botones */
.w-btn {
  font-size: 0.92rem;      /* 13px → 11px → 9px */
}

/* Inputs */
input, textarea, select {
  font-size: 0.85rem;      /* 12px → 10px → 8px */
}
```

### 3.2 Espaciado Consistente (en REM, escalable)

```css
/* Padding interno de widgets */
.w-body {
  padding: 0.71rem;        /* 10px → 8px → 6px */
  gap: 0.42rem;            /* 6px → 5px → 4px */
}

/* Gap entre elementos */
.w-row, .w-col {
  gap: 0.57rem;            /* 8px → 6px → 4px */
}

/* Margen entre widgets */
.canvasWidget {
  margin: 0.57rem;         /* 8px → 6px → 4px */
}

/* Inputs y controles */
input, button, select {
  padding: 0.57rem 0.71rem; /* 8px 10px → 6px 8px → 4px 6px */
  border-radius: 0.42rem;   /* 6px → 5px → 4px */
}
```

### 3.3 Line-height y Contraste Mejorado

```css
/* Mejor legibilidad en labels y texto pequeño */
.w-label {
  line-height: 1.4;
  letter-spacing: 0.5px;
}

.w-sub {
  line-height: 1.4;
}

/* Mejorar contraste de texto secundario */
:root {
  --text-secondary: #cbd5e1;  /* 85% opacidad equivalente, más legible */
}
```

---

## 4. WIDGETS COMPLEJOS - MEJORAS ESPECÍFICAS

### 4.1 Calendario (CalendarioDia y CalendarioMini)

**Problemas actuales:**
- Grid de días muy pequeño, difícil de clickear
- Eventos difíciles de leer
- Modal necesita mejor jerarquía visual

**Mejoras:**

**Grid de días:**
```css
.calendar-day-cell {
  padding: 0.28rem 0;           /* 4px → 3px → 2px */
  min-height: 2rem;             /* 28px → 24px → 20px, más clickeable */
  font-size: 0.78rem;           /* 11px → 9px → 7px */
  border-radius: 0.35rem;       /* 5px */
  transition: background 0.15s;
}

.calendar-day-cell.today {
  background: rgba(255,255,255,0.1);
  color: var(--accent);
  font-weight: 700;
}

.calendar-day-cell.selected {
  background: var(--accent);
  color: #fff;
}
```

**Indicadores de eventos:**
```css
.calendar-event-dot {
  width: 0.28rem;               /* 4px */
  height: 0.28rem;
  border-radius: 50%;
  margin: 0.07rem auto 0;       /* 1px auto 0 */
  background: var(--accent);
}
```

**Lista de eventos:**
```css
.calendar-event-item {
  font-size: 0.78rem;           /* 11px → 9px → 7px */
  padding: 0.28rem 0.42rem;     /* 4px 6px */
  border-radius: 0.28rem;       /* 4px */
  background: rgba(255,255,255,0.08);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Modal de calendario:**
```css
.calendar-modal {
  border: 1px solid var(--border-accent);
  border-radius: 0.85rem;       /* 12px */
  padding: 1.42rem;             /* 20px */
  background: linear-gradient(135deg, #0f172a, #0a1f3d);
  max-height: 85vh;
  overflow-y: auto;
}

.calendar-modal-title {
  font-size: 1rem;              /* 14px → 12px → 10px */
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.85rem;       /* 12px */
}
```

---

### 4.2 Notas (Notas Widget)

**Problemas actuales:**
- Colores claros no contrastan bien con tema oscuro en algunos casos
- Texto puede ser muy pequeño en móvil
- Stack visual podría mejorar

**Mejoras:**

**Tarjeta de nota:**
```css
.note-paper {
  padding: 1rem 1rem 0.71rem;   /* 14px 14px 10px → 12px 12px 8px → 10px 10px 6px */
  border-radius: 0.85rem;       /* 12px */
  box-shadow: -4px 6px 18px rgba(0,0,0,0.45);
  overflow: hidden;
  position: relative;
  transition: all 220ms ease;
}

.note-title {
  font-size: 0.92rem;           /* 13px → 11px → 9px */
  font-weight: 800;
  margin-bottom: 0.57rem;       /* 8px */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-left: 2rem;           /* 28px, margen de libreta */
}

.note-body {
  font-size: 0.78rem;           /* 11px → 9px → 7px */
  line-height: 1.65;
  color: inherit;
  overflow: hidden;
  padding-left: 2rem;           /* 28px, margen de libreta */
  white-space: pre-line;
  flex: 1;
}

.note-date {
  font-size: 0.57rem;           /* 8px → 7px → 5px */
  color: inherit;
  margin-top: 0.42rem;          /* 6px */
  text-align: right;
  opacity: 0.7;
  flex-shrink: 0;
}
```

**Stack de notas (hojas detrás):**
```css
.note-stack-sheet {
  position: absolute;
  border-radius: 0.85rem;       /* 12px */
  box-shadow: -3px 4px 12px rgba(0,0,0,0.3);
  border-left: 1px solid rgba(255,255,255,0.4);
  border-bottom: 1px solid rgba(0,0,0,0.1);
  transition: all 220ms ease;
  z-index: 10;
}
```

**Contador de notas:**
```css
.note-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.42rem;               /* 6px */
  flex: 1;
  font-size: 0.71rem;         /* 10px → 8px → 6px */
  font-weight: 700;
  color: var(--accent);
}

.note-counter-dot {
  width: 0.35rem;             /* 5px */
  height: 0.35rem;
  border-radius: 50%;
  transition: all 200ms ease;
}
```

**Color picker:**
```css
.note-color-button {
  width: 1.71rem;             /* 24px */
  height: 1.71rem;
  border-radius: 0.42rem;     /* 6px */
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;
}

.note-color-button.active {
  transform: scale(1.2);
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.4);
}
```

---

### 4.3 Grupo (GrupoWidget)

**Problemas actuales:**
- Tarjetas de hijos con estilos muy complejos
- Falta consistencia visual

**Mejoras:**

**Contenedor de grupo:**
```css
.group-widget {
  display: flex;
  flex-direction: column;
  gap: 0.57rem;               /* 8px */
  padding: 0.71rem;           /* 10px */
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.57rem;    /* 8px */
  border-bottom: 1px solid var(--border);
  margin-bottom: 0.57rem;     /* 8px */
}

.group-title {
  font-size: 0.92rem;         /* 13px → 11px → 9px */
  font-weight: 700;
  color: var(--text-primary);
}
```

**Tarjetas de hijos:**
```css
.group-child-card {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 0.42rem;     /* 6px */
  padding: 0.57rem;           /* 8px */
  display: flex;
  align-items: center;
  gap: 0.57rem;               /* 8px */
  cursor: pointer;
  transition: all 0.15s;
}

.group-child-card:hover {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.25);
}

.group-child-card.on {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.3);
}

.group-child-icon {
  font-size: 1.2rem;          /* 16-17px */
  flex-shrink: 0;
}

.group-child-info {
  flex: 1;
  min-width: 0;
}

.group-child-name {
  font-size: 0.85rem;         /* 12px → 10px → 8px */
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-child-value {
  font-size: 0.71rem;         /* 10px → 8px → 6px */
  color: var(--text-secondary);
}
```

**Botón master (control grupal):**
```css
.group-master-button {
  width: 2.14rem;             /* 30px */
  height: 2.14rem;
  border-radius: 0.42rem;     /* 6px */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.group-master-button.on {
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
}

.group-master-button.off {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
}
```

---

### 4.4 Navegador Dashboard (NavegadorDashboard)

**Problemas actuales:**
- Modal de configuración un poco densa
- Icono podría ser más consistente

**Mejoras:**

**Widget principal:**
```css
.navigator-widget {
  cursor: pointer;
  transition: opacity 0.1s;
  user-select: none;
}

.navigator-icon {
  font-size: 2.14rem;         /* 30px (variable según size) */
  color: rgba(255,255,255,0.85);
  margin-bottom: 0.42rem;     /* 6px */
}

.navigator-name {
  font-size: 1.06rem;         /* 15px → 12px → 10px */
  font-weight: 600;
  color: var(--text-primary);
}

.navigator-subtext {
  font-size: 0.71rem;         /* 10px → 8px → 6px */
  color: var(--text-dim);
  margin-top: 0.28rem;        /* 4px */
}
```

**Botón "Ir":**
```css
.navigator-go-button {
  background: var(--accent-dim);
  border: none;
  color: var(--accent);
  border-radius: 0.57rem;     /* 8px */
  padding: 0.35rem 1.14rem;   /* 5px 16px */
  cursor: pointer;
  font-size: 0.85rem;         /* 12px */
  margin-top: 0.28rem;        /* 4px */
  transition: background 0.15s;
}

.navigator-go-button:hover {
  background: var(--accent);
  color: #fff;
}
```

**Modal de configuración:**
```css
.navigator-config-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.75);
}

.navigator-config-panel {
  background: linear-gradient(135deg, #0f172a, #0a1f3d);
  border: 2px solid var(--border-accent);
  border-radius: 1.14rem;     /* 16px */
  padding: 1.42rem;           /* 20px */
  width: 90%;
  max-width: 20rem;           /* 280px */
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 0 40px rgba(0,0,0,0.7);
}

.navigator-config-title {
  font-size: 0.92rem;         /* 13px → 11px → 9px */
  font-weight: 700;
  color: var(--text-primary);
}

.navigator-config-label {
  color: rgba(255,255,255,0.5);
  font-size: 0.71rem;         /* 10px → 8px → 6px */
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.35rem;     /* 5px */
}

.navigator-config-select {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.57rem;     /* 8px */
  color: var(--text-primary);
  padding: 0.42rem 0.71rem;   /* 6px 10px */
  font-size: 0.85rem;         /* 12px */
  width: 100%;
}
```

---

## 5. MODALS BASE - DISEÑO UNIFICADO

### 5.1 ModalBase Component

Todos los modals usan esta estructura base mejorada:

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.65);
  animation: fadeIn 200ms ease;
}

.modal-panel {
  background: linear-gradient(135deg, #0f172a 0%, #0a1f3d 100%);
  border: 1px solid var(--border-accent);
  border-radius: 1rem;        /* 14px */
  padding: 1.42rem;           /* 20px */
  max-width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
  animation: slideUp 200ms ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.14rem;     /* 16px */
  padding-bottom: 0.71rem;    /* 10px */
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.modal-title {
  font-size: 0.92rem;         /* 13px → 11px → 9px */
  font-weight: 700;
  color: var(--text-primary);
}

.modal-close-button {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 0.28rem;     /* 4px */
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.14rem 0.57rem;   /* 2px 8px */
  font-size: 0.78rem;         /* 11px */
  transition: all 0.15s;
}

.modal-close-button:hover {
  background: rgba(255,255,255,0.12);
  color: var(--text-primary);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-footer {
  display: flex;
  gap: 0.57rem;               /* 8px */
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### 5.2 Inputs, Selects, Textareas

```css
input, select, textarea {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: var(--text-primary);
  border-radius: 0.42rem;     /* 6px */
  padding: 0.57rem 0.71rem;   /* 8px 10px */
  font-size: 0.85rem;         /* 12px */
  transition: all 0.15s;
  width: 100%;
  box-sizing: border-box;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--accent);
  background: rgba(255,255,255,0.12);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

textarea {
  resize: vertical;
  line-height: 1.5;
  min-height: 5em;
}

input::placeholder, textarea::placeholder {
  color: var(--text-dim);
  opacity: 0.6;
}
```

---

## 6. PALETA DE COLORES - MEJORADA

```css
:root {
  /* Base oscura */
  --bg-base:          #060d1a;
  --bg-surface:       #0a1628;
  --bg-widget:        #0f172a;
  
  /* Bordes */
  --border:           #1e3a5f;
  --border-accent:    #3b82f6;
  
  /* Texto - MEJORADO CONTRASTE */
  --text-primary:     #e2e8f0;  (95-96% brightness)
  --text-secondary:   #cbd5e1;  (80-85% brightness, MEJORADO)
  --text-dim:         #64748b;  (40-50% brightness)
  
  /* Acentos */
  --accent:           #3b82f6;  (azul)
  --accent-dim:       #1e3a5f;  (azul oscuro, para backgrounds)
  
  /* Estados */
  --success:          #22c55e;  (verde)
  --danger:           #ef4444;  (rojo)
  --warning:          #f59e0b;  (naranja)
  
  /* Especiales */
  --icon-off:         rgba(255,255,255,0.55);
  --icon-on:          rgba(255,255,255,0.95);
}
```

**Mejora clave:** `--text-secondary` aumenta de opacidad para mejor legibilidad en móvil.

---

## 7. TOUCH TARGETS - ACCESIBILIDAD MÓVIL

**Mínimos recomendados:**
```css
/* Botones */
.w-btn {
  min-height: 2.14rem;        /* 30px */
  min-width: 2.14rem;
  padding: 0.28rem 0.71rem;   /* 4px 10px */
}

/* Botones icon */
.w-btn-icon {
  width: 2.14rem;             /* 30px */
  height: 2.14rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Sliders */
input[type="range"] {
  min-height: 2.56rem;        /* 36px */
  cursor: pointer;
  accent-color: var(--accent);
}

/* Celdas clickeables */
.clickable-cell {
  min-height: 2.14rem;        /* 30px */
  min-width: 2.14rem;
  padding: 0.28rem;           /* 4px */
}

/* Calendar day */
.calendar-day-cell {
  min-height: 2rem;           /* 28px */
}
```

---

## 8. SCROLLS - CONSISTENCIA

```css
/* Scroll desktop (auto-hide) */
@media (min-width: 1024px) {
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-accent); }
}

/* Scroll tablet y móvil (visible) */
@media (max-width: 1023px) {
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-surface); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-accent); }
  
  /* Thumb mínimo de 30px para clickear fácil */
  ::-webkit-scrollbar-thumb { min-height: 2.14rem; }
}
```

---

## 9. RESPONSIVE BREAKPOINTS

### 9.1 Desktop (> 1024px)
- Font-size base: 14px
- Widget margin: 8px
- Padding: 10px
- Gap: 6-8px
- Touch target: 30px (recomendado pero no crítico)

### 9.2 Tablet (768px - 1023px)
- Font-size base: 12px
- Widget margin: 6px
- Padding: 8px
- Gap: 5-6px
- Touch target: 30px (crítico)

### 9.3 Mobile (< 768px)
- Font-size base: 10px
- Dashboard auto-scaled
- Widget margin: 4px
- Padding: 6px
- Gap: 4-5px
- Touch target: 40px (crítico)
- Pinch-to-zoom habilitado
- Scrolls siempre visibles

---

## 10. IMPLEMENTACIÓN CHECKLIST

### Fase 1: Estilos Base
- [ ] Actualizar `src/styles/theme.css` con REM base responsivo
- [ ] Mejora de --text-secondary contraste
- [ ] Agregar media queries para font-size base por viewport

### Fase 2: Widget.css
- [ ] Convertir padding/margin/gap a valores REM escalables
- [ ] Actualizar .w-btn, .w-icon, .w-val-* a REM
- [ ] Agregar estilos scroll para tablet/móvil

### Fase 3: Auto-Scale JavaScript
- [ ] Crear función `detectDashboardScale()` en Canvas
- [ ] Aplicar transform scale automático
- [ ] Detectar cambios de viewport y recalcular

### Fase 4: Pinch-to-Zoom
- [ ] Agregar event listeners para wheel (ctrl+scroll)
- [ ] Agregar event listeners para touch pinch (2 dedos)
- [ ] Limitar zoom a rango 1.0 - 1.5
- [ ] Suavizar animaciones (200ms)

### Fase 5: Componentes Específicos
- [ ] CalendarioDia: mejorar grid, eventos, modal
- [ ] CalendarioMini: aplicar mismas mejoras
- [ ] Notas: ajustar colores, padding, tipografía
- [ ] GrupoWidget: mejorar tarjetas hijos, consistencia
- [ ] NavegadorDashboard: mejorar modal config
- [ ] ModalBase: aplicar diseño unificado

### Fase 6: Testing Responsive
- [ ] Test 4x dashboard en móvil (debe verse normal)
- [ ] Test 12x dashboard en móvil (debe escalarse)
- [ ] Test pinch-to-zoom en tablet
- [ ] Test scrolls visibles en móvil
- [ ] Test touch targets mínimo 30-40px
- [ ] Test tipografía legible en todos los tamaños

---

## 11. NOTAS IMPORTANTES

1. **No cambiar estructura:** El layout es el mismo en todos los dispositivos. Solo se escala.
2. **REM es flexible:** Todo automáticamente responsivo sin media queries complejas.
3. **Auto-scale es inteligente:** Detecta tamaño dashboard vs pantalla automáticamente.
4. **Pinch-to-zoom es adicional:** Encima del scale automático, no lo reemplaza.
5. **Mobile-first testing:** Probar primero en móvil (lo más restrictivo).
6. **Sin commits hasta aprobación:** Todos los cambios deben revisarse antes de mergear.

---

**Diseño completado:** 2026-06-10  
**Versión:** 1.0  
**Estado:** Listo para implementación

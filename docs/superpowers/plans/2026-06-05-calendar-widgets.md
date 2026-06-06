# Calendar Widgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two calendar widgets — `CalendarioMini` (1×1, shows today + month modal) and `CalendarioDia` (day agenda with prev/next navigation) — backed by a global shared event store.

**Architecture:** A new `calendarStore.jsx` Context/reducer (mirroring `dashboardStore`) persists events in `localStorage` under `calendar-events-v1`. Both widgets read/write from it via `useCalendar()`. A shared `CalendarioEventModal.jsx` handles create and edit flows for both widgets.

**Tech Stack:** React 18, Context + useReducer, localStorage, existing `ModalBase` + `useLongPress` from `widgetUtils.jsx`, `createPortal` (already used by ModalBase).

---

## File Map

| Action | File |
|--------|------|
| Create | `src/store/calendarStore.jsx` |
| Create | `src/components/widgets/CalendarioEventModal.jsx` |
| Create | `src/components/widgets/CalendarioMini.jsx` |
| Create | `src/components/widgets/CalendarioDia.jsx` |
| Modify | `src/App.jsx` — wrap with `CalendarProvider` |
| Modify | `src/catalog/widgetCatalog.jsx` — add catalog entries |

---

## Task 1: Global Calendar Store

**Files:**
- Create: `src/store/calendarStore.jsx`

- [ ] **Step 1: Create the store file**

```jsx
// src/store/calendarStore.jsx
import { createContext, useContext, useReducer } from 'react';

const STORAGE_KEY = 'calendar-events-v1';

const DEFAULT_STATE = { events: [] };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    return { events: Array.isArray(saved.events) ? saved.events : [] };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: state.events }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_EVENT': {
      const next = { ...state, events: [...state.events, action.payload] };
      persist(next);
      return next;
    }
    case 'UPDATE_EVENT': {
      const next = {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e),
      };
      persist(next);
      return next;
    }
    case 'DELETE_EVENT': {
      const next = { ...state, events: state.events.filter(e => e.id !== action.id) };
      persist(next);
      return next;
    }
    default:
      return state;
  }
}

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  return (
    <CalendarContext.Provider value={{ state, dispatch }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  return useContext(CalendarContext);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/store/calendarStore.jsx
git commit -m "feat: add calendarStore — global event store with localStorage persistence"
```

---

## Task 2: Shared Event Modal

**Files:**
- Create: `src/components/widgets/CalendarioEventModal.jsx`

- [ ] **Step 1: Create the modal file**

```jsx
// src/components/widgets/CalendarioEventModal.jsx
import { useState } from 'react';
import { ModalBase } from './widgetUtils';
import { useCalendar } from '../../store/calendarStore';

const DURATION_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 h',    value: 60 },
  { label: '1 h 30 min', value: 90 },
  { label: '2 h',   value: 120 },
  { label: '3 h',   value: 180 },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarioEventModal({ event, defaultDate, onClose, accentColor }) {
  const { dispatch } = useCalendar();
  const isEdit = !!event;

  const [title,     setTitle]     = useState(event?.title     ?? '');
  const [date,      setDate]      = useState(event?.date      ?? defaultDate ?? todayISO());
  const [startTime, setStartTime] = useState(event?.startTime ?? '09:00');
  const [duration,  setDuration]  = useState(event?.duration  ?? 60);

  const inputStyle = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    padding: '4px 8px',
    fontSize: 12,
    width: '100%',
    boxSizing: 'border-box',
  };

  function save() {
    if (!title.trim()) return;
    if (isEdit) {
      dispatch({ type: 'UPDATE_EVENT', payload: { ...event, title: title.trim(), date, startTime, duration } });
    } else {
      dispatch({ type: 'ADD_EVENT', payload: { id: crypto.randomUUID(), title: title.trim(), date, startTime, duration } });
    }
    onClose();
  }

  function remove() {
    dispatch({ type: 'DELETE_EVENT', id: event.id });
    onClose();
  }

  const stop = e => e.stopPropagation();

  return (
    <ModalBase
      title={isEdit ? '✏️ Editar evento' : '➕ Nuevo evento'}
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} onClick={stop} onMouseDown={stop}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Título</div>
          <input
            style={inputStyle}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej. Médico"
          />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Fecha</div>
          <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Hora inicio</div>
          <input type="time" style={inputStyle} value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Duración</div>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
          >
            {DURATION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          className="w-btn"
          style={{ width: '100%', marginTop: 6, background: accentColor, borderColor: accentColor, color: '#fff' }}
          onClick={save}
          onMouseDown={stop}
        >
          Guardar
        </button>
        {isEdit && (
          <button
            className="w-btn"
            style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444' }}
            onClick={remove}
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

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/CalendarioEventModal.jsx
git commit -m "feat: add CalendarioEventModal — shared create/edit event modal"
```

---

## Task 3: CalendarioMini Widget (1×1)

**Files:**
- Create: `src/components/widgets/CalendarioMini.jsx`

- [ ] **Step 1: Create the widget file**

```jsx
// src/components/widgets/CalendarioMini.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLongPress, ModalBase } from './widgetUtils';
import { useCalendar } from '../../store/calendarStore';
import CalendarioEventModal from './CalendarioEventModal';

const DAY_NAMES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoToDateParts(iso) {
  const d = new Date(iso + 'T00:00:00');
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), weekday: d.getDay() };
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Returns Mon=0 … Sun=6 offset for the 1st of the month
function firstWeekdayOffset(year, month) {
  const dow = new Date(year, month, 1).getDay(); // 0=Sun
  return dow === 0 ? 6 : dow - 1;
}

function buildIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function MonthModal({ onClose, accentColor }) {
  const { state } = useCalendar();
  const today = todayISO();
  const todayParts = isoToDateParts(today);

  const [viewYear,  setViewYear]  = useState(todayParts.year);
  const [viewMonth, setViewMonth] = useState(todayParts.month);
  const [selectedDay, setSelectedDay] = useState(today);
  const [creating, setCreating]   = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const totalDays   = daysInMonth(viewYear, viewMonth);
  const startOffset = firstWeekdayOffset(viewYear, viewMonth);

  // Build grid cells: null = empty, number = day
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  // Days that have events this month
  const eventDates = new Set(
    state.events
      .filter(e => e.date.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`))
      .map(e => e.date)
  );

  const selectedEvents = state.events
    .filter(e => e.date === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const stop = e => e.stopPropagation();

  if (creating) {
    return <CalendarioEventModal defaultDate={selectedDay} onClose={() => setCreating(false)} accentColor={accentColor} />;
  }
  if (editingEvent) {
    return <CalendarioEventModal event={editingEvent} onClose={() => setEditingEvent(null)} accentColor={accentColor} />;
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)' }}
      onMouseDown={e => { e.stopPropagation(); onClose(); }}
    >
      <div
        style={{ background: 'linear-gradient(135deg,#0f172a,#0a1f3d)', border: `1px solid ${accentColor}`, borderRadius: 16, padding: 20, width: 300, boxShadow: '0 0 40px rgba(0,0,0,0.5)', maxHeight: '85vh', overflowY: 'auto' }}
        onMouseDown={stop}
        onClick={stop}
      >
        {/* Month nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={prevMonth}>‹</button>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={nextMonth}>›</button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
          {['L','M','X','J','V','S','D'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-secondary)', paddingBottom: 2 }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const iso = buildIso(viewYear, viewMonth, day);
            const isToday    = iso === today;
            const isSelected = iso === selectedDay;
            const hasEvents  = eventDates.has(iso);
            return (
              <div
                key={i}
                onMouseDown={stop}
                onClick={() => setSelectedDay(iso)}
                style={{
                  textAlign: 'center', cursor: 'pointer', borderRadius: 5, padding: '3px 0',
                  background: isSelected ? accentColor : isToday ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isSelected ? '#fff' : isToday ? accentColor : 'var(--text-primary)',
                  fontWeight: isToday || isSelected ? 700 : 400,
                  fontSize: 11,
                  position: 'relative',
                }}
              >
                {day}
                {hasEvents && (
                  <div style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: isSelected ? '#fff' : accentColor,
                    margin: '1px auto 0',
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Selected day events */}
        <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {DAY_NAMES[isoToDateParts(selectedDay).weekday]} {isoToDateParts(selectedDay).day} {MONTH_SHORT[isoToDateParts(selectedDay).month]}
            </span>
            <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={() => setCreating(true)}>+ Añadir</button>
          </div>
          {selectedEvents.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', padding: '8px 0' }}>Sin eventos</div>
          )}
          {selectedEvents.map(ev => (
            <div
              key={ev.id}
              onMouseDown={stop}
              onClick={() => setEditingEvent(ev)}
              style={{
                borderLeft: `3px solid ${accentColor}`, paddingLeft: 8, marginBottom: 6,
                cursor: 'pointer', borderRadius: '0 4px 4px 0', padding: '4px 8px',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{ev.title}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                {ev.startTime} · {formatDuration(ev.duration)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Clic fuera para cerrar</div>
      </div>
    </div>,
    document.body
  );
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export default function CalendarioMini({ accentColor }) {
  const { state } = useCalendar();
  const [modal, setModal] = useState(false);
  const longPress = useLongPress(() => setModal(true));

  const today = todayISO();
  const { year, month, day, weekday } = isoToDateParts(today);

  const todayEvents = state.events.filter(e => e.date === today);
  const dots = Math.min(todayEvents.length, 3);

  return (
    <div className="w-body w-center" style={{ cursor: 'pointer' }} {...longPress}>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {DAY_NAMES[weekday]}
      </div>
      <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
        {day}
      </div>
      <div style={{ fontSize: 11, color: accentColor, fontWeight: 600 }}>
        {MONTH_SHORT[month]} {year}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'center' }}>
        {Array.from({ length: dots }).map((_, i) => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor }} />
        ))}
      </div>
      {modal && <MonthModal onClose={() => setModal(false)} accentColor={accentColor} />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/CalendarioMini.jsx
git commit -m "feat: add CalendarioMini widget — 1x1 day display with month calendar modal"
```

---

## Task 4: CalendarioDia Widget (2×2 / 2×4 / 4×4)

**Files:**
- Create: `src/components/widgets/CalendarioDia.jsx`

- [ ] **Step 1: Create the widget file**

```jsx
// src/components/widgets/CalendarioDia.jsx
import { useState } from 'react';
import { useLongPress, ModalBase } from './widgetUtils';
import { useCalendar } from '../../store/calendarStore';
import CalendarioEventModal from './CalendarioEventModal';

const DAY_SHORT   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatHeader(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function ConfigModal({ config, onConfigChange, onClose, accentColor }) {
  const [name, setName] = useState(config.name ?? 'Agenda');
  const stop = e => e.stopPropagation();
  function save() { onConfigChange({ ...config, name }); onClose(); }
  return (
    <ModalBase title="🗓 Calendario" onClose={onClose} borderColor={accentColor}>
      <div onClick={stop} onMouseDown={stop} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>Nombre del widget</div>
          <input
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, color: 'var(--text-primary)', padding: '4px 8px', fontSize: 12, width: '100%', boxSizing: 'border-box' }}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <button className="w-btn" style={{ width: '100%', background: accentColor, borderColor: accentColor, color: '#fff' }} onClick={save} onMouseDown={stop}>Guardar</button>
      </div>
    </ModalBase>
  );
}

export default function CalendarioDia({ size, config, onConfigChange, accentColor }) {
  const { state } = useCalendar();
  const [viewDate,     setViewDate]     = useState(todayISO);
  const [configModal,  setConfigModal]  = useState(false);
  const [createModal,  setCreateModal]  = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const longPress = useLongPress(() => setConfigModal(true));

  const dayEvents = state.events
    .filter(e => e.date === viewDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const stop = e => e.stopPropagation();

  const isLarge  = size === '4x4';
  const fontSize = isLarge ? 13 : 11;

  return (
    <div className="w-body" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }} {...longPress}>

      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isLarge ? '8px 12px' : '5px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}
        onClick={stop}
        onMouseDown={stop}
      >
        <button className="w-btn w-btn-sm" onClick={() => setViewDate(d => addDays(d, -1))} onMouseDown={stop}>‹</button>
        <span style={{ fontSize: fontSize, fontWeight: 700, color: 'var(--text-primary)' }}>
          {formatHeader(viewDate)}
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="w-btn w-btn-sm" onClick={() => setViewDate(d => addDays(d, 1))} onMouseDown={stop}>›</button>
          <button
            className="w-btn w-btn-sm"
            style={{ color: accentColor, borderColor: accentColor }}
            onClick={() => setCreateModal(true)}
            onMouseDown={stop}
          >+</button>
        </div>
      </div>

      {/* Events list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isLarge ? '8px 12px' : '5px 8px' }}>
        {dayEvents.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 12 }}>Sin eventos</div>
        )}
        {dayEvents.map(ev => (
          <div
            key={ev.id}
            onClick={e => { e.stopPropagation(); setEditingEvent(ev); }}
            onMouseDown={stop}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 6,
              borderLeft: `3px solid ${accentColor}`,
              padding: isLarge ? '5px 8px' : '3px 6px',
              marginBottom: isLarge ? 6 : 4,
              borderRadius: '0 5px 5px 0',
              background: 'rgba(255,255,255,0.04)',
              cursor: 'pointer',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: fontSize, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.title}
              </div>
              <div style={{ fontSize: fontSize - 1, color: 'var(--text-secondary)' }}>
                {ev.startTime} · {formatDuration(ev.duration)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {configModal && (
        <ConfigModal config={config} onConfigChange={onConfigChange} onClose={() => setConfigModal(false)} accentColor={accentColor} />
      )}
      {createModal && (
        <CalendarioEventModal defaultDate={viewDate} onClose={() => setCreateModal(false)} accentColor={accentColor} />
      )}
      {editingEvent && (
        <CalendarioEventModal event={editingEvent} onClose={() => setEditingEvent(null)} accentColor={accentColor} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/CalendarioDia.jsx
git commit -m "feat: add CalendarioDia widget — day agenda with prev/next navigation and event CRUD"
```

---

## Task 5: Wire Provider + Register in Catalog

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/catalog/widgetCatalog.jsx`

- [ ] **Step 1: Add CalendarProvider to App.jsx**

In `src/App.jsx`, add the import at the top (after the existing imports):

```jsx
import { CalendarProvider } from './store/calendarStore.jsx';
```

Then replace the `App` export function:

```jsx
export default function App() {
  return (
    <MetaProvider>
      <CalendarProvider>
        <DashboardTabs />
        <AppInner />
      </CalendarProvider>
    </MetaProvider>
  );
}
```

- [ ] **Step 2: Add widgets to widgetCatalog.jsx**

At the top of `src/catalog/widgetCatalog.jsx`, add two imports after the `NavegadorDashboard` import:

```jsx
import CalendarioMini from '../components/widgets/CalendarioMini';
import CalendarioDia  from '../components/widgets/CalendarioDia';
```

At the bottom of `WIDGET_CATALOG`, after the `// ── NAVEGACIÓN ──` block (before the closing `]`), add:

```jsx
  // ── UTILIDADES ──
  { id: 'calendario-mini', category: 'Utilidades', categoryIcon: '📅', icon: '📅', name: 'Calendario Mini',
    sizes: ['1x1'],
    defaultConfig: { name: 'Calendario' },
    component: CalendarioMini },
  { id: 'calendario-dia', category: 'Utilidades', categoryIcon: '📅', icon: '🗓', name: 'Calendario',
    sizes: ['2x2', '2x4', '4x4'],
    defaultConfig: { name: 'Agenda' },
    component: CalendarioDia },
```

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx src/catalog/widgetCatalog.jsx
git commit -m "feat: register CalendarioMini and CalendarioDia widgets in catalog"
```

---

## Task 6: Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify CalendarioMini**
  - Drag "Calendario Mini" (1×1) from sidebar onto the canvas
  - Confirm it shows today's weekday, day number, and month
  - Long-press the widget → month modal opens
  - Navigate months with ‹ › arrows
  - Click a day → event list shows (empty initially)
  - Click "+ Añadir" → create modal opens, save an event
  - Confirm event appears in the list and a dot appears on the day cell
  - Close and reopen modal → event persists (localStorage)

- [ ] **Step 3: Verify CalendarioDia**
  - Drag "Calendario" (2×2, 2×4, or 4×4) onto canvas
  - Confirm header shows today's date with ‹ › arrows and + button
  - Click + → create event modal opens with today pre-filled, save
  - Confirm event appears in the day list
  - Navigate to another day with › arrow — event disappears
  - Navigate back — event reappears
  - Click an existing event → edit modal opens, change title → Guardar
  - Open edit modal again → click Eliminar → event removed

- [ ] **Step 4: Verify shared store**
  - With both widgets on canvas, create an event in CalendarioDia
  - Open CalendarioMini month modal and navigate to that day
  - Confirm the event appears in CalendarioMini's event list too

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: calendar widget smoke test fixes"
```

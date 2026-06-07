import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLongPress } from './widgetUtils';
import { useCalendar } from '../../store/calendarStore';
import CalendarioEventModal from './CalendarioEventModal';

const DAY_NAMES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
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

function firstWeekdayOffset(year, month) {
  const dow = new Date(year, month, 1).getDay();
  return dow === 0 ? 6 : dow - 1;
}

function buildIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

function MonthModal({ onClose, accentColor }) {
  const { state } = useCalendar();
  const today = todayISO();
  const todayParts = isoToDateParts(today);

  const [viewYear,     setViewYear]     = useState(todayParts.year);
  const [viewMonth,    setViewMonth]    = useState(todayParts.month);
  const [selectedDay,  setSelectedDay]  = useState(today);
  const [creating,     setCreating]     = useState(false);
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
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const allEvents = [...state.events, ...(state.googleEvents || [])];
  const eventDates  = new Set(allEvents.filter(e => e.date.startsWith(monthPrefix)).map(e => e.date));

  const selectedEvents = allEvents
    .filter(e => e.date === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const stop = e => e.stopPropagation();

  if (creating) {
    return <CalendarioEventModal defaultDate={selectedDay} onClose={() => setCreating(false)} accentColor={accentColor} />;
  }
  if (editingEvent) {
    return <CalendarioEventModal event={editingEvent} onClose={() => setEditingEvent(null)} accentColor={accentColor} />;
  }

  const selParts = isoToDateParts(selectedDay);

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
            const iso        = buildIso(viewYear, viewMonth, day);
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
                }}
              >
                {day}
                {hasEvents && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#fff' : accentColor, margin: '1px auto 0' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Selected day events */}
        <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {DAY_NAMES[selParts.weekday]} {selParts.day} {MONTH_SHORT[selParts.month]}
            </span>
            <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={() => setCreating(true)}>+ Añadir</button>
          </div>
          {selectedEvents.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', padding: '8px 0' }}>Sin eventos</div>
          )}
          {selectedEvents.map(ev => {
            const evColor = ev.isGoogle ? ev.accountColor : accentColor;
            return (
              <div
                key={ev.id}
                onMouseDown={stop}
                onClick={() => !ev.isGoogle && setEditingEvent(ev)}
                style={{ borderLeft: `3px solid ${evColor}`, padding: '4px 8px', marginBottom: 6, cursor: ev.isGoogle ? 'default' : 'pointer', borderRadius: '0 4px 4px 0', background: 'rgba(255,255,255,0.05)' }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{ev.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {ev.startTime} · {formatDuration(ev.duration)}
                  {ev.isGoogle && <span style={{ marginLeft: 6, opacity: 0.5 }}>☁️ Google</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Clic fuera para cerrar</div>
      </div>
    </div>,
    document.body
  );
}

export default function CalendarioMini({ accentColor }) {
  const { state } = useCalendar();
  const [modal, setModal] = useState(false);
  const longPress = useLongPress(() => setModal(true));

  const today = todayISO();
  const { month, day, weekday, year } = isoToDateParts(today);
  const allEvents = [...state.events, ...(state.googleEvents || [])];
  const dots = Math.min(allEvents.filter(e => e.date === today).length, 3);

  const isWeekend = weekday === 0 || weekday === 6;
  const headerColor = isWeekend ? '#ef4444' : accentColor;

  return (
    <div className="w-body" style={{ padding: 0, gap: 0, cursor: 'pointer', background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)' }} {...longPress}>
      {/* Cabecera del día (estilo icono de calendario clásico) */}
      <div style={{
        background: headerColor,
        color: '#fff',
        textAlign: 'center',
        fontSize: 9,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 2,
        padding: '5px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}>
        {DAY_NAMES[weekday]}
      </div>
      
      {/* Cuerpo central: Número y Mes */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 4 }}>
        <div style={{ 
          fontSize: 44, fontWeight: 900, color: 'var(--text-primary)', 
          lineHeight: 1, letterSpacing: -1, textShadow: '0 2px 12px rgba(0,0,0,0.35)' 
        }}>
          {day}
        </div>
        <div style={{ 
          fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, 
          textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 
        }}>
          {MONTH_SHORT[month]} {year}
        </div>
        
        {/* Puntos de eventos */}
        <div style={{ display: 'flex', gap: 4, marginTop: 6, height: 4 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ 
              width: 4, height: 4, borderRadius: '50%', 
              background: i < dots ? headerColor : 'rgba(255,255,255,0.08)',
              boxShadow: i < dots ? `0 0 6px ${headerColor}88` : 'none'
            }} />
          ))}
        </div>
      </div>
      {modal && <MonthModal onClose={() => setModal(false)} accentColor={accentColor} />}
    </div>
  );
}

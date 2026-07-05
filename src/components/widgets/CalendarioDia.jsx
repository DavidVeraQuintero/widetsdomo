import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLongPress, ModalBase } from './widgetUtils';
import { useCalendar } from '../../store/calendarStore';
import CalendarioEventModal from './CalendarioEventModal';
import { useGoogleLogin } from '@react-oauth/google';

const DAY_NAMES   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DAY_SHORT   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoToDateParts(iso) {
  // Parse YYYY-MM-DD format
  const match = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return { year: 2026, month: 0, day: 1, weekday: 0 };

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // 0-indexed
  const day = parseInt(match[3], 10);

  // Use UTC to avoid timezone issues
  const d = new Date(Date.UTC(year, month, day));

  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    weekday: d.getUTCDay()
  };
}

function addDays(isoDate, n) {
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return isoDate;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const d = new Date(Date.UTC(year, month, day));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
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
  return m ? `${h}h ${m}m` : `${h}h`;
}

function ConfigModal({ config, onConfigChange, onClose, accentColor }) {
  const { state, dispatch } = useCalendar();
  const [name, setName] = useState(config.name ?? 'Agenda');
  const stop = e => e.stopPropagation();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const info = await res.json();
        const colors = ['#4285F4', '#0F9D58', '#F4B400', '#DB4437'];
        const color = colors[state.accounts.length % colors.length];
        dispatch({
          type: 'ADD_ACCOUNT',
          payload: {
            id: info.sub,
            email: info.email,
            name: info.name,
            avatarUrl: info.picture,
            accessToken: tokenResponse.access_token,
            color
          }
        });
      } catch (err) {
        console.error('Error fetching Google user info', err);
      }
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly'
  });

  function save() { onConfigChange({ ...config, name }); onClose(); }

  return (
    <ModalBase title="⚙ Ajustes del Calendario" onClose={onClose} borderColor={accentColor}>
      <div onClick={stop} onMouseDown={stop} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Nombre del widget</div>
          <input
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 6, color: 'var(--text-primary)', padding: '6px 10px', fontSize: 12, width: '100%', boxSizing: 'border-box' }}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Cuentas Vinculadas</div>
          {state.accounts.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>No hay cuentas de Google vinculadas.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {state.accounts.map(acc => (
                <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '6px 8px', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {acc.avatarUrl ? <img src={acc.avatarUrl} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} /> : <div style={{ width: 20, height: 20, borderRadius: '50%', background: acc.color }} />}
                    <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>{acc.email}</div>
                  </div>
                  <button className="w-btn w-btn-sm" style={{ borderColor: '#ef4444', color: '#ef4444', padding: '2px 6px', fontSize: 12 }} onClick={() => dispatch({ type: 'REMOVE_ACCOUNT', id: acc.id })}>
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="w-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => login()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Vincular cuenta Google
          </button>
        </div>

        <button className="w-btn" style={{ width: '100%', background: accentColor, borderColor: accentColor, color: '#fff', marginTop: 8 }} onClick={save}>
          Cerrar
        </button>
      </div>
    </ModalBase>
  );
}

function EventList({ events, fontSize, accentColor, onEdit }) {
  if (events.length === 0) {
    return <div style={{ fontSize: 12, color: '#fff', textAlign: 'center', marginTop: 12 }}>Sin eventos programados</div>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {events.map(ev => {
        const evColor = ev.isGoogle ? ev.accountColor : accentColor;
        return (
          <div
            key={ev.id}
            onClick={e => { e.stopPropagation(); if(onEdit) onEdit(ev); }}
            onMouseDown={e => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              borderLeft: `3px solid ${evColor}`,
              padding: '6px 8px',
              borderRadius: '0 6px 6px 0',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              cursor: onEdit ? 'pointer' : 'default',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: fontSize + 1, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.title}
              </div>
              <div style={{ fontSize: fontSize, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ev.startTime}</span>
                <span style={{ opacity: 0.4 }}>•</span>
                <span>{formatDuration(ev.duration)}</span>
                {ev.isGoogle && <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" alt="G" style={{ width: 11, height: 11, marginLeft: 'auto', opacity: 0.8 }} />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={prevMonth}>‹</button>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '1rem' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={nextMonth}>›</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '0.14rem', marginBottom: '0.28rem' }}>
          {['L','M','X','J','V','S','D'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.95)', fontWeight: 600, paddingBottom: '0.14rem' }}>{d}</div>
          ))}
        </div>

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
                  textAlign: 'center', cursor: 'pointer', borderRadius: '0.35rem', padding: '0.21rem 0',
                  minHeight: '1.43rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  background: isSelected ? accentColor : isToday ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isSelected ? '#fff' : isToday ? accentColor : 'var(--text-primary)',
                  fontWeight: isToday || isSelected ? 700 : 400,
                  fontSize: 12,
                }}
              >
                {day}
                {hasEvents && (
                  <div style={{ width: '0.28rem', height: '0.28rem', borderRadius: '50%', background: isSelected ? '#fff' : accentColor, margin: '0.07rem auto 0' }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {DAY_NAMES[selParts.weekday]} {selParts.day} {MONTH_SHORT[selParts.month]}
            </span>
            <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={() => setCreating(true)}>+ Añadir</button>
          </div>
          {selectedEvents.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: '8px 0' }}>Sin eventos</div>
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
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {ev.startTime} · {formatDuration(ev.duration)}
                  {ev.isGoogle && <span style={{ marginLeft: 6, opacity: 0.5 }}>☁️ Google</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Clic fuera para cerrar</div>
      </div>
    </div>,
    document.body
  );
}

function StackedEvents({ events, totalEvents, currentIndex, fontSize, accentColor, onEdit, onNext, onPrev }) {
  if (events.length === 0) return <div style={{ fontSize: 12, color: '#fff', textAlign: 'center', marginTop: 12 }}>Sin eventos programados</div>;
  
  const behind = events.slice(1, 4); // max 3 behind
  const activeEv = events[0];
  const activeColor = activeEv.isGoogle ? (activeEv.accountColor || '#4285F4') : accentColor;
  const offsetStep = 5;

  return (
    <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}>
      {/* Hojas de fondo */}
      {[...behind].reverse().map((ev, ri) => {
        const i = behind.length - 1 - ri;
        const depth = i + 1;
        const evColor = ev.isGoogle ? (ev.accountColor || '#4285F4') : accentColor;
        
        return (
          <div
            key={ev.id + '-' + depth}
            style={{
              position: 'absolute',
              top: depth * offsetStep,
              right: depth * offsetStep,
              bottom: (behind.length - depth) * offsetStep,
              left: (behind.length - depth) * offsetStep,
              zIndex: 10 - depth,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              boxShadow: '-2px 3px 10px rgba(0,0,0,0.3)',
              borderLeft: `3px solid ${evColor}`,
              borderBottom: `1px solid rgba(0,0,0,0.1)`,
              pointerEvents: 'none',
              transition: 'all 220ms ease'
            }}
          />
        );
      })}

      {/* Nota Activa */}
      <div
        onClick={e => { e.stopPropagation(); if(onEdit && !activeEv.isGoogle) onEdit(activeEv); }}
        onMouseDown={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0, right: behind.length * offsetStep,
          bottom: behind.length * offsetStep, left: 0,
          zIndex: 10,
          borderRadius: 8,
          borderLeft: `4px solid ${activeColor}`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
          boxShadow: '-3px 4px 12px rgba(0,0,0,0.4)',
          padding: '10px 12px',
          display: 'flex', flexDirection: 'column',
          cursor: onEdit && !activeEv.isGoogle ? 'pointer' : 'default',
          transition: 'all 220ms ease'
        }}
      >
        <div style={{ fontSize: fontSize + 1, fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
          {activeEv.title}
        </div>
        <div style={{ fontSize: fontSize, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{activeEv.startTime}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>{formatDuration(activeEv.duration)}</span>
          {activeEv.isGoogle && <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" alt="G" style={{ width: 11, height: 11, marginLeft: 'auto', opacity: 0.8 }} />}
        </div>
        
        {/* Controles de navegación */}
        {totalEvents > 1 && (
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{currentIndex + 1} de {totalEvents}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="w-btn w-btn-sm" style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.2)', borderColor: 'transparent' }} onClick={e => { e.stopPropagation(); onPrev(); }}>‹</button>
              <button className="w-btn w-btn-sm" style={{ padding: '2px 8px', background: 'rgba(0,0,0,0.2)', borderColor: 'transparent' }} onClick={e => { e.stopPropagation(); onNext(); }}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarioDia({ size = '2x2', config, onConfigChange, accentColor }) {
  const { state } = useCalendar();
  const [viewDate,     setViewDate]     = useState(todayISO());
  const [configModal,  setConfigModal]  = useState(false);
  const [createModal,  setCreateModal]  = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [activeEventIdx, setActiveEventIdx] = useState(0);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    setActiveEventIdx(0);
  }, [viewDate]);

  const longPress = useLongPress(() => setConfigModal(true));
  const stop = e => e.stopPropagation();

  // Combine and sort local + google events
  const allEvents = [...state.events, ...(state.googleEvents || [])];
  const dayEvents = allEvents
    .filter(e => e.date === viewDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const parts = isoToDateParts(viewDate);
  const isWeekend = parts.weekday === 0 || parts.weekday === 6;
  const headerColor = isWeekend ? '#ef4444' : accentColor;

  const realIdx = Math.min(activeEventIdx, Math.max(0, dayEvents.length - 1));
  const orderedEvents = dayEvents.length > 0
    ? (realIdx === 0 ? dayEvents : [...dayEvents.slice(realIdx), ...dayEvents.slice(0, realIdx)])
    : [];

  // Handle 1x1 mini calendar
  if (size === '1x1') {
    const today = todayISO();
    const dots = Math.min(allEvents.filter(e => e.date === today).length, 3);
    const todayParts = isoToDateParts(today);
    const miniHeaderColor = todayParts.weekday === 0 || todayParts.weekday === 6 ? '#ef4444' : accentColor;

    return (
      <div
        className="w-body"
        style={{
          padding: 0,
          gap: 0,
          cursor: 'pointer',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 8,
          height: '100%'
        }}
        {...useLongPress(() => setModal(true))}
      >
        <div style={{
          background: 'transparent',
          color: miniHeaderColor,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          padding: '6px 4px',
          borderBottom: `2px solid ${miniHeaderColor}`,
          borderRadius: '8px 8px 0 0',
          transition: 'color 200ms ease, border-color 200ms ease'
        }}>
          {DAY_NAMES[todayParts.weekday].substring(0, 3)}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', gap: 3 }}>
          <div style={{
            fontSize: 24,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            transition: 'all 200ms ease'
          }}>
            {todayParts.day}
          </div>

          <div style={{
            fontSize: 12,
            color: miniHeaderColor,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0,
            transition: 'color 200ms ease'
          }}>
            {MONTH_SHORT[todayParts.month]}
          </div>

          {dots > 0 && (
            <div style={{ display: 'flex', gap: 2, marginTop: 2, height: 3 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: i < dots ? miniHeaderColor : 'rgba(255,255,255,0.1)',
                  transition: 'all 200ms ease'
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Layout 2x2 (Compacto)
  // -------------------------------------------------------------
  if (size === '2x2') {
    return (
      <div className="w-body" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05))' }} {...longPress}>
        <div style={{ borderBottom: `2px solid ${headerColor}`, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 4px 12px trasparent 33`, transition: 'all 200ms ease' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>{DAY_NAMES[parts.weekday]}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1, marginTop: 2 }}>{parts.day} <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{MONTH_SHORT[parts.month]}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="w-btn w-btn-sm" style={{ padding: '4px 6px', fontSize: 12, background: 'rgba(255,255,255,0.15)', border: 'none' }} onClick={() => setViewDate(d => addDays(d, -1))} onMouseDown={stop}>‹</button>
            <button className="w-btn w-btn-sm" style={{ padding: '4px 6px', fontSize: 12, background: 'rgba(255,255,255,0.15)', border: 'none' }} onClick={() => setViewDate(d => addDays(d, 1))} onMouseDown={stop}>›</button>
          </div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px', display: 'flex' }}>
          <StackedEvents
            events={orderedEvents}
            totalEvents={dayEvents.length}
            currentIndex={realIdx}
            fontSize={11}
            accentColor={accentColor}
            onEdit={setEditingEvent}
            onNext={() => setActiveEventIdx(i => (i + 1) % dayEvents.length)}
            onPrev={() => setActiveEventIdx(i => (i - 1 + dayEvents.length) % dayEvents.length)}
          />
        </div>
        {configModal && <ConfigModal config={config} onConfigChange={onConfigChange} onClose={() => setConfigModal(false)} accentColor={accentColor} />}
        {editingEvent && <CalendarioEventModal event={editingEvent} onClose={() => setEditingEvent(null)} accentColor={accentColor} />}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Layout 2x4 (Vertical)
  // -------------------------------------------------------------
  if (size === '2x4') {
    return (
      <div className="w-body" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05))' }} {...longPress}>
        <div style={{  borderBottom: `2px solid ${headerColor}`, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', boxShadow: `0 4px 12px trasparent 33`, transition: 'all 200ms ease' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>{DAY_NAMES[parts.weekday]}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1, marginTop: 3 }}>{parts.day}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)', marginTop: 3 }}>{MONTH_NAMES[parts.month]} {parts.year}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              <button className="w-btn w-btn-sm" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', padding: '4px 8px', fontSize: 12, border: 'none' }} onClick={() => setViewDate(d => addDays(d, -1))} onMouseDown={stop}>‹</button>
              <button className="w-btn w-btn-sm" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', padding: '4px 8px', fontSize: 12, border: 'none' }} onClick={() => setViewDate(d => addDays(d, 1))} onMouseDown={stop}>›</button>
            </div>
            <button className="w-btn w-btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 11, border: 'none' }} onClick={() => setCreateModal(true)} onMouseDown={stop}>+ Evento</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <EventList events={dayEvents} fontSize={12} accentColor={accentColor} onEdit={ev => !ev.isGoogle && setEditingEvent(ev)} />
        </div>
        {configModal && <ConfigModal config={config} onConfigChange={onConfigChange} onClose={() => setConfigModal(false)} accentColor={accentColor} />}
        {createModal && <CalendarioEventModal defaultDate={viewDate} onClose={() => setCreateModal(false)} accentColor={accentColor} />}
        {editingEvent && <CalendarioEventModal event={editingEvent} onClose={() => setEditingEvent(null)} accentColor={accentColor} />}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Layout 4x4 (Split View)
  // -------------------------------------------------------------
  const startOffset = firstWeekdayOffset(parts.year, parts.month);
  const totalDays = daysInMonth(parts.year, parts.month);
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  const monthPrefix = `${parts.year}-${String(parts.month + 1).padStart(2, '0')}`;
  const eventDates = new Set(allEvents.filter(e => e.date.startsWith(monthPrefix)).map(e => e.date));

  return (
    <div className="w-body" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'row' }} {...longPress}>
      {/* Panel Izquierdo: Calendario */}
      <div style={{ flex: '1.2', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }} onMouseDown={stop}>
        <div style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${headerColor}`, transition: 'border-color 200ms ease' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', flex: 1, minWidth: 0 }}>{MONTH_NAMES[parts.month]} {parts.year}</span>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button className="w-btn w-btn-sm" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', padding: '4px 8px', fontSize: 12, border: 'none', color: '#fff' }} onClick={() => setViewDate(d => buildIso(parts.year, parts.month - 1, 1))}>‹</button>
            <button className="w-btn w-btn-sm" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', padding: '4px 8px', fontSize: 12, border: 'none', color: '#fff' }} onClick={() => setViewDate(todayISO())}>Hoy</button>
            <button className="w-btn w-btn-sm" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', padding: '4px 8px', fontSize: 12, border: 'none', color: '#fff' }} onClick={() => setViewDate(d => buildIso(parts.year, parts.month + 1, 1))}>›</button>
          </div>
        </div>
        
        <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
            {['L','M','X','J','V','S','D'].map((d, i) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: (i===5||i===6) ? '#ef4444' : 'var(--text-secondary)' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: '1fr', gap: 4, flex: 1 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const iso = buildIso(parts.year, parts.month, day);
              const isToday = iso === todayISO();
              const isSelected = iso === viewDate;
              const hasEvents = eventDates.has(iso);
              return (
                <div
                  key={i}
                  onClick={() => setViewDate(iso)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', borderRadius: 8,
                    background: 'transparent',
                    border: isSelected || isToday ? `2px solid ${accentColor}` : '2px solid transparent',
                    color: 'var(--text-primary)',
                    fontWeight: isSelected || isToday ? 800 : 500,
                    fontSize: 13,
                    transition: 'all 150ms ease',
                  }}
                >
                  {day}
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: hasEvents ? (isSelected ? '#fff' : accentColor) : 'transparent', marginTop: 2 }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel Derecho: Agenda */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }} onMouseDown={stop}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 200ms ease' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: headerColor, transition: 'color 200ms ease' }}>{DAY_NAMES[parts.weekday]}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{parts.day} de {MONTH_NAMES[parts.month]}</div>
          </div>
          <button className="w-btn w-btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 12, border: 'none' }} onClick={() => setCreateModal(true)}>+ Evento</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          <EventList events={dayEvents} fontSize={12} accentColor={accentColor} onEdit={ev => !ev.isGoogle && setEditingEvent(ev)} />
        </div>
      </div>

      {configModal && <ConfigModal config={config} onConfigChange={onConfigChange} onClose={() => setConfigModal(false)} accentColor={accentColor} />}
      {createModal && <CalendarioEventModal defaultDate={viewDate} onClose={() => setCreateModal(false)} accentColor={accentColor} />}
      {editingEvent && <CalendarioEventModal event={editingEvent} onClose={() => setEditingEvent(null)} accentColor={accentColor} />}
    </div>
  );
}

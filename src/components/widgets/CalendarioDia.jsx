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
        <button
          className="w-btn"
          style={{ width: '100%', background: accentColor, borderColor: accentColor, color: '#fff' }}
          onClick={save}
          onMouseDown={stop}
        >
          Guardar
        </button>
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
        <span style={{ fontSize, fontWeight: 700, color: 'var(--text-primary)' }}>
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
              <div style={{ fontSize, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.title}
              </div>
              <div style={{ fontSize: fontSize - 1, color: 'var(--text-secondary)' }}>
                {ev.startTime} · {formatDuration(ev.duration)}
              </div>
            </div>
          </div>
        ))}
      </div>

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

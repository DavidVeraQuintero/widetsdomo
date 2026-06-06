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

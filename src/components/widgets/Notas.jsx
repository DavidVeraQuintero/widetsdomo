// src/components/widgets/Notas.jsx
import { useState } from 'react';
import { useLongPress, ModalBase } from './widgetUtils';
import SvgIcon from './SvgIcon';

/* ─── Paleta de colores tipo papel ─── */
const NOTE_COLORS = [
  { id: 'cream',    label: 'Crema',    bg: ['#fdf6ee', '#f5ead9'], line: 'rgba(180,150,100,0.18)', margin: 'rgba(220,80,80,0.25)',   text: '#1e293b', sub: '#475569' },
  { id: 'yellow',   label: 'Amarillo', bg: ['#fef9c3', '#fde047'], line: 'rgba(160,140,0,0.18)',   margin: 'rgba(220,80,80,0.25)',   text: '#1a1200', sub: '#3b2e00' },
  { id: 'green',    label: 'Verde',    bg: ['#bbf7d0', '#4ade80'], line: 'rgba(0,120,60,0.15)',    margin: 'rgba(5,90,40,0.35)',     text: '#052e16', sub: '#14532d' },
  { id: 'blue',     label: 'Azul',     bg: ['#bfdbfe', '#60a5fa'], line: 'rgba(0,60,160,0.15)',   margin: 'rgba(30,50,180,0.35)',   text: '#0c1a4d', sub: '#1e3a8a' },
  { id: 'purple',   label: 'Morado',   bg: ['#ddd6fe', '#a78bfa'], line: 'rgba(90,0,180,0.13)',   margin: 'rgba(100,30,200,0.35)',  text: '#1e0052', sub: '#3b0764' },
  { id: 'pink',     label: 'Rosa',     bg: ['#fbcfe8', '#f472b6'], line: 'rgba(180,0,100,0.12)',  margin: 'rgba(160,0,80,0.35)',    text: '#4a0022', sub: '#831843' },
  { id: 'orange',   label: 'Naranja',  bg: ['#fed7aa', '#fb923c'], line: 'rgba(180,80,0,0.15)',   margin: 'rgba(180,60,0,0.35)',    text: '#3a1200', sub: '#7c2d12' },
  { id: 'teal',     label: 'Turquesa', bg: ['#99f6e4', '#2dd4bf'], line: 'rgba(0,130,120,0.15)',  margin: 'rgba(0,100,100,0.35)',   text: '#012a26', sub: '#134e4a' },
  { id: 'rose',     label: 'Lila',     bg: ['#f5d0fe', '#e879f9'], line: 'rgba(150,0,200,0.12)',  margin: 'rgba(130,0,180,0.35)',   text: '#3b0058', sub: '#701a75' },
  { id: 'dark',     label: 'Oscuro',   bg: ['#1e293b', '#0f172a'], line: 'rgba(255,255,255,0.07)', margin: 'rgba(100,149,237,0.4)', text: '#f1f5f9', sub: '#94a3b8' },
];

const DEFAULT_COLOR = 'cream';

function getColorDef(id) {
  return NOTE_COLORS.find(c => c.id === id) ?? NOTE_COLORS[0];
}

/* ─── Selector de color ─── */
function ColorPicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Color de nota
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {NOTE_COLORS.map(c => (
          <button
            key={c.id}
            title={c.label}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onChange(c.id); }}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: `linear-gradient(135deg, ${c.bg[0]}, ${c.bg[1]})`,
              border: value === c.id ? '2px solid #fff' : '2px solid transparent',
              boxShadow: value === c.id ? '0 0 0 2px rgba(255,255,255,0.4)' : '0 1px 4px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              transform: value === c.id ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 150ms ease',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Modal para crear / editar nota ─── */
function NotasModal({ note, onSave, onDelete = () => {}, onClose, accentColor }) {
  const isNew = !note;
  const [title,  setTitle]  = useState(note?.title ?? '');
  const [body,   setBody]   = useState(note?.body  ?? '');
  const [colorId, setColorId] = useState(note?.colorId ?? DEFAULT_COLOR);
  const stop = e => e.stopPropagation();

  const col = getColorDef(colorId);

  return (
    <ModalBase
      title={isNew ? 'Nueva nota' : 'Editar nota'}
      onClose={onClose}
      borderColor={accentColor}
    >
      {/* Preview mini de la nota */}
      <div style={{
        background: `linear-gradient(160deg, ${col.bg[0]}, ${col.bg[1]})`,
        borderRadius: 8,
        padding: '8px 12px',
        marginBottom: 12,
        borderLeft: `3px solid ${col.margin.replace('0.2)', '0.7)').replace('0.3)', '0.7)')}`,
        minHeight: 28,
        fontSize: 12,
        color: col.text,
        fontWeight: title ? 600 : 400,
        opacity: title ? 1 : 0.5,
        transition: 'background 200ms',
      }}>
        {title || 'Vista previa…'}
      </div>

      <ColorPicker value={colorId} onChange={setColorId} />

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onMouseDown={stop}
        placeholder="Título de la nota"
        style={{
          width: '100%', background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8,
          color: 'var(--text-primary)', padding: '8px 10px', fontSize: 13,
          marginBottom: 10, outline: 'none', boxSizing: 'border-box',
        }}
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        onMouseDown={stop}
        placeholder={'— elemento\n— elemento'}
        rows={5}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8,
          color: 'var(--text-primary)', padding: '8px 10px', fontSize: 12,
          resize: 'vertical', outline: 'none', lineHeight: 1.5, boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          className="w-btn"
          style={{ flex: 1 }}
          disabled={!title.trim()}
          onClick={e => { stop(e); if (title.trim()) onSave({ title: title.trim(), body: body.trim(), colorId }); }}
          onMouseDown={stop}
        >
          {isNew ? '✓ Crear' : '✓ Guardar'}
        </button>
        {!isNew && (
          <button
            className="w-btn"
            style={{ color: '#ef4444', borderColor: '#ef4444' }}
            onClick={e => { stop(e); onDelete(); }}
            onMouseDown={stop}
          >
            Eliminar
          </button>
        )}
      </div>
    </ModalBase>
  );
}

/* ─── Hojas de fondo (efecto abanico diagonal) ─── */
function StackSheets({ notes, offsetStep = 6 }) {
  const behind = notes.slice(1, 4); // máx 3 hojas
  if (behind.length === 0) return null;
  const totalBehind = behind.length;

  return (
    <>
      {[...behind].reverse().map((note, ri) => {
        const i = behind.length - 1 - ri; // 0 = la más cercana a la activa
        const depth = i + 1; // 1, 2, 3
        const col = getColorDef(note.colorId ?? DEFAULT_COLOR);
        
        return (
          <div
            key={note.id}
            style={{
              position: 'absolute',
              top: depth * offsetStep,
              right: depth * offsetStep,
              bottom: (totalBehind - depth) * offsetStep,
              left: (totalBehind - depth) * offsetStep,
              zIndex: 10 - depth,
              borderRadius: 12,
              background: `linear-gradient(160deg, ${col.bg[0]}, ${col.bg[1]})`,
              boxShadow: '-3px 4px 12px rgba(0,0,0,0.3)',
              borderLeft: `1px solid rgba(255,255,255,0.4)`,
              borderBottom: `1px solid rgba(0,0,0,0.1)`,
              pointerEvents: 'none',
              transition: 'all 220ms ease'
            }}
          >
            {/* Margen simulado para mantener el estilo de nota */}
            <div style={{
              position: 'absolute', left: 24, top: 0, bottom: 0,
              width: 1, background: col.margin, opacity: 0.5
            }} />
          </div>
        );
      })}
    </>
  );
}

/* ─── Contador X de Y ─── */
function NoteCounter({ total, current, accentColor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1 }}>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {Array.from({ length: Math.min(total, 6) }, (_, i) => (
          <div key={i} style={{
            width: i === current ? 10 : 5, height: 5, borderRadius: 3,
            background: i === current ? accentColor : 'rgba(255,255,255,0.18)',
            transition: 'all 200ms ease',
          }} />
        ))}
        {total > 6 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 1 }}>…</div>}
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: accentColor,
        background: `${accentColor}18`, borderRadius: 6, padding: '1px 7px',
        letterSpacing: 0.3, whiteSpace: 'nowrap',
      }}>
        {current + 1} <span style={{ opacity: 0.5, fontWeight: 400 }}>de</span> {total}
      </div>
    </div>
  );
}

/* ─── Papel de nota ─── */
function NotePaper({ note, style: extraStyle, showBody = true, longPressProps = {} }) {
  const col = getColorDef(note?.colorId ?? DEFAULT_COLOR);

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 10,
        background: `linear-gradient(160deg, ${col.bg[0]} 0%, ${col.bg[1]} 100%)`,
        borderRadius: '0.85rem',
        padding: '1rem 1rem 0.71rem',
        boxShadow: '-4px 6px 18px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: 'all 220ms ease',
        ...extraStyle,
      }}
      {...longPressProps}
    >
      {/* Líneas de fondo */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '0.85rem' }}>
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0,
            top: 36 + i * 22, height: 1,
            background: col.line,
          }} />
        ))}
        {/* Margen */}
        <div style={{
          position: 'absolute', left: 36, top: 0, bottom: 0,
          width: 1, background: col.margin,
        }} />
      </div>

      {/* Título */}
      <div style={{
        fontSize: '0.92rem', fontWeight: 800, color: col.text,
        marginBottom: '0.57rem', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', paddingLeft: '2rem', flexShrink: 0,
      }}>
        {note.title}
      </div>

      {/* Cuerpo */}
      {showBody && (
        <div style={{
          flex: 1, fontSize: 12, color: col.sub,
          lineHeight: 1.65, whiteSpace: 'pre-line', overflow: 'hidden', paddingLeft: '2rem',
        }}>
          {note.body || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Sin contenido</span>}
        </div>
      )}

      {/* Fecha */}
      <div style={{
        fontSize: 12, color: col.sub, marginTop: '0.42rem',
        textAlign: 'right', flexShrink: 0, opacity: 0.7,
      }}>
        {new Date(note.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
        {showBody && <span style={{ opacity: 0.6 }}> · mantén para editar</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Widget principal
══════════════════════════════════════════ */
export default function Notas({ size, config, onConfigChange, accentColor }) {
  const { name = 'Mis notas', notes = [], activeId = null } = config;
  const [modal,     setModal]     = useState(null);
  const [slideDir,  setSlideDir]  = useState(null);
  const [animating, setAnimating] = useState(false);
  const stop = e => e.stopPropagation();

  /* Índice activo */
  const realIdx  = notes.length === 0 ? -1
    : Math.max(0, notes.findIndex(n => n.id === activeId));
  const activeNote = realIdx >= 0 ? notes[realIdx] : null;

  /* Navegar */
  function navigate(dir) {
    if (animating || notes.length <= 1) return;
    const nextIdx = dir === 'right'
      ? (realIdx + 1) % notes.length
      : (realIdx - 1 + notes.length) % notes.length;
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => {
      onConfigChange({ ...config, activeId: notes[nextIdx].id });
      setSlideDir(null);
      setAnimating(false);
    }, 220);
  }

  const longPress = useLongPress(() => { if (activeNote) setModal('edit'); });

  /* CRUD */
  function handleCreate({ title, body, colorId }) {
    const newNote = { id: Date.now().toString(), title, body, colorId, createdAt: Date.now() };
    onConfigChange({ ...config, notes: [newNote, ...notes], activeId: newNote.id });
    setModal(null);
  }

  function handleEdit({ title, body, colorId }) {
    onConfigChange({
      ...config,
      notes: notes.map(n => n.id === activeNote.id ? { ...n, title, body, colorId } : n),
    });
    setModal(null);
  }

  function handleDelete() {
    const next = notes.filter(n => n.id !== activeNote.id);
    onConfigChange({ ...config, notes: next, activeId: next[0]?.id ?? null });
    setModal(null);
  }

  const canAdd = notes.length < 10;

  /* Animación de deslizamiento */
  const slideStyle = slideDir === 'right'
    ? { transform: 'translateX(-60px)', opacity: 0 }
    : slideDir === 'left'
    ? { transform: 'translateX(60px)',  opacity: 0 }
    : { transform: 'translateX(0)',     opacity: 1 };

  /* ── Header ── */
  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.57rem', flexShrink: 0 }}>
      <div style={{ fontSize: 12, color: accentColor, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <SvgIcon id="note" size={14} color={accentColor} />
        {name}
        {notes.length > 0 && (
          <span style={{ background: `${accentColor}28`, color: accentColor, borderRadius: '0.57rem', padding: '0.07rem 0.35rem', fontSize: 12, fontWeight: 700 }}>
            {realIdx + 1}/{notes.length}
          </span>
        )}
      </div>
      {canAdd && (
        <button className="w-btn w-btn-sm"
          onClick={e => { stop(e); setModal('create'); }}
          onMouseDown={stop}
        >
          {size === '1x2' ? '+' : '+ Nueva'}
        </button>
      )}
    </div>
  );

  /* ── Modal ── */
  const modalEl = modal === 'create' ? (
    <NotasModal note={null} onSave={handleCreate} onClose={() => setModal(null)} accentColor={accentColor} />
  ) : modal === 'edit' && activeNote ? (
    <NotasModal note={activeNote} onSave={handleEdit} onDelete={handleDelete} onClose={() => setModal(null)} accentColor={accentColor} />
  ) : null;

  /* ── Barra de navegación ── */
  const navBar = notes.length > 1 && (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.28rem', marginTop: '0.28rem', flexShrink: 0 }}
      onMouseDown={stop} onClick={stop}
    >
      <button className="w-btn" onClick={e => { stop(e); navigate('left'); }} onMouseDown={stop}
        style={{ fontSize: size === '1x2' ? '0.85rem' : '1.14rem', padding: size === '1x2' ? '0.14rem 0.57rem' : '0.14rem 0.85rem', lineHeight: 1, flexShrink: 0 }}>
        ‹
      </button>
      <NoteCounter total={notes.length} current={realIdx} accentColor={accentColor} />
      <button className="w-btn" onClick={e => { stop(e); navigate('right'); }} onMouseDown={stop}
        style={{ fontSize: size === '1x2' ? 12 : 16, padding: size === '1x2' ? '2px 8px' : '2px 12px', lineHeight: 1, flexShrink: 0 }}>
        ›
      </button>
    </div>
  );

  /* ── Sin notas ── */
  if (notes.length === 0) {
    return (
      <div className="w-body" style={{ gap: 0 }}>
        {header}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-dim)' }}>
          <SvgIcon id="note" size={28} color="rgba(255,255,255,0.3)" />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Sin notas · toca + para crear</div>
        </div>
        {modalEl}
      </div>
    );
  }

  /* ── Layout 1x2 (estrecho) ── */
  if (size === '1x2') {
    const col         = getColorDef(activeNote?.colorId ?? DEFAULT_COLOR);
    const ordNotes1x2 = realIdx === 0 ? notes : [...notes.slice(realIdx), ...notes.slice(0, realIdx)];
    const offsetStep  = 4;
    const totalBehind = Math.min(ordNotes1x2.length - 1, 3);
    const activeOffset = totalBehind * offsetStep;

    return (
      <div className="w-body" style={{ gap: 0 }}>
        {header}
        <div style={{ position: 'relative', flex: 1, marginBottom: 0 }}>
          <StackSheets notes={ordNotes1x2} offsetStep={offsetStep} />
          <div
            style={{
              position: 'absolute', 
              top: 0, right: 0,
              bottom: activeOffset, left: activeOffset,
              zIndex: 10,
              background: `linear-gradient(160deg, ${col.bg[0]}, ${col.bg[1]})`,
              borderRadius: 10, padding: '8px',
              boxShadow: '-3px 4px 12px rgba(0,0,0,0.4)',
              overflow: 'hidden', cursor: 'pointer',
              transition: 'all 220ms ease',
              ...slideStyle,
            }}
            {...longPress}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: col.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeNote.title}
            </div>
            <div style={{ fontSize: 12, color: col.sub, lineHeight: 1.4, whiteSpace: 'pre-line', overflow: 'hidden' }}>
              {activeNote.body}
            </div>
          </div>
        </div>
        {navBar}
        {modalEl}
      </div>
    );
  }

  /* ── Layout estándar ── */
  const orderedNotes = realIdx === 0 ? notes : [...notes.slice(realIdx), ...notes.slice(0, realIdx)];
  const offsetStep   = 6;
  const totalBehind  = Math.min(orderedNotes.length - 1, 3);
  const activeOffset = totalBehind * offsetStep;

  return (
    <div className="w-body" style={{ gap: 0 }}>
      {header}
      <div style={{ position: 'relative', flex: 1, marginBottom: 0 }}>
        <StackSheets notes={orderedNotes} offsetStep={offsetStep} />
        <NotePaper
          note={activeNote}
          style={{ ...slideStyle, top: 0, right: 0, bottom: activeOffset, left: activeOffset }}
          longPressProps={longPress}
        />
      </div>
      {navBar}
      {modalEl}
    </div>
  );
}

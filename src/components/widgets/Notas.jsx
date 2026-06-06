// src/components/widgets/Notas.jsx
import { useState, useRef, useEffect } from 'react';
import { useLongPress, ModalBase } from './widgetUtils';

const PEEK_H = 32;
const PEEK_GAP = 6;

function getPaperTop(idx, numPeeks, stackH) {
  const peekTotal = numPeeks * PEEK_H + (numPeeks + 1) * PEEK_GAP;
  const activeH = Math.max(60, stackH - peekTotal);
  if (idx === 0) return 0;
  if (idx === 1) return activeH + PEEK_GAP;
  return activeH + PEEK_GAP * 2 + PEEK_H;
}

function getPaperHeight(idx, numPeeks, stackH) {
  if (idx === 0) {
    const peekTotal = numPeeks * PEEK_H + (numPeeks + 1) * PEEK_GAP;
    return Math.max(60, stackH - peekTotal);
  }
  return PEEK_H;
}

function NotasModal({ note, onSave, onDelete = () => {}, onClose, accentColor }) {
  const isNew = !note;
  const [title, setTitle] = useState(note?.title ?? '');
  const [body,  setBody]  = useState(note?.body  ?? '');
  const stop = e => e.stopPropagation();

  return (
    <ModalBase
      title={isNew ? '📝 Nueva nota' : '📝 Editar nota'}
      onClose={onClose}
      borderColor={accentColor}
    >
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onMouseDown={stop}
        placeholder="🛒 Título de la nota"
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          padding: '8px 10px',
          fontSize: 13,
          marginBottom: 10,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        onMouseDown={stop}
        placeholder={'— elemento\n— elemento'}
        rows={6}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 8,
          color: 'var(--text-primary)',
          padding: '8px 10px',
          fontSize: 12,
          resize: 'vertical',
          outline: 'none',
          lineHeight: 1.5,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button
          className="w-btn"
          style={{ flex: 1 }}
          disabled={!title.trim()}
          onClick={e => { stop(e); if (title.trim()) onSave({ title: title.trim(), body: body.trim() }); }}
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

export default function Notas({ size, config, onConfigChange, accentColor }) {
  const { name = 'Mis notas', notes = [], activeId = null } = config;
  const [modal, setModal]   = useState(null); // null | 'create' | 'edit'
  const containerRef        = useRef(null);
  const [stackH, setStackH] = useState(100);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setStackH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stop = e => e.stopPropagation();

  const effectiveActiveId = activeId ?? notes[0]?.id ?? null;
  const activeNote = notes.find(n => n.id === effectiveActiveId) ?? null;
  const orderedNotes = activeNote
    ? [activeNote, ...notes.filter(n => n.id !== activeNote.id)]
    : notes;

  const longPress = useLongPress(() => { if (activeNote) setModal('edit'); });

  function setActive(id) {
    onConfigChange({ ...config, activeId: id });
  }

  function handleCreate({ title, body }) {
    const newNote = { id: Date.now().toString(), title, body, createdAt: Date.now() };
    onConfigChange({ ...config, notes: [newNote, ...notes], activeId: newNote.id });
    setModal(null);
  }

  function handleEdit({ title, body }) {
    onConfigChange({
      ...config,
      notes: notes.map(n => n.id === activeNote.id ? { ...n, title, body } : n),
    });
    setModal(null);
  }

  function handleDelete() {
    const next = notes.filter(n => n.id !== activeNote.id);
    onConfigChange({ ...config, notes: next, activeId: next[0]?.id ?? null });
    setModal(null);
  }

  const canAdd = notes.length < 10;

  const modalEl = modal === 'create' ? (
    <NotasModal
      note={null}
      onSave={handleCreate}
      onClose={() => setModal(null)}
      accentColor={accentColor}
    />
  ) : modal === 'edit' && activeNote ? (
    <NotasModal
      note={activeNote}
      onSave={handleEdit}
      onDelete={handleDelete}
      onClose={() => setModal(null)}
      accentColor={accentColor}
    />
  ) : null;

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexShrink: 0 }}>
      <div style={{ fontSize: 9, color: accentColor, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
        📝 {name}
        {notes.length > 0 && (
          <span style={{ marginLeft: 5, background: `${accentColor}28`, color: accentColor, borderRadius: 8, padding: '1px 5px', fontSize: 8, fontWeight: 700 }}>
            {notes.length}/10
          </span>
        )}
      </div>
      {canAdd && (
        <button
          className="w-btn w-btn-sm"
          onClick={e => { stop(e); setModal('create'); }}
          onMouseDown={stop}
        >
          {size === '1x2' ? '+' : '+ Nueva'}
        </button>
      )}
    </div>
  );

  // ── 1x2: single paper, no cascade (too narrow) ──
  if (size === '1x2') {
    return (
      <div className="w-body" style={{ gap: 0 }}>
        {header}
        {activeNote ? (
          <div
            style={{
              flex: 1,
              background: 'linear-gradient(160deg, #fdf6ee, #f5ead9)',
              borderRadius: 8,
              padding: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            {...longPress}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>
              {activeNote.title}
            </div>
            <div style={{ fontSize: 9, color: '#475569', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
              {activeNote.body}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text-dim)' }}>
            Toca + para crear
          </div>
        )}
        {modalEl}
      </div>
    );
  }

  // ── Cascade layout (all other sizes) ──
  const visibleNotes = orderedNotes.slice(0, 3);
  const numPeeks = Math.min(visibleNotes.length - 1, 2);
  const leftOffsets = [0, 8, 14];
  const opacities   = [1, 0.85, 0.6];

  return (
    <div className="w-body" style={{ gap: 0 }}>
      {header}
      {notes.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-dim)' }}>
          Sin notas · toca + para crear
        </div>
      ) : (
        <div ref={containerRef} style={{ position: 'relative', flex: 1 }}>
          {visibleNotes.map((note, idx) => {
            const isActive = idx === 0;
            const left     = leftOffsets[idx] ?? 14;
            const top      = getPaperTop(idx, numPeeks, stackH);
            const height   = getPaperHeight(idx, numPeeks, stackH);
            const opacity  = opacities[idx] ?? 0.6;

            return (
              <div
                key={note.id}
                onClick={e => { stop(e); if (!isActive) setActive(note.id); }}
                onMouseDown={stop}
                {...(isActive ? longPress : {})}
                style={{
                  position: 'absolute',
                  top,
                  left,
                  right: 0,
                  height,
                  zIndex: 3 - idx,
                  opacity,
                  background: 'linear-gradient(160deg, #fdf6ee, #f5ead9)',
                  borderRadius: 8,
                  padding: isActive ? '9px 10px' : '6px 10px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
                  transition: 'top 220ms ease, height 220ms ease, left 200ms ease, opacity 200ms ease',
                  cursor: isActive ? 'default' : 'pointer',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{
                  fontSize: isActive ? 11 : 10,
                  fontWeight: 700,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: isActive ? 5 : 0,
                }}>
                  {note.title}
                </div>
                {isActive && note.body && (
                  <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line', overflow: 'hidden' }}>
                    {note.body}
                  </div>
                )}
                {isActive && (
                  <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 4 }}>
                    {new Date(note.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {modalEl}
    </div>
  );
}

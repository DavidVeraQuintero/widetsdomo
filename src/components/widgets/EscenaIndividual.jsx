import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import SvgIcon from './SvgIcon';
import { useLongPress } from './widgetUtils';

const SCENES = [
  { sceneName: 'Noche',   iconId: 'moon'   },
  { sceneName: 'Día',     iconId: 'sun'    },
  { sceneName: 'Dormir',  iconId: 'heart'  },
  { sceneName: 'Lectura', iconId: 'book'   },
  { sceneName: 'Fiesta',  iconId: 'music'  },
];

function ConfigModal({ config, onSave, onClose }) {
  const { sceneName: current } = config;
  const stop = e => e.stopPropagation();
  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) { stop(e); onClose(); } }}
    >
      <div
        style={{ background: 'linear-gradient(135deg,#0f172a,#0a1f3d)', border: '2px solid #1e3a5f', borderRadius: '1.14rem', padding: '1.42rem', width: '22rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 0 40px rgba(0,0,0,0.7)' }}
        onMouseDown={stop} onClick={stop}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.92rem' }}>⚙ Seleccionar escena</span>
          <button className="w-btn" style={{ padding: '2px 8px', fontSize: 11 }} onMouseDown={stop} onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SCENES.map(s => {
            const isSelected = s.sceneName === current;
            return (
              <div
                key={s.sceneName}
                onMouseDown={stop}
                onClick={() => { onSave({ ...config, sceneName: s.sceneName, iconId: s.iconId }); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 8px', borderRadius: 10, cursor: 'pointer',
                  background: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
                  border: isSelected ? '1.5px solid rgba(255,255,255,0.45)' : '1px solid rgba(255,255,255,0.12)',
                  transition: 'all 0.15s',
                }}
              >
                <SvgIcon id={s.iconId} size={28} color={isSelected ? 'var(--icon-on)' : 'var(--icon-off)'} className={isSelected ? 'icon-glow' : ''} />
                <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.sceneName}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>Toca una escena para seleccionar</div>
      </div>
    </div>,
    document.body
  );
}

export default function EscenaIndividual({ size, config, onConfigChange }) {
  const { active = false, sceneName = 'Noche', iconId = 'moon' } = config;
  const [showModal, setShowModal] = useState(false);
  const didLongPress = useRef(false);

  const longPress = useLongPress(() => { didLongPress.current = true; setShowModal(true); });

  function handleClick(e) {
    e.stopPropagation();
    if (didLongPress.current) { didLongPress.current = false; return; }
    onConfigChange({ ...config, active: !active });
  }

  const modal = showModal && (
    <ConfigModal
      config={config}
      onSave={c => { onConfigChange(c); setShowModal(false); }}
      onClose={() => setShowModal(false)}
    />
  );

  if (size === '1x1') return (
    <>
      <div className="w-body w-center" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={handleClick} {...longPress}>
        <SvgIcon id={iconId} size={40} color={active ? 'var(--icon-on)' : 'var(--icon-off)'} className={active ? 'icon-glow' : ''} />
        <div style={{ fontSize: 12, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{sceneName}</div>
      </div>
      {modal}
    </>
  );

  if (size === '1x2') return (
    <>
      <div className="w-body w-center" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={handleClick} {...longPress}>
        <SvgIcon id={iconId} size={44} color={active ? 'var(--icon-on)' : 'var(--icon-off)'} className={active ? 'icon-glow' : ''} />
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{sceneName}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{active ? '● Activa' : '○ Inactiva'}</div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onConfigChange({ ...config, active: !active }); }}
          className="w-btn w-btn-sm"
        >{active ? 'Parar' : 'Activar'}</button>
      </div>
      {modal}
    </>
  );

  // 2x1
  return (
    <>
      <div className="w-row-body" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={handleClick} {...longPress}>
        <SvgIcon id={iconId} size={32} color={active ? 'var(--icon-on)' : 'var(--icon-off)'} className={active ? 'icon-glow' : ''} />
        <div className="w-info">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{sceneName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{active ? '● Activa' : '○ Inactiva'}</div>
        </div>
        <span style={{ fontSize: 16, color: active ? 'var(--icon-on)' : 'var(--icon-off)' }}>{active ? '⏹' : '▶'}</span>
      </div>
      {modal}
    </>
  );
}

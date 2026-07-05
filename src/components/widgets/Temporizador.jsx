import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SvgIcon from './SvgIcon';
import { useLongPress } from './widgetUtils';

function pad(n) { return String(n).padStart(2, '0'); }

function TimerModal({ config, onConfigChange, onClose, remaining, accentColor }) {
  const { active = false, duration = 1800, name = 'Timer' } = config;
  const [editMins, setEditMins] = useState(Math.floor(duration / 60));
  const [editSecs, setEditSecs] = useState(duration % 60);
  const stop = e => e.stopPropagation();

  const adjMins = d => setEditMins(m => Math.min(99, Math.max(0, m + d)));
  const adjSecs = d => setEditSecs(s => { let v = s + d; if (v < 0) { adjMins(-1); return 55; } if (v > 59) { adjMins(1); return 0; } return v; });

  const handleToggle = () => {
    if (!active) {
      const newDuration = editMins * 60 + editSecs;
      onConfigChange({ ...config, duration: newDuration, active: true });
    } else {
      onConfigChange({ ...config, active: false });
    }
    onClose();
  };

  const displayTime = active ? `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}` : `${pad(editMins)}:${pad(editSecs)}`;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) { stop(e); onClose(); } }}>
      <div style={{ background: 'linear-gradient(135deg,#0f172a,#0a1f3d)', border: '2px solid #1e3a5f', borderRadius: '1.14rem', padding: '1.42rem', width: '20rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 0 40px rgba(0,0,0,0.7)' }}
        onMouseDown={stop} onClick={stop}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SvgIcon id="timer" size={16} color="var(--icon-off)" />
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.92rem' }}>{name}</span>
          </div>
          <button className="w-btn" style={{ padding: '2px 8px', fontSize: 11 }} onMouseDown={stop} onClick={onClose}>✕</button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 52, fontWeight: 700, fontFamily: 'monospace', color: active ? accentColor : 'var(--text-primary)' }}>
          {displayTime}
        </div>

        {!active ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>min</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={() => adjMins(-1)}>−</button>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', minWidth: 32, textAlign: 'center' }}>{pad(editMins)}</span>
                <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={() => adjMins(1)}>+</button>
              </div>
            </div>
            <span style={{ fontSize: 28, color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: 16 }}>:</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>seg</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={() => adjSecs(-5)}>−</button>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', minWidth: 32, textAlign: 'center' }}>{pad(editSecs)}</span>
                <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={() => adjSecs(5)}>+</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>● Activo</div>
        )}

        <button className="w-btn" style={{ width: '100%' }} onMouseDown={stop} onClick={handleToggle}>
          {active ? 'Detener' : 'Iniciar'}
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function Temporizador({ size, config, onConfigChange, accentColor }) {
  const { active = false, duration = 1800, name = 'Timer' } = config;
  const [remaining, setRemaining] = useState(duration);
  const [modal, setModal] = useState(false);
  const intervalRef = useRef(null);
  const longPress = useLongPress(() => setModal(true));

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(intervalRef.current); onConfigChange({ ...config, active: false }); return 0; }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setRemaining(duration);
    }
    return () => clearInterval(intervalRef.current);
  }, [active]);

  useEffect(() => { if (!active) setRemaining(duration); }, [duration]);

  const mm = pad(Math.floor(remaining / 60));
  const ss = pad(remaining % 60);
  const toggle = () => onConfigChange({ ...config, active: !active });
  const adjustDuration = d => {
    if (active) return;
    onConfigChange({ ...config, duration: Math.max(60, Math.min(5999, duration + d)) });
  };

  const timeColor = active ? accentColor : 'var(--text-primary)';

  const Modal = modal && (
    <TimerModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} remaining={remaining} accentColor={accentColor} />
  );

  const BtnStop = e => e.stopPropagation();

  if (size === '1x2') return (
    <>
      <div className="w-body w-center" {...longPress}>
        <span className="w-label" style={{ fontSize: 12 }}>Timer</span>
        <div style={{ fontSize: 26, fontWeight: 700, color: timeColor, fontFamily: 'monospace' }}>{mm}:{ss}</div>
        {!active && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[{ d: -300, label: '−' }, { d: 300, label: '+' }].map(({ d, label }) => (
              <button key={label}
                onPointerDown={BtnStop} onMouseDown={BtnStop}
                onClick={e => { BtnStop(e); adjustDuration(d); }}
                style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', fontSize: 18, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{active ? '● Activo' : '○ Detenido'}</div>
        <button className="w-btn" onPointerDown={BtnStop} onMouseDown={BtnStop} onClick={e => { BtnStop(e); toggle(); }}>
          {active ? 'Detener' : 'Iniciar'}
        </button>
      </div>
      {Modal}
    </>
  );

  if (size === '2x1') return (
    <>
      <div className="w-row-body" {...longPress}>
        <SvgIcon id="timer" size={22} color={active ? 'var(--icon-on)' : 'var(--icon-off)'} className={active ? 'icon-glow' : ''} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: timeColor }}>{mm}:{ss}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{active ? '● Activo' : '○ Detenido'}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <button className="w-btn w-btn-sm" onPointerDown={BtnStop} onMouseDown={BtnStop} onClick={e => { BtnStop(e); toggle(); }}>
            {active ? 'Parar' : 'Iniciar'}
          </button>
          {!active && (
            <div style={{ display: 'flex', gap: 5 }}>
              {[{ d: -300, label: '−' }, { d: 300, label: '+' }].map(({ d, label }) => (
                <button key={label} onPointerDown={BtnStop} onMouseDown={BtnStop} onClick={e => { BtnStop(e); adjustDuration(d); }}
                  style={{ width: 22, height: 20, borderRadius: 4, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {Modal}
    </>
  );

  // 2x2
  return (
    <>
      <div className="w-body w-center" {...longPress}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: timeColor, fontFamily: 'monospace' }}>{mm}:{ss}</div>
        {!active && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
            <button className="w-btn w-btn-sm" style={{ padding: '4px 12px', fontSize: 16 }} onPointerDown={BtnStop} onMouseDown={BtnStop} onClick={e => { BtnStop(e); adjustDuration(-300); }}>−</button>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>5 min</span>
            <button className="w-btn w-btn-sm" style={{ padding: '4px 12px', fontSize: 16 }} onPointerDown={BtnStop} onMouseDown={BtnStop} onClick={e => { BtnStop(e); adjustDuration(300); }}>+</button>
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{active ? '● Activo' : '○ Detenido'}</div>
        <button className="w-btn" onPointerDown={BtnStop} onMouseDown={BtnStop} onClick={e => { BtnStop(e); toggle(); }}>
          {active ? 'Detener' : 'Iniciar'}
        </button>
      </div>
      {Modal}
    </>
  );
}

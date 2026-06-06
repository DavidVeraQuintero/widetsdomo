import { useState, useEffect, useRef } from 'react';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function TemporizadorModal({ config, onConfigChange, onClose, accentColor, remaining }) {
  const { active = false, name = 'Timer' } = config;
  const icons = useWidgetIcons('temporizador', config.icons);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return (
    <ModalBase
      title="⏱ Temporizador"
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:12 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:52, fontWeight:700, color:active ? accentColor : 'var(--text-dim)', fontFamily:'monospace', marginBottom:8 }}>{mm}:{ss}</div>
      <div style={{ textAlign:'center', fontSize:11, color:'var(--text-secondary)', marginBottom:20 }}>{active ? '● Activo' : '○ Detenido'}</div>
      <button className="w-btn" style={{ width:'100%' }}
        onClick={() => onConfigChange({ ...config, active: !active })}
        onMouseDown={e => e.stopPropagation()}>
        {active ? '⏹ Detener' : '▶ Iniciar'}
      </button>
      <IconSection typeId="temporizador" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Temporizador({ size, config, onConfigChange, accentColor }) {
  const { active = false, minutes = 30, name = 'Timer' } = config;
  const [remaining, setRemaining] = useState(minutes * 60);
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
      setRemaining(minutes * 60);
    }
    return () => clearInterval(intervalRef.current);
  }, [active]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const toggle = () => onConfigChange({ ...config, active: !active });
  const icons = useWidgetIcons('temporizador', config.icons);

  const Modal = modal && (
    <TemporizadorModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} accentColor={accentColor} remaining={remaining} />
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <div className="w-label">⏱ Temporizador</div>
      <div style={{ fontSize:32, fontWeight:700, color:active ? accentColor : 'var(--text-dim)', fontFamily:'monospace', cursor:'pointer' }} {...longPress}>{mm}:{ss}</div>
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{active ? '● Activo' : '○ Detenido'}</div>
      <button className="w-btn" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>{active ? '⏹ Detener' : '▶ Iniciar'}</button>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={22} color={active ? 'var(--icon-on)' : 'var(--icon-off)'} className={active ? 'icon-glow' : ''} /></span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:'var(--text-secondary)' }}>{active ? '● Activo' : '○ Detenido'}</div>
      </div>
      <div style={{ fontFamily:'monospace', fontSize:18, fontWeight:700, color:active ? accentColor : 'var(--text-dim)' }}>{mm}:{ss}</div>
      <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>{active ? '⏹' : '▶'}</button>
      {Modal}
    </div>
  );

  return (
    <div className="w-body w-center">
      <div className="w-label">⏱ Temporizador</div>
      <div className="w-name">{name}</div>
      <div style={{ fontSize:36, fontWeight:700, color:active ? accentColor : 'var(--text-dim)', fontFamily:'monospace', cursor:'pointer' }} {...longPress}>{mm}:{ss}</div>
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{active ? '● Activo' : '○ Detenido'}</div>
      <button className="w-btn" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>{active ? '⏹ Detener' : '▶ Iniciar'}</button>
      {Modal}
    </div>
  );
}

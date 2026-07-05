import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

function PuertaModal({ open, locked, name, config, onConfigChange, onClose }) {
  const icons = useWidgetIcons('puerta', config.icons);
  const col = open ? '#f59e0b' : locked ? '#22c55e' : 'var(--text-secondary)';
  const status = open ? 'Abierta' : locked ? 'Bloqueada' : 'Cerrada';
  return (
    <ModalBase
      title="🚪 Puerta"
      onClose={onClose}
      borderColor={col}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={open ? icons.open : icons.closed} size={72} color={!open ? 'var(--icon-on)' : 'var(--icon-off)'} className={!open ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:8 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--text-primary)', fontWeight:600, marginBottom:20 }}>{status}</div>
      <div style={{ fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:8, textAlign:'center' }}>Simulación</div>
      <button className="w-btn" style={{ width:'100%' }}
        onClick={() => onConfigChange({ open: !open })}
        onMouseDown={e => e.stopPropagation()}>
        {open ? 'Cerrar puerta' : 'Abrir puerta'}
      </button>
      <IconSection typeId="puerta" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Puerta({ size, config, onConfigChange, accentColor }) {
  const { open = false, locked = true, name = 'Puerta' } = config;
  const [modal, setModal] = useState(false);
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const icons = useWidgetIcons('puerta', config.icons);
  const col = open ? '#f59e0b' : locked ? '#22c55e' : accentColor;
  const status = open ? 'Abierta' : locked ? 'Bloqueada' : 'Cerrada';
  const longPress = useLongPress(() => setModal(true));

  const Modal = modal && (
    <PuertaModal open={open} locked={locked} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ alignItems:'center' }}>
      <div className="w-name" style={{ width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <span style={{ cursor:'pointer', userSelect:'none' }} {...longPress}><SvgIcon id={open ? icons.open : icons.closed} size={44} color={!open ? 'var(--icon-on)' : 'var(--icon-off)'} className={!open ? 'icon-glow' : ''} /></span>
        <span style={{ fontSize:12, color:'var(--text-primary)' }}>{open ? 'Abierta' : 'Cerrada'}</span>
      </div>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={open ? icons.open : icons.closed} size={44} color={!open ? 'var(--icon-on)' : 'var(--icon-off)'} className={!open ? 'icon-glow' : ''} /></span>
      <div className="w-name">{name}</div>
      <div className="w-status" style={{ color:'var(--text-primary)' }}>{status}</div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={open ? icons.open : icons.closed} size={32} color={!open ? 'var(--icon-on)' : 'var(--icon-off)'} className={!open ? 'icon-glow' : ''} /></span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:'var(--text-primary)' }}>{status}</div>
      </div>
      <div style={{ width:12, height:12, borderRadius:'50%', background:col, flexShrink:0 }} />
      {Modal}
    </div>
  );

  return (
    <div className="w-body w-center">
      <div className="w-name">{name}</div>
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={open ? icons.open : icons.closed} size={60} color={!open ? 'var(--icon-on)' : 'var(--icon-off)'} className={!open ? 'icon-glow' : ''} /></span>
      <div className="w-status" style={{ color:'var(--text-primary)' }}>{status}</div>
      {Modal}
    </div>
  );
}


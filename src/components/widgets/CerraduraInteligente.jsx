import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

function CerraduraModal({ locked, name, config, onConfigChange, onClose }) {
  const icons = useWidgetIcons('cerradura', config.icons);
  const col = locked ? '#22c55e' : '#ef4444';
  return (
    <ModalBase
      title="🔒 Cerradura Inteligente"
      onClose={onClose}
      borderColor={col}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={locked ? icons.locked : icons.unlocked} size={72} color={locked ? 'var(--icon-on)' : 'var(--icon-off)'} className={locked ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:8 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--text-primary)', fontWeight:700, marginBottom:20 }}>{locked ? 'Bloqueada' : 'Desbloqueada'}</div>
      <button
        className="w-btn"
        style={{ width:'100%', ...(locked ? {} : { borderColor:'#ef4444', color:'var(--text-primary)' }) }}
        onClick={() => onConfigChange({ locked: !locked })}
        onMouseDown={e => e.stopPropagation()}
      >
        {locked ? '🔓 Desbloquear' : '🔒 Bloquear'}
      </button>
      <IconSection typeId="cerradura" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function CerraduraInteligente({ size, config, onConfigChange, accentColor }) {
  const { locked = true, name = 'Cerradura' } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, locked: !locked });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const icons = useWidgetIcons('cerradura', config.icons);
  const col = locked ? '#22c55e' : '#ef4444';
  const longPress = useLongPress(() => setModal(true));

  const Modal = modal && (
    <CerraduraModal locked={locked} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}><SvgIcon id={locked ? icons.locked : icons.unlocked} size={44} color={locked ? 'var(--icon-on)' : 'var(--icon-off)'} className={locked ? 'icon-glow' : ''} /></span>
      <span style={{ fontSize:11, color:'var(--text-primary)', transition:'color 0.2s' }}>{locked ? 'Bloqueada' : 'Abierta'}</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <div className="w-label">🔒 Cerradura</div>
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={locked ? icons.locked : icons.unlocked} size={44} color={locked ? 'var(--icon-on)' : 'var(--icon-off)'} className={locked ? 'icon-glow' : ''} /></span>
      <div className="w-name">{name}</div>
      <div className="w-status" style={{ color:'var(--text-primary)' }}>{locked ? 'Bloqueada' : 'Desbloqueada'}</div>
      <button className="w-btn" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>{locked ? '🔓 Desbloquear' : '🔒 Bloquear'}</button>
      {Modal}
    </div>
  );

  return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={locked ? icons.locked : icons.unlocked} size={30} color={locked ? 'var(--icon-on)' : 'var(--icon-off)'} className={locked ? 'icon-glow' : ''} /></span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:'var(--text-primary)' }}>{locked ? 'Bloqueada' : 'Desbloqueada'}</div>
      </div>
      <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>{locked ? '🔓 Abrir' : '🔒 Cerrar'}</button>
      {Modal}
    </div>
  );
}

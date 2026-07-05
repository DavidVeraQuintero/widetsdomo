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
        {locked ? 'Desbloquear' : 'Bloquear'}
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
    <div className="w-body" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}><SvgIcon id={locked ? icons.locked : icons.unlocked} size={44} color={locked ? 'var(--icon-on)' : 'var(--icon-off)'} className={locked ? 'icon-glow' : ''} /></span>
        <span style={{ fontSize:12, color:'var(--text-primary)', transition:'color 0.2s' }}>{locked ? 'Bloqueada' : 'Abierta'}</span>
      </div>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={locked ? icons.locked : icons.unlocked} size={44} color={locked ? 'var(--icon-on)' : 'var(--icon-off)'} className={locked ? 'icon-glow' : ''} /></span>
      <div className="w-name">{name}</div>
      <div className="w-status" style={{ color:'var(--text-primary)' }}>{locked ? 'Bloqueada' : 'Desbloqueada'}</div>
      <button className="w-btn w-btn-sm" style={{ padding:'2px 12px' }} onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>{locked ? 'Abrir' : 'Cerrar'}</button>
      {Modal}
    </div>
  );

  return (
    <div style={{ height:'100%', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'16px 12px 10px 12px' }}>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <button className="w-btn w-btn-sm" style={{ fontSize:12, padding:'2px 10px' }} onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>{locked ? 'Abrir' : 'Cerrar'}</button>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingRight:56 }}>
        <span style={{ cursor:'pointer', flexShrink:0 }} {...longPress}><SvgIcon id={locked ? icons.locked : icons.unlocked} size={38} color={locked ? 'var(--icon-on)' : 'var(--icon-off)'} className={locked ? 'icon-glow' : ''} /></span>
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
      </div>
      <div style={{ fontSize:12, color:'var(--text-primary)' }}>{locked ? 'Bloqueada' : 'Desbloqueada'}</div>
      {Modal}
    </div>
  );
}

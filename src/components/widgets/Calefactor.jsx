import { useState } from 'react';
import Toggle from './Toggle';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function CalefactorModal({ on, temp, name, config, onConfigChange, onClose }) {
  const col = on ? '#f97316' : 'var(--text-dim)';
  const adj = (d) => onConfigChange({ temp: Math.max(15, Math.min(30, temp + d)) });
  const icons = useWidgetIcons('calefactor', config.icons);
  return (
    <ModalBase
      title="🔥 Calefactor"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ on: !on })} />}
      onClose={onClose}
      borderColor="#f97316"
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:16 }}>{name}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:8 }}>
        <button className="w-btn-icon" style={{ width:36, height:36, fontSize:20 }} onClick={() => adj(-1)} onMouseDown={e => e.stopPropagation()}>−</button>
        <div style={{ fontSize:48, fontWeight:700, color:'var(--text-primary)' }}>{temp}°</div>
        <button className="w-btn-icon" style={{ width:36, height:36, fontSize:20 }} onClick={() => adj(1)} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
      <div style={{ textAlign:'center', fontSize:11, color:'var(--text-secondary)', marginTop:4 }}>{on ? 'Calentando' : 'Apagado'}</div>
      <IconSection typeId="calefactor" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Calefactor({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Calefactor', temp = 20 } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, on: !on });
  const adj = (d) => onConfigChange({ ...config, temp: Math.max(15, Math.min(30, temp + d)) });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const col = on ? '#f97316' : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('calefactor', config.icons);

  const Modal = modal && (
    <CalefactorModal on={on} temp={temp} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
        <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <span style={{ fontSize:11, color:'var(--text-primary)', transition:'color 0.2s' }}>{temp}°</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'flex-end' }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ cursor:'pointer', display:'flex', alignItems:'center' }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:4 }}>
        <button className="w-btn-icon" onClick={e=>{e.stopPropagation();adj(-1);}} onMouseDown={e=>e.stopPropagation()}>−</button>
        <span style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>{temp}°</span>
        <button className="w-btn-icon" onClick={e=>{e.stopPropagation();adj(1);}} onMouseDown={e=>e.stopPropagation()}>+</button>
      </div>
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {Modal}
    </div>
  );

  return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer', display:'flex', alignItems:'center' }} {...longPress}>
        <SvgIcon id={icons.default} size={28} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:'var(--text-secondary)' }}>{on ? 'Calentando' : 'Apagado'}</div>
      </div>
      <button className="w-btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={e => { e.stopPropagation(); adj(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
      <span className="w-val-med" style={{ color:'var(--text-primary)' }}>{temp}°</span>
      <button className="w-btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={e => { e.stopPropagation(); adj(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      <Toggle on={on} onToggle={toggle} />
      {Modal}
    </div>
  );
}

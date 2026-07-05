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
      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>{on ? 'Calentando' : 'Apagado'}</div>
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
    <div className="w-body" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <span style={{ fontSize:12, color:'var(--text-primary)', transition:'color 0.2s' }}>{temp}°</span>
      </div>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <span style={{ cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={40} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <span style={{ fontSize:'1.14rem', fontWeight:700, color:'var(--text-primary)', lineHeight:1 }}>{temp}°</span>
      </div>
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:4, flexShrink:0 }}>{name}</div>
      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
        <button className="w-btn w-btn-sm" style={{ flex:1 }} onClick={e=>{e.stopPropagation();adj(-1);}} onMouseDown={e=>e.stopPropagation()}>−</button>
        <button className="w-btn w-btn-sm" style={{ flex:1 }} onClick={e=>{e.stopPropagation();adj(1);}} onMouseDown={e=>e.stopPropagation()}>+</button>
      </div>
      {Modal}
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
        <span style={{ cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={52} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <div className="w-name">{name}</div>
        <div style={{ fontSize:48, fontWeight:700, color:'var(--text-primary)' }}>{temp}°</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); adj(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); adj(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
      {Modal}
    </div>
  );

  return (
    <div style={{ height:'100%', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'16px 12px 10px 12px' }}>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingRight:44 }}>
        <span style={{ flexShrink:0, cursor:'pointer', display:'flex', alignItems:'center' }} {...longPress}>
          <SvgIcon id={icons.default} size={38} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flex:1 }}>{on ? 'Calentando' : 'Apagado'}</span>
        <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{temp}°</span>
        <button className="w-btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={e => { e.stopPropagation(); adj(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <button className="w-btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={e => { e.stopPropagation(); adj(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
      {Modal}
    </div>
  );
}

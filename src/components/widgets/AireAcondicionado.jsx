import { useState } from 'react';
import Toggle from './Toggle';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

const MODES = ['frío', 'calor', 'auto', 'vent'];
const MI = { 'frío':'❄', 'calor':'🔥', 'auto':'🔄', 'vent':'🌀' };

function ACModal({ on, temp, mode, name, config, onConfigChange, onClose, accentColor }) {
  const icons = useWidgetIcons('aire-acondicionado', config.icons);
  const col = on ? accentColor : 'var(--text-dim)';
  const adj = (d) => onConfigChange({ temp: Math.max(16, Math.min(30, temp + d)) });
  return (
    <ModalBase
      title="❄ Aire Acondicionado"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ on: !on })} />}
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:10 }}>{name}</div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:16 }}>
        <button className="w-btn-icon" style={{ width:36, height:36, fontSize:20 }} onClick={() => adj(-1)} onMouseDown={e => e.stopPropagation()}>−</button>
        <div style={{ fontSize:48, fontWeight:700, color:'var(--text-primary)' }}>{temp}°</div>
        <button className="w-btn-icon" style={{ width:36, height:36, fontSize:20 }} onClick={() => adj(1)} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
      <div style={{ fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Modo</div>
      <div style={{ display:'flex', gap:6 }}>
        {MODES.map(m => (
          <button key={m} className="w-btn w-btn-sm" style={{ flex:1, ...(mode === m ? { background:'var(--border-accent)', color:'white' } : {}) }}
            onClick={() => onConfigChange({ mode: m })} onMouseDown={e => e.stopPropagation()}>
            {MI[m]} {m}
          </button>
        ))}
      </div>
      <IconSection typeId="aire-acondicionado" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function AireAcondicionado({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'AC', temp = 24, mode = 'frío' } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setTemp = (d) => onConfigChange({ ...config, temp: Math.max(16, Math.min(30, temp + d)) });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const col = on ? accentColor : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('aire-acondicionado', config.icons);

  const Modal = modal && (
    <ACModal on={on} temp={temp} mode={mode} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ flexDirection:'column', justifyContent:'center', alignItems:'center', gap:4 }}>
      <span style={{ cursor:'pointer', userSelect:'none', flexShrink:0 }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
        <SvgIcon id={icons.default} size={40} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', flexShrink:0 }}>{temp}°</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <div style={{ cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={40} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </div>
        <span style={{ fontSize:'1.14rem', fontWeight:700, color:'var(--text-primary)', lineHeight:1 }}>{temp}°</span>
      </div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', textAlign:'center', marginBottom:4, flexShrink:0 }}>{MI[mode]} {mode}</div>
      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
        <button className="w-btn w-btn-sm" style={{ flex:1 }} onClick={e => { e.stopPropagation(); setTemp(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <button className="w-btn w-btn-sm" style={{ flex:1 }} onClick={e => { e.stopPropagation(); setTemp(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
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
        <span style={{ fontSize:12, color:'var(--text-secondary)', flex:1 }}>{MI[mode]} {mode}</span>
        <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{temp}°C</span>
        <button className="w-btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={e => { e.stopPropagation(); setTemp(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <button className="w-btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={e => { e.stopPropagation(); setTemp(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
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
        <SvgIcon id={icons.default} size={48} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} style={{ cursor:'pointer' }} {...longPress} />
        <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{temp}°C</div>
        <div className="w-status" style={{ color:'var(--text-secondary)', fontSize:12 }}>{MI[mode]} {mode}</div>
      </div>
      <div className="w-btn-row" style={{ justifyContent:'center' }}>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
      {Modal}
    </div>
  );

  return null;
}

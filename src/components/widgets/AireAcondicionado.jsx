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
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
        <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <span style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)' }}>{temp}°</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <div className="w-label">❄ AC</div>
      <div className="w-val-big" style={{ color:'var(--text-primary)', cursor:'pointer' }} {...longPress}>{temp}°C</div>
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{MI[mode]} {mode}</div>
      <div className="w-btn-row" style={{ justifyContent:'center' }}>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()} style={{ color: 'var(--text-primary)' }}>⏻</button>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer', display:'flex', alignItems:'center' }} {...longPress}>
        <SvgIcon id={icons.default} size={26} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:'var(--text-secondary)' }}>{MI[mode]} {mode}</div>
      </div>
      <div className="w-val-med" style={{ color:'var(--text-primary)' }}>{temp}°C</div>
      <div className="w-btn-row">
        <button className="w-btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={e => { e.stopPropagation(); setTemp(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <button className="w-btn-icon" style={{ width:24, height:24, fontSize:12 }} onClick={e => { e.stopPropagation(); setTemp(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
      <Toggle on={on} onToggle={toggle} />
      {Modal}
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">❄ Aire Acondicionado</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <div className="w-val-big" style={{ color:'var(--text-primary)', cursor:'pointer' }} {...longPress}>{temp}°C</div>
        <div className="w-status" style={{ color:'var(--text-secondary)' }}>{MI[mode]} {mode}</div>
        <div className="w-name">{name}</div>
      </div>
      <div className="w-btn-row" style={{ justifyContent:'center' }}>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">❄ Aire Acondicionado</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-row">
        <div><div className="w-name">{name}</div><div className="w-status" style={{ color:'var(--text-secondary)' }}>{MI[mode]} {mode}</div></div>
        <div className="w-val-big" style={{ color:'var(--text-primary)', cursor:'pointer' }} {...longPress}>{temp}°C</div>
        <div className="w-btn-row">
          <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
          <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
        </div>
      </div>
      <div className="w-btn-row">
        {MODES.map(m => (
          <button key={m} className="w-btn w-btn-sm" style={mode === m ? { background:'var(--border-accent)', color:'white' } : {}} onClick={e => { e.stopPropagation(); onConfigChange({ ...config, mode: m }); }} onMouseDown={e => e.stopPropagation()}>{MI[m]} {m}</button>
        ))}
      </div>
      {Modal}
    </div>
  );
}

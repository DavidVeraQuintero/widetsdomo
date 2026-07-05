import { useState } from 'react';
import Toggle from './Toggle';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function VentiladorModal({ on, speed, name, config, onConfigChange, onClose, accentColor }) {
  const col = on ? accentColor : 'var(--text-dim)';
  const icons = useWidgetIcons('ventilador', config.icons);
  return (
    <ModalBase
      title="🌀 Ventilador"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ on: !on })} />}
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ display:'inline-block', animation: on ? 'spin 1s linear infinite' : 'none' }}>
          <SvgIcon id={icons.default} size={64} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:16 }}>{name}</div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Velocidad</div>
      <div style={{ display:'flex', gap:8 }}>
        {[1, 2, 3].map(s => (
          <button key={s} className="w-btn w-btn-sm" style={{ flex:1, padding:'8px 0', ...(speed === s && on ? { background:'var(--border-accent)', color:'white' } : {}) }}
            onClick={() => onConfigChange({ speed: s })} onMouseDown={e => e.stopPropagation()}>
            {'●'.repeat(s)}
          </button>
        ))}
      </div>
      <IconSection typeId="ventilador" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Ventilador({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Ventilador', speed = 2 } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setSpeed = (s) => onConfigChange({ ...config, speed: s });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const col = on ? accentColor : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('ventilador', config.icons);

  const Modal = modal && (
    <VentiladorModal on={on} speed={speed} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ alignItems:'center' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="w-name" style={{ width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <span style={{ marginTop:'auto', display:'inline-block', animation:on?'spin 1s linear infinite':'none', cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
        <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ display:'inline-block', animation:on?'spin 1s linear infinite':'none', cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
      </div>
      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
        {[1,2,3].map(s => (
          <button key={s} className="w-btn w-btn-sm" style={{ flex:1, padding:'0.21rem 0', ...(speed===s&&on?{background:'var(--border-accent)',color:'white'}:{}) }} onClick={e=>{e.stopPropagation();setSpeed(s);}} onMouseDown={e=>e.stopPropagation()}>{'●'.repeat(s)}</button>
        ))}
      </div>
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {Modal}
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
        <span style={{ display:'inline-block', animation: on ? 'spin 1s linear infinite' : 'none', cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={56} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <div className="w-name">{name}</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Vel · {'●'.repeat(speed)}</div>
      </div>
      <div style={{ display:'flex', gap:4, justifyContent:'center', marginBottom:4 }}>
        {[1, 2, 3].map(s => (
          <button key={s} className="w-btn w-btn-sm" style={{ padding:'6px 8px', ...(speed === s && on ? { background:'var(--border-accent)', color:'white' } : {}) }} onClick={e => { e.stopPropagation(); setSpeed(s); }} onMouseDown={e => e.stopPropagation()}>{'●'.repeat(s)}</button>
        ))}
      </div>
      {Modal}
    </div>
  );

  return (
    <div style={{ height:'100%', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'16px 12px 10px 12px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingRight:44 }}>
        <span style={{ flexShrink:0, display:'inline-block', animation: on ? 'spin 1s linear infinite' : 'none', cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={38} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
      </div>
      <div style={{ display:'flex', gap:4 }}>
        {[1, 2, 3].map(s => (
          <button key={s} className="w-btn w-btn-sm" style={{ flex:1, padding:'1px 0', ...(speed === s && on ? { background:'var(--border-accent)', color:'white' } : {}) }} onClick={e => { e.stopPropagation(); setSpeed(s); }} onMouseDown={e => e.stopPropagation()}>{'●'.repeat(s)}</button>
        ))}
      </div>
      {Modal}
    </div>
  );
}

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Toggle from './Toggle';
import Slider from './Slider';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

const Segments = ({ on, color, brightness, count = 10 }) => (
  <div style={{ display:'flex', gap:2, width:'100%' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{
        flex:1, height:6, borderRadius:3,
        background: on ? color : 'var(--text-dim)',
        opacity: on ? (brightness / 100) * (1 - i * 0.03) : 0.15,
        transition:'background 0.3s, opacity 0.3s',
        boxShadow: on ? `0 0 5px ${color}88` : 'none',
      }} />
    ))}
  </div>
);

function StripIcon({ color, on, size = 50, iconSize = 22, icons, longPressProps = {} }) {
  return (
    <div
      style={{
        width:size, height:size, borderRadius:'50%', flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', transition:'border-color 0.2s, box-shadow 0.2s',
        userSelect:'none',
      }}
      {...longPressProps}
    >
      <SvgIcon id={icons.default} size={iconSize} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
    </div>
  );
}

function TiraBlancaModal({ config, onConfigChange, onClose, accentColor }) {
  const { on = false, brightness = 80, name = 'Tira LED' } = config;
  const icons = useWidgetIcons('tira-led', config.icons);
  const cfg = (patch) => onConfigChange({ ...config, ...patch });
  return createPortal(
    <div
      style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.65)' }}
      onMouseDown={e => { e.stopPropagation(); onClose(); }}
    >
      <div
        style={{ background:'linear-gradient(135deg,#0f172a,#0a1f3d)', border:`2px solid ${accentColor}55`, borderRadius:16, padding:22, width:290, boxShadow:`0 0 40px ${accentColor}33, 0 20px 60px rgba(0,0,0,0.6)` }}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ color:'#e2e8f0', fontWeight:700, fontSize:14 }}>✨ Tira LED</div>
          <Toggle on={on} onToggle={() => cfg({ on: !on })} />
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <StripIcon color={accentColor} on={on} size={80} iconSize={40} icons={icons} />
        </div>
        <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:16 }}>{name}</div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Brillo · {brightness}%</div>
          <Slider value={brightness} onChange={v => cfg({ brightness: v })} showVal={false} />
        </div>
        <Segments on={on} color={accentColor} brightness={brightness} />
        <IconSection typeId="tira-led" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
        <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'rgba(255,255,255,0.25)' }}>Clic fuera para cerrar</div>
      </div>
    </div>,
    document.body
  );
}

export default function TiraLEDBlanca({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Tira LED', brightness = 80 } = config;
  const [modal, setModal] = useState(false);
  const icons = useWidgetIcons('tira-led', config.icons);

  const toggle = () => onConfigChange({ ...config, on: !on });
  const setBrightness = (v) => {
    const newConfig = { ...config, brightness: v };
    if (!on && v > 0) newConfig.on = true;
    onConfigChange(newConfig);
  };
  const patchConfig = (patch) => onConfigChange({ ...config, ...patch });
  const longPress = useLongPress(() => setModal(true));

  const Modal = modal && (
    <TiraBlancaModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ flexDirection:'column', justifyContent:'center', alignItems:'center', gap:4 }}>
      <span style={{ cursor:'pointer', userSelect:'none', flexShrink:0 }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
        <StripIcon color={accentColor} on={on} size={40} iconSize={44} icons={icons} longPressProps={{}} />
      </span>
      <span style={{ fontSize:12, color: on ? '#ffffff' : 'var(--text-secondary)', transition:'color 0.2s', flexShrink:0 }}>{brightness}%</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <StripIcon color={accentColor} on={on} size={50} iconSize={44} icons={icons} longPressProps={longPress} />
      </div>
      <Slider value={brightness} onChange={setBrightness} showVal={false} />
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height:'100%', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'16px 12px 10px 12px' }}>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingRight:44 }}>
        <StripIcon color={accentColor} on={on} size={38} iconSize={30} icons={icons} longPressProps={longPress} />
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:on?accentColor:'var(--text-secondary)', flexShrink:0 }}>{brightness}%</span>
        <Slider value={brightness} onChange={setBrightness} showVal={false} />
      </div>
      {Modal}
    </div>
  );

  // 2x2
  return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
        <StripIcon color={accentColor} on={on} size={72} iconSize={48} icons={icons} longPressProps={longPress} />
        <div className="w-name-lg">{name}</div>
      </div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>Brillo · {brightness}%</div>
      <Slider value={brightness} onChange={setBrightness} showVal={false} />
      {Modal}
    </div>
  );
}

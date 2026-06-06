import { useState } from 'react';
import { createPortal } from 'react-dom';
import Toggle from './Toggle';
import Slider from './Slider';
import ColorWheel from './ColorWheel';
import { useLongPress, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

const PRESETS = ['#ef4444','#f97316','#fbbf24','#22c55e','#3b82f6','#7c3aed','#ec4899','#ffffff'];

function RGBModal({ config, onConfigChange, onClose }) {
  const { color = '#3b82f6', brightness = 75, on = false } = config;
  const icons = useWidgetIcons('lampara-rgb', config.icons);
  const cfg = (patch) => onConfigChange({ ...config, ...patch });
  return createPortal(
    <div
      style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.65)' }}
      onMouseDown={e => { e.stopPropagation(); onClose(); }}
    >
      <div
        style={{ background:'linear-gradient(135deg,#0f172a,#0a1f3d)', border:`2px solid ${color}55`, borderRadius:16, padding:22, width:290, boxShadow:`0 0 40px ${color}33, 0 20px 60px rgba(0,0,0,0.6)` }}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ color:'#e2e8f0', fontWeight:700, fontSize:14 }}>🎨 Lámpara RGB</div>
          <Toggle on={on} onToggle={() => cfg({ on: !on })} />
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <ColorWheel color={color} onChange={c => cfg({ color: c })} size={140} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <div style={{ width:38, height:38, borderRadius:8, background:color, border:'2px solid rgba(255,255,255,0.2)', flexShrink:0 }} />
          <div style={{ color:'var(--text-secondary)', fontSize:12, fontFamily:'monospace' }}>{color}</div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Brillo · {brightness}%</div>
          <Slider value={brightness} onChange={v => cfg({ brightness: v })} showVal={false} />
        </div>
        <div style={{ fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Colores rápidos</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {PRESETS.map(c => (
            <button key={c} style={{ width:28, height:28, borderRadius:'50%', background:c, border:color===c?'2px solid white':'2px solid rgba(255,255,255,0.15)', cursor:'pointer', flexShrink:0 }}
              onClick={() => cfg({ color: c })} onMouseDown={e => e.stopPropagation()} />
          ))}
        </div>
        <IconSection typeId="lampara-rgb" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
        <div style={{ textAlign:'center', marginTop:14, fontSize:10, color:'rgba(255,255,255,0.25)' }}>Clic fuera para cerrar</div>
      </div>
    </div>,
    document.body
  );
}

function ColoredIcon({ color, on, size = 50, iconSize = 26, icons, longPressProps = {} }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s',
        userSelect: 'none',
      }}
      {...longPressProps}
    >
      <SvgIcon id={icons.default} size={iconSize} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
    </div>
  );
}

export default function LamparaRGB({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'RGB', color = '#3b82f6', brightness = 75 } = config;
  const [modal, setModal] = useState(false);
  const icons = useWidgetIcons('lampara-rgb', config.icons);

  const toggle = () => onConfigChange({ ...config, on: !on });
  const setColor = (c) => onConfigChange({ ...config, color: c });
  const setBrightness = (v) => onConfigChange({ ...config, brightness: v });
  const patchConfig = (patch) => onConfigChange({ ...config, ...patch });
  const longPress = useLongPress(() => setModal(true));

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <ColoredIcon color={color} on={on} size={50} iconSize={44} icons={icons} longPressProps={{ ...longPress, onClick: e => { e.stopPropagation(); toggle(); } }} />
      {modal && <RGBModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'flex-end' }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <ColoredIcon color={color} on={on} size={50} iconSize={44} icons={icons} longPressProps={longPress} />
      </div>
      <Slider value={brightness} onChange={setBrightness} showVal={false} />
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {modal && <RGBModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <ColoredIcon color={color} on={on} size={28} iconSize={13} icons={icons} longPressProps={longPress} />
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        {PRESETS.slice(0,4).map(c => (
          <button key={c} style={{ width:15, height:15, borderRadius:'50%', background:c, border:color===c?'2px solid white':'1px solid rgba(255,255,255,0.15)', cursor:'pointer', flexShrink:0 }}
            onClick={e => { e.stopPropagation(); setColor(c); }} onMouseDown={e => e.stopPropagation()} />
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:10, color:'var(--text-secondary)', flexShrink:0 }}>{brightness}%</span>
        <Slider value={brightness} onChange={setBrightness} showVal={false} />
      </div>
      {modal && <RGBModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />}
    </div>
  );

  // 2x2
  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">🎨 RGB</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      {/* Icono con borde de color + nombre */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <ColoredIcon color={color} on={on} size={36} iconSize={18} icons={icons} longPressProps={longPress} />
        <div>
          <div className="w-name">{name}</div>
          <div style={{ fontSize:10, color:'var(--text-secondary)', fontFamily:'monospace' }}>{color}</div>
        </div>
      </div>
      {/* 6 presets en una fila */}
      <div style={{ display:'flex', gap:6, justifyContent:'space-between', flex:1, alignItems:'center' }}>
        {PRESETS.slice(0,6).map(c => (
          <button key={c} style={{ width:22, height:22, borderRadius:'50%', background:c, border:color===c?'2px solid white':'1px solid rgba(255,255,255,0.15)', cursor:'pointer', flexShrink:0 }}
            onClick={e => { e.stopPropagation(); setColor(c); }} onMouseDown={e => e.stopPropagation()} />
        ))}
      </div>
      {/* Slider con etiqueta */}
      <div style={{ fontSize:9, color:'var(--text-secondary)', marginBottom:4 }}>Brillo · {brightness}%</div>
      <Slider value={brightness} onChange={setBrightness} showVal={false} />
      {modal && <RGBModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />}
    </div>
  );
}

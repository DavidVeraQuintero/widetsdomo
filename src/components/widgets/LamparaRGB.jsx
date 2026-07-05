import { useState } from 'react';
import { createPortal } from 'react-dom';
import Toggle from './Toggle';
import Slider from './Slider';
import ColorWheel from './ColorWheel';
import { useLongPress, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useDeviceControl } from '../../hooks/useDeviceControl';

const PRESETS = ['#ef4444','#f97316','#fbbf24','#22c55e','#3b82f6','#7c3aed','#ec4899','#ffffff'];

function hexToHubitatColor(hex) {
  if (!hex || hex.length < 7) return { hue: 0, saturation: 0 };
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return { hue: 0, saturation: 0 };
  const l = (max + min) / 2;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0)
    : max === g ? (b - r) / d + 2
      : (r - g) / d + 4;
  return { hue: Math.round(h / 6 * 100), saturation: Math.round(s * 100) };
}

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
          <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Brillo · {brightness}%</div>
          <Slider value={brightness} onChange={v => cfg({ brightness: v })} showVal={false} />
        </div>
        <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Colores rápidos</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {PRESETS.map(c => (
            <button key={c} style={{ width:28, height:28, borderRadius:'50%', background:c, border:color===c?'2px solid white':'2px solid rgba(255,255,255,0.15)', cursor:'pointer', flexShrink:0 }}
              onClick={() => cfg({ color: c })} onMouseDown={e => e.stopPropagation()} />
          ))}
        </div>
        <IconSection typeId="lampara-rgb" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
        <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'rgba(255,255,255,0.25)' }}>Clic fuera para cerrar</div>
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
  const sendCmd = useDeviceControl(config);

  const handleConfigChange = (newConfig) => {
    if (newConfig.on !== config.on) sendCmd(newConfig.on ? 'on' : 'off');
    if (newConfig.brightness !== undefined && newConfig.brightness !== config.brightness) {
      sendCmd('setLevel', newConfig.brightness);
    }
    if (newConfig.color !== undefined && newConfig.color !== config.color) {
      const { hue, saturation } = hexToHubitatColor(newConfig.color);
      sendCmd('setHue', hue);
      sendCmd('setSaturation', saturation);
    }
    onConfigChange(newConfig);
  };

  const toggle = () => handleConfigChange({ ...config, on: !on });
  const setColor = (c) => handleConfigChange({ ...config, color: c });
  const setBrightness = (v) => {
    const newConfig = { ...config, brightness: v };
    if (!on && v > 0) newConfig.on = true;
    handleConfigChange(newConfig);
  };
  const longPress = useLongPress(() => setModal(true));

  if (size === '1x1') return (
    <div className="w-body" style={{ alignItems:'center', paddingTop:6 }}>
      <div style={{ width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <ColoredIcon color={color} on={on} size={44} iconSize={38} icons={icons} longPressProps={{ ...longPress, onClick: e => { e.stopPropagation(); toggle(); } }} />
      </div>
      {modal && <RGBModal config={config} onConfigChange={handleConfigChange} onClose={() => setModal(false)} />}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <ColoredIcon color={color} on={on} size={50} iconSize={44} icons={icons} longPressProps={longPress} />
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{brightness}%</div>
      </div>
      <Slider value={brightness} onChange={setBrightness} showVal={false} />
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {modal && <RGBModal config={config} onConfigChange={handleConfigChange} onClose={() => setModal(false)} />}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'4px 12px 10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <ColoredIcon color={color} on={on} size={44} iconSize={32} icons={icons} longPressProps={longPress} />
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
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{brightness}%</span>
        <Slider value={brightness} onChange={setBrightness} showVal={false} />
      </div>
      {modal && <RGBModal config={config} onConfigChange={handleConfigChange} onClose={() => setModal(false)} />}
    </div>
  );

  // 2x2
  return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      {/* Icono con nombre */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <ColoredIcon color={color} on={on} size={60} iconSize={48} icons={icons} longPressProps={longPress} />
        <div className="w-name-lg">{name}</div>
      </div>
      {/* 6 presets en una fila */}
      <div style={{ display:'flex', gap:6, justifyContent:'space-between', flex:1, alignItems:'center' }}>
        {PRESETS.slice(0,6).map(c => (
          <button key={c} style={{ width:22, height:22, borderRadius:'50%', background:c, border:color===c?'2px solid white':'1px solid rgba(255,255,255,0.15)', cursor:'pointer', flexShrink:0 }}
            onClick={e => { e.stopPropagation(); setColor(c); }} onMouseDown={e => e.stopPropagation()} />
        ))}
      </div>
      {/* Slider con etiqueta */}
      <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>Brillo · {brightness}%</div>
      <Slider value={brightness} onChange={setBrightness} showVal={false} />
      {modal && <RGBModal config={config} onConfigChange={handleConfigChange} onClose={() => setModal(false)} />}
    </div>
  );
}

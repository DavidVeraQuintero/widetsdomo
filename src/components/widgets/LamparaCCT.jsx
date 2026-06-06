import { useState } from 'react';
import { createPortal } from 'react-dom';
import Toggle from './Toggle';
import Slider from './Slider';
import { useLongPress, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

// Color visual según temperatura de color
const cctColor = (v) => v < 33 ? '#f97316' : v < 66 ? '#f8fafc' : '#67e8f9';
const cctLabel = (v) => v < 33 ? '🔥 Cálido' : v < 66 ? '☀ Neutro' : '❄ Frío';

function CCTModal({ config, onConfigChange, onClose }) {
  const { colorTemp = 50, on = false } = config;
  const icons = useWidgetIcons('lampara-cct', config.icons);
  const cfg = (patch) => onConfigChange({ ...config, ...patch });
  const borderCol = cctColor(colorTemp);
  return createPortal(
    <div
      style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.65)' }}
      onMouseDown={e => { e.stopPropagation(); onClose(); }}
    >
      <div
        style={{ background:'linear-gradient(135deg,#0f172a,#0a1f3d)', border:`2px solid ${borderCol}55`, borderRadius:16, padding:22, width:280, boxShadow:`0 0 40px ${borderCol}33, 0 20px 60px rgba(0,0,0,0.6)` }}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ color:'#e2e8f0', fontWeight:700, fontSize:14 }}>💫 Lámpara CCT</div>
          <Toggle on={on} onToggle={() => cfg({ on: !on })} />
        </div>

        {/* Preview de temperatura */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <SvgIcon id={icons.default} size={36} color="var(--icon-on)" className="icon-glow" />
          </div>
        </div>

        {/* Etiqueta actual */}
        <div style={{ textAlign:'center', color:'var(--text-secondary)', fontWeight:600, marginBottom:16 }}>
          {cctLabel(colorTemp)} · {colorTemp}%
        </div>

        {/* Slider de temperatura */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Temperatura de color</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>🔥</span>
            <div style={{ flex:1 }}>
              <Slider value={colorTemp} onChange={v => cfg({ colorTemp: v })} showVal={false} />
            </div>
            <span style={{ fontSize:16 }}>❄</span>
          </div>
        </div>

        {/* Presets */}
        <div style={{ fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginTop:14, marginBottom:8 }}>Preajustes</div>
        <div style={{ display:'flex', gap:8 }}>
          {[0, 25, 50, 75, 100].map(v => (
            <button
              key={v}
              style={{ flex:1, padding:'6px 0', borderRadius:8, background:`${cctColor(v)}22`, border:`1px solid ${colorTemp === v ? cctColor(v) : 'rgba(255,255,255,0.1)'}`, cursor:'pointer', color:'var(--text-secondary)', fontSize:9, fontWeight:600 }}
              onClick={() => cfg({ colorTemp: v })}
              onMouseDown={e => e.stopPropagation()}
            >
              {cctLabel(v).split(' ')[1] || cctLabel(v)}
            </button>
          ))}
        </div>

        <IconSection typeId="lampara-cct" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
        <div style={{ textAlign:'center', marginTop:14, fontSize:10, color:'rgba(255,255,255,0.25)' }}>Clic fuera para cerrar</div>
      </div>
    </div>,
    document.body
  );
}

export default function LamparaCCT({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'CCT', colorTemp = 50 } = config;
  const [modal, setModal] = useState(false);
  const icons = useWidgetIcons('lampara-cct', config.icons);

  const toggle = () => onConfigChange({ ...config, on: !on });
  const setTemp  = (v) => onConfigChange({ ...config, colorTemp: v });
  const patchConfig = (patch) => onConfigChange({ ...config, ...patch });
  const longPress = useLongPress(() => setModal(true));

  const borderCol = cctColor(colorTemp);
  const label     = cctLabel(colorTemp);

  const Icon = ({ sz = 50, iconSz = 26, ...rest }) => (
    <div
      style={{ width:sz, height:sz, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', userSelect:'none', transition:'border-color 0.2s, box-shadow 0.2s' }}
      {...longPress} {...rest}
    >
      <SvgIcon id={icons.default} size={iconSz} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
    </div>
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <Icon sz={44} iconSz={44} onClick={e => { e.stopPropagation(); toggle(); }} />
      {modal && <CCTModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'flex-end' }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon sz={50} iconSz={44} />
      </div>
      <div style={{ fontSize:9, color:'var(--text-secondary)', textAlign:'right', marginBottom:2 }}>{label} · {colorTemp}%</div>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <span style={{ fontSize:10 }}>🔥</span>
        <div style={{ flex:1, minWidth:0 }}><Slider value={colorTemp} onChange={setTemp} showVal={false} /></div>
        <span style={{ fontSize:10 }}>❄</span>
      </div>
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:4 }}>{name}</div>
      {modal && <CCTModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Icon sz={28} iconSz={13} />
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:10, flexShrink:0 }}>🔥</span>
        <Slider value={colorTemp} onChange={setTemp} showVal={false} />
        <span style={{ fontSize:9, color:'var(--text-secondary)', flexShrink:0 }}>{label.split(' ')[1] || label}</span>
        <span style={{ fontSize:10, flexShrink:0 }}>❄</span>
      </div>
      {modal && <CCTModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />}
    </div>
  );

  // 2x2
  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">💫 Lámpara CCT</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <Icon sz={56} iconSz={28} />
        <div className="w-name">{name}</div>
        <div style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>{label}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12 }}>🔥</span>
        <Slider value={colorTemp} onChange={setTemp} showVal={false} />
        <span style={{ fontSize:12 }}>❄</span>
      </div>
      {modal && <CCTModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />}
    </div>
  );
}

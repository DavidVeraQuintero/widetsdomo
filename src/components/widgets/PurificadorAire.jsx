import { useState } from 'react';
import Toggle from './Toggle';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

const AQI_COLOR = (v) => v <= 50 ? '#22c55e' : v <= 100 ? '#f59e0b' : '#ef4444';
const AQI_LABEL = (v) => v <= 50 ? 'Bueno' : v <= 100 ? 'Moderado' : 'Malo';

function PurificadorModal({ on, aqi, name, config, onConfigChange, onClose }) {
  const aqiCol = AQI_COLOR(aqi);
  const icons = useWidgetIcons('purificador', config.icons);
  return (
    <ModalBase
      title="🌬 Purificador de Aire"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ on: !on })} />}
      onClose={onClose}
      borderColor={aqiCol}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:16 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:40, fontWeight:700, color:aqiCol, marginBottom:4 }}>AQI {aqi}</div>
      <div style={{ textAlign:'center', fontSize:13, color:aqiCol, fontWeight:600, marginBottom:8 }}>{AQI_LABEL(aqi)}</div>
      <div style={{ width:'100%', height:8, background:'var(--accent-dim)', borderRadius:4, overflow:'hidden', marginTop:8 }}>
        <div style={{ width:`${Math.min(aqi, 150) / 150 * 100}%`, height:'100%', background:aqiCol, borderRadius:4 }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text-secondary)', marginTop:4 }}>
        <span>0 Bueno</span><span>100 Moderado</span><span>150+ Malo</span>
      </div>
      <IconSection typeId="purificador" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function PurificadorAire({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Purificador', aqi = 25 } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, on: !on });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const aqiCol = AQI_COLOR(aqi);
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('purificador', config.icons);

  const Modal = modal && (
    <PurificadorModal on={on} aqi={aqi} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ alignItems:'center', justifyContent:'center' }}>
      <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
        <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:2, flexShrink:0 }}>AQI {aqi}</div>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ cursor:'pointer', display:'flex', alignItems:'center' }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
      </div>
      <div className="w-sub" style={{ textAlign:'center', flexShrink:0 }}>AQI {aqi} · {AQI_LABEL(aqi)}</div>
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
      <div className="w-sub">AQI {aqi} · {AQI_LABEL(aqi)}</div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{name}</div>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <div style={{ cursor:'pointer', display:'flex', alignItems:'center' }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </div>
        <div className="w-val-med" style={{ color:'var(--text-primary)' }}>AQI {aqi}</div>
        <div className="w-sub">{AQI_LABEL(aqi)}</div>
      </div>
      {Modal}
    </div>
  );
}

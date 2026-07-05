import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

function LuminosidadModal({ lux, name, config, onConfigChange, onClose, col, level, icons }) {
  return (
    <ModalBase title="☀ Luminosidad" onClose={onClose} borderColor={col}>
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color="var(--icon-on)" className="icon-glow" />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:12 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:40, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{lux}</div>
      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-secondary)', marginBottom:8 }}>lux</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--text-primary)', fontWeight:600 }}>{level}</div>
      <div style={{ width:'100%', height:8, background:'var(--accent-dim)', borderRadius:4, overflow:'hidden', marginTop:16 }}>
        <div style={{ width:`${Math.min(lux, 1000) / 1000 * 100}%`, height:'100%', background:col, borderRadius:4 }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>
        <span>0 Oscuro</span><span>500 Moderado</span><span>1000+ Brillante</span>
      </div>
      <IconSection typeId="sensor-luz" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function SensorLuminosidad({ size, config, onConfigChange, accentColor }) {
  const { lux = 320, name = 'Luz' } = config;
  const [modal, setModal] = useState(false);
  const level = lux < 100 ? 'Oscuro' : lux < 500 ? 'Moderado' : 'Brillante';
  const col = lux < 100 ? 'var(--text-dim)' : lux < 500 ? '#f59e0b' : '#fbbf24';
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('sensor-luz', config.icons);

  const Modal = modal && (
    <LuminosidadModal lux={lux} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} col={col} level={level} icons={icons} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ alignItems:'center' }}>
      <div style={{ fontSize:12, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <span style={{ cursor:'pointer', userSelect:'none' }} {...longPress}><SvgIcon id={icons.default} size={44} color="var(--icon-on)" className="icon-glow" /></span>
        <span style={{ fontSize:12, color:'var(--text-primary)' }}>{lux} lx</span>
      </div>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={44} color="var(--icon-on)" className="icon-glow" /></span>
      <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{lux}</div>
      <div className="w-sub">lux · {level}</div>
      {Modal}
    </div>
  );

  return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={28} color="var(--icon-on)" className="icon-glow" /></span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:'var(--text-primary)' }}>{level}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>{lux}</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>lux</div>
      </div>
      {Modal}
    </div>
  );
}

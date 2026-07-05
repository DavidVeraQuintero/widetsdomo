import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

const AQI_LABEL = (v) => v <= 50 ? 'Bueno' : v <= 100 ? 'Moderado' : v <= 150 ? 'Dañino' : 'Peligroso';
const AQI_COLOR = (v) => v <= 50 ? '#22c55e' : v <= 100 ? '#f59e0b' : v <= 150 ? '#f97316' : '#ef4444';

function CalidadAireModal({ aqi, co2, name, config, onConfigChange, onClose, accentColor }) {
  const col = AQI_COLOR(aqi);
  const icons = useWidgetIcons('sensor-aire', config.icons);
  return (
    <ModalBase
      title="💨 Calidad del Aire"
      onClose={onClose}
      borderColor={col}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color="var(--icon-on)" className="icon-glow" />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:12 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:44, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>AQI {aqi}</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--text-secondary)', fontWeight:600, marginBottom:16 }}>{AQI_LABEL(aqi)}</div>
      <div style={{ width:'100%', height:8, background:'var(--accent-dim)', borderRadius:4, overflow:'hidden', marginBottom:16 }}>
        <div style={{ width:`${Math.min(aqi, 200) / 200 * 100}%`, height:'100%', background:col, borderRadius:4 }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', borderTop:'1px solid var(--border)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>CO₂</div>
          <div style={{ fontSize:18, fontWeight:600, color:'var(--text-primary)' }}>{co2}</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)' }}>ppm</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>Estado</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>● {AQI_LABEL(aqi)}</div>
        </div>
      </div>
      <IconSection typeId="sensor-aire" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function SensorCalidadAire({ size, config, onConfigChange, accentColor }) {
  const { aqi = 42, co2 = 480, name = 'Aire' } = config;
  const [modal, setModal] = useState(false);
  const col = AQI_COLOR(aqi);
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('sensor-aire', config.icons);

  const Modal = modal && (
    <CalidadAireModal aqi={aqi} co2={co2} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={44} color="var(--icon-on)" className="icon-glow" /></span>
      <div className="w-val-big" style={{ color:'var(--text-primary)' }}>AQI {aqi}</div>
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{AQI_LABEL(aqi)}</div>
      <div className="w-sub">CO₂: {co2} ppm</div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={32} color="var(--icon-on)" className="icon-glow" /></span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:'var(--text-secondary)' }}>{AQI_LABEL(aqi)}</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>AQI {aqi}</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>CO₂: {co2}</div>
      </div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body w-center">
      <div className="w-name">{name}</div>
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={48} color="var(--icon-on)" className="icon-glow" /></span>
      <div className="w-val-big" style={{ color:'var(--text-primary)' }}>AQI {aqi}</div>
      <div className="w-status" style={{ color:'var(--text-secondary)', fontWeight:600 }}>{AQI_LABEL(aqi)}</div>
      <div className="w-divider" />
      <div className="w-row">
        <div className="w-col w-center"><div className="w-sub">CO₂</div><div style={{ color:'var(--text-primary)', fontWeight:600 }}>{co2} ppm</div></div>
        <div className="w-col w-center"><div className="w-sub">Estado</div><div style={{ color:'var(--text-secondary)' }}>● {AQI_LABEL(aqi)}</div></div>
      </div>
      {Modal}
    </div>
  );
}

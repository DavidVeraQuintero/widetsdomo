import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

function TempHumedadModal({ temp, humidity, name, config, onConfigChange, onClose, accentColor }) {
  const icons = useWidgetIcons('sensor-temp', config.icons);
  return (
    <ModalBase
      title="🌡 Temperatura / Humedad"
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:16 }}>{name}</div>
      <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <span style={{ fontSize:32 }}>🌡</span>
          <div style={{ fontSize:36, fontWeight:700, color:'var(--text-primary)', marginTop:4 }}>{temp}°C</div>
          <div style={{ fontSize:10, color:'var(--text-secondary)', marginTop:4 }}>Temperatura</div>
        </div>
        <div style={{ width:1, background:'var(--border)' }} />
        <div style={{ textAlign:'center' }}>
          <span style={{ fontSize:32 }}>💧</span>
          <div style={{ fontSize:36, fontWeight:700, color:'var(--text-secondary)', marginTop:4 }}>{humidity}%</div>
          <div style={{ fontSize:10, color:'var(--text-secondary)', marginTop:4 }}>Humedad</div>
        </div>
      </div>
      <IconSection typeId="sensor-temp" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function SensorTempHumedad({ size, config, onConfigChange, accentColor }) {
  const { temp = 22, humidity = 65, name = 'Sensor' } = config;
  const [modal, setModal] = useState(false);
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('sensor-temp', config.icons);

  const Modal = modal && (
    <TempHumedadModal temp={temp} humidity={humidity} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer' }} {...longPress}>
        <div style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', lineHeight:1 }}>{temp}°</div>
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:2 }}>{humidity}%</div>
      </div>
      <div style={{ width:6, height:6, borderRadius:'50%', background:accentColor }} />
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <div className="w-label">🌡 Sensor</div>
      <div className="w-val-big" style={{ color:'var(--text-primary)', cursor:'pointer' }} {...longPress}>{temp}°C</div>
      <div className="w-sub">Temperatura</div>
      <div className="w-divider" />
      <div className="w-val-med" style={{ color:'var(--text-secondary)' }}>{humidity}%</div>
      <div className="w-sub">Humedad relativa</div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div className="w-row-body">
      <span style={{ fontSize:24, cursor:'pointer' }} {...longPress}>🌡</span>
      <div className="w-info">
        <div className="w-name">{name}</div>
      </div>
      <div style={{ textAlign:'center' }}>
        <div className="w-val-med" style={{ color:'var(--text-primary)' }}>{temp}°C</div>
        <div style={{ fontSize:9, color:'var(--text-secondary)' }}>temp</div>
      </div>
      <div style={{ width:1, height:30, background:'var(--border)', flexShrink:0 }} />
      <div style={{ textAlign:'center' }}>
        <div className="w-val-med" style={{ color:'var(--text-secondary)' }}>{humidity}%</div>
        <div style={{ fontSize:9, color:'var(--text-secondary)' }}>HR</div>
      </div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body w-center">
      <div className="w-label">🌡 Temperatura / Humedad</div>
      <div className="w-name">{name}</div>
      <div style={{ display:'flex', gap:20, alignItems:'center', flex:1, cursor:'pointer' }} {...longPress}>
        <div className="w-col w-center">
          <span style={{ fontSize:24 }}>🌡</span>
          <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{temp}°C</div>
          <div className="w-sub">Temperatura</div>
        </div>
        <div className="w-col w-center">
          <span style={{ fontSize:24 }}>💧</span>
          <div className="w-val-big" style={{ color:'var(--text-secondary)' }}>{humidity}%</div>
          <div className="w-sub">Humedad</div>
        </div>
      </div>
      {Modal}
    </div>
  );
}

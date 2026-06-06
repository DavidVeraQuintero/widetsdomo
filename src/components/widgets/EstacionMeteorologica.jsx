import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

function MeteoModal({ temp, humidity, pressure, wind, name, config, onConfigChange, onClose, accentColor }) {
  const icons = useWidgetIcons('estacion-meteo', config.icons);
  return (
    <ModalBase
      title="⛅ Estación Meteorológica"
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:12 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:44, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{temp}°C</div>
      <div style={{ textAlign:'center', fontSize:11, color:'var(--text-secondary)', marginBottom:16 }}>⛅ Parcialmente nublado</div>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {[
          { icon:'💧', label:'Humedad', value:`${humidity}%`, col:'#67e8f9' },
          { icon:'🌬', label:'Viento', value:`${wind} km/h`, col:'var(--text-secondary)' },
          { icon:'⬇', label:'Presión', value:`${pressure} hPa`, col:'var(--text-secondary)' },
        ].map(({ icon, label, value, col }) => (
          <div key={label} style={{ flex:1, background:'var(--accent-dim)', borderRadius:8, padding:'10px 6px', textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize:9, color:'var(--text-secondary)', marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>
      <IconSection typeId="estacion-meteo" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function EstacionMeteorologica({ size, config, onConfigChange, accentColor }) {
  const { temp = 18, humidity = 72, pressure = 1013, wind = 12, name = 'Exterior' } = config;
  const [modal, setModal] = useState(false);
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('estacion-meteo', config.icons);

  const Data = ({ icon, label, value, unit, color }) => (
    <div className="w-col w-center" style={{ flex:1 }}>
      <span style={{ fontSize:20 }}>{icon}</span>
      <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{value}<span style={{ fontSize:10 }}>{unit}</span></div>
      <div className="w-sub">{label}</div>
    </div>
  );

  const Modal = modal && (
    <MeteoModal temp={temp} humidity={humidity} pressure={pressure} wind={wind} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-label">⛅ Estación Meteo</div>
      <div className="w-name">{name}</div>
      <div style={{ display:'flex', flex:1, gap:8 }}>
        <div style={{ cursor:'pointer' }} {...longPress}><Data icon="🌡" label="Temp" value={temp} unit="°C" color={accentColor} /></div>
        <Data icon="💧" label="HR" value={humidity} unit="%" color="#67e8f9" />
      </div>
      <div style={{ display:'flex', flex:1, gap:8 }}>
        <Data icon="🌬" label="Viento" value={wind} unit=" km/h" color="var(--text-secondary)" />
        <Data icon="⬇" label="Presión" value={pressure} unit=" hPa" color="var(--text-secondary)" />
      </div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-label">⛅ Estación Meteorológica</div>
      <div className="w-name">{name}</div>
      <div style={{ display:'flex', justifyContent:'center', padding:'8px 0', cursor:'pointer' }} {...longPress}>
        <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{temp}°C</div>
      </div>
      <div className="w-divider" />
      <div style={{ display:'flex', flex:1 }}>
        <Data icon="💧" label="Humedad" value={humidity} unit="%" color="#67e8f9" />
        <Data icon="🌬" label="Viento" value={wind} unit=" km/h" color="var(--text-secondary)" />
        <Data icon="⬇" label="Presión" value={pressure} unit=" hPa" color="var(--text-secondary)" />
      </div>
      <div style={{ background:'var(--accent-dim)', borderRadius:6, padding:8, textAlign:'center' }}>
        <div className="w-sub">Condición</div>
        <div style={{ color:'var(--text-secondary)', marginTop:2 }}>⛅ Parcialmente nublado</div>
      </div>
      {Modal}
    </div>
  );
}

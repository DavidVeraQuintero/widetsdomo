import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

function PresenciaModal({ present, name, config, onConfigChange, onClose }) {
  const icons = useWidgetIcons('sensor-presencia', config.icons);
  const col = present ? '#f59e0b' : '#22c55e';
  return (
    <ModalBase
      title="🧑 Sensor de Presencia"
      onClose={onClose}
      borderColor={col}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={present ? icons.present : icons.absent} size={64} color={present ? 'var(--icon-on)' : 'var(--icon-off)'} className={present ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:8 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--text-primary)', fontWeight:700, marginBottom:16 }}>{present ? '● Presencia detectada' : '○ Zona vacía'}</div>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
        <div style={{ width:16, height:16, borderRadius:'50%', background:col, boxShadow:present ? `0 0 14px ${col}` : 'none' }} />
      </div>
      <div style={{ fontSize:9, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:8, textAlign:'center' }}>Simulación</div>
      <button className="w-btn" style={{ width:'100%' }}
        onClick={() => onConfigChange({ present: !present })}
        onMouseDown={e => e.stopPropagation()}>
        Simular {present ? 'zona vacía' : 'presencia'}
      </button>
      <IconSection typeId="sensor-presencia" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function SensorPresencia({ size, config, onConfigChange, accentColor }) {
  const { present = false, name = 'Presencia' } = config;
  const [modal, setModal] = useState(false);
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const icons = useWidgetIcons('sensor-presencia', config.icons);
  const col = present ? '#f59e0b' : '#22c55e';
  const longPress = useLongPress(() => setModal(true));

  const Modal = modal && (
    <PresenciaModal present={present} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <span style={{ cursor:'pointer', userSelect:'none' }} {...longPress}><SvgIcon id={present ? icons.present : icons.absent} size={44} color={present ? 'var(--icon-on)' : 'var(--icon-off)'} className={present ? 'icon-glow' : ''} /></span>
      <span style={{ fontSize:11, color:'var(--text-primary)' }}>{present ? 'Presente' : 'Vacío'}</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <div className="w-label">🧑 Presencia</div>
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={present ? icons.present : icons.absent} size={44} color={present ? 'var(--icon-on)' : 'var(--icon-off)'} className={present ? 'icon-glow' : ''} /></span>
      <div className="w-name">{name}</div>
      <div className="w-status" style={{ color:'var(--text-primary)' }}>{present ? '● Presencia detectada' : '○ Zona vacía'}</div>
      {Modal}
    </div>
  );

  return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={present ? icons.present : icons.absent} size={28} color={present ? 'var(--icon-on)' : 'var(--icon-off)'} className={present ? 'icon-glow' : ''} /></span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:'var(--text-primary)' }}>{present ? '● Presencia detectada' : '○ Zona vacía'}</div>
      </div>
      <div style={{ width:14, height:14, borderRadius:'50%', background:col, boxShadow:present ? `0 0 10px ${col}` : 'none', flexShrink:0 }} />
      {Modal}
    </div>
  );
}

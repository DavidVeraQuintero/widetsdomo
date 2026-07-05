import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

function InundacionModal({ alert, name, config, onConfigChange, onClose }) {
  const col = alert ? '#3b82f6' : '#22c55e';
  const icons = useWidgetIcons('sensor-inundacion', config.icons);
  return (
    <ModalBase
      title="💧 Sensor de Inundación"
      onClose={onClose}
      borderColor={col}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={alert ? icons.alert : icons.ok} size={64} color={alert ? 'var(--icon-on)' : 'var(--icon-off)'} className={alert ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:8 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:14, color:'var(--text-primary)', fontWeight:alert ? 700 : 400, marginBottom:16 }}>{alert ? '⚠ Agua detectada' : '✓ Superficie seca'}</div>
      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
        <div style={{ width:20, height:20, borderRadius:'50%', background:col, boxShadow:alert ? `0 0 16px ${col}` : 'none' }} />
      </div>
      <button className="w-btn" style={{ width:'100%' }}
        onClick={() => onConfigChange({ alert: !alert })}
        onMouseDown={e => e.stopPropagation()}>
        Simular {alert ? 'seco' : 'inundación'}
      </button>
      <IconSection typeId="sensor-inundacion" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function SensorInundacion({ size, config, onConfigChange, accentColor }) {
  const { alert = false, name = 'Agua' } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, alert: !alert });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const col = alert ? '#3b82f6' : '#22c55e';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('sensor-inundacion', config.icons);

  const Modal = modal && (
    <InundacionModal alert={alert} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <span style={{ cursor:'pointer', userSelect:'none' }} {...longPress}><SvgIcon id={alert ? icons.alert : icons.ok} size={44} color={alert ? 'var(--icon-on)' : 'var(--icon-off)'} className={alert ? 'icon-glow' : ''} /></span>
        <span style={{ fontSize:12, color:'var(--text-primary)' }}>{alert ? '⚠ AGUA' : '✓ Seco'}</span>
      </div>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={alert ? icons.alert : icons.ok} size={44} color={alert ? 'var(--icon-on)' : 'var(--icon-off)'} className={alert ? 'icon-glow' : ''} /></span>
      <div className="w-name">{name}</div>
      <div className="w-status" style={{ color:'var(--text-primary)' }}>{alert ? '⚠ Agua detectada' : '✓ Superficie seca'}</div>
      <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>Simular {alert ? 'seco' : 'inundación'}</button>
      {Modal}
    </div>
  );

  return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={alert ? icons.alert : icons.ok} size={28} color={alert ? 'var(--icon-on)' : 'var(--icon-off)'} className={alert ? 'icon-glow' : ''} /></span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:'var(--text-primary)' }}>{alert ? '⚠ Agua detectada' : '✓ Seco'}</div>
      </div>
      <div style={{ width:14, height:14, borderRadius:'50%', background:col, flexShrink:0 }} />
      {Modal}
    </div>
  );
}

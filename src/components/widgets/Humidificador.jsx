import { useState } from 'react';
import Toggle from './Toggle';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function HumidificadorModal({ on, humidity, name, config, onConfigChange, onClose }) {
  const col = on ? '#67e8f9' : 'var(--text-dim)';
  const icons = useWidgetIcons('humidificador', config.icons);
  return (
    <ModalBase
      title="💧 Humidificador"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ on: !on })} />}
      onClose={onClose}
      borderColor="#67e8f9"
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:16 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:28, fontWeight:700, color:'var(--text-primary)', marginBottom:12 }}>{humidity}% HR</div>
      <div style={{ width:'100%', height:10, background:'var(--accent-dim)', borderRadius:5, overflow:'hidden' }}>
        <div style={{ width:`${humidity}%`, height:'100%', background:col, borderRadius:5, transition:'width 0.3s' }} />
      </div>
      <div style={{ textAlign:'center', fontSize:10, color:'var(--text-secondary)', marginTop:8 }}>Humedad relativa</div>
      <IconSection typeId="humidificador" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Humidificador({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Humidificador', humidity = 50 } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, on: !on });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const col = on ? '#67e8f9' : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('humidificador', config.icons);

  const Modal = modal && (
    <HumidificadorModal on={on} humidity={humidity} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
        <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <span style={{ fontSize:11, color:'var(--text-primary)', transition:'color 0.2s' }}>{humidity}%</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'flex-end' }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ cursor:'pointer', display:'flex', alignItems:'center' }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
      </div>
      <div style={{ width:'100%', height:5, background:'var(--accent-dim)', borderRadius:3, overflow:'hidden', marginBottom:2 }}>
        <div style={{ width:`${humidity}%`, height:'100%', background:col, borderRadius:3, transition:'width 0.3s' }} />
      </div>
      <div style={{ fontSize:9, color:'var(--text-primary)', textAlign:'right', marginBottom:4 }}>{humidity}% HR</div>
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {Modal}
    </div>
  );

  return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer', display:'flex', alignItems:'center' }} {...longPress}>
        <SvgIcon id={icons.default} size={28} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <div style={{ height:5, background:'var(--accent-dim)', borderRadius:3, overflow:'hidden', marginTop:2 }}>
          <div style={{ width:`${humidity}%`, height:'100%', background:col, borderRadius:3 }} />
        </div>
      </div>
      <span style={{ fontSize:11, color:'var(--text-primary)', minWidth:30 }}>{humidity}%</span>
      <Toggle on={on} onToggle={toggle} />
      {Modal}
    </div>
  );
}

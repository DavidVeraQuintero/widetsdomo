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
    <div className="w-body" style={{ alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <span style={{ fontSize:11, color:'var(--text-primary)', transition:'color 0.2s' }}>{humidity}%</span>
      </div>
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
      <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-primary)', textAlign:'center', flexShrink:0 }}>{humidity}% HR</div>
      <div style={{ width:'100%', height:5, background:'var(--accent-dim)', borderRadius:3, overflow:'hidden', flexShrink:0 }}>
        <div style={{ width:`${humidity}%`, height:'100%', background:'rgba(255,255,255,0.75)', borderRadius:3, transition:'width 0.3s' }} />
      </div>
      {Modal}
    </div>
  );

  return (
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
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ flex:1, height:5, background:'var(--accent-dim)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ width:`${humidity}%`, height:'100%', background:'rgba(255,255,255,0.75)', borderRadius:3 }} />
        </div>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', flexShrink:0 }}>{humidity}%</span>
      </div>
      {Modal}
    </div>
  );
}

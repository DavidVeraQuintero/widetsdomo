import { useState } from 'react';
import Toggle from './Toggle';
import Slider from './Slider';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useDeviceControl } from '../../hooks/useDeviceControl';

function DimmerModal({ config, onConfigChange, onClose, accentColor }) {
  const { on = false, brightness = 75, name = 'Lámpara' } = config;
  const icons = useWidgetIcons('lampara-dimmer', config.icons);
  const col = on ? accentColor : 'var(--text-dim)';
  return (
    <ModalBase
      title="💡 Dimmer"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ ...config, on: !on })} />}
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:16 }}>{name}</div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Brillo · {brightness}%</div>
      <Slider value={brightness} onChange={v => onConfigChange({ ...config, brightness: v })} showVal={false} />
      <IconSection typeId="lampara-dimmer" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

const ToggleWithPct = ({ on, onToggle, brightness, accentColor }) => (
  <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'center' }}>
    <Toggle on={on} onToggle={onToggle} />
    <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{brightness}%</span>
  </div>
);

export default function LamparaDimmer({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Lámpara', brightness = 75 } = config;
  const [modal, setModal] = useState(false);
  const sendCmd = useDeviceControl(config);

  const handleConfigChange = (newConfig) => {
    if (newConfig.on !== config.on) sendCmd(newConfig.on ? 'on' : 'off');
    if (newConfig.brightness !== undefined && newConfig.brightness !== config.brightness) {
      sendCmd('setLevel', newConfig.brightness);
    }
    onConfigChange(newConfig);
  };

  const toggle = () => handleConfigChange({ ...config, on: !on });
  const setBrightness = (v) => {
    const newConfig = { ...config, brightness: v };
    if (!on && v > 0) newConfig.on = true;
    handleConfigChange(newConfig);
  };
  const col = on ? accentColor : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('lampara-dimmer', config.icons);

  const Modal = modal && (
    <DimmerModal config={config} onConfigChange={handleConfigChange} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ flexDirection:'column', justifyContent:'center', alignItems:'center', gap:4 }}>
      <span style={{ cursor:'pointer', userSelect:'none', flexShrink:0 }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
        <SvgIcon id={icons.default} size={40} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <span style={{ fontSize:12, color: on ? '#ffffff' : 'var(--text-secondary)', transition:'color 0.2s', flexShrink:0 }}>{brightness}%</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <div style={{ cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{brightness}%</div>
      </div>
      <Slider value={brightness} onChange={setBrightness} showVal={false} />
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:4 }}>{name}</div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height:'100%', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'16px 12px 10px 12px' }}>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingRight:44 }}>
        <span style={{ flexShrink:0, cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={38} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{brightness}%</span>
        <Slider value={brightness} onChange={setBrightness} showVal={false} />
      </div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
        <span style={{ cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={48} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <div className="w-name">{name}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{brightness}%</span>
        <Slider value={brightness} onChange={setBrightness} showVal={false} />
      </div>
      {Modal}
    </div>
  );
}

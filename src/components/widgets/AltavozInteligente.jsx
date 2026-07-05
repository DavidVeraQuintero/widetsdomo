import { useState } from 'react';
import Toggle from './Toggle';
import Slider from './Slider';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function AltavozModal({ config, onConfigChange, onClose, accentColor }) {
  const { on = false, volume = 50, name = 'Altavoz' } = config;
  const icons = useWidgetIcons('altavoz', config.icons);
  return (
    <ModalBase
      title="🔊 Altavoz Inteligente"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ ...config, on: !on })} />}
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:16 }}>{name}</div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Volumen · {volume}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:14 }}>🔈</span>
        <Slider value={volume} onChange={v => onConfigChange({ ...config, volume: v })} showVal={false} />
        <span style={{ fontSize:14 }}>🔊</span>
      </div>
      <IconSection typeId="altavoz" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function AltavozInteligente({ size, config, onConfigChange, accentColor }) {
  const { on = false, volume = 50, name = 'Altavoz' } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setVolume = (v) => onConfigChange({ ...config, volume: v });
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('altavoz', config.icons);

  const Modal = modal && (
    <AltavozModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ alignItems:'center' }}>
      <div style={{ fontSize:12, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <span style={{ fontSize:12, color:'var(--text-secondary)', transition:'color 0.2s' }}>{volume}</span>
      </div>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
      </div>
      <div style={{ marginBottom:4 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Volumen</span>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{volume}</span>
        </div>
        <Slider value={volume} onChange={setVolume} showVal={false} />
      </div>
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {Modal}
    </div>
  );

  // 2x1 — toggle absoluto arriba a la derecha
  return (
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
        <span style={{ fontSize:12, color:'var(--text-secondary)', flexShrink:0 }}>{volume}</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
      </div>
      {Modal}
    </div>
  );
}

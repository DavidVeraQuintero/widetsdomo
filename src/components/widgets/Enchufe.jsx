import { useState } from 'react';
import Toggle from './Toggle';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useDeviceControl } from '../../hooks/useDeviceControl';

function EnchufeModal({ config, onConfigChange, onClose }) {
  const { on = false, watts = 85, name = 'Enchufe' } = config;
  const icons = useWidgetIcons('enchufe', config.icons);
  const col = on ? '#22c55e' : 'var(--text-dim)';
  return (
    <ModalBase
      title="🔌 Enchufe Inteligente"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ ...config, on: !on })} />}
      onClose={onClose}
      borderColor="#22c55e"
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:10 }}>{name}</div>
      <div style={{ textAlign:'center', marginTop:10 }}>
        {on
          ? <div style={{ fontSize:28, fontWeight:700, color:'var(--text-primary)' }}>{watts}W</div>
          : <div style={{ fontSize:12, color:'var(--text-dim)' }}>○ Apagado</div>
        }
        {on && <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>consumiendo ahora</div>}
      </div>
      <IconSection typeId="enchufe" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Enchufe({ size, config, onConfigChange, accentColor }) {
  const { on = false, watts = 85, name = 'Enchufe' } = config;
  const [modal, setModal] = useState(false);
  const sendCmd = useDeviceControl(config);

  const handleConfigChange = (newConfig) => {
    if (newConfig.on !== config.on) sendCmd(newConfig.on ? 'on' : 'off');
    onConfigChange(newConfig);
  };

  const toggle = () => handleConfigChange({ ...config, on: !on });
  const col = on ? '#22c55e' : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('enchufe', config.icons);

  const Modal = modal && (
    <EnchufeModal config={config} onConfigChange={handleConfigChange} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ alignItems:'center' }}>
      <div className="w-name" style={{ width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <span style={{ marginTop:'auto', cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}><SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} /></span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} /></span>
      </div>
      {on && <div style={{ fontSize:12, color:'var(--text-primary)', textAlign:'right', marginBottom:2 }}>{watts}W</div>}
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height:'100%', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'16px 12px 10px 12px' }}>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, paddingRight:44 }}>
        <span style={{ flexShrink:0, cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={38} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} /></span>
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
      </div>
      {on && <div style={{ fontSize:12, color:'var(--text-primary)' }}>● {watts}W consumiendo</div>}
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{name}</div>
      <div style={{ position:'absolute', top:4, right:12, zIndex:1 }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={52} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} /></span>
      </div>
      <span style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', textAlign:'right' }}>{on ? `${watts}W` : '—'}</span>
      {Modal}
    </div>
  );
}

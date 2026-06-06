import { useState } from 'react';
import Toggle from './Toggle';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function SimpleModal({ config, onConfigChange, onClose, accentColor }) {
  const { on = false, name = 'Lámpara' } = config;
  const icons = useWidgetIcons('lampara-simple', config.icons);
  const col = on ? accentColor : 'var(--text-dim)';
  return (
    <ModalBase
      title="💡 Lámpara Simple"
      headerRight={<Toggle on={on} onToggle={() => onConfigChange({ ...config, on: !on })} />}
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 16px' }}>
        <SvgIcon id={icons.default} size={72} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:11, color:'var(--text-secondary)', marginTop:8 }}>{on ? '● Encendida' : '○ Apagada'}</div>
      <IconSection typeId="lampara-simple" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function LamparaSimple({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Lámpara' } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, on: !on });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const col = on ? accentColor : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('lampara-simple', config.icons);

  const Modal = modal && (
    <SimpleModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}>
        <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'flex-end' }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
      </div>
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height:'100%', display:'flex', flexDirection:'row', alignItems:'center', padding:'0 12px', gap:8 }}>
      <span style={{ flexShrink:0, cursor:'pointer' }} {...longPress}>
        <SvgIcon id={icons.default} size={22} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
      </span>
      <div style={{ flex:1, minWidth:0 }}>
        <div className="w-name" style={{ overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{name}</div>
      </div>
      <Toggle on={on} onToggle={toggle} />
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">💡 Lámpara</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
        <span style={{ cursor:'pointer' }} {...longPress}>
          <SvgIcon id={icons.default} size={48} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} />
        </span>
        <div className="w-name">{name}</div>
      </div>
      {Modal}
    </div>
  );
}

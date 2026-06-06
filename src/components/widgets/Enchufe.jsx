import { useState } from 'react';
import Toggle from './Toggle';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

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
          : <div style={{ fontSize:11, color:'var(--text-dim)' }}>○ Apagado</div>
        }
        {on && <div style={{ fontSize:10, color:'var(--text-secondary)', marginTop:4 }}>consumiendo ahora</div>}
      </div>
      <IconSection typeId="enchufe" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Enchufe({ size, config, onConfigChange, accentColor }) {
  const { on = false, watts = 85, name = 'Enchufe' } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, on: !on });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const col = on ? '#22c55e' : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('enchufe', config.icons);

  const Modal = modal && (
    <EnchufeModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:11, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <span style={{ cursor:'pointer', userSelect:'none' }} onClick={e => { e.stopPropagation(); toggle(); }} {...longPress}><SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} /></span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'flex-end' }}><Toggle on={on} onToggle={toggle} /></div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={44} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} /></span>
      </div>
      <div style={{ fontSize:9, color:'var(--text-primary)', textAlign:'right', marginBottom:2 }}>{on ? `${watts}W` : '○ off'}</div>
      <div className="w-name" style={{ textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ flexShrink:0, cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={20} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} /></span>
        <div style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ fontSize:11, color:'var(--text-primary)' }}>{on ? `● ${watts}W consumiendo` : '○ Apagado'}</div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={52} color={on ? 'var(--icon-on)' : 'var(--icon-off)'} className={on ? 'icon-glow' : ''} /></span>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0, flex:1 }}>{name}</div>
        <span style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', flexShrink:0 }}>{on ? `${watts}W` : '—'}</span>
      </div>
    </div>
  );
}

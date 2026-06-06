import { useState } from 'react';
import Toggle from './Toggle';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function ReglaModal({ config, onConfigChange, onClose }) {
  const { enabled = true, name = 'Si anochece → luces' } = config;
  const icons = useWidgetIcons('regla-auto', config.icons);
  const col = enabled ? '#22c55e' : 'var(--text-dim)';
  return (
    <ModalBase
      title="⚙ Automatización"
      headerRight={<Toggle on={enabled} onToggle={() => onConfigChange({ ...config, enabled: !enabled })} />}
      onClose={onClose}
      borderColor={enabled ? '#22c55e' : '#888'}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color={col} />
      </div>
      <div style={{ background:'var(--accent-dim)', borderRadius:8, padding:12, marginBottom:16 }}>
        <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4 }}>Regla</div>
        <div style={{ fontSize:13, color:'#e2e8f0', lineHeight:1.5 }}>{name}</div>
      </div>
      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-secondary)', fontWeight:600, marginBottom:8 }}>{enabled ? '● Activa' : '○ Pausada'}</div>
      <div style={{ fontSize:10, color:'var(--text-secondary)', textAlign:'center' }}>Última ejecución: hace 2h</div>
      <IconSection typeId="regla-auto" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function ReglaAutomatica({ size, config, onConfigChange, accentColor }) {
  const { enabled = true, name = 'Si anochece → luces' } = config;
  const [modal, setModal] = useState(false);
  const toggle = () => onConfigChange({ ...config, enabled: !enabled });
  const col = enabled ? '#22c55e' : 'var(--text-dim)';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('regla-auto', config.icons);

  const Modal = modal && (
    <ReglaModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <div className="w-label">⚙ Automatización</div>
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={44} color={col} /></span>
      <div className="w-name" style={{ fontSize:11, lineHeight:1.4, textAlign:'center' }}>{name}</div>
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{enabled ? '● Activa' : '○ Pausada'}</div>
      <Toggle on={enabled} onToggle={toggle} />
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={24} color={col} /></span>
      <div className="w-info">
        <div className="w-name" style={{ fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
        <div className="w-status" style={{ color:'var(--text-secondary)' }}>{enabled ? '● Activa' : '○ Pausada'}</div>
      </div>
      <Toggle on={enabled} onToggle={toggle} />
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">⚙ Automatización</div>
        <Toggle on={enabled} onToggle={toggle} />
      </div>
      <div className="w-name" style={{ fontSize:11, lineHeight:1.4, cursor:'pointer' }} {...longPress}>{name}</div>
      <div className="w-divider" />
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{enabled ? '● Activa — Se ejecutará cuando se cumpla la condición' : '○ Pausada'}</div>
      <div className="w-sub">Última ejecución: hace 2h</div>
      {Modal}
    </div>
  );
}

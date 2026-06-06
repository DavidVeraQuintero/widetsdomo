import { useState } from 'react';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';

function BateriaModal({ config, onConfigChange, onClose }) {
  const { percent = 78, charging = true, name = 'Batería' } = config;
  const icons = useWidgetIcons('bateria', config.icons);
  const col = percent > 50 ? '#22c55e' : percent > 20 ? '#f59e0b' : '#ef4444';
  return (
    <ModalBase
      title="🔋 Batería"
      onClose={onClose}
      borderColor={col}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <SvgIcon id={icons.default} size={64} color="var(--icon-on)" className="icon-glow" />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:12 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:44, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{percent}%</div>
      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-secondary)', marginBottom:16 }}>{charging ? '⚡ Cargando' : '● Descargando'}</div>
      <div style={{ width:'100%', height:12, background:'var(--accent-dim)', borderRadius:6, overflow:'hidden' }}>
        <div style={{ width:`${percent}%`, height:'100%', background:col, borderRadius:6, transition:'width 0.5s' }} />
      </div>
      <IconSection typeId="bateria" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Bateria({ size, config, onConfigChange, accentColor }) {
  const { percent = 78, charging = true, name = 'Batería' } = config;
  const [modal, setModal] = useState(false);
  const col = percent > 50 ? '#22c55e' : percent > 20 ? '#f59e0b' : '#ef4444';
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('bateria', config.icons);

  const Bar = ({ h }) => (
    <div style={{ background:'var(--accent-dim)', borderRadius:4, overflow:'hidden', height:h, width:'100%' }}>
      <div style={{ width:`${percent}%`, height:'100%', background:col, borderRadius:4, transition:'width 0.5s' }} />
    </div>
  );

  const Modal = modal && (
    <BateriaModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <div className="w-label">🔋 Batería</div>
      <div className="w-val-big" style={{ color:'var(--text-primary)', cursor:'pointer' }} {...longPress}>{percent}%</div>
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{charging ? '⚡ Cargando' : '● En uso'}</div>
      <Bar h={10} />
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}><SvgIcon id={icons.default} size={26} color="var(--icon-on)" className="icon-glow" /></span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <Bar h={6} />
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>{percent}%</div>
        <div style={{ fontSize:9, color:'var(--text-secondary)' }}>{charging ? '⚡' : '●'}</div>
      </div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body w-center">
      <div className="w-label">🔋 Batería</div>
      <div className="w-name">{name}</div>
      <div className="w-val-big" style={{ color:'var(--text-primary)', cursor:'pointer' }} {...longPress}>{percent}%</div>
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{charging ? '⚡ Cargando' : '● Descargando'}</div>
      <Bar h={12} />
      {Modal}
    </div>
  );
}

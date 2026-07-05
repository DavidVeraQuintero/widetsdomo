import { useState } from 'react';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';
import { useWidgetIcons } from './useWidgetIcons';

function BatteryIcon({ percent, charging, size = 40 }) {
  const SEGS = 4;
  const filled = Math.max(1, Math.round((percent / 100) * SEGS));
  const w = Math.round(size * 0.74);
  const h = Math.round(size * 0.40);
  const pad = Math.max(2, Math.round(h * 0.16));
  const gap = Math.max(1, Math.round(w * 0.04));
  const tipW = Math.round(size * 0.08);
  const tipH = Math.round(h * 0.44);
  const r = Math.max(2, Math.round(h * 0.22));

  return (
    <div style={{ width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ display:'flex', alignItems:'center' }}>
        <div style={{
          width:w, height:h,
          border:'2px solid rgba(255,255,255,0.85)',
          borderRadius:r,
          padding:pad,
          display:'flex',
          gap,
          boxSizing:'border-box',
        }}>
          {Array.from({ length: SEGS }).map((_, i) => (
            <div key={i} style={{
              flex:1,
              height:'100%',
              borderRadius:2,
              background:'rgba(255,255,255,0.9)',
              opacity: charging ? undefined : (i < filled ? 1 : 0.12),
              animation: charging ? `bat-charge 2s ease ${i * 0.5}s infinite` : 'none',
            }} />
          ))}
        </div>
        <div style={{ width:tipW, height:tipH, background:'rgba(255,255,255,0.85)', borderRadius:'0 2px 2px 0' }} />
      </div>
    </div>
  );
}

function BateriaModal({ config, onConfigChange, onClose }) {
  const { percent = 78, charging = true, name = 'Batería' } = config;
  const icons = useWidgetIcons('bateria', config.icons);
  return (
    <ModalBase
      title="🔋 Batería"
      onClose={onClose}
      borderColor={charging ? '#22c55e' : (percent > 50 ? '#22c55e' : percent > 20 ? '#f59e0b' : '#ef4444')}
    >
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <BatteryIcon percent={percent} charging={charging} size={64} />
      </div>
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:12 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:44, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{percent}%</div>
      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-secondary)', marginBottom:16 }}>{charging ? 'Cargando' : '● Descargando'}</div>
      <div style={{ width:'100%', height:12, background:'var(--accent-dim)', borderRadius:6, overflow:'hidden' }}>
        <div style={{ width:`${percent}%`, height:'100%', background:'rgba(255,255,255,0.85)', borderRadius:6, transition:'width 0.5s' }} />
      </div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:1, marginTop:20, marginBottom:8, textAlign:'center' }}>Simulación</div>
      <button className="w-btn" style={{ width:'100%' }}
        onClick={() => onConfigChange({ ...config, charging: !charging })}
        onMouseDown={e => e.stopPropagation()}>
        {charging ? 'Simular descargando' : 'Simular cargando'}
      </button>
      <IconSection typeId="bateria" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Bateria({ size, config, onConfigChange, accentColor }) {
  const { percent = 78, charging = true, name = 'Batería' } = config;
  const [modal, setModal] = useState(false);
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('bateria', config.icons);

  const Bar = ({ h }) => (
    <div style={{ background:'var(--accent-dim)', borderRadius:4, overflow:'hidden', height:h, width:'100%' }}>
      <div style={{ width:`${percent}%`, height:'100%', background:'rgba(255,255,255,0.85)', borderRadius:4, transition:'width 0.5s' }} />
    </div>
  );

  const Modal = modal && (
    <BateriaModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ flexDirection:'column', justifyContent:'center', alignItems:'center', gap:4 }}>
      <span style={{ cursor:'pointer', userSelect:'none', flexShrink:0 }} {...longPress}>
        <BatteryIcon percent={percent} charging={charging} size={44} />
      </span>
      <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', flexShrink:0 }}>{percent}%</span>
      {Modal}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center">
      <div className="w-name">{name}</div>
      <span style={{ cursor:'pointer' }} {...longPress}>
        <BatteryIcon percent={percent} charging={charging} size={52} />
      </span>
      <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{percent}%</div>
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{charging ? 'Cargando' : '● En uso'}</div>
      <Bar h={10} />
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div className="w-row-body">
      <span style={{ cursor:'pointer' }} {...longPress}>
        <BatteryIcon percent={percent} charging={charging} size={32} />
      </span>
      <div className="w-info">
        <div className="w-name">{name}</div>
        <Bar h={6} />
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>{percent}%</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{charging ? 'Cargando' : '●'}</div>
      </div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body w-center">
      <div className="w-name">{name}</div>
      <span style={{ cursor:'pointer' }} {...longPress}>
        <BatteryIcon percent={percent} charging={charging} size={56} />
      </span>
      <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{percent}%</div>
      <div className="w-status" style={{ color:'var(--text-secondary)' }}>{charging ? 'Cargando' : '● Descargando'}</div>
      <Bar h={12} />
      {Modal}
    </div>
  );
}

import { useState } from 'react';
import { useLongPress, ModalBase } from './widgetUtils';

const BARS = [0.2, 0.8, 1.5, 2.1, 2.8, 2.6, 2.9, 2.4, 1.8, 1.1, 0.5, 0.1];

function SolarModal({ kw, name, onClose }) {
  const maxBar = Math.max(...BARS);
  return (
    <ModalBase
      title="☀ Panel Solar"
      onClose={onClose}
      borderColor="#fbbf24"
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:8 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:36, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{kw} kW</div>
      <div style={{ textAlign:'center', fontSize:10, color:'var(--text-secondary)', marginBottom:14 }}>generando ahora</div>
      <div className="w-bar-chart" style={{ height:80 }}>
        {BARS.map((v, i) => (
          <div key={i} className="w-bar" style={{ height:`${(v / maxBar) * 100}%`, background:i === 6 ? '#fbbf24' : 'var(--accent-dim)' }} />
        ))}
      </div>
      <div style={{ fontSize:9, color:'var(--text-secondary)', textAlign:'center', marginTop:4, marginBottom:14 }}>Producción últimas 12h</div>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid var(--border)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:9, color:'var(--text-secondary)' }}>Hoy total</div>
          <div style={{ color:'var(--text-primary)', fontWeight:600 }}>18.4 kWh</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:9, color:'var(--text-secondary)' }}>Ahorro est.</div>
          <div style={{ color:'var(--text-primary)', fontWeight:600 }}>€2.76</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:9, color:'var(--text-secondary)' }}>CO₂ evit.</div>
          <div style={{ color:'var(--text-primary)', fontWeight:600 }}>8.3 kg</div>
        </div>
      </div>
    </ModalBase>
  );
}

export default function PanelSolar({ size, config, accentColor }) {
  const { kw = 2.8, name = 'Solar' } = config;
  const [modal, setModal] = useState(false);
  const maxBar = Math.max(...BARS);
  const longPress = useLongPress(() => setModal(true));

  const Chart = ({ height }) => (
    <div className="w-bar-chart" style={{ height }}>
      {BARS.map((v, i) => (
        <div key={i} className="w-bar" style={{ height:`${(v / maxBar) * 100}%`, background:i === 6 ? '#fbbf24' : 'var(--accent-dim)' }} />
      ))}
    </div>
  );

  const Modal = modal && (
    <SolarModal kw={kw} name={name} onClose={() => setModal(false)} />
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-label">☀ Panel Solar</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <div className="w-val-med" style={{ color:'var(--text-primary)', cursor:'pointer' }} {...longPress}>{kw} kW</div>
      </div>
      <Chart height={70} />
      <div className="w-sub" style={{ textAlign:'center' }}>Generando ahora</div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-label">☀ Panel Solar</div>
      <div className="w-name">{name}</div>
      <div style={{ textAlign:'center', padding:'8px 0', cursor:'pointer' }} {...longPress}>
        <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{kw} kW</div>
        <div className="w-sub">generando ahora</div>
      </div>
      <Chart height={120} />
      <div className="w-divider" />
      <div className="w-row">
        <div className="w-col"><div className="w-sub">Hoy total</div><div style={{ color:'var(--text-primary)' }}>18.4 kWh</div></div>
        <div className="w-col"><div className="w-sub">Ahorro est.</div><div style={{ color:'var(--text-primary)' }}>€2.76</div></div>
        <div className="w-col"><div className="w-sub">CO₂ evit.</div><div style={{ color:'var(--text-primary)' }}>8.3 kg</div></div>
      </div>
      {Modal}
    </div>
  );
}

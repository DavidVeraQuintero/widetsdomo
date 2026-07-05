import { useState } from 'react';
import { useLongPress, ModalBase } from './widgetUtils';

const BARS = [4.2, 3.8, 5.1, 4.7, 3.2, 4.9, 5.5, 6.1, 4.3, 3.7, 5.2, 4.8];

function ConsumoModal({ kwh, name, onClose, accentColor }) {
  const maxBar = Math.max(...BARS);
  return (
    <ModalBase
      title="📊 Medidor de Consumo"
      onClose={onClose}
      borderColor={accentColor}
    >
      <div style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:13, marginBottom:8 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:36, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{kwh} kWh</div>
      <div style={{ textAlign:'center', fontSize:12, color:'var(--text-secondary)', marginBottom:14 }}>consumidos hoy</div>
      <div className="w-bar-chart" style={{ height:80 }}>
        {BARS.map((v, i) => (
          <div key={i} className="w-bar" style={{ height:`${(v / maxBar) * 100}%`, background:i === BARS.length - 1 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.15)' }} />
        ))}
      </div>
      <div style={{ fontSize:12, color:'var(--text-secondary)', textAlign:'center', marginTop:4, marginBottom:14 }}>Últimas 12h</div>
      <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid var(--border)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Pico</div>
          <div style={{ color:'var(--text-primary)', fontWeight:600 }}>6.1 kW</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Promedio</div>
          <div style={{ color:'var(--text-primary)', fontWeight:600 }}>4.6 kW</div>
        </div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Coste est.</div>
          <div style={{ color:'var(--text-primary)', fontWeight:600 }}>€1.86</div>
        </div>
      </div>
    </ModalBase>
  );
}

export default function MedidorConsumo({ size, config, accentColor }) {
  const { kwh = 12.4, name = 'Consumo' } = config;
  const [modal, setModal] = useState(false);
  const maxBar = Math.max(...BARS);
  const longPress = useLongPress(() => setModal(true));

  const Chart = ({ height }) => (
    <div className="w-bar-chart" style={{ height }}>
      {BARS.map((v, i) => (
        <div key={i} className="w-bar" style={{ height:`${(v / maxBar) * 100}%`, background:i === BARS.length - 1 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.15)' }} />
      ))}
    </div>
  );

  const Modal = modal && (
    <ConsumoModal kwh={kwh} name={name} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-name">{name}</div>
        <div className="w-val-med" style={{ color:'var(--text-primary)', cursor:'pointer' }} {...longPress}>{kwh} kWh</div>
      </div>
      <Chart height={70} />
      <div className="w-sub" style={{ textAlign:'center' }}>Hoy · Últimas 12h</div>
      {Modal}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-name">{name}</div>
      <div style={{ textAlign:'center', padding:'8px 0', cursor:'pointer' }} {...longPress}>
        <div className="w-val-big" style={{ color:'var(--text-primary)' }}>{kwh} kWh</div>
        <div className="w-sub">consumidos hoy</div>
      </div>
      <Chart height={120} />
      <div className="w-divider" />
      <div className="w-row">
        <div className="w-col"><div className="w-sub">Pico</div><div style={{ color:'var(--text-primary)', fontWeight:600 }}>6.1 kW</div></div>
        <div className="w-col"><div className="w-sub">Promedio</div><div style={{ color:'var(--text-primary)', fontWeight:600 }}>4.6 kW</div></div>
        <div className="w-col"><div className="w-sub">Coste est.</div><div style={{ color:'var(--text-primary)', fontWeight:600 }}>€1.86</div></div>
      </div>
      {Modal}
    </div>
  );
}

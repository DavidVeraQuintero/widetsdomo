import SvgIcon from './SvgIcon';

const Stat = ({ iconId, value, label, color }) => (
  <div className="w-col w-center" style={{ flex: 1 }}>
    <SvgIcon id={iconId} size={22} color={color || 'var(--icon-off)'} />
    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{value}</div>
    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
  </div>
);

export default function EstadoHogar({ size, config }) {
  const { activeDevices = 8, alerts = 0, kwh = 12.4 } = config;
  const alertColor = alerts > 0 ? 'var(--danger)' : 'var(--success)';

  if (size === '2x2') return (
    <div className="w-body">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <SvgIcon id="home" size={14} color="var(--icon-off)" />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Estado del Hogar</span>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <Stat iconId="zap" value={activeDevices} label="Activos" />
        <Stat iconId="alert" value={alerts} label="Alertas" color={alertColor} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <SvgIcon id="meter" size={14} color="var(--icon-off)" />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Consumo:</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{kwh} kWh</span>
      </div>
    </div>
  );

  // 2x4
  return (
    <div className="w-body">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <SvgIcon id="home" size={14} color="var(--icon-off)" />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Estado del Hogar</span>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <Stat iconId="zap" value={activeDevices} label="Dispositivos activos" />
        <Stat iconId="alert" value={alerts} label="Alertas" color={alertColor} />
      </div>
      <div className="w-divider" />
      <div style={{ display: 'flex', flex: 1 }}>
        <Stat iconId="meter" value={`${kwh} kWh`} label="Consumo hoy" />
        <Stat iconId="thermometer" value="22°C" label="Temp. media" />
      </div>
      <div className="w-divider" />
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <SvgIcon id={alerts > 0 ? 'alert' : 'check'} size={14} color={alertColor} />
        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
          {alerts > 0 ? `${alerts} alerta(s) pendiente(s)` : 'Todo en orden'}
        </span>
      </div>
    </div>
  );
}

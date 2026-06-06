export default function EstadoHogar({ size, config, accentColor }) {
  const { activeDevices = 8, alerts = 0, kwh = 12.4 } = config;

  const Stat = ({ icon, value, label, color }) => (
    <div className="w-col w-center" style={{ flex: 1 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      <div className="w-sub">{label}</div>
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-label">🏠 Estado del Hogar</div>
      <div style={{ display: 'flex', flex: 1 }}>
        <Stat icon="⚡" value={activeDevices} label="Activos" color={accentColor} />
        <Stat icon="🚨" value={alerts} label="Alertas" color={alerts > 0 ? '#ef4444' : '#22c55e'} />
      </div>
      <div className="w-row" style={{ justifyContent: 'center' }}>
        <div className="w-sub">Consumo: </div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginLeft: 4 }}>{kwh} kWh</div>
      </div>
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-label">🏠 Estado del Hogar</div>
      <div style={{ display: 'flex', flex: 1 }}>
        <Stat icon="⚡" value={activeDevices} label="Dispositivos activos" color={accentColor} />
        <Stat icon="🚨" value={alerts} label="Alertas" color={alerts > 0 ? '#ef4444' : '#22c55e'} />
      </div>
      <div className="w-divider" />
      <div style={{ display: 'flex', flex: 1 }}>
        <Stat icon="📊" value={`${kwh} kWh`} label="Consumo hoy" color="#f59e0b" />
        <Stat icon="🌡" value="22°C" label="Temp. media" color="#67e8f9" />
      </div>
      <div className="w-divider" />
      <div style={{ background: 'var(--accent-dim)', borderRadius: 6, padding: 8 }}>
        <div className="w-sub">Resumen</div>
        <div style={{ color: 'var(--text-primary)', fontSize: 11, marginTop: 2 }}>
          {alerts > 0 ? `⚠ ${alerts} alerta(s) pendiente(s)` : '✓ Todo en orden'}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_SCENES = [
  { id: 'noche',    name: 'Noche',    icon: '🌙', color: '#0f1f14' },
  { id: 'película', name: 'Película', icon: '🎬', color: '#1e1b4b' },
  { id: 'lectura',  name: 'Lectura',  icon: '📖', color: '#1c1507' },
  { id: 'fiesta',   name: 'Fiesta',   icon: '🎉', color: '#1f0e1a' },
  { id: 'mañana',   name: 'Mañana',   icon: '🌅', color: '#0d1f1f' },
  { id: 'relax',    name: 'Relax',    icon: '😌', color: '#12101a' },
];

export default function PanelEscenas({ size, config, onConfigChange, accentColor }) {
  const { activeScene = null, scenes = DEFAULT_SCENES } = config;
  const activate = (id) => onConfigChange({ ...config, activeScene: activeScene === id ? null : id });

  if (size === '2x2') {
    return (
      <div className="w-body">
        <div className="w-label">🎬 Escenas</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: 1 }}>
          {scenes.slice(0, 4).map(s => (
            <div key={s.id} onClick={e => { e.stopPropagation(); activate(s.id); }} style={{ background: activeScene === s.id ? s.color : 'var(--bg-widget)', border: `1px solid ${activeScene === s.id ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div style={{ fontSize: 9, fontWeight: 600, color: activeScene === s.id ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)' }}>{s.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (size === '4x2') {
    return (
      <div className="w-body">
        <div className="w-label">🎬 Escenas</div>
        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
          {scenes.slice(0, 5).map(s => (
            <div key={s.id} onClick={e => { e.stopPropagation(); activate(s.id); }} style={{ flex: 1, background: s.color, border: `1px solid ${activeScene === s.id ? 'rgba(255,255,255,0.3)' : 'transparent'}`, borderRadius: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{s.name}</div>
              {activeScene === s.id && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>● Activa</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2x4
  return (
    <div className="w-body">
      <div className="w-label">🎬 Escenas</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {scenes.map(s => (
          <div key={s.id} onClick={e => { e.stopPropagation(); activate(s.id); }} style={{ flex: 1, background: s.color, border: `1px solid ${activeScene === s.id ? 'rgba(255,255,255,0.25)' : 'transparent'}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{s.name}</div>
              {activeScene === s.id && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>● Activa</div>}
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>▶</span>
          </div>
        ))}
      </div>
    </div>
  );
}

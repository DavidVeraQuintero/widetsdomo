export default function EscenaActiva({ size, config, onConfigChange, accentColor }) {
  const { activeScene = 'Película', activeIcon = '🎬', activeColor = '#1e1b4b' } = config;
  const deactivate = () => onConfigChange({ ...config, activeScene: null });

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">▶ Escena Activa</div>
      <div className="w-row w-fill" style={{ background: activeColor, borderRadius: 8, padding: '8px' }}>
        <span style={{ fontSize: 22 }}>{activeIcon}</span>
        <div>
          <div className="w-name">{activeScene}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>● Activa ahora</div>
        </div>
        <button onClick={e => { e.stopPropagation(); deactivate(); }} onMouseDown={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>⏹</button>
      </div>
    </div>
  );

  return (
    <div className="w-body w-center" style={{ background: activeColor, borderRadius: 8 }}>
      <div className="w-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Escena Activa</div>
      <div style={{ fontSize: 44 }}>{activeIcon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{activeScene}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>● Activa</div>
      <button onClick={e => { e.stopPropagation(); deactivate(); }} onMouseDown={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 20, padding: '4px 16px', cursor: 'pointer', fontSize: 11, marginTop: 4 }}>⏹ Desactivar</button>
    </div>
  );
}

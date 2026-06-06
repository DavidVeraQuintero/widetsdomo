export default function EscenaIndividual({ size, config, onConfigChange, accentColor }) {
  const { active = false, sceneName = 'Noche', sceneIcon = '🌙', sceneColor = '#0f1f14' } = config;
  const toggle = () => onConfigChange({ ...config, active: !active });

  if (size === '1x1') return (
    <div className="w-body w-center" style={{ background: active ? sceneColor : 'transparent', borderRadius: 8, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); toggle(); }}>
      <span style={{ fontSize: 30 }}>{sceneIcon}</span>
      <div style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)' }}>{sceneName}</div>
      {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body w-center" style={{ background: active ? sceneColor : 'transparent', borderRadius: 8 }}>
      <div className="w-label" style={{ color: active ? 'rgba(255,255,255,0.5)' : 'var(--accent)' }}>🎬 Escena</div>
      <span style={{ fontSize: 44 }}>{sceneIcon}</span>
      <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'rgba(255,255,255,0.95)' : 'var(--text-primary)' }}>{sceneName}</div>
      <div style={{ fontSize: 10, color: active ? 'var(--text-secondary)' : 'var(--text-dim)' }}>{active ? '● Activa' : '○ Inactiva'}</div>
      <button onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()} style={{ background: active ? 'rgba(255,255,255,0.15)' : 'var(--accent-dim)', border: 'none', color: active ? 'white' : 'var(--accent)', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 11 }}>{active ? '⏹ Desactivar' : '▶ Activar'}</button>
    </div>
  );

  // 2x1
  return (
    <div className="w-row-body" style={{ background: active ? sceneColor : 'transparent', borderRadius: 8, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); toggle(); }}>
      <span style={{ fontSize: 28 }}>{sceneIcon}</span>
      <div className="w-info">
        <div style={{ fontSize: 12, fontWeight: 600, color: active ? 'rgba(255,255,255,0.95)' : 'var(--text-primary)' }}>{sceneName}</div>
        <div style={{ fontSize: 10, color: active ? 'var(--text-secondary)' : 'var(--text-dim)' }}>{active ? '● Activa' : '○ Inactiva'}</div>
      </div>
      <span style={{ fontSize: 16, color: active ? 'rgba(255,255,255,0.7)' : 'var(--text-dim)' }}>{active ? '⏹' : '▶'}</span>
    </div>
  );
}

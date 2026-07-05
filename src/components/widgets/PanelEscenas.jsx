import SvgIcon from './SvgIcon';
import { useDashboard } from '../../store/dashboardStore.jsx';

const DEFAULT_SCENES = [
  { id: 'noche',    name: 'Noche',    svgIcon: 'moon'  },
  { id: 'pelicula', name: 'Película', svgIcon: 'film'  },
  { id: 'lectura',  name: 'Lectura',  svgIcon: 'book'  },
  { id: 'fiesta',   name: 'Fiesta',   svgIcon: 'music' },
  { id: 'manana',   name: 'Mañana',   svgIcon: 'sun'   },
  { id: 'relax',    name: 'Relax',    svgIcon: 'heart' },
];

const INACTIVE = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.12)',
};

function activeStyle(rgbStyle) {
  switch (rgbStyle) {
    case 'border': return {
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1.5px solid rgba(255,255,255,0.45)',
      boxShadow: '0 0 14px rgba(255,255,255,0.10)',
    };
    case 'tint': return {
      background: 'rgba(255,255,255,0.20)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.20)',
    };
    default: return { // bar
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.18)',
    };
  }
}

function Bar() {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 5, borderRadius: '0 0 7px 7px',
      background: 'rgba(255,255,255,0.55)',
      boxShadow: '0 -2px 8px rgba(255,255,255,0.20)',
      pointerEvents: 'none',
    }} />
  );
}

export default function PanelEscenas({ size, config, onConfigChange }) {
  const { state } = useDashboard();
  const rgbStyle = state.theme?.rgbStyle || 'bar';
  const { activeScene = null, scenes = DEFAULT_SCENES } = config;
  const activate = (id) => onConfigChange({ ...config, activeScene: activeScene === id ? null : id });
  const scenesWithIcons = scenes.map(s => ({
    ...s,
    svgIcon: s.svgIcon || DEFAULT_SCENES.find(d => d.id === s.id)?.svgIcon || 'star',
  }));

  if (size === '2x2') {
    return (
      <div className="w-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: 1 }}>
          {scenesWithIcons.slice(0, 4).map(s => {
            const isActive = activeScene === s.id;
            return (
              <div key={s.id} onClick={e => { e.stopPropagation(); activate(s.id); }}
                style={{ ...( isActive ? activeStyle(rgbStyle) : INACTIVE), borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative', overflow: 'hidden' }}>
                <SvgIcon id={s.svgIcon} size={20} color={isActive ? 'var(--icon-on)' : 'var(--icon-off)'} className={isActive ? 'icon-glow' : ''} />
                <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.name}</div>
                {isActive && rgbStyle === 'bar' && <Bar />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (size === '4x2') {
    return (
      <div className="w-body">
        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
          {scenesWithIcons.slice(0, 5).map(s => {
            const isActive = activeScene === s.id;
            return (
              <div key={s.id} onClick={e => { e.stopPropagation(); activate(s.id); }}
                style={{ ...( isActive ? activeStyle(rgbStyle) : INACTIVE), flex: 1, borderRadius: 10, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative', overflow: 'hidden' }}>
                <SvgIcon id={s.svgIcon} size={26} color={isActive ? 'var(--icon-on)' : 'var(--icon-off)'} className={isActive ? 'icon-glow' : ''} />
                <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.name}</div>
                {isActive && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>● Activa</div>}
                {isActive && rgbStyle === 'bar' && <Bar />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2x4
  return (
    <div className="w-body">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {scenesWithIcons.map(s => {
          const isActive = activeScene === s.id;
          return (
            <div key={s.id} onClick={e => { e.stopPropagation(); activate(s.id); }}
              style={{ ...( isActive ? activeStyle(rgbStyle) : INACTIVE), flex: 1, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', position: 'relative', overflow: 'hidden' }}>
              <SvgIcon id={s.svgIcon} size={20} color={isActive ? 'var(--icon-on)' : 'var(--icon-off)'} className={isActive ? 'icon-glow' : ''} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.name}</div>
                {isActive && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>● Activa</div>}
              </div>
              <span style={{ fontSize: 12, color: isActive ? 'var(--icon-on)' : 'var(--text-dim)' }}>▶</span>
              {isActive && rgbStyle === 'bar' && <Bar />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

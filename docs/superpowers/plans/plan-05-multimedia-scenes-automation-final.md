# Plan 05 — Multimedia + Escenas + Automatización + Cierre

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 9 widgets finales (multimedia, escenas, automatización) + catálogo 100% conectado + animaciones de entrada + persistencia verificada.

**Architecture:** Mismo patrón de planes anteriores. Al final, eliminar la función `Placeholder` del catálogo y verificar que los 38 widgets funcionan.

**Prerequisite:** Plan 04 completado.

---

### Task 1: Widgets de Multimedia (3 componentes)

**Files:**
- Create: `src/components/widgets/TV.jsx`
- Create: `src/components/widgets/Musica.jsx`
- Create: `src/components/widgets/AltavozInteligente.jsx`

- [ ] **Step 1: Crear `src/components/widgets/TV.jsx`**

```jsx
import Toggle from './Toggle';
import Slider from './Slider';

const SOURCES = ['HDMI 1', 'HDMI 2', 'Netflix', 'YouTube', 'TV'];

export default function TV({ size, config, onConfigChange, accentColor }) {
  const { on = false, source = 'HDMI 1', volume = 30, name = 'TV' } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setVolume = (v) => onConfigChange({ ...config, volume: v });
  const nextSource = () => onConfigChange({ ...config, source: SOURCES[(SOURCES.indexOf(source) + 1) % SOURCES.length] });
  const col = on ? accentColor : 'var(--text-dim)';

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">📺 TV</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{on ? source : '○ Apagado'}</div>
        </div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      {on && <Slider value={volume} onChange={setVolume} unit="" showVal={true} />}
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">📺 TV</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div
        style={{
          background: on ? '#0a0a0a' : 'var(--bg-widget)',
          borderRadius: 6, height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border)', flex: 1,
        }}
      >
        {on ? (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{source}</div>
        ) : (
          <span style={{ fontSize: 24, opacity: 0.2 }}>📺</span>
        )}
      </div>
      <div className="w-row">
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); nextSource(); }} onMouseDown={e => e.stopPropagation()}>📡 {source}</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10 }}>🔈</span>
          <Slider value={volume} onChange={setVolume} showVal={false} />
          <span style={{ fontSize: 10 }}>{volume}</span>
        </div>
      </div>
    </div>
  );

  // 2x4
  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">📺 Televisión</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-name">{name}</div>
      <div style={{
        background: on ? '#0a0a0a' : 'var(--bg-widget)',
        borderRadius: 8, flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--border)',
      }}>
        {on ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{source}</div>
        ) : (
          <span style={{ fontSize: 40, opacity: 0.15 }}>📺</span>
        )}
      </div>
      <div className="w-label" style={{ marginTop: 4 }}>Fuente</div>
      <div className="w-btn-row" style={{ flexWrap: 'wrap' }}>
        {SOURCES.map(s => (
          <button
            key={s}
            className="w-btn w-btn-sm"
            style={source === s && on ? { background: 'var(--border-accent)', color: 'white' } : {}}
            onClick={e => { e.stopPropagation(); onConfigChange({ ...config, source: s }); }}
            onMouseDown={e => e.stopPropagation()}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="w-row">
        <span style={{ fontSize: 12 }}>🔈</span>
        <Slider value={volume} onChange={setVolume} unit="" />
        <span style={{ fontSize: 10, color: accentColor }}>{volume}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/widgets/Musica.jsx`**

```jsx
import Slider from './Slider';

export default function Musica({ size, config, onConfigChange, accentColor }) {
  const { playing = false, track = 'Blinding Lights', artist = 'The Weeknd', volume = 65, name = 'Música' } = config;
  const togglePlay = () => onConfigChange({ ...config, playing: !playing });
  const setVolume = (v) => onConfigChange({ ...config, volume: v });

  const Controls = () => (
    <div className="w-btn-row" style={{ justifyContent: 'center', gap: 8 }}>
      {['⏮', playing ? '⏸' : '▶', '⏭'].map((icon, i) => (
        <button
          key={i}
          className="w-btn-icon"
          style={i === 1 ? { background: accentColor, color: 'white', border: 'none' } : {}}
          onClick={e => { e.stopPropagation(); if (i === 1) togglePlay(); }}
          onMouseDown={e => e.stopPropagation()}
        >
          {icon}
        </button>
      ))}
    </div>
  );

  const CoverArt = ({ size: sz }) => (
    <div style={{
      width: sz, height: sz, borderRadius: 8, flexShrink: 0,
      background: `linear-gradient(135deg, var(--accent-dim), ${accentColor}44)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: sz * 0.4 }}>🎵</span>
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🎵 Música</div>
      <div className="w-row" style={{ flex: 1 }}>
        <CoverArt size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="w-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track}</div>
          <div className="w-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist}</div>
        </div>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); togglePlay(); }} onMouseDown={e => e.stopPropagation()}>
          {playing ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-label">🎵 Música</div>
      <div className="w-row">
        <CoverArt size={55} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="w-name">{track}</div>
          <div className="w-sub">{artist}</div>
        </div>
      </div>
      <Controls />
      <div className="w-row">
        <span style={{ fontSize: 10 }}>🔈</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
        <span style={{ fontSize: 10, color: accentColor }}>{volume}</span>
      </div>
    </div>
  );

  if (size === '2x4') return (
    <div className="w-body">
      <div className="w-label">🎵 Música</div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <CoverArt size={90} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="w-name">{track}</div>
        <div className="w-sub" style={{ color: accentColor }}>{artist}</div>
      </div>
      <Controls />
      <div className="w-row">
        <span style={{ fontSize: 10 }}>🔇</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
        <span style={{ fontSize: 10 }}>🔊</span>
        <span style={{ fontSize: 10, color: accentColor, minWidth: 24 }}>{volume}</span>
      </div>
    </div>
  );

  // 4x4
  return (
    <div className="w-body">
      <div className="w-label">🎵 Reproductor de Música</div>
      <div style={{ display: 'flex', gap: 16, flex: 1, alignItems: 'center' }}>
        <CoverArt size={140} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{track}</div>
          <div style={{ color: accentColor, marginBottom: 16 }}>{artist}</div>
          <Controls />
          <div className="w-row" style={{ marginTop: 12 }}>
            <span style={{ fontSize: 10 }}>🔇</span>
            <Slider value={volume} onChange={setVolume} showVal={false} />
            <span style={{ fontSize: 10, color: accentColor }}>{volume}%</span>
          </div>
        </div>
      </div>
      <div style={{ background: 'var(--accent-dim)', borderRadius: 6, padding: '6px 10px' }}>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '45%', height: '100%', background: accentColor, borderRadius: 2 }} />
        </div>
        <div className="w-row" style={{ marginTop: 4 }}>
          <div className="w-sub">1:48</div>
          <div className="w-sub">4:00</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/AltavozInteligente.jsx`**

```jsx
import Toggle from './Toggle';
import Slider from './Slider';

export default function AltavozInteligente({ size, config, onConfigChange, accentColor }) {
  const { on = false, volume = 50, name = 'Altavoz' } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setVolume = (v) => onConfigChange({ ...config, volume: v });
  const col = on ? accentColor : 'var(--text-dim)';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col }}>🔊</span>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">🔊 Altavoz</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-row">
        <span style={{ fontSize: 10 }}>🔈</span>
        <Slider value={volume} onChange={setVolume} showVal={false} />
        <span style={{ fontSize: 10, color: col }}>{volume}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add 3 multimedia widgets (TV, Musica, Altavoz)"
```

---

### Task 2: Widgets de Escenas (3 componentes)

**Files:**
- Create: `src/components/widgets/EscenaIndividual.jsx`
- Create: `src/components/widgets/PanelEscenas.jsx`
- Create: `src/components/widgets/EscenaActiva.jsx`

- [ ] **Step 1: Crear `src/components/widgets/EscenaIndividual.jsx`**

```jsx
export default function EscenaIndividual({ size, config, onConfigChange, accentColor }) {
  const { active = false, sceneName = 'Noche', sceneIcon = '🌙', sceneColor = '#0f1f14' } = config;
  const toggle = () => onConfigChange({ ...config, active: !active });

  if (size === '1x1') return (
    <div
      className="w-body w-center"
      style={{ background: active ? sceneColor : 'transparent', borderRadius: 8, cursor: 'pointer' }}
      onClick={e => { e.stopPropagation(); toggle(); }}
    >
      <span style={{ fontSize: 30 }}>{sceneIcon}</span>
      <div className="w-name" style={{ fontSize: 10, color: active ? 'white' : 'var(--text-secondary)' }}>{sceneName}</div>
      {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />}
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">🎬 Escena</div>
      <div
        className="w-row w-fill"
        style={{ background: active ? sceneColor : 'transparent', borderRadius: 8, padding: '8px 6px', cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); toggle(); }}
      >
        <div style={{ fontSize: 22 }}>{sceneIcon}</div>
        <div>
          <div className="w-name">{sceneName}</div>
          <div className="w-status" style={{ color: active ? accentColor : 'var(--text-dim)' }}>
            {active ? '● Activa' : '○ Inactiva'}
          </div>
        </div>
        <div style={{ fontSize: 18, color: active ? accentColor : 'var(--text-dim)' }}>
          {active ? '⏹' : '▶'}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/widgets/PanelEscenas.jsx`**

```jsx
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
    const shown = scenes.slice(0, 4);
    return (
      <div className="w-body">
        <div className="w-label">🎬 Escenas</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: 1 }}>
          {shown.map(s => (
            <div
              key={s.id}
              onClick={e => { e.stopPropagation(); activate(s.id); }}
              style={{
                background: activeScene === s.id ? s.color : 'var(--bg-widget)',
                border: `1px solid ${activeScene === s.id ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                borderRadius: 8, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              }}
            >
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div style={{ fontSize: 9, fontWeight: 600, color: activeScene === s.id ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)' }}>{s.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (size === '4x2') {
    const shown = scenes.slice(0, 5);
    return (
      <div className="w-body">
        <div className="w-label">🎬 Escenas</div>
        <div style={{ display: 'flex', gap: 8, flex: 1 }}>
          {shown.map(s => (
            <div
              key={s.id}
              onClick={e => { e.stopPropagation(); activate(s.id); }}
              style={{
                flex: 1, background: s.color,
                border: `1px solid ${activeScene === s.id ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                boxShadow: activeScene === s.id ? '0 0 12px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{s.name}</div>
              {activeScene === s.id && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>● Activa</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2x4 — lista vertical
  return (
    <div className="w-body">
      <div className="w-label">🎬 Escenas</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {scenes.map(s => (
          <div
            key={s.id}
            onClick={e => { e.stopPropagation(); activate(s.id); }}
            style={{
              flex: 1, background: s.color,
              border: `1px solid ${activeScene === s.id ? 'rgba(255,255,255,0.25)' : 'transparent'}`,
              borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
            }}
          >
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{s.name}</div>
              {activeScene === s.id && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>● Activa</div>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>▶</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/EscenaActiva.jsx`**

```jsx
export default function EscenaActiva({ size, config, onConfigChange, accentColor }) {
  const { activeScene = 'Película', activeIcon = '🎬', activeColor = '#1e1b4b' } = config;
  const deactivate = () => onConfigChange({ ...config, activeScene: null });

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">▶ Escena Activa</div>
      <div className="w-row w-fill" style={{ background: activeColor, borderRadius: 8, padding: '8px 8px' }}>
        <span style={{ fontSize: 22 }}>{activeIcon}</span>
        <div>
          <div className="w-name">{activeScene}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>● Activa ahora</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); deactivate(); }}
          onMouseDown={e => e.stopPropagation()}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}
        >
          ⏹
        </button>
      </div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center" style={{ background: activeColor, borderRadius: 8 }}>
      <div className="w-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Escena Activa</div>
      <div style={{ fontSize: 44 }}>{activeIcon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{activeScene}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>● Activa</div>
      <button
        onClick={e => { e.stopPropagation(); deactivate(); }}
        onMouseDown={e => e.stopPropagation()}
        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 20, padding: '4px 16px', cursor: 'pointer', fontSize: 11, marginTop: 4 }}
      >
        ⏹ Desactivar
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add 3 scene widgets (EscenaIndividual, PanelEscenas, EscenaActiva)"
```

---

### Task 3: Widgets de Automatización (3 componentes)

**Files:**
- Create: `src/components/widgets/Temporizador.jsx`
- Create: `src/components/widgets/ReglaAutomatica.jsx`
- Create: `src/components/widgets/EstadoHogar.jsx`

- [ ] **Step 1: Crear `src/components/widgets/Temporizador.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react';

export default function Temporizador({ size, config, onConfigChange, accentColor }) {
  const { active = false, minutes = 30, name = 'Timer' } = config;
  const [remaining, setRemaining] = useState(minutes * 60);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            onConfigChange({ ...config, active: false });
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setRemaining(minutes * 60);
    }
    return () => clearInterval(intervalRef.current);
  }, [active]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const toggle = () => onConfigChange({ ...config, active: !active });

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">⏱ Temporizador</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <div className="w-val-med" style={{ color: accentColor }}>{mm}:{ss}</div>
      </div>
      <button className="w-btn" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>
        {active ? '⏹ Detener' : '▶ Iniciar'}
      </button>
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">⏱ Temporizador</div>
      <div className="w-name">{name}</div>
      <div style={{ fontSize: 36, fontWeight: 700, color: active ? accentColor : 'var(--text-dim)', fontFamily: 'monospace' }}>
        {mm}:{ss}
      </div>
      <div className="w-status" style={{ color: active ? '#22c55e' : 'var(--text-dim)' }}>
        {active ? '● Activo' : '○ Detenido'}
      </div>
      <button className="w-btn" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>
        {active ? '⏹ Detener' : '▶ Iniciar'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/widgets/ReglaAutomatica.jsx`**

```jsx
import Toggle from './Toggle';

export default function ReglaAutomatica({ size, config, onConfigChange, accentColor }) {
  const { enabled = true, name = 'Si anochece → luces' } = config;
  const toggle = () => onConfigChange({ ...config, enabled: !enabled });
  const col = enabled ? '#22c55e' : 'var(--text-dim)';

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">⚙ Regla Auto</div>
      <div className="w-row">
        <div className="w-status" style={{ color: col }}>{enabled ? '● Activa' : '○ Pausada'}</div>
        <Toggle on={enabled} onToggle={toggle} />
      </div>
      <div className="w-sub" style={{ fontSize: 11 }}>{name}</div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">⚙ Automatización</div>
        <Toggle on={enabled} onToggle={toggle} />
      </div>
      <div className="w-name" style={{ fontSize: 11, lineHeight: 1.4 }}>{name}</div>
      <div className="w-divider" />
      <div className="w-status" style={{ color: col }}>
        {enabled ? '● Activa — Se ejecutará cuando se cumpla la condición' : '○ Pausada'}
      </div>
      <div className="w-sub">Última ejecución: hace 2h</div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/EstadoHogar.jsx`**

```jsx
export default function EstadoHogar({ size, config, accentColor }) {
  const { activeDevices = 8, alerts = 0, kwh = 12.4 } = config;

  const Stat = ({ icon, value, label, color }) => (
    <div className="w-col w-center" style={{ flex: 1 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || accentColor }}>{value}</div>
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
        <div style={{ color: accentColor, fontWeight: 600, marginLeft: 4 }}>{kwh} kWh</div>
      </div>
    </div>
  );

  // 2x4
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
        <div style={{ color: alerts > 0 ? '#ef4444' : '#22c55e', fontSize: 11, marginTop: 2 }}>
          {alerts > 0 ? `⚠ ${alerts} alerta(s) pendiente(s)` : '✓ Todo en orden'}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add 3 automation widgets (Temporizador, ReglaAuto, EstadoHogar)"
```

---

### Task 4: Catálogo 100% conectado

**Files:**
- Modify: `src/catalog/widgetCatalog.js`

- [ ] **Step 1: Agregar importaciones finales al catálogo**

Al inicio de `widgetCatalog.js`, agregar:

```js
import TV                from '../components/widgets/TV';
import Musica            from '../components/widgets/Musica';
import AltavozInteligente from '../components/widgets/AltavozInteligente';
import EscenaIndividual  from '../components/widgets/EscenaIndividual';
import PanelEscenas      from '../components/widgets/PanelEscenas';
import EscenaActiva      from '../components/widgets/EscenaActiva';
import Temporizador      from '../components/widgets/Temporizador';
import ReglaAutomatica   from '../components/widgets/ReglaAutomatica';
import EstadoHogar       from '../components/widgets/EstadoHogar';
```

- [ ] **Step 2: Actualizar los últimos `component: Placeholder` en el catálogo**

| id | component |
|----|-----------|
| tv | TV |
| musica | Musica |
| altavoz | AltavozInteligente |
| escena-individual | EscenaIndividual |
| panel-escenas | PanelEscenas |
| escena-activa | EscenaActiva |
| temporizador | Temporizador |
| regla-auto | ReglaAutomatica |
| estado-hogar | EstadoHogar |

- [ ] **Step 3: Eliminar la función `Placeholder` y la importación de `lazy`** del inicio del archivo (ya no se usa).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: complete widget catalog - all 38 widgets connected"
```

---

### Task 5: Animaciones + pulido visual

**Files:**
- Modify: `src/components/Canvas/Canvas.module.css`
- Modify: `src/styles/widget.css`

- [ ] **Step 1: Verificar que la animación `widgetIn` ya está en `widget.css`** (se definió en Plan 01). Si no está, agregarla:

```css
@keyframes widgetIn {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 2: Aplicar la animación en `Canvas.module.css`** — verificar que la clase `.widget` tiene:

```css
animation: widgetIn 0.2s ease-out;
```

- [ ] **Step 3: Verificar en browser — checklist completo**

- [ ] Arrastrar "Lámpara RGB" → tamaño 2×2 → clic en rueda de color → selector de color nativo abre
- [ ] Arrastrar "Aire Acondicionado" → tamaño 4×2 → botones de temperatura funcionan
- [ ] Arrastrar "Persiana Roller" → slider mueve las lamas visualmente
- [ ] Arrastrar "Panel Escenas" → tamaño 4×2 → clic en escena la resalta
- [ ] Arrastrar "Música" → tamaño 4×4 → botones de control visibles y clickeables
- [ ] Arrastrar "Temporizador" → botón Iniciar → cuenta regresiva visible
- [ ] Cambiar tamaño de widget desde panel de propiedades → widget se redimensiona
- [ ] Cambiar color de acento → borde de widget seleccionado cambia de color
- [ ] Escribir X=200, Y=100 en panel propiedades → widget salta a esa posición
- [ ] Recargar la página → widgets restaurados desde localStorage
- [ ] Botón Limpiar → canvas vacío

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "feat: complete domotica dashboard - 38 widgets, drag & drop, properties panel, persistence"
```

---

### Task 6: Verificación final

- [ ] **Step 1: Build de producción**

```bash
npm run build
```

Expected: sin errores. Carpeta `dist/` creada.

- [ ] **Step 2: Preview del build**

```bash
npm run preview
```

Expected: `http://localhost:4173` — dashboard funcional con todos los widgets.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "chore: verify production build"
```

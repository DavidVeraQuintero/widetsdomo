# Plan 04 — Seguridad + Persianas + Sensores + Energía

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 20 widgets adicionales: 6 de seguridad, 4 de persianas, 6 de sensores y 4 de energía. Todos conectados al catálogo al final.

**Architecture:** Mismo patrón que Plan 03. Todos reciben `{ size, config, onConfigChange, accentColor }`. `onConfigChange` y botones usan `e.stopPropagation()`.

**Prerequisite:** Plan 03 completado.

---

### Task 1: Widgets de Seguridad (6 componentes)

**Files:**
- Create: `src/components/widgets/Puerta.jsx`
- Create: `src/components/widgets/Ventana.jsx`
- Create: `src/components/widgets/CerraduraInteligente.jsx`
- Create: `src/components/widgets/CamaraIP.jsx`
- Create: `src/components/widgets/SensorMovimiento.jsx`
- Create: `src/components/widgets/Alarma.jsx`

- [ ] **Step 1: Crear `src/components/widgets/Puerta.jsx`**

```jsx
import Toggle from './Toggle';

export default function Puerta({ size, config, onConfigChange, accentColor }) {
  const { open = false, locked = true, name = 'Puerta' } = config;
  const toggleOpen = () => onConfigChange({ ...config, open: !open });
  const toggleLock = () => onConfigChange({ ...config, locked: !locked });
  const statusColor = open ? '#f59e0b' : locked ? '#22c55e' : accentColor;
  const statusText = open ? '🔓 Abierta' : locked ? '🔒 Cerrada y bloqueada' : '🔓 Cerrada';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 32 }}>{open ? '🚪' : '🚪'}</span>
      <div className="w-status" style={{ color: statusColor, fontSize: 9 }}>
        {open ? 'Abierta' : locked ? '🔒' : 'Cerrada'}
      </div>
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🚪 Puerta</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <span style={{ color: statusColor, fontSize: 18 }}>{open ? '🟡' : locked ? '🟢' : '🔵'}</span>
      </div>
      <div className="w-status" style={{ color: statusColor }}>{statusText}</div>
      <div className="w-btn-row">
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); toggleOpen(); }} onMouseDown={e => e.stopPropagation()}>
          {open ? '🚪 Cerrar' : '🚪 Abrir'}
        </button>
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); toggleLock(); }} onMouseDown={e => e.stopPropagation()}>
          {locked ? '🔓' : '🔒'}
        </button>
      </div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">🚪 Puerta</div>
      <div className="w-name">{name}</div>
      <div style={{ fontSize: 60, filter: open ? 'none' : 'grayscale(0.3)' }}>🚪</div>
      <div className="w-status" style={{ color: statusColor }}>{statusText}</div>
      <div className="w-btn-row">
        <button className="w-btn" onClick={e => { e.stopPropagation(); toggleOpen(); }} onMouseDown={e => e.stopPropagation()}>
          {open ? 'Cerrar' : 'Abrir'}
        </button>
        <button className="w-btn" onClick={e => { e.stopPropagation(); toggleLock(); }} onMouseDown={e => e.stopPropagation()}>
          {locked ? '🔓 Desbloquear' : '🔒 Bloquear'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/widgets/Ventana.jsx`**

```jsx
export default function Ventana({ size, config, onConfigChange, accentColor }) {
  const { open = false, name = 'Ventana' } = config;
  const toggle = () => onConfigChange({ ...config, open: !open });
  const col = open ? '#f59e0b' : '#22c55e';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 30, color: col }}>🪟</span>
      <div className="w-status" style={{ color: col, fontSize: 9 }}>{open ? 'Abierta' : 'Cerrada'}</div>
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">🪟 Ventana</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{open ? '● Abierta' : '● Cerrada'}</div>
        </div>
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>
          {open ? 'Cerrar' : 'Abrir'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/CerraduraInteligente.jsx`**

```jsx
export default function CerraduraInteligente({ size, config, onConfigChange, accentColor }) {
  const { locked = true, name = 'Cerradura' } = config;
  const toggle = () => onConfigChange({ ...config, locked: !locked });
  const col = locked ? '#22c55e' : '#ef4444';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 32, color: col }}>{locked ? '🔒' : '🔓'}</span>
      <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>
        {locked ? 'Abrir' : 'Cerrar'}
      </button>
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">🔒 Cerradura</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{locked ? '🔒 Bloqueada' : '🔓 Desbloqueada'}</div>
        </div>
        <span style={{ fontSize: 28, color: col }}>{locked ? '🔒' : '🔓'}</span>
      </div>
      <button className="w-btn" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>
        {locked ? '🔓 Desbloquear' : '🔒 Bloquear'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/components/widgets/CamaraIP.jsx`**

```jsx
import Toggle from './Toggle';

export default function CamaraIP({ size, config, onConfigChange, accentColor }) {
  const { recording = true, name = 'Cámara' } = config;
  const toggle = () => onConfigChange({ ...config, recording: !recording });

  const Preview = ({ h }) => (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)',
      borderRadius: 6, overflow: 'hidden', height: h,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', border: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 28, opacity: 0.3 }}>📹</span>
      {recording && (
        <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
      )}
      <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">📹 Cámara IP</div>
        <Toggle on={recording} onToggle={toggle} />
      </div>
      <div className="w-name">{name}</div>
      <Preview h={90} />
    </div>
  );

  if (size === '2x4') return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">📹 Cámara IP</div>
        <Toggle on={recording} onToggle={toggle} />
      </div>
      <div className="w-name">{name}</div>
      <Preview h={200} />
      <div className="w-status" style={{ color: recording ? '#ef4444' : 'var(--text-dim)' }}>
        {recording ? '● REC' : '○ Inactiva'}
      </div>
    </div>
  );

  // 4x4
  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">📹 Cámara IP</div>
        <Toggle on={recording} onToggle={toggle} />
      </div>
      <div className="w-name">{name}</div>
      <Preview h={240} />
      <div className="w-row">
        <div className="w-status" style={{ color: recording ? '#ef4444' : 'var(--text-dim)' }}>
          {recording ? '● Grabando' : '○ Standby'}
        </div>
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); }} onMouseDown={e => e.stopPropagation()}>📸 Captura</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Crear `src/components/widgets/SensorMovimiento.jsx`**

```jsx
export default function SensorMovimiento({ size, config, onConfigChange, accentColor }) {
  const { detected = false, name = 'Movimiento' } = config;
  const col = detected ? '#f59e0b' : '#22c55e';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col }}>{detected ? '🚶' : '👁'}</span>
      <div className="w-status" style={{ color: col, fontSize: 9 }}>{detected ? 'Detectado' : 'Sin mov.'}</div>
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">👁 Movimiento</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{detected ? '⚡ Movimiento detectado' : '✓ Sin actividad'}</div>
        </div>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: col, boxShadow: detected ? `0 0 8px ${col}` : 'none' }} />
      </div>
      <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); onConfigChange({ ...config, detected: !detected }); }} onMouseDown={e => e.stopPropagation()}>
        Simular {detected ? 'calma' : 'movimiento'}
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Crear `src/components/widgets/Alarma.jsx`**

```jsx
export default function Alarma({ size, config, onConfigChange, accentColor }) {
  const { armed = false, triggered = false, name = 'Alarma' } = config;
  const toggleArm = () => onConfigChange({ ...config, armed: !armed, triggered: false });
  const col = triggered ? '#ef4444' : armed ? '#f59e0b' : '#22c55e';
  const label = triggered ? '🚨 ALARMA!' : armed ? '🔒 Armada' : '✓ Desarmada';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col }}>🚨</span>
      <div className="w-status" style={{ color: col, fontSize: 9 }}>{armed ? 'Armada' : 'OFF'}</div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">🚨 Alarma</div>
      <div className="w-name">{name}</div>
      <div style={{ fontSize: 48, color: col }}>{triggered ? '🚨' : armed ? '🔒' : '🔓'}</div>
      <div className="w-status" style={{ color: col, fontWeight: triggered ? 700 : 400 }}>{label}</div>
      <button className="w-btn" style={armed ? { borderColor: '#ef4444', color: '#ef4444' } : {}} onClick={e => { e.stopPropagation(); toggleArm(); }} onMouseDown={e => e.stopPropagation()}>
        {armed ? 'Desarmar' : 'Armar'}
      </button>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add 6 security widgets (Puerta, Ventana, Cerradura, Camara, Movimiento, Alarma)"
```

---

### Task 2: Widgets de Persianas (4 componentes)

**Files:**
- Create: `src/components/widgets/PersianaRoller.jsx`
- Create: `src/components/widgets/Cortina.jsx`
- Create: `src/components/widgets/Toldo.jsx`
- Create: `src/components/widgets/Veneciana.jsx`

- [ ] **Step 1: Crear `src/components/widgets/PersianaRoller.jsx`**

```jsx
import Slider from './Slider';

const SlatsPreview = ({ position, color = 'var(--accent)' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 0' }}>
    {[0, 1, 2, 3].map(i => {
      const opacity = Math.max(0.1, (position / 100) - i * 0.2);
      return <div key={i} style={{ height: 4, background: color, borderRadius: 2, opacity }} />;
    })}
  </div>
);

export default function PersianaRoller({ size, config, onConfigChange, accentColor }) {
  const { position = 60, name = 'Persiana' } = config;
  const setPos = (v) => onConfigChange({ ...config, position: v });
  const adj = (d) => setPos(Math.max(0, Math.min(100, position + d)));

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">📋 Persiana</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <span className="w-sub">{position}%</span>
      </div>
      <SlatsPreview position={position} color={accentColor} />
      <div className="w-btn-row">
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); adj(10); }} onMouseDown={e => e.stopPropagation()}>▲</button>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setPos(50); }} onMouseDown={e => e.stopPropagation()}>■</button>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); adj(-10); }} onMouseDown={e => e.stopPropagation()}>▼</button>
      </div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body">
      <div className="w-label">📋 Persiana Roller</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <span style={{ color: accentColor }}>{position}% abierta</span>
      </div>
      <SlatsPreview position={position} color={accentColor} />
      <Slider value={position} onChange={setPos} unit="%" />
      <div className="w-btn-row">
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); setPos(100); }} onMouseDown={e => e.stopPropagation()}>▲ Abrir</button>
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); setPos(50); }} onMouseDown={e => e.stopPropagation()}>■ Parar</button>
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); setPos(0); }} onMouseDown={e => e.stopPropagation()}>▼ Cerrar</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/widgets/Cortina.jsx`**

```jsx
import Slider from './Slider';

export default function Cortina({ size, config, onConfigChange, accentColor }) {
  const { position = 80, name = 'Cortina' } = config;
  const setPos = (v) => onConfigChange({ ...config, position: v });

  const CurtainPreview = () => (
    <div style={{ display: 'flex', height: 50, gap: 4, alignItems: 'stretch', position: 'relative' }}>
      <div style={{ width: `${(100 - position) / 2}%`, background: accentColor, opacity: 0.6, borderRadius: '0 0 4px 4px', transition: 'width 0.3s', minWidth: 4 }} />
      <div style={{ flex: 1, background: 'var(--bg-base)', border: '1px dashed var(--border)', borderRadius: 4 }} />
      <div style={{ width: `${(100 - position) / 2}%`, background: accentColor, opacity: 0.6, borderRadius: '0 0 4px 4px', transition: 'width 0.3s', minWidth: 4 }} />
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🎭 Cortina</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <span className="w-sub">{position}%</span>
      </div>
      <CurtainPreview />
      <div className="w-btn-row">
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); setPos(100); }} onMouseDown={e => e.stopPropagation()}>◀▶ Abrir</button>
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); setPos(0); }} onMouseDown={e => e.stopPropagation()}>▶◀ Cerrar</button>
      </div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body">
      <div className="w-label">🎭 Cortina</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <span style={{ color: accentColor }}>{position}% abierta</span>
      </div>
      <CurtainPreview />
      <Slider value={position} onChange={setPos} unit="%" />
      <div className="w-btn-row">
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); setPos(100); }} onMouseDown={e => e.stopPropagation()}>◀▶ Abrir</button>
        <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); setPos(0); }} onMouseDown={e => e.stopPropagation()}>▶◀ Cerrar</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/Toldo.jsx`**

```jsx
import Slider from './Slider';

export default function Toldo({ size, config, onConfigChange, accentColor }) {
  const { position = 40, name = 'Toldo' } = config;
  const setPos = (v) => onConfigChange({ ...config, position: v });

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">⛺ Toldo</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <span className="w-sub">{position}%</span>
      </div>
      <Slider value={position} onChange={setPos} unit="%" />
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">⛺ Toldo</div>
      <div style={{ fontSize: 44 }}>⛺</div>
      <div className="w-name">{name}</div>
      <div className="w-sub" style={{ color: accentColor }}>{position}% extendido</div>
      <Slider value={position} onChange={setPos} unit="%" />
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/components/widgets/Veneciana.jsx`**

```jsx
import Slider from './Slider';

export default function Veneciana({ size, config, onConfigChange, accentColor }) {
  const { position = 50, angle = 45, name = 'Veneciana' } = config;
  const setPos = (v) => onConfigChange({ ...config, position: v });
  const setAngle = (v) => onConfigChange({ ...config, angle: v });

  const Slats = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          height: 5, background: accentColor, borderRadius: 2,
          opacity: position / 100,
          transform: `scaleY(${Math.abs(Math.cos((angle * Math.PI) / 180)) * 0.8 + 0.2})`,
          transition: 'transform 0.2s',
        }} />
      ))}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🪞 Veneciana</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <span className="w-sub">{position}%</span>
      </div>
      <Slats />
      <Slider value={position} onChange={setPos} unit="%" />
    </div>
  );

  // 2x2
  return (
    <div className="w-body">
      <div className="w-label">🪞 Veneciana</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <span style={{ color: accentColor }}>{position}%</span>
      </div>
      <Slats />
      <div className="w-sub">Posición</div>
      <Slider value={position} onChange={setPos} unit="%" />
      <div className="w-sub">Ángulo lamas</div>
      <Slider value={angle} min={0} max={90} onChange={setAngle} unit="°" />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add 4 blind/curtain widgets (Persiana, Cortina, Toldo, Veneciana)"
```

---

### Task 3: Widgets de Sensores (6 componentes)

**Files:**
- Create: `src/components/widgets/SensorTempHumedad.jsx`
- Create: `src/components/widgets/SensorCalidadAire.jsx`
- Create: `src/components/widgets/SensorHumoGas.jsx`
- Create: `src/components/widgets/SensorInundacion.jsx`
- Create: `src/components/widgets/SensorLuminosidad.jsx`
- Create: `src/components/widgets/EstacionMeteorologica.jsx`

- [ ] **Step 1: Crear `src/components/widgets/SensorTempHumedad.jsx`**

```jsx
export default function SensorTempHumedad({ size, config, onConfigChange, accentColor }) {
  const { temp = 22, humidity = 65, name = 'Sensor' } = config;

  if (size === '1x1') return (
    <div className="w-body w-center">
      <div className="w-val-big" style={{ color: accentColor }}>{temp}°</div>
      <div className="w-sub">{humidity}% HR</div>
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🌡 Sensor</div>
      <div className="w-name">{name}</div>
      <div className="w-row">
        <div>
          <div className="w-val-big" style={{ color: accentColor }}>{temp}°C</div>
          <div className="w-sub">Temperatura</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="w-val-med" style={{ color: '#67e8f9' }}>{humidity}%</div>
          <div className="w-sub">Humedad</div>
        </div>
      </div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">🌡 Temperatura / Humedad</div>
      <div className="w-name">{name}</div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flex: 1 }}>
        <div className="w-col w-center">
          <span style={{ fontSize: 24 }}>🌡</span>
          <div className="w-val-big" style={{ color: accentColor }}>{temp}°C</div>
          <div className="w-sub">Temperatura</div>
        </div>
        <div className="w-col w-center">
          <span style={{ fontSize: 24 }}>💧</span>
          <div className="w-val-big" style={{ color: '#67e8f9' }}>{humidity}%</div>
          <div className="w-sub">Humedad</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/widgets/SensorCalidadAire.jsx`**

```jsx
const AQI_LABEL = (v) => v <= 50 ? 'Bueno' : v <= 100 ? 'Moderado' : v <= 150 ? 'Dañino' : 'Peligroso';
const AQI_COLOR = (v) => v <= 50 ? '#22c55e' : v <= 100 ? '#f59e0b' : v <= 150 ? '#f97316' : '#ef4444';

export default function SensorCalidadAire({ size, config, onConfigChange, accentColor }) {
  const { aqi = 42, co2 = 480, name = 'Aire' } = config;
  const col = AQI_COLOR(aqi);

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">💨 Calidad Aire</div>
      <div className="w-name">{name}</div>
      <div className="w-val-big" style={{ color: col }}>AQI {aqi}</div>
      <div className="w-status" style={{ color: col }}>{AQI_LABEL(aqi)}</div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">💨 Calidad del Aire</div>
      <div className="w-name">{name}</div>
      <div className="w-val-big" style={{ color: col }}>AQI {aqi}</div>
      <div className="w-status" style={{ color: col, fontWeight: 600 }}>{AQI_LABEL(aqi)}</div>
      <div className="w-divider" />
      <div className="w-row">
        <div className="w-col w-center">
          <div className="w-sub">CO₂</div>
          <div style={{ color: accentColor, fontWeight: 600 }}>{co2} ppm</div>
        </div>
        <div className="w-col w-center">
          <div className="w-sub">Estado</div>
          <div style={{ color: col }}>● {AQI_LABEL(aqi)}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/SensorHumoGas.jsx`**

```jsx
export default function SensorHumoGas({ size, config, onConfigChange, accentColor }) {
  const { alert = false, name = 'Humo/Gas' } = config;
  const toggle = () => onConfigChange({ ...config, alert: !alert });
  const col = alert ? '#ef4444' : '#22c55e';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col }}>🔥</span>
      <div className="w-status" style={{ color: col, fontSize: 9 }}>{alert ? '⚠ ALERTA' : '✓ OK'}</div>
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">🔥 Humo / Gas</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col, fontWeight: alert ? 700 : 400 }}>
            {alert ? '⚠ ALERTA - Humo/Gas detectado' : '✓ Todo normal'}
          </div>
        </div>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: col, boxShadow: alert ? `0 0 12px ${col}` : 'none' }} />
      </div>
      <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>
        Simular {alert ? 'calma' : 'alerta'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/components/widgets/SensorInundacion.jsx`**

```jsx
export default function SensorInundacion({ size, config, onConfigChange, accentColor }) {
  const { alert = false, name = 'Agua' } = config;
  const toggle = () => onConfigChange({ ...config, alert: !alert });
  const col = alert ? '#3b82f6' : '#22c55e';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col }}>💧</span>
      <div className="w-status" style={{ color: col, fontSize: 9 }}>{alert ? '⚠ AGUA' : '✓ Seco'}</div>
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">💧 Inundación</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>
            {alert ? '⚠ Agua detectada' : '✓ Superficie seca'}
          </div>
        </div>
        <span style={{ fontSize: 24, color: col }}>💧</span>
      </div>
      <button className="w-btn w-btn-sm" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()}>
        Simular {alert ? 'seco' : 'inundación'}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Crear `src/components/widgets/SensorLuminosidad.jsx`**

```jsx
export default function SensorLuminosidad({ size, config, onConfigChange, accentColor }) {
  const { lux = 320, name = 'Luz' } = config;
  const level = lux < 100 ? 'Oscuro' : lux < 500 ? 'Moderado' : 'Brillante';
  const col = lux < 100 ? 'var(--text-dim)' : lux < 500 ? '#f59e0b' : '#fbbf24';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col }}>☀</span>
      <div className="w-sub" style={{ color: col }}>{lux} lux</div>
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">☀ Luminosidad</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{level}</div>
        </div>
        <div>
          <div className="w-val-med" style={{ color: col }}>{lux}</div>
          <div className="w-sub">lux</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Crear `src/components/widgets/EstacionMeteorologica.jsx`**

```jsx
export default function EstacionMeteorologica({ size, config, accentColor }) {
  const { temp = 18, humidity = 72, pressure = 1013, wind = 12, name = 'Exterior' } = config;

  const Data = ({ icon, label, value, unit, color }) => (
    <div className="w-col w-center" style={{ flex: 1 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ fontSize: 14, fontWeight: 700, color: color || accentColor }}>{value}<span style={{ fontSize: 10 }}>{unit}</span></div>
      <div className="w-sub">{label}</div>
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-label">⛅ Estación Meteo</div>
      <div className="w-name">{name}</div>
      <div style={{ display: 'flex', flex: 1, gap: 8 }}>
        <Data icon="🌡" label="Temp" value={temp} unit="°C" color={accentColor} />
        <Data icon="💧" label="HR" value={humidity} unit="%" color="#67e8f9" />
      </div>
      <div style={{ display: 'flex', flex: 1, gap: 8 }}>
        <Data icon="🌬" label="Viento" value={wind} unit=" km/h" color="#94a3b8" />
        <Data icon="⬇" label="Presión" value={pressure} unit=" hPa" color="#94a3b8" />
      </div>
    </div>
  );

  // 2x4
  return (
    <div className="w-body">
      <div className="w-label">⛅ Estación Meteorológica</div>
      <div className="w-name">{name}</div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <div className="w-val-big" style={{ color: accentColor }}>{temp}°C</div>
      </div>
      <div className="w-divider" />
      <div style={{ display: 'flex', flex: 1 }}>
        <Data icon="💧" label="Humedad" value={humidity} unit="%" color="#67e8f9" />
        <Data icon="🌬" label="Viento" value={wind} unit=" km/h" color="#94a3b8" />
        <Data icon="⬇" label="Presión" value={pressure} unit=" hPa" color="#94a3b8" />
      </div>
      <div style={{ background: 'var(--accent-dim)', borderRadius: 6, padding: 8, textAlign: 'center' }}>
        <div className="w-sub">Condición</div>
        <div style={{ color: accentColor, marginTop: 2 }}>⛅ Parcialmente nublado</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add 6 sensor widgets (TempHumedad, CalidadAire, Humo, Inundacion, Luminosidad, EstacionMeteo)"
```

---

### Task 4: Widgets de Energía (4 componentes)

**Files:**
- Create: `src/components/widgets/Enchufe.jsx`
- Create: `src/components/widgets/MedidorConsumo.jsx`
- Create: `src/components/widgets/PanelSolar.jsx`
- Create: `src/components/widgets/Bateria.jsx`

- [ ] **Step 1: Crear `src/components/widgets/Enchufe.jsx`**

```jsx
import Toggle from './Toggle';

export default function Enchufe({ size, config, onConfigChange, accentColor }) {
  const { on = false, watts = 85, name = 'Enchufe' } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const col = on ? '#22c55e' : 'var(--text-dim)';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col }}>🔌</span>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🔌 Enchufe</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{on ? `● ${watts}W` : '○ Apagado'}</div>
        </div>
        <Toggle on={on} onToggle={toggle} />
      </div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">🔌 Enchufe Inteligente</div>
      <span style={{ fontSize: 40, color: col }}>🔌</span>
      <div className="w-name">{name}</div>
      {on && <div className="w-val-med" style={{ color: '#22c55e' }}>{watts}W</div>}
      <div className="w-sub" style={{ color: col }}>{on ? 'Consumiendo' : 'Apagado'}</div>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/widgets/MedidorConsumo.jsx`**

```jsx
const BARS = [4.2, 3.8, 5.1, 4.7, 3.2, 4.9, 5.5, 6.1, 4.3, 3.7, 5.2, 4.8];

export default function MedidorConsumo({ size, config, accentColor }) {
  const { kwh = 12.4, name = 'Consumo' } = config;
  const maxBar = Math.max(...BARS);

  const Chart = ({ height }) => (
    <div className="w-bar-chart" style={{ height }}>
      {BARS.map((v, i) => (
        <div key={i} className="w-bar" style={{ height: `${(v / maxBar) * 100}%`, background: i === BARS.length - 1 ? accentColor : 'var(--accent-dim)' }} />
      ))}
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-label">📊 Consumo</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <div className="w-val-med" style={{ color: accentColor }}>{kwh} kWh</div>
      </div>
      <Chart height={70} />
      <div className="w-sub" style={{ textAlign: 'center' }}>Hoy · Últimas 12h</div>
    </div>
  );

  // 2x4
  return (
    <div className="w-body">
      <div className="w-label">📊 Medidor de Consumo</div>
      <div className="w-name">{name}</div>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div className="w-val-big" style={{ color: accentColor }}>{kwh} kWh</div>
        <div className="w-sub">consumidos hoy</div>
      </div>
      <Chart height={120} />
      <div className="w-divider" />
      <div className="w-row">
        <div className="w-col">
          <div className="w-sub">Pico</div>
          <div style={{ color: '#f59e0b', fontWeight: 600 }}>6.1 kW</div>
        </div>
        <div className="w-col">
          <div className="w-sub">Promedio</div>
          <div style={{ color: accentColor, fontWeight: 600 }}>4.6 kW</div>
        </div>
        <div className="w-col">
          <div className="w-sub">Coste est.</div>
          <div style={{ color: '#22c55e', fontWeight: 600 }}>€1.86</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/PanelSolar.jsx`**

```jsx
const BARS = [0.2, 0.8, 1.5, 2.1, 2.8, 2.6, 2.9, 2.4, 1.8, 1.1, 0.5, 0.1];

export default function PanelSolar({ size, config, accentColor }) {
  const { kw = 2.8, name = 'Solar' } = config;
  const maxBar = Math.max(...BARS);

  const Chart = ({ height }) => (
    <div className="w-bar-chart" style={{ height }}>
      {BARS.map((v, i) => (
        <div key={i} className="w-bar" style={{ height: `${(v / maxBar) * 100}%`, background: i === 6 ? '#fbbf24' : 'var(--accent-dim)' }} />
      ))}
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-label">☀ Panel Solar</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <div className="w-val-med" style={{ color: '#fbbf24' }}>{kw} kW</div>
      </div>
      <Chart height={70} />
      <div className="w-sub" style={{ color: '#fbbf24', textAlign: 'center' }}>Generando ahora</div>
    </div>
  );

  // 2x4
  return (
    <div className="w-body">
      <div className="w-label">☀ Panel Solar</div>
      <div className="w-name">{name}</div>
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div className="w-val-big" style={{ color: '#fbbf24' }}>{kw} kW</div>
        <div className="w-sub" style={{ color: '#fbbf24' }}>generando ahora</div>
      </div>
      <Chart height={120} />
      <div className="w-divider" />
      <div className="w-row">
        <div className="w-col"><div className="w-sub">Hoy total</div><div style={{ color: '#fbbf24' }}>18.4 kWh</div></div>
        <div className="w-col"><div className="w-sub">Ahorro est.</div><div style={{ color: '#22c55e' }}>€2.76</div></div>
        <div className="w-col"><div className="w-sub">CO₂ evit.</div><div style={{ color: '#22c55e' }}>8.3 kg</div></div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/components/widgets/Bateria.jsx`**

```jsx
export default function Bateria({ size, config, accentColor }) {
  const { percent = 78, charging = true, name = 'Batería' } = config;
  const col = percent > 50 ? '#22c55e' : percent > 20 ? '#f59e0b' : '#ef4444';

  const BatteryBar = ({ height }) => (
    <div style={{ background: 'var(--accent-dim)', borderRadius: 4, overflow: 'hidden', height, width: '100%' }}>
      <div style={{ width: `${percent}%`, height: '100%', background: col, borderRadius: 4, transition: 'width 0.5s' }} />
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🔋 Batería</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{charging ? '⚡ Cargando' : '● En uso'}</div>
        </div>
        <div className="w-val-med" style={{ color: col }}>{percent}%</div>
      </div>
      <BatteryBar height={10} />
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">🔋 Batería</div>
      <div className="w-name">{name}</div>
      <div className="w-val-big" style={{ color: col }}>{percent}%</div>
      <div className="w-status" style={{ color: col }}>{charging ? '⚡ Cargando' : '● Descargando'}</div>
      <BatteryBar height={12} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add 4 energy widgets (Enchufe, MedidorConsumo, PanelSolar, Bateria)"
```

---

### Task 5: Conectar todos los widgets al catálogo

**Files:**
- Modify: `src/catalog/widgetCatalog.js`

- [ ] **Step 1: Agregar todas las importaciones nuevas al inicio de `widgetCatalog.js`**

```js
import Puerta             from '../components/widgets/Puerta';
import Ventana            from '../components/widgets/Ventana';
import CerraduraInteligente from '../components/widgets/CerraduraInteligente';
import CamaraIP           from '../components/widgets/CamaraIP';
import SensorMovimiento   from '../components/widgets/SensorMovimiento';
import Alarma             from '../components/widgets/Alarma';
import PersianaRoller     from '../components/widgets/PersianaRoller';
import Cortina            from '../components/widgets/Cortina';
import Toldo              from '../components/widgets/Toldo';
import Veneciana          from '../components/widgets/Veneciana';
import SensorTempHumedad  from '../components/widgets/SensorTempHumedad';
import SensorCalidadAire  from '../components/widgets/SensorCalidadAire';
import SensorHumoGas      from '../components/widgets/SensorHumoGas';
import SensorInundacion   from '../components/widgets/SensorInundacion';
import SensorLuminosidad  from '../components/widgets/SensorLuminosidad';
import EstacionMeteorologica from '../components/widgets/EstacionMeteorologica';
import Enchufe            from '../components/widgets/Enchufe';
import MedidorConsumo     from '../components/widgets/MedidorConsumo';
import PanelSolar         from '../components/widgets/PanelSolar';
import Bateria            from '../components/widgets/Bateria';
```

- [ ] **Step 2: Actualizar los `component:` en el catálogo** — Reemplazar `component: Placeholder` por el componente real en cada entrada de: seguridad, persianas, sensores y energía.

| id | component |
|----|-----------|
| puerta | Puerta |
| ventana | Ventana |
| cerradura | CerraduraInteligente |
| camara-ip | CamaraIP |
| sensor-movimiento | SensorMovimiento |
| alarma | Alarma |
| persiana-roller | PersianaRoller |
| cortina | Cortina |
| toldo | Toldo |
| veneciana | Veneciana |
| sensor-temp | SensorTempHumedad |
| sensor-aire | SensorCalidadAire |
| sensor-humo | SensorHumoGas |
| sensor-inundacion | SensorInundacion |
| sensor-luz | SensorLuminosidad |
| estacion-meteo | EstacionMeteorologica |
| enchufe | Enchufe |
| medidor-consumo | MedidorConsumo |
| panel-solar | PanelSolar |
| bateria | Bateria |

- [ ] **Step 3: Verificar en browser** — Arrastrar "Puerta" → toggle abierto/cerrado funciona. Arrastrar "Persiana Roller" en 2×2 → slider mueve las lamas. Arrastrar "Medidor Consumo" en 2×4 → gráfico de barras visible.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: wire security, blinds, sensor and energy widgets into catalog"
```

# Plan 03 — Primitivos + Iluminación + Clima

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Primitivos reutilizables (Toggle, Slider, ColorWheel) + 11 widgets de iluminación y clima completamente funcionales reemplazando los Placeholder del catálogo.

**Architecture:** Todos los widgets reciben `{ size, config, onConfigChange, accentColor }`. Renderizan JSX diferente según `size`. Los primitivos usan `e.stopPropagation()` en mouse events para no interferir con el drag del canvas.

**Tech Stack:** React 18, CSS Modules para primitivos, `src/styles/widget.css` para clases compartidas.

**Prerequisite:** Plan 02 completado. Drag & drop funcionando.

---

### Task 1: Primitivos — Toggle, Slider, ColorWheel

**Files:**
- Create: `src/components/widgets/Toggle.jsx`
- Create: `src/components/widgets/Slider.jsx`
- Create: `src/components/widgets/ColorWheel.jsx`
- Create: `src/components/widgets/primitives.module.css`

- [ ] **Step 1: Crear `src/components/widgets/primitives.module.css`**

```css
/* Toggle */
.toggle {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: var(--text-dim);
  border: none;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
  padding: 0;
}
.toggleOn { background: var(--accent); }
.toggleThumb {
  position: absolute;
  left: 3px;
  top: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  transition: left 0.2s;
}
.toggleOn .toggleThumb { left: 19px; }

/* Slider */
.sliderWrap {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--accent-dim);
  outline: none;
  cursor: pointer;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid white;
  cursor: pointer;
}
.sliderVal {
  font-size: 10px;
  color: var(--text-secondary);
  min-width: 32px;
  text-align: right;
  flex-shrink: 0;
}

/* ColorWheel */
.colorWheelWrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: visible;
}
.colorWheel {
  border-radius: 50%;
  background: conic-gradient(red, yellow, green, cyan, blue, magenta, red);
  flex-shrink: 0;
}
.colorCenter {
  position: absolute;
  border-radius: 50%;
  border: 2px solid var(--bg-widget);
  pointer-events: none;
}
.hiddenColorInput {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
```

- [ ] **Step 2: Crear `src/components/widgets/Toggle.jsx`**

```jsx
import styles from './primitives.module.css';

export default function Toggle({ on, onToggle }) {
  return (
    <button
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
      onClick={e => { e.stopPropagation(); onToggle(); }}
      onMouseDown={e => e.stopPropagation()}
      role="switch"
      aria-checked={on}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/Slider.jsx`**

```jsx
import styles from './primitives.module.css';

export default function Slider({ value, min = 0, max = 100, onChange, unit = '', showVal = true }) {
  return (
    <div className={styles.sliderWrap}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        className={styles.slider}
        onChange={e => onChange(Number(e.target.value))}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      />
      {showVal && (
        <span className={styles.sliderVal}>{value}{unit}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/components/widgets/ColorWheel.jsx`**

```jsx
import { useRef } from 'react';
import styles from './primitives.module.css';

export default function ColorWheel({ color, onChange, size = 60 }) {
  const inputRef = useRef(null);
  const centerSize = Math.round(size * 0.38);

  return (
    <div
      className={styles.colorWheelWrap}
      style={{ width: size, height: size }}
      onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className={styles.colorWheel} style={{ width: size, height: size }} />
      <div
        className={styles.colorCenter}
        style={{ width: centerSize, height: centerSize, background: color }}
      />
      <input
        ref={inputRef}
        type="color"
        value={color}
        className={styles.hiddenColorInput}
        onChange={e => onChange(e.target.value)}
        onMouseDown={e => e.stopPropagation()}
      />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add Toggle, Slider and ColorWheel primitives"
```

---

### Task 2: Widgets de Iluminación (5 componentes)

**Files:**
- Create: `src/components/widgets/LamparaSimple.jsx`
- Create: `src/components/widgets/LamparaDimmer.jsx`
- Create: `src/components/widgets/LamparaRGB.jsx`
- Create: `src/components/widgets/LamparaCCT.jsx`
- Create: `src/components/widgets/TiraLED.jsx`

- [ ] **Step 1: Crear `src/components/widgets/LamparaSimple.jsx`**

```jsx
import Toggle from './Toggle';

export default function LamparaSimple({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Lámpara' } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const col = on ? accentColor : 'var(--text-dim)';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 32, color: col }}>💡</span>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">💡 Lámpara</div>
      <div className="w-row w-fill">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{on ? '● Encendida' : '○ Apagada'}</div>
        </div>
        <Toggle on={on} onToggle={toggle} />
      </div>
    </div>
  );

  return (
    <div className="w-body w-center">
      <div className="w-label">💡 Lámpara</div>
      <span style={{ fontSize: 48, color: col }}>💡</span>
      <div className="w-name">{name}</div>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/widgets/LamparaDimmer.jsx`**

```jsx
import Toggle from './Toggle';
import Slider from './Slider';

export default function LamparaDimmer({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Lámpara', brightness = 75 } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setBrightness = (v) => onConfigChange({ ...config, brightness: v });
  const col = on ? accentColor : 'var(--text-dim)';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 30, color: col, opacity: on ? brightness / 100 + 0.3 : 0.3 }}>🔆</span>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🔆 Dimmer</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <Slider value={brightness} onChange={setBrightness} unit="%" />
    </div>
  );

  return (
    <div className="w-body w-center">
      <div className="w-label">🔆 Dimmer</div>
      <span style={{ fontSize: 44, color: col, opacity: on ? brightness / 100 + 0.2 : 0.2 }}>💡</span>
      <div className="w-name">{name}</div>
      <div className="w-sub" style={{ color: accentColor }}>{brightness}% brillo</div>
      <Slider value={brightness} onChange={setBrightness} unit="%" />
      <Toggle on={on} onToggle={toggle} />
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/LamparaRGB.jsx`**

```jsx
import Toggle from './Toggle';
import Slider from './Slider';
import ColorWheel from './ColorWheel';

export default function LamparaRGB({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'RGB', color = '#3b82f6', brightness = 75 } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setColor = (c) => onConfigChange({ ...config, color: c });
  const setBrightness = (v) => onConfigChange({ ...config, brightness: v });

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 30, color: on ? color : 'var(--text-dim)', filter: on ? `drop-shadow(0 0 6px ${color})` : 'none' }}>💡</span>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🎨 RGB</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color }}>{on ? '●' : '○'} {color}</div>
        </div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <Slider value={brightness} onChange={setBrightness} unit="%" />
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">🎨 RGB</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-name">{name}</div>
      <div style={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
        <ColorWheel color={color} onChange={setColor} size={80} />
      </div>
      <Slider value={brightness} onChange={setBrightness} unit="%" />
    </div>
  );

  // 4x4
  return (
    <div className="w-body">
      <div className="w-row">
        <div>
          <div className="w-label">🎨 Lámpara RGB</div>
          <div className="w-name">{name}</div>
        </div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-divider" />
      <div style={{ display: 'flex', gap: 16, flex: 1, alignItems: 'center' }}>
        <ColorWheel color={color} onChange={setColor} size={140} />
        <div style={{ flex: 1 }}>
          <div className="w-label" style={{ marginBottom: 8 }}>Brillo</div>
          <Slider value={brightness} onChange={setBrightness} unit="%" />
          <div className="w-label" style={{ marginTop: 12, marginBottom: 8 }}>Color seleccionado</div>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: color, border: '2px solid var(--border)' }} />
          <div className="w-sub" style={{ marginTop: 4 }}>{color}</div>
        </div>
      </div>
      <div className="w-row">
        {['#ef4444','#f97316','#22c55e','#3b82f6','#7c3aed','#ec4899'].map(c => (
          <button
            key={c}
            style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); setColor(c); }}
            onMouseDown={e => e.stopPropagation()}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/components/widgets/LamparaCCT.jsx`**

```jsx
import Toggle from './Toggle';
import Slider from './Slider';

const tempToColor = (v) => {
  const r = Math.round(255 - (v / 100) * 100);
  const b = Math.round((v / 100) * 200);
  return `rgb(${255},${200 + Math.round((v / 100) * 55)},${b})`;
};

export default function LamparaCCT({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'CCT', colorTemp = 50 } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setTemp = (v) => onConfigChange({ ...config, colorTemp: v });
  const lightColor = on ? tempToColor(colorTemp) : 'var(--text-dim)';

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">💫 CCT</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10 }}>🔴</span>
        <Slider value={colorTemp} onChange={setTemp} showVal={false} />
        <span style={{ fontSize: 10 }}>🔵</span>
      </div>
      <div className="w-sub" style={{ color: lightColor }}>
        {colorTemp < 33 ? 'Cálido' : colorTemp < 66 ? 'Neutro' : 'Frío'}
      </div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">💫 Lámpara CCT</div>
      <span style={{ fontSize: 44, color: lightColor }}>💡</span>
      <div className="w-name">{name}</div>
      <div className="w-sub" style={{ color: lightColor }}>
        {colorTemp < 33 ? '🔥 Cálido' : colorTemp < 66 ? '☀ Neutro' : '❄ Frío'} · {colorTemp}%
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
        <span style={{ fontSize: 10 }}>🔥</span>
        <Slider value={colorTemp} onChange={setTemp} showVal={false} />
        <span style={{ fontSize: 10 }}>❄</span>
      </div>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );
}
```

- [ ] **Step 5: Crear `src/components/widgets/TiraLED.jsx`**

```jsx
import Toggle from './Toggle';
import Slider from './Slider';
import ColorWheel from './ColorWheel';

const SEGMENTS = 8;

export default function TiraLED({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Tira LED', color = '#7c3aed', brightness = 80 } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setColor = (c) => onConfigChange({ ...config, color: c });
  const setBrightness = (v) => onConfigChange({ ...config, brightness: v });

  const Segments = () => (
    <div style={{ display: 'flex', gap: 3, width: '100%' }}>
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 8, borderRadius: 4,
          background: on ? color : 'var(--text-dim)',
          opacity: on ? (brightness / 100) * (1 - i * 0.05) : 0.2,
        }} />
      ))}
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">✨ Tira LED</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <Segments />
      <Slider value={brightness} onChange={setBrightness} unit="%" />
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">✨ Tira LED</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-name">{name}</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        <ColorWheel color={color} onChange={setColor} size={70} />
      </div>
      <Segments />
      <Slider value={brightness} onChange={setBrightness} unit="%" />
    </div>
  );

  // 2x4
  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">✨ Tira LED</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-name">{name}</div>
      <div style={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
        <ColorWheel color={color} onChange={setColor} size={100} />
      </div>
      <Segments />
      <Slider value={brightness} onChange={setBrightness} unit="%" />
      <div className="w-sub" style={{ color }}>Color: {color} · {brightness}% brillo</div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add 5 lighting widgets (LamparaSimple, Dimmer, RGB, CCT, TiraLED)"
```

---

### Task 3: Widgets de Clima (6 componentes)

**Files:**
- Create: `src/components/widgets/AireAcondicionado.jsx`
- Create: `src/components/widgets/Termostato.jsx`
- Create: `src/components/widgets/Ventilador.jsx`
- Create: `src/components/widgets/Calefactor.jsx`
- Create: `src/components/widgets/Humidificador.jsx`
- Create: `src/components/widgets/PurificadorAire.jsx`

- [ ] **Step 1: Crear `src/components/widgets/AireAcondicionado.jsx`**

```jsx
import Toggle from './Toggle';

const MODES = ['frío', 'calor', 'auto', 'vent'];
const MODE_ICONS = { 'frío': '❄', 'calor': '🔥', 'auto': '🔄', 'vent': '🌀' };

export default function AireAcondicionado({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'AC', temp = 24, mode = 'frío' } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setTemp = (d) => onConfigChange({ ...config, temp: Math.max(16, Math.min(30, temp + d)) });
  const cycleMode = () => onConfigChange({ ...config, mode: MODES[(MODES.indexOf(mode) + 1) % MODES.length] });
  const col = on ? accentColor : 'var(--text-dim)';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 22, color: col }}>{MODE_ICONS[mode]}</span>
      <div className="w-val-med" style={{ color: col }}>{temp}°</div>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">❄ AC</div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{MODE_ICONS[mode]} {mode}</div>
        </div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-val-big" style={{ color: col }}>{temp}°C</div>
    </div>
  );

  if (size === '2x2') return (
    <div className="w-body w-center">
      <div className="w-label">❄ Aire Acondicionado</div>
      <div className="w-name">{name}</div>
      <div className="w-val-big" style={{ color: col }}>{temp}°C</div>
      <div className="w-status" style={{ color: col }}>{MODE_ICONS[mode]} {mode}</div>
      <div className="w-btn-row" style={{ justifyContent: 'center' }}>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); toggle(); }} onMouseDown={e => e.stopPropagation()} style={{ color: on ? '#22c55e' : 'var(--text-dim)' }}>⏻</button>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
    </div>
  );

  // 4x2
  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">❄ Aire Acondicionado</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-row">
        <div>
          <div className="w-name">{name}</div>
          <div className="w-status" style={{ color: col }}>{MODE_ICONS[mode]} {mode}</div>
        </div>
        <div className="w-val-big" style={{ color: col }}>{temp}°C</div>
        <div className="w-btn-row">
          <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
          <button className="w-btn-icon" onClick={e => { e.stopPropagation(); setTemp(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
        </div>
      </div>
      <div className="w-btn-row">
        {MODES.map(m => (
          <button
            key={m}
            className="w-btn w-btn-sm"
            style={mode === m ? { background: 'var(--border-accent)', color: 'white' } : {}}
            onClick={e => { e.stopPropagation(); onConfigChange({ ...config, mode: m }); }}
            onMouseDown={e => e.stopPropagation()}
          >
            {MODE_ICONS[m]} {m}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `src/components/widgets/Termostato.jsx`**

```jsx
import Slider from './Slider';

export default function Termostato({ size, config, onConfigChange, accentColor }) {
  const { name = 'Termostato', target = 22, current = 21 } = config;
  const setTarget = (v) => onConfigChange({ ...config, target: v });
  const heating = current < target;
  const col = heating ? '#f97316' : accentColor;

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🌡 Termostato</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <span style={{ color: col, fontSize: 16 }}>{heating ? '🔥' : '❄'}</span>
      </div>
      <div className="w-row">
        <div>
          <div className="w-sub">Actual</div>
          <div className="w-val-med" style={{ color: col }}>{current}°</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="w-sub">Objetivo</div>
          <div className="w-val-med" style={{ color: accentColor }}>{target}°</div>
        </div>
      </div>
      <Slider value={target} min={15} max={30} onChange={setTarget} unit="°" />
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">🌡 Termostato</div>
      <div className="w-name">{name}</div>
      <div style={{ fontSize: 40 }}>{heating ? '🔥' : '❄'}</div>
      <div className="w-val-big" style={{ color: col }}>{current}°C</div>
      <div className="w-sub">Objetivo: <span style={{ color: accentColor }}>{target}°C</span></div>
      <Slider value={target} min={15} max={30} onChange={setTarget} unit="°" />
    </div>
  );
}
```

- [ ] **Step 3: Crear `src/components/widgets/Ventilador.jsx`**

```jsx
import Toggle from './Toggle';

export default function Ventilador({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Ventilador', speed = 2 } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const setSpeed = (s) => onConfigChange({ ...config, speed: s });
  const col = on ? accentColor : 'var(--text-dim)';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col, animation: on ? 'spin 1s linear infinite' : 'none' }}>🌀</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">🌀 Ventilador</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-btn-row" style={{ justifyContent: 'center' }}>
        {[1, 2, 3].map(s => (
          <button
            key={s}
            className="w-btn w-btn-sm"
            style={speed === s && on ? { background: 'var(--border-accent)', color: 'white' } : {}}
            onClick={e => { e.stopPropagation(); setSpeed(s); }}
            onMouseDown={e => e.stopPropagation()}
          >
            {'●'.repeat(s)}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Crear `src/components/widgets/Calefactor.jsx`**

```jsx
import Toggle from './Toggle';

export default function Calefactor({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Calefactor', temp = 20 } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const adj = (d) => onConfigChange({ ...config, temp: Math.max(15, Math.min(30, temp + d)) });
  const col = on ? '#f97316' : 'var(--text-dim)';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col }}>🔥</span>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">🔥 Calefactor</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-row" style={{ justifyContent: 'center' }}>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); adj(-1); }} onMouseDown={e => e.stopPropagation()}>−</button>
        <span className="w-val-med" style={{ color: col }}>{temp}°</span>
        <button className="w-btn-icon" onClick={e => { e.stopPropagation(); adj(1); }} onMouseDown={e => e.stopPropagation()}>+</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Crear `src/components/widgets/Humidificador.jsx`**

```jsx
import Toggle from './Toggle';

export default function Humidificador({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Humidificador', humidity = 50 } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const col = on ? '#67e8f9' : 'var(--text-dim)';

  if (size === '1x1') return (
    <div className="w-body w-center">
      <span style={{ fontSize: 28, color: col }}>💧</span>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );

  // 1x2
  return (
    <div className="w-body">
      <div className="w-label">💧 Humidificador</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-row">
        <span style={{ fontSize: 10 }}>💧</span>
        <div style={{ flex: 1, height: 6, background: 'var(--accent-dim)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${humidity}%`, height: '100%', background: col, borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 10, color: col }}>{humidity}%</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Crear `src/components/widgets/PurificadorAire.jsx`**

```jsx
import Toggle from './Toggle';

const AQI_COLOR = (v) => v <= 50 ? '#22c55e' : v <= 100 ? '#f59e0b' : '#ef4444';
const AQI_LABEL = (v) => v <= 50 ? 'Bueno' : v <= 100 ? 'Moderado' : 'Malo';

export default function PurificadorAire({ size, config, onConfigChange, accentColor }) {
  const { on = false, name = 'Purificador', aqi = 25 } = config;
  const toggle = () => onConfigChange({ ...config, on: !on });
  const aqiCol = AQI_COLOR(aqi);

  if (size === '1x2') return (
    <div className="w-body">
      <div className="w-label">🌬 Purificador</div>
      <div className="w-row">
        <div className="w-name">{name}</div>
        <Toggle on={on} onToggle={toggle} />
      </div>
      <div className="w-row">
        <span style={{ color: aqiCol, fontSize: 10 }}>● AQI {aqi}</span>
        <span style={{ color: aqiCol, fontSize: 10 }}>{AQI_LABEL(aqi)}</span>
      </div>
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center">
      <div className="w-label">🌬 Purificador</div>
      <div className="w-name">{name}</div>
      <div style={{ fontSize: 44 }}>🌬</div>
      <div className="w-val-med" style={{ color: aqiCol }}>AQI {aqi}</div>
      <div className="w-sub" style={{ color: aqiCol }}>{AQI_LABEL(aqi)}</div>
      <Toggle on={on} onToggle={toggle} />
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: add 6 climate widgets (AC, Termostato, Ventilador, Calefactor, Humidificador, Purificador)"
```

---

### Task 4: Conectar widgets de iluminación y clima al catálogo

**Files:**
- Modify: `src/catalog/widgetCatalog.js`

- [ ] **Step 1: Actualizar las importaciones y referencias en `widgetCatalog.js`**

Reemplazar las primeras líneas y las entradas de iluminación y clima:

```js
import LamparaSimple from '../components/widgets/LamparaSimple';
import LamparaDimmer from '../components/widgets/LamparaDimmer';
import LamparaRGB    from '../components/widgets/LamparaRGB';
import LamparaCCT    from '../components/widgets/LamparaCCT';
import TiraLED       from '../components/widgets/TiraLED';
import AireAcondicionado from '../components/widgets/AireAcondicionado';
import Termostato    from '../components/widgets/Termostato';
import Ventilador    from '../components/widgets/Ventilador';
import Calefactor    from '../components/widgets/Calefactor';
import Humidificador from '../components/widgets/Humidificador';
import PurificadorAire from '../components/widgets/PurificadorAire';
```

Reemplazar `component: Placeholder` por el componente real en cada entrada de iluminación y clima (las demás categorías siguen con `Placeholder` hasta el Plan 04).

Entradas actualizadas (solo la propiedad `component`):
- `lampara-simple` → `component: LamparaSimple`
- `lampara-dimmer` → `component: LamparaDimmer`
- `lampara-rgb` → `component: LamparaRGB`
- `lampara-cct` → `component: LamparaCCT`
- `tira-led` → `component: TiraLED`
- `aire-acondicionado` → `component: AireAcondicionado`
- `termostato` → `component: Termostato`
- `ventilador` → `component: Ventilador`
- `calefactor` → `component: Calefactor`
- `humidificador` → `component: Humidificador`
- `purificador` → `component: PurificadorAire`

- [ ] **Step 2: Verificar en browser**

Arrastrar "Lámpara RGB" al canvas. Cambiar a tamaño 2×2. Hacer clic en la rueda de color → debe abrirse el selector de color nativo. Confirmar que el toggle enciende/apaga la lámpara y cambia el color del icono.

Arrastrar "Aire Acondicionado" en tamaño 2×2. Pulsar los botones +/− para cambiar temperatura.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: wire lighting and climate widgets into catalog"
```

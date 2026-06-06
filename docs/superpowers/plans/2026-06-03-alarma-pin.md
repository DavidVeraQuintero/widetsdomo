# Alarma — PIN de desarme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Proteger el desarme de la alarma con un teclado PIN numérico de 4-6 dígitos, con bloqueo tras 3 intentos fallidos y gestión del PIN desde el modal de configuración.

**Architecture:** Todo el cambio vive en `Alarma.jsx`. Se añaden tres componentes auxiliares (`PinPad`, `PinDots`, `PinModal`) antes de `AlarmaModal`. `AlarmaModal` recibe un prop `onDisarm` en lugar de llamar `onConfigChange` directamente al desarmar. El componente principal `Alarma` controla si el flow de desarme abre `PinModal` o actúa directo.

**Tech Stack:** React 18 (useState, useEffect), Vite, CSS global en `widget.css`

---

## File Structure

- **Modify:** `src/styles/widget.css` — añadir `@keyframes shake`
- **Modify:** `src/components/widgets/Alarma.jsx` — añadir `PinPad`, `PinDots`, `PinModal`; extender `AlarmaModal`; actualizar componente `Alarma`

---

### Task 1: Añadir animación shake al CSS global

**Files:**
- Modify: `src/styles/widget.css` (después de la línea `@keyframes widgetIn`)

- [ ] **Step 1: Añadir keyframe shake a `src/styles/widget.css`**

Insertar justo después del bloque `@keyframes widgetIn { ... }`:

```css
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%     { transform: translateX(-6px); }
  40%     { transform: translateX(6px); }
  60%     { transform: translateX(-4px); }
  80%     { transform: translateX(4px); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/widget.css
git commit -m "feat: add shake keyframe animation for PIN error feedback"
```

---

### Task 2: Añadir PinPad, PinDots y PinModal a Alarma.jsx

**Files:**
- Modify: `src/components/widgets/Alarma.jsx`

- [ ] **Step 1: Actualizar el import de React para incluir `useEffect`**

Cambiar la primera línea de `Alarma.jsx`:

```jsx
import { useState, useEffect } from 'react';
```

- [ ] **Step 2: Añadir el componente `PinPad` antes de `AlarmaModal`**

Insertar este bloque justo antes de la línea `function AlarmaModal(`:

```jsx
function PinPad({ onDigit, onDelete, onConfirm, disabled }) {
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
      {keys.map(k => (
        <button key={k} className="w-btn"
          disabled={disabled}
          style={{
            fontSize:16, padding:'10px 0',
            ...(k==='✓' && { borderColor:'#22c55e', color:'#22c55e' }),
            ...(k==='⌫' && { borderColor:'#f59e0b', color:'#f59e0b' }),
            ...(disabled && { opacity:0.4, cursor:'not-allowed' }),
          }}
          onClick={() => { if(k==='⌫') onDelete(); else if(k==='✓') onConfirm(); else onDigit(k); }}
          onMouseDown={e => e.stopPropagation()}
        >{k}</button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Añadir el componente `PinDots` justo debajo de `PinPad`**

```jsx
function PinDots({ length, filled, shake }) {
  return (
    <div style={{ display:'flex', gap:8, justifyContent:'center', margin:'12px 0', animation: shake ? 'shake 0.4s' : 'none' }}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} style={{ width:14, height:14, borderRadius:'50%', border:'2px solid #64748b', background: i < filled ? '#e2e8f0' : 'transparent', transition:'background 0.1s' }} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Añadir el componente `PinModal` justo debajo de `PinDots`**

```jsx
function PinModal({ pin, onDisarm, onClose }) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      const r = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (r <= 0) {
        setLockedUntil(0);
        setFailedAttempts(0);
        setRemaining(0);
        setError('');
      } else {
        setRemaining(r);
      }
    }, 500);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const locked = lockedUntil > Date.now();

  const handleDigit = (d) => {
    if (!locked && digits.length < pin.length) setDigits(p => p + d);
  };
  const handleDelete = () => { if (!locked) setDigits(p => p.slice(0, -1)); };
  const handleConfirm = () => {
    if (locked || !digits) return;
    if (digits === pin) {
      onDisarm();
      onClose();
    } else {
      const next = failedAttempts + 1;
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setDigits('');
      if (next >= 3) {
        setFailedAttempts(next);
        const until = Date.now() + 60_000;
        setLockedUntil(until);
        setRemaining(60);
        setError('');
      } else {
        setFailedAttempts(next);
        setError(`PIN incorrecto. ${3 - next} intento${3 - next === 1 ? '' : 's'} restante${3 - next === 1 ? '' : 's'}.`);
      }
    }
  };

  return (
    <ModalBase title="🔐 Introduce el PIN" onClose={onClose} borderColor="#f59e0b">
      <PinDots length={pin.length} filled={digits.length} shake={shake} />
      {locked
        ? <div style={{ textAlign:'center', color:'#ef4444', fontSize:13, marginBottom:12 }}>Demasiados intentos. Espera {remaining}s</div>
        : error
          ? <div style={{ textAlign:'center', color:'#ef4444', fontSize:13, marginBottom:12 }}>{error}</div>
          : <div style={{ height:33, marginBottom:12 }} />}
      <PinPad onDigit={handleDigit} onDelete={handleDelete} onConfirm={handleConfirm} disabled={locked} />
    </ModalBase>
  );
}
```

- [ ] **Step 5: Verificar visualmente en el navegador**

Correr `npm run dev` y abrir el dashboard. Aunque todavía no esté conectado, asegurarse de que no hay errores de compilación en consola.

- [ ] **Step 6: Commit**

```bash
git add src/components/widgets/Alarma.jsx
git commit -m "feat: add PinPad, PinDots, PinModal components to Alarma"
```

---

### Task 3: Extender AlarmaModal con gestión de PIN

**Files:**
- Modify: `src/components/widgets/Alarma.jsx` — reemplazar la función `AlarmaModal`

- [ ] **Step 1: Reemplazar la función `AlarmaModal` completa**

La nueva firma es `{ config, onConfigChange, onDisarm, onClose }`. Reemplazar toda la función `AlarmaModal` con:

```jsx
function AlarmaModal({ config, onConfigChange, onDisarm, onClose }) {
  const { armed = false, triggered = false, name = 'Alarma', pin = null } = config;
  const col = triggered ? '#ef4444' : armed ? '#f59e0b' : '#22c55e';
  const label = triggered ? '🚨 ALARMA!' : armed ? '🔒 Armada' : '✓ Desarmada';

  const [pinStep, setPinStep] = useState(null);
  const [pinBuffer, setPinBuffer] = useState('');
  const [pinNew, setPinNew] = useState('');
  const [pinError, setPinError] = useState('');

  const resetPinFlow = () => { setPinStep(null); setPinBuffer(''); setPinNew(''); setPinError(''); };

  const pinDotLen = {
    'setup':          6,
    'setup-confirm':  pinNew.length || 4,
    'change-verify':  pin ? pin.length : 4,
    'change-new':     6,
    'change-confirm': pinNew.length || 4,
    'delete-verify':  pin ? pin.length : 4,
  };
  const pinMaxLen = {
    'setup':          6,
    'setup-confirm':  pinNew.length || 6,
    'change-verify':  pin ? pin.length : 6,
    'change-new':     6,
    'change-confirm': pinNew.length || 6,
    'delete-verify':  pin ? pin.length : 6,
  };
  const stepTitle = {
    'setup':          'Nuevo PIN (4-6 dígitos)',
    'setup-confirm':  'Confirmar nuevo PIN',
    'change-verify':  'PIN actual',
    'change-new':     'Nuevo PIN (4-6 dígitos)',
    'change-confirm': 'Confirmar nuevo PIN',
    'delete-verify':  'Confirmar PIN actual para eliminar',
  };

  const handlePinDigit = (d) => {
    if (pinBuffer.length < (pinMaxLen[pinStep] || 6)) setPinBuffer(p => p + d);
  };
  const handlePinDelete = () => setPinBuffer(p => p.slice(0, -1));
  const handlePinConfirm = () => {
    if (pinStep === 'setup') {
      if (pinBuffer.length < 4) { setPinError('Mínimo 4 dígitos'); return; }
      setPinNew(pinBuffer); setPinBuffer(''); setPinError(''); setPinStep('setup-confirm');
    } else if (pinStep === 'setup-confirm') {
      if (pinBuffer !== pinNew) { setPinError('Los PINs no coinciden'); setPinBuffer(''); return; }
      onConfigChange({ ...config, pin: pinNew }); resetPinFlow();
    } else if (pinStep === 'change-verify') {
      if (pinBuffer !== pin) { setPinError('PIN incorrecto'); setPinBuffer(''); return; }
      setPinBuffer(''); setPinError(''); setPinStep('change-new');
    } else if (pinStep === 'change-new') {
      if (pinBuffer.length < 4) { setPinError('Mínimo 4 dígitos'); return; }
      setPinNew(pinBuffer); setPinBuffer(''); setPinError(''); setPinStep('change-confirm');
    } else if (pinStep === 'change-confirm') {
      if (pinBuffer !== pinNew) { setPinError('Los PINs no coinciden'); setPinBuffer(''); return; }
      onConfigChange({ ...config, pin: pinNew }); resetPinFlow();
    } else if (pinStep === 'delete-verify') {
      if (pinBuffer !== pin) { setPinError('PIN incorrecto'); setPinBuffer(''); return; }
      onConfigChange({ ...config, pin: null }); resetPinFlow();
    }
  };

  return (
    <ModalBase title="🚨 Alarma" onClose={onClose} borderColor={col}>
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0 12px' }}>
        <span style={{ fontSize:72, color:col }}>{triggered ? '🚨' : armed ? '🔒' : '🔓'}</span>
      </div>
      <div style={{ textAlign:'center', color:'#94a3b8', fontSize:13, marginBottom:8 }}>{name}</div>
      <div style={{ textAlign:'center', fontSize:14, color:col, fontWeight:triggered ? 700 : 400, marginBottom:20 }}>{label}</div>
      <button
        className="w-btn"
        style={{ width:'100%', ...(armed ? { borderColor:'#ef4444', color:'#ef4444' } : {}) }}
        onClick={armed ? onDisarm : () => onConfigChange({ ...config, armed: true, triggered: false })}
        onMouseDown={e => e.stopPropagation()}
      >
        {armed ? 'Desarmar' : 'Armar'}
      </button>

      {!armed && (
        <div style={{ marginTop:16, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:14 }}>
          {!pinStep ? (
            <>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>
                {pin ? `PIN: ${'●'.repeat(pin.length)}` : 'Sin PIN configurado'}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {!pin && (
                  <button className="w-btn" style={{ flex:1 }} onMouseDown={e => e.stopPropagation()}
                    onClick={() => { setPinStep('setup'); setPinBuffer(''); }}>
                    Configurar PIN
                  </button>
                )}
                {pin && (
                  <>
                    <button className="w-btn" style={{ flex:1 }} onMouseDown={e => e.stopPropagation()}
                      onClick={() => { setPinStep('change-verify'); setPinBuffer(''); }}>
                      Cambiar PIN
                    </button>
                    <button className="w-btn" style={{ flex:1, borderColor:'#ef4444', color:'#ef4444' }} onMouseDown={e => e.stopPropagation()}
                      onClick={() => { setPinStep('delete-verify'); setPinBuffer(''); }}>
                      Eliminar PIN
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4, textAlign:'center' }}>{stepTitle[pinStep]}</div>
              <PinDots length={pinDotLen[pinStep]} filled={pinBuffer.length} shake={false} />
              {pinError && <div style={{ textAlign:'center', color:'#ef4444', fontSize:12, marginBottom:6 }}>{pinError}</div>}
              <PinPad onDigit={handlePinDigit} onDelete={handlePinDelete} onConfirm={handlePinConfirm} disabled={false} />
              <button className="w-btn" style={{ width:'100%', marginTop:8 }} onMouseDown={e => e.stopPropagation()} onClick={resetPinFlow}>
                Cancelar
              </button>
            </>
          )}
        </div>
      )}
    </ModalBase>
  );
}
```

- [ ] **Step 2: Verificar que no hay errores de compilación**

El navegador en `npm run dev` no debe mostrar errores en consola.

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/Alarma.jsx
git commit -m "feat: AlarmaModal — PIN configuration section with setup/change/delete flows"
```

---

### Task 4: Conectar PinModal al flow de desarme en Alarma

**Files:**
- Modify: `src/components/widgets/Alarma.jsx` — reemplazar el componente `Alarma`

- [ ] **Step 1: Reemplazar el componente `Alarma` completo**

```jsx
export default function Alarma({ size, config, onConfigChange, accentColor }) {
  const { armed = false, triggered = false, name = 'Alarma', pin = null } = config;
  const [modal, setModal] = useState(false);
  const [pinModal, setPinModal] = useState(false);

  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const handleArm = () => patchConfig({ armed: true, triggered: false });
  const handleDisarm = () => {
    if (pin) {
      setModal(false);
      setPinModal(true);
    } else {
      patchConfig({ armed: false, triggered: false });
    }
  };
  const toggleArm = () => armed ? handleDisarm() : handleArm();

  const col = triggered ? '#ef4444' : armed ? '#f59e0b' : '#22c55e';
  const label = triggered ? '🚨 ALARMA!' : armed ? '🔒 Armada' : '✓ Desarmada';
  const longPress = useLongPress(() => setModal(true));

  const PinModalEl = pinModal && (
    <PinModal pin={pin} onDisarm={() => patchConfig({ armed: false, triggered: false })} onClose={() => setPinModal(false)} />
  );
  const ModalEl = modal && (
    <AlarmaModal config={config} onConfigChange={patchConfig} onDisarm={handleDisarm} onClose={() => setModal(false)} />
  );

  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent:'space-between', alignItems:'center', gap:0 }}>
      <div style={{ fontSize:9, color:'var(--text-secondary)', width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
      <div style={{ width:40, height:40, borderRadius:'50%', background:`${col}15`, border:`2px solid ${col}`, boxShadow:`0 0 12px ${col}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer', transition:'all 0.2s', userSelect:'none' }}
        onClick={e => { e.stopPropagation(); toggleArm(); }} {...longPress}>🚨</div>
      <span style={{ fontSize:9, color:col, transition:'color 0.2s' }}>{armed ? 'Armada' : 'OFF'}</span>
      {PinModalEl}
      {ModalEl}
    </div>
  );

  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-label">🚨 Alarma</div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:col, boxShadow:armed||triggered?`0 0 8px ${col}`:'none', flexShrink:0 }} />
          <span style={{ fontSize:10, color:col }}>{armed ? 'Armada' : 'OFF'}</span>
        </div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
        <div style={{ fontSize:48, color:col, cursor:'pointer' }} {...longPress}>{triggered ? '🚨' : armed ? '🔒' : '🔓'}</div>
        <div className="w-name">{name}</div>
        <div className="w-status" style={{ color:col, fontWeight:triggered ? 700 : 400 }}>{label}</div>
      </div>
      <button
        className="w-btn"
        style={armed ? { borderColor:'#ef4444', color:'#ef4444' } : {}}
        onClick={e => { e.stopPropagation(); toggleArm(); }}
        onMouseDown={e => e.stopPropagation()}
      >
        {armed ? 'Desarmar' : 'Armar'}
      </button>
      {PinModalEl}
      {ModalEl}
    </div>
  );
}
```

- [ ] **Step 2: Verificar el flujo completo en el navegador**

Probar en `npm run dev`:
1. Sin PIN: armar y desarmar funciona directo — no aparece ningún modal de PIN
2. Long-press → sección PIN → "Configurar PIN" → ingresar 4-6 dígitos → confirmar → PIN guardado (se muestra `●●●●`)
3. Armar → "Desarmar" → aparece `PinModal` con teclado 3×4 y dots
4. PIN correcto → alarma se desarma
5. PIN incorrecto 3 veces → bloqueo 60s con cuenta regresiva
6. Long-press con alarma armada → no aparece sección de PIN
7. Tamaño 1×1: mismo comportamiento de disarm con PIN

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/Alarma.jsx
git commit -m "feat: Alarma — PIN-protected disarm with lockout after 3 failed attempts"
```

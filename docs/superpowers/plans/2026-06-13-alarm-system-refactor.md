# Alarm System Refactor - Complete Professional Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the basic on/off alarm into a complete professional alarm system with zones, timers, event history, and multi-state management based on enterprise alarm software.

**Architecture:** 
- Core alarm state machine (Desarmada → Armada Ausencia/Casa/Noche → Disparada → Silenciada)
- Zone management system (perimetrales, interiores, especiales)
- Timer system (salida, entrada, alarma)
- Event logging with timestamps and zone tracking
- PIN security with user codes and lockout protection
- Separate UI screens for control, zonas, historial, configuración

**Tech Stack:** React, useState/useContext for state management, CSS for styling

---

## File Structure

**New Files:**
- `src/hooks/useAlarmState.js` - Alarm state machine and core logic
- `src/hooks/useAlarmZones.js` - Zone management
- `src/hooks/useAlarmTimers.js` - Entry/exit/alarm timers
- `src/hooks/useAlarmEvents.js` - Event history management
- `src/components/widgets/AlarmV2.jsx` - Refactored alarm widget (replaces Alarma.jsx)
- `src/components/widgets/AlarmScreens.jsx` - Screen components (Control, Zonas, Historial, Config)
- `src/components/widgets/AlarmKeypad.jsx` - PIN entry component
- `tests/useAlarmState.test.js` - State machine tests

**Modify:**
- `src/catalog/widgetCatalog.jsx` - Update Alarma component reference

---

## Task Breakdown

### Task 1: Define Alarm Data Model & Types

**Files:**
- Create: `src/hooks/useAlarmState.js`

**Purpose:** Create the core alarm state machine with proper state transitions and constants.

- [ ] **Step 1: Create alarm constants and state definitions**

```javascript
// src/hooks/useAlarmState.js

// Alarm States
export const ALARM_STATES = {
  DISARMED: 'disarmed',
  ARMED_AWAY: 'armed-away',
  ARMED_HOME: 'armed-home', 
  ARMED_NIGHT: 'armed-night',
  TRIGGERED: 'triggered',
  SILENCED: 'silenced'
};

// Zone Types
export const ZONE_TYPES = {
  PERIMETER: 'perimeter',      // Puertas/ventanas
  INTERIOR: 'interior',        // Movimiento
  SPECIAL: 'special'           // Humo/inundación
};

// Zone States
export const ZONE_STATES = {
  NORMAL: 'normal',
  OPEN: 'open',
  TRIGGERED: 'triggered'
};

// Default configuration
export const DEFAULT_ALARM_CONFIG = {
  pin: '1234',
  exitDelay: 60,           // segundos antes de armarse
  entryDelay: 30,          // segundos antes de dispararse
  alarmTimeout: 600,       // 10 minutos de alarma continua
  maxFailedAttempts: 3,
  lockoutDuration: 300,    // 5 minutos de bloqueo
  zones: [
    { id: 'door-front', name: 'Puerta Principal', type: ZONE_TYPES.PERIMETER, armed: true },
    { id: 'door-back', name: 'Puerta Trasera', type: ZONE_TYPES.PERIMETER, armed: true },
    { id: 'window-living', name: 'Ventana Sala', type: ZONE_TYPES.PERIMETER, armed: true },
    { id: 'motion-living', name: 'Movimiento Sala', type: ZONE_TYPES.INTERIOR, armed: true },
    { id: 'motion-bedroom', name: 'Movimiento Dormitorio', type: ZONE_TYPES.INTERIOR, armed: false },
    { id: 'smoke', name: 'Detector Humo', type: ZONE_TYPES.SPECIAL, armed: true },
    { id: 'flood', name: 'Sensor Inundación', type: ZONE_TYPES.SPECIAL, armed: true }
  ]
};

// Event types for history
export const EVENT_TYPES = {
  ARMED: 'armed',
  DISARMED: 'disarmed',
  ENTRY_DELAY_START: 'entry-delay-start',
  EXIT_DELAY_START: 'exit-delay-start',
  TRIGGERED: 'triggered',
  ZONE_OPEN: 'zone-open',
  ZONE_CLOSED: 'zone-closed',
  FAILED_PIN: 'failed-pin',
  LOCKOUT: 'lockout',
  SILENCED: 'silenced',
  RESET: 'reset',
  PANIC: 'panic'
};
```

- [ ] **Step 2: Create useAlarmState hook with state machine logic**

```javascript
// Continua en el mismo archivo...

import { useState, useCallback, useEffect } from 'react';

export function useAlarmState(initialConfig = DEFAULT_ALARM_CONFIG) {
  const [state, setState] = useState({
    alarmState: ALARM_STATES.DISARMED,
    config: initialConfig,
    zones: initialConfig.zones.map(z => ({
      ...z,
      state: ZONE_STATES.NORMAL
    })),
    events: [],
    timers: {
      exitDelay: null,
      entryDelay: null,
      alarmDuration: null
    },
    security: {
      failedAttempts: 0,
      lockedUntil: null,
      userCodes: { '1234': 'Master', '5678': 'User1' }
    },
    lastTriggeredZone: null,
    silencedAt: null
  });

  // Add event to history
  const addEvent = useCallback((type, zoneId = null) => {
    setState(prev => ({
      ...prev,
      events: [{
        id: Date.now(),
        type,
        zoneId,
        zoneName: zoneId ? prev.zones.find(z => z.id === zoneId)?.name : null,
        timestamp: new Date(),
        state: prev.alarmState
      }, ...prev.events].slice(0, 100) // Keep last 100 events
    }));
  }, []);

  // Trigger alarm (when zone is activated while armed)
  const triggerAlarm = useCallback((zoneId) => {
    setState(prev => {
      if (prev.alarmState === ALARM_STATES.DISARMED) return prev;
      
      return {
        ...prev,
        alarmState: ALARM_STATES.TRIGGERED,
        lastTriggeredZone: zoneId,
        zones: prev.zones.map(z => 
          z.id === zoneId ? { ...z, state: ZONE_STATES.TRIGGERED } : z
        )
      };
    });
    addEvent(EVENT_TYPES.TRIGGERED, zoneId);
  }, [addEvent]);

  // Arm alarm with selected mode
  const arm = useCallback((mode) => {
    setState(prev => {
      if (prev.alarmState !== ALARM_STATES.DISARMED) return prev;
      
      return {
        ...prev,
        alarmState: mode === 'away' ? ALARM_STATES.ARMED_AWAY : 
                    mode === 'home' ? ALARM_STATES.ARMED_HOME :
                    ALARM_STATES.ARMED_NIGHT,
        timers: {
          ...prev.timers,
          exitDelay: prev.config.exitDelay
        }
      };
    });
    addEvent(EVENT_TYPES.EXIT_DELAY_START);
  }, [addEvent]);

  // Disarm alarm (after successful PIN)
  const disarm = useCallback(() => {
    setState(prev => ({
      ...prev,
      alarmState: ALARM_STATES.DISARMED,
      timers: { exitDelay: null, entryDelay: null, alarmDuration: null },
      silencedAt: null
    }));
    addEvent(EVENT_TYPES.DISARMED);
  }, [addEvent]);

  // Silence active alarm (still armed)
  const silence = useCallback(() => {
    setState(prev => ({
      ...prev,
      alarmState: prev.alarmState === ALARM_STATES.TRIGGERED ? 
        ALARM_STATES.ARMED_AWAY : prev.alarmState,
      silencedAt: new Date()
    }));
    addEvent(EVENT_TYPES.SILENCED);
  }, [addEvent]);

  // Panic button
  const panic = useCallback(() => {
    setState(prev => ({
      ...prev,
      alarmState: ALARM_STATES.TRIGGERED,
      lastTriggeredZone: null
    }));
    addEvent(EVENT_TYPES.PANIC);
  }, [addEvent]);

  // Reset alarm
  const reset = useCallback(() => {
    disarm();
    setState(prev => ({
      ...prev,
      zones: prev.zones.map(z => ({ ...z, state: ZONE_STATES.NORMAL })),
      lastTriggeredZone: null,
      security: { ...prev.security, failedAttempts: 0 }
    }));
    addEvent(EVENT_TYPES.RESET);
  }, [disarm, addEvent]);

  // Update zone state
  const updateZone = useCallback((zoneId, zoneState) => {
    setState(prev => {
      const zone = prev.zones.find(z => z.id === zoneId);
      if (!zone) return prev;

      const isBecomingOpen = zoneState === ZONE_STATES.OPEN;
      const shouldTrigger = isBecomingOpen && zone.armed && 
        [ALARM_STATES.ARMED_AWAY, ALARM_STATES.ARMED_HOME, ALARM_STATES.ARMED_NIGHT].includes(prev.alarmState);

      if (shouldTrigger) {
        triggerAlarm(zoneId);
      }

      return {
        ...prev,
        zones: prev.zones.map(z => 
          z.id === zoneId ? { ...z, state: zoneState } : z
        )
      };
    });
  }, [triggerAlarm]);

  // Handle failed PIN attempt
  const recordFailedPin = useCallback(() => {
    setState(prev => {
      const nextFailed = prev.security.failedAttempts + 1;
      const isLocked = nextFailed >= prev.config.maxFailedAttempts;
      
      return {
        ...prev,
        security: {
          ...prev.security,
          failedAttempts: nextFailed,
          lockedUntil: isLocked ? Date.now() + (prev.config.lockoutDuration * 1000) : null
        }
      };
    });
    addEvent(EVENT_TYPES.FAILED_PIN);
  }, [addEvent]);

  // Check if locked out
  const isLockedOut = () => {
    const { lockedUntil } = state.security;
    if (!lockedUntil) return false;
    if (Date.now() > lockedUntil) {
      setState(prev => ({
        ...prev,
        security: { ...prev.security, lockedUntil: null, failedAttempts: 0 }
      }));
      return false;
    }
    return true;
  };

  // Update configuration
  const updateConfig = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }));
  }, []);

  // Update zone armed status
  const toggleZoneArmed = useCallback((zoneId) => {
    setState(prev => ({
      ...prev,
      zones: prev.zones.map(z => 
        z.id === zoneId ? { ...z, armed: !z.armed } : z
      )
    }));
  }, []);

  return {
    state,
    setState,
    actions: {
      arm,
      disarm,
      silence,
      panic,
      reset,
      triggerAlarm,
      updateZone,
      recordFailedPin,
      isLockedOut,
      updateConfig,
      toggleZoneArmed,
      addEvent
    }
  };
}
```

- [ ] **Step 3: Verify types are consistent**

Check that all state keys match usage patterns throughout the hook.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAlarmState.js
git commit -m "feat: create alarm state machine with zones, timers, and event tracking"
```

---

### Task 2: Create Timer Management Hook

**Files:**
- Create: `src/hooks/useAlarmTimers.js`

**Purpose:** Handle countdown timers for exit delay, entry delay, and alarm duration.

- [ ] **Step 1: Create useAlarmTimers hook**

```javascript
// src/hooks/useAlarmTimers.js

import { useEffect, useCallback } from 'react';

export function useAlarmTimers(alarmState, config, onTimerUpdate, onTimerComplete) {
  useEffect(() => {
    // Exit Delay Timer (contando hacia 0 antes de armarse)
    if (alarmState.timers.exitDelay !== null && alarmState.timers.exitDelay > 0) {
      const timer = setTimeout(() => {
        onTimerUpdate('exitDelay', alarmState.timers.exitDelay - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (alarmState.timers.exitDelay === 0) {
      onTimerComplete('exitDelay');
    }
  }, [alarmState.timers.exitDelay, onTimerUpdate, onTimerComplete]);

  useEffect(() => {
    // Entry Delay Timer (contando hacia 0 cuando zona se activa)
    if (alarmState.timers.entryDelay !== null && alarmState.timers.entryDelay > 0) {
      const timer = setTimeout(() => {
        onTimerUpdate('entryDelay', alarmState.timers.entryDelay - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (alarmState.timers.entryDelay === 0) {
      onTimerComplete('entryDelay');
    }
  }, [alarmState.timers.entryDelay, onTimerUpdate, onTimerComplete]);

  useEffect(() => {
    // Alarm Duration Timer
    if (alarmState.timers.alarmDuration !== null && alarmState.timers.alarmDuration > 0) {
      const timer = setTimeout(() => {
        onTimerUpdate('alarmDuration', alarmState.timers.alarmDuration - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (alarmState.timers.alarmDuration === 0) {
      onTimerComplete('alarmDuration');
    }
  }, [alarmState.timers.alarmDuration, onTimerUpdate, onTimerComplete]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAlarmTimers.js
git commit -m "feat: add timer management for exit/entry delays and alarm duration"
```

---

### Task 3: Create Keypad Component

**Files:**
- Create: `src/components/widgets/AlarmKeypad.jsx`

**Purpose:** Reusable PIN entry component with feedback.

- [ ] **Step 1: Create keypad component**

```javascript
// src/components/widgets/AlarmKeypad.jsx

import React from 'react';

export default function AlarmKeypad({ 
  onDigit, 
  onDelete, 
  onConfirm, 
  onCancel,
  inputLength = 0,
  maxLength = 6,
  disabled = false,
  error = ''
}) {
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* PIN Dots */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0' }}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div 
            key={i} 
            style={{ 
              width: 14, 
              height: 14, 
              borderRadius: '50%', 
              border: '2px solid #64748b', 
              background: i < inputLength ? '#e2e8f0' : 'transparent',
              transition: 'background 0.1s'
            }} 
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div style={{ 
          textAlign: 'center', 
          color: '#ef4444', 
          fontSize: 12, 
          marginBottom: 8 
        }}>
          {error}
        </div>
      )}

      {/* Keypad Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 8 
      }}>
        {keys.map(k => (
          <button 
            key={k} 
            className="w-btn"
            disabled={disabled}
            style={{
              fontSize: 16, 
              padding: '10px 0',
              ...(k === '✓' && { borderColor: '#22c55e', color: 'var(--text-primary)' }),
              ...(k === '⌫' && { borderColor: '#f59e0b', color: 'var(--text-primary)' }),
              ...(disabled && { opacity: 0.4, cursor: 'not-allowed' }),
            }}
            onClick={() => {
              if (k === '⌫') onDelete?.();
              else if (k === '✓') onConfirm?.();
              else if (!disabled) onDigit?.(k);
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button 
          className="w-btn" 
          style={{ width: '100%', marginTop: 8 }}
          onClick={onCancel}
          onMouseDown={e => e.stopPropagation()}
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/AlarmKeypad.jsx
git commit -m "feat: create reusable alarm keypad component for PIN entry"
```

---

### Task 4: Create Alarm Screens Component

**Files:**
- Create: `src/components/widgets/AlarmScreens.jsx`

**Purpose:** Separate screens for Control, Zonas, Historial, and Config.

- [ ] **Step 1: Create screen components**

```javascript
// src/components/widgets/AlarmScreens.jsx

import React, { useState } from 'react';
import AlarmKeypad from './AlarmKeypad';
import SvgIcon from './SvgIcon';
import { ALARM_STATES, ZONE_STATES, ZONE_TYPES } from '../../hooks/useAlarmState';

// Control Screen
export function ControlScreen({ state, actions, icons, onDisarm }) {
  const [pinStep, setPinStep] = useState(null);
  const [pinBuffer, setPinBuffer] = useState('');
  const [pinError, setPinError] = useState('');
  const isLocked = actions.isLockedOut();

  const armModes = [
    { id: 'away', label: 'Ausencia', desc: 'Todos los sensores activos' },
    { id: 'home', label: 'Casa', desc: 'Solo perimetral' },
    { id: 'night', label: 'Noche', desc: 'Personalizado' }
  ];

  const handleArm = (mode) => {
    actions.arm(mode);
  };

  const handleDisarmPin = () => {
    if (pinBuffer === state.config.pin) {
      onDisarm();
      setPinStep(null);
      setPinBuffer('');
      setPinError('');
    } else {
      actions.recordFailedPin();
      setPinError('PIN incorrecto');
      setPinBuffer('');
    }
  };

  const alarmStateDisplay = {
    [ALARM_STATES.DISARMED]: { label: 'Desarmada', color: '#22c55e', emoji: '✓' },
    [ALARM_STATES.ARMED_AWAY]: { label: 'Ausencia', color: '#f59e0b', emoji: '🔒' },
    [ALARM_STATES.ARMED_HOME]: { label: 'Casa', color: '#f59e0b', emoji: '🏠' },
    [ALARM_STATES.ARMED_NIGHT]: { label: 'Noche', color: '#f59e0b', emoji: '🌙' },
    [ALARM_STATES.TRIGGERED]: { label: '¡ALARMA!', color: '#ef4444', emoji: '🚨' },
    [ALARM_STATES.SILENCED]: { label: 'Silenciada', color: '#f59e0b', emoji: '🔇' }
  };

  const display = alarmStateDisplay[state.alarmState];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Estado Principal */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Estado</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: display.color, marginBottom: 8 }}>
          {display.emoji}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
          {display.label}
        </div>
      </div>

      {/* Botón Pánico */}
      <button 
        className="w-btn"
        style={{ 
          width: '100%', 
          borderColor: '#ef4444', 
          color: 'var(--text-primary)',
          padding: '12px',
          fontSize: 14,
          fontWeight: 600
        }}
        onClick={() => actions.panic()}
        onMouseDown={e => e.stopPropagation()}
      >
        🚨 PÁNICO
      </button>

      {/* Control Buttons */}
      {state.alarmState === ALARM_STATES.DISARMED ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {armModes.map(mode => (
            <button
              key={mode.id}
              className="w-btn"
              style={{ fontSize: 12, padding: '8px 4px' }}
              onClick={() => handleArm(mode.id)}
              onMouseDown={e => e.stopPropagation()}
              title={mode.desc}
            >
              {mode.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          {state.alarmState === ALARM_STATES.TRIGGERED && (
            <button
              className="w-btn"
              style={{ 
                width: '100%', 
                borderColor: '#f59e0b', 
                color: 'var(--text-primary)',
                padding: '10px'
              }}
              onClick={() => actions.silence()}
              onMouseDown={e => e.stopPropagation()}
            >
              🔇 Silenciar Alarma
            </button>
          )}
          
          {!pinStep ? (
            <button
              className="w-btn"
              style={{ 
                width: '100%', 
                borderColor: '#ef4444', 
                color: 'var(--text-primary)',
                padding: '10px'
              }}
              onClick={() => setPinStep('disarm')}
              disabled={isLocked}
              onMouseDown={e => e.stopPropagation()}
            >
              {isLocked ? `Bloqueado (${Math.ceil((state.security.lockedUntil - Date.now()) / 1000)}s)` : 'Desarmar'}
            </button>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 8 }}>
              Ingresa PIN para desarmar
            </div>
          )}

          {pinStep && (
            <AlarmKeypad
              onDigit={(d) => {
                if (pinBuffer.length < 6) setPinBuffer(p => p + d);
              }}
              onDelete={() => setPinBuffer(p => p.slice(0, -1))}
              onConfirm={handleDisarmPin}
              onCancel={() => { setPinStep(null); setPinBuffer(''); setPinError(''); }}
              inputLength={pinBuffer.length}
              disabled={isLocked}
              error={pinError}
            />
          )}
        </>
      )}
    </div>
  );
}

// Zonas Screen
export function ZonasScreen({ state, actions }) {
  const zoneTypeLabels = {
    [ZONE_TYPES.PERIMETER]: 'Perimetral',
    [ZONE_TYPES.INTERIOR]: 'Interior',
    [ZONE_TYPES.SPECIAL]: 'Especial'
  };

  const zoneStateColors = {
    [ZONE_STATES.NORMAL]: '#22c55e',
    [ZONE_STATES.OPEN]: '#f59e0b',
    [ZONE_STATES.TRIGGERED]: '#ef4444'
  };

  const zoneStateEmoji = {
    [ZONE_STATES.NORMAL]: '✓',
    [ZONE_STATES.OPEN]: '⚠',
    [ZONE_STATES.TRIGGERED]: '🚨'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 8 }}>
        {state.zones.length} zonas configuradas
      </div>
      {state.zones.map(zone => (
        <div 
          key={zone.id}
          style={{
            padding: '10px 12px',
            borderLeft: `4px solid ${zoneStateColors[zone.state]}`,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
              {zoneStateEmoji[zone.state]} {zone.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {zoneTypeLabels[zone.type]} {zone.armed ? '(Activa)' : '(Inactiva)'}
            </div>
          </div>
          <button
            className="w-btn w-btn-sm"
            style={{ 
              fontSize: 11,
              borderColor: zone.armed ? '#22c55e' : '#888'
            }}
            onClick={() => actions.toggleZoneArmed(zone.id)}
            onMouseDown={e => e.stopPropagation()}
          >
            {zone.armed ? 'ON' : 'OFF'}
          </button>
        </div>
      ))}
    </div>
  );
}

// Historial Screen
export function HistorialScreen({ state }) {
  const eventLabels = {
    'armed': '🔒 Armada',
    'disarmed': '✓ Desarmada',
    'entry-delay-start': '⏱ Entrada en cuenta regresiva',
    'exit-delay-start': '⏱ Salida en cuenta regresiva',
    'triggered': '🚨 Disparada',
    'zone-open': '⚠ Zona abierta',
    'zone-closed': '✓ Zona cerrada',
    'failed-pin': '❌ PIN incorrecto',
    'lockout': '🔐 Bloqueada',
    'silenced': '🔇 Silenciada',
    'reset': '🔄 Reset',
    'panic': '🆘 Pánico'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
      {state.events.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
          Sin eventos registrados
        </div>
      ) : (
        state.events.map(event => (
          <div 
            key={event.id}
            style={{
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 4,
              fontSize: 11,
              borderLeft: '2px solid var(--accent)'
            }}
          >
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {eventLabels[event.type] || event.type}
            </div>
            {event.zoneName && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 2 }}>
                Zona: {event.zoneName}
              </div>
            )}
            <div style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 2 }}>
              {event.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Config Screen
export function ConfigScreen({ state, actions, onUpdatePin }) {
  const [editingPin, setEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSavePin = () => {
    if (newPin.length < 4) {
      setPinError('Mínimo 4 dígitos');
      return;
    }
    if (newPin !== newPinConfirm) {
      setPinError('Los PINs no coinciden');
      return;
    }
    actions.updateConfig({ pin: newPin });
    onUpdatePin?.({ pin: newPin });
    setEditingPin(false);
    setNewPin('');
    setNewPinConfirm('');
    setPinError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* PIN Configuration */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Configuración de PIN
        </div>
        {!editingPin ? (
          <button
            className="w-btn"
            style={{ width: '100%' }}
            onClick={() => setEditingPin(true)}
            onMouseDown={e => e.stopPropagation()}
          >
            Cambiar PIN ({state.config.pin.length} dígitos)
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="password"
              placeholder="Nuevo PIN"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              style={{
                padding: '8px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 14
              }}
              maxLength={6}
            />
            <input
              type="password"
              placeholder="Confirmar PIN"
              value={newPinConfirm}
              onChange={e => setNewPinConfirm(e.target.value)}
              style={{
                padding: '8px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 14
              }}
              maxLength={6}
            />
            {pinError && <div style={{ color: '#ef4444', fontSize: 12 }}>{pinError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                className="w-btn"
                onClick={handleSavePin}
                onMouseDown={e => e.stopPropagation()}
              >
                Guardar
              </button>
              <button
                className="w-btn"
                onClick={() => {
                  setEditingPin(false);
                  setNewPin('');
                  setNewPinConfirm('');
                  setPinError('');
                }}
                onMouseDown={e => e.stopPropagation()}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timers Configuration */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Temporizadores (segundos)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--text-primary)' }}>
            Tiempo de Salida: {state.config.exitDelay}s
            <input
              type="range"
              min="30"
              max="180"
              value={state.config.exitDelay}
              onChange={e => actions.updateConfig({ exitDelay: parseInt(e.target.value) })}
              style={{ marginLeft: 8, width: 100 }}
            />
          </label>
          <label style={{ fontSize: 12, color: 'var(--text-primary)' }}>
            Tiempo de Entrada: {state.config.entryDelay}s
            <input
              type="range"
              min="10"
              max="60"
              value={state.config.entryDelay}
              onChange={e => actions.updateConfig({ entryDelay: parseInt(e.target.value) })}
              style={{ marginLeft: 8, width: 100 }}
            />
          </label>
        </div>
      </div>

      {/* System Info */}
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', paddingTop: 12 }}>
        <div>Zonas Activas: {state.zones.filter(z => z.armed).length}/{state.zones.length}</div>
        <div>Eventos Registrados: {state.events.length}</div>
        <div>Versión: 2.0</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/AlarmScreens.jsx
git commit -m "feat: create alarm control, zones, history, and config screens"
```

---

### Task 5: Create Main Alarm V2 Widget

**Files:**
- Create: `src/components/widgets/AlarmV2.jsx`
- Modify: `src/catalog/widgetCatalog.jsx`

**Purpose:** Main alarm widget that orchestrates all screens and state.

- [ ] **Step 1: Create AlarmV2 widget**

```javascript
// src/components/widgets/AlarmV2.jsx

import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase } from './widgetUtils';
import { useAlarmState, ALARM_STATES } from '../../hooks/useAlarmState';
import { useAlarmTimers } from '../../hooks/useAlarmTimers';
import { ControlScreen, ZonasScreen, HistorialScreen, ConfigScreen } from './AlarmScreens';

function AlarmModal({ config, onConfigChange, onClose, icons }) {
  const [screen, setScreen] = useState('control');
  const { state, actions } = config.alarmState;

  const handleDisarm = () => {
    actions.disarm();
  };

  const handleUpdatePin = ({ pin }) => {
    onConfigChange?.({ pin });
  };

  const alarmStateDisplay = {
    [ALARM_STATES.DISARMED]: { color: '#22c55e' },
    [ALARM_STATES.ARMED_AWAY]: { color: '#f59e0b' },
    [ALARM_STATES.ARMED_HOME]: { color: '#f59e0b' },
    [ALARM_STATES.ARMED_NIGHT]: { color: '#f59e0b' },
    [ALARM_STATES.TRIGGERED]: { color: '#ef4444' },
    [ALARM_STATES.SILENCED]: { color: '#f59e0b' }
  };

  const display = alarmStateDisplay[state.alarmState];

  return (
    <ModalBase
      title="🔐 Sistema de Alarma"
      onClose={onClose}
      borderColor={display.color}
    >
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 4, 
        marginBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 8
      }}>
        {[
          { id: 'control', label: '🎛 Control' },
          { id: 'zones', label: '🚪 Zonas' },
          { id: 'history', label: '📋 Historial' },
          { id: 'config', label: '⚙ Config' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setScreen(tab.id)}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              background: screen === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              borderRadius: 4,
              fontWeight: screen === tab.id ? 600 : 400
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Screen Content */}
      <div style={{ minHeight: 200 }}>
        {screen === 'control' && (
          <ControlScreen 
            state={state} 
            actions={actions} 
            icons={icons}
            onDisarm={handleDisarm}
          />
        )}
        {screen === 'zones' && (
          <ZonasScreen state={state} actions={actions} />
        )}
        {screen === 'history' && (
          <HistorialScreen state={state} />
        )}
        {screen === 'config' && (
          <ConfigScreen 
            state={state} 
            actions={actions} 
            onUpdatePin={handleUpdatePin}
          />
        )}
      </div>
    </ModalBase>
  );
}

export default function AlarmV2({ size, config, onConfigChange, accentColor }) {
  const [modal, setModal] = useState(false);
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('alarma', config.icons);

  // Initialize alarm state
  const alarmState = useAlarmState({
    pin: config.pin || '1234',
    exitDelay: config.exitDelay || 60,
    entryDelay: config.entryDelay || 30,
    ...config
  });

  // Timer management
  useAlarmTimers(
    alarmState.state,
    alarmState.state.config,
    (timerName, value) => {
      alarmState.setState(prev => ({
        ...prev,
        timers: { ...prev.timers, [timerName]: value }
      }));
    },
    (timerName) => {
      if (timerName === 'exitDelay') {
        // Finish arming - transition to proper armed state
        alarmState.setState(prev => ({
          ...prev,
          timers: { ...prev.timers, exitDelay: null }
        }));
      } else if (timerName === 'entryDelay') {
        // Time's up - fully trigger alarm
        alarmState.setState(prev => ({
          ...prev,
          alarmState: ALARM_STATES.TRIGGERED,
          timers: { ...prev.timers, entryDelay: null, alarmDuration: prev.config.alarmTimeout }
        }));
      }
    }
  );

  const { state } = alarmState;
  const isArmed = [ALARM_STATES.ARMED_AWAY, ALARM_STATES.ARMED_HOME, ALARM_STATES.ARMED_NIGHT].includes(state.alarmState);
  const isTriggered = state.alarmState === ALARM_STATES.TRIGGERED;

  const alarmStateDisplay = {
    [ALARM_STATES.DISARMED]: { label: 'Desarmada', emoji: '✓', color: '#22c55e' },
    [ALARM_STATES.ARMED_AWAY]: { label: 'Ausencia', emoji: '🔒', color: '#f59e0b' },
    [ALARM_STATES.ARMED_HOME]: { label: 'Casa', emoji: '🏠', color: '#f59e0b' },
    [ALARM_STATES.ARMED_NIGHT]: { label: 'Noche', emoji: '🌙', color: '#f59e0b' },
    [ALARM_STATES.TRIGGERED]: { label: '¡ALARMA!', emoji: '🚨', color: '#ef4444' },
    [ALARM_STATES.SILENCED]: { label: 'Silenciada', emoji: '🔇', color: '#f59e0b' }
  };

  const display = alarmStateDisplay[state.alarmState];

  const Modal = modal && (
    <AlarmModal 
      config={{ alarmState }} 
      onConfigChange={onConfigChange} 
      onClose={() => setModal(false)}
      icons={icons}
    />
  );

  // 1x1 Size
  if (size === '1x1') return (
    <div className="w-body" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 0 }}>
      <span 
        style={{ cursor: 'pointer', userSelect: 'none' }} 
        onClick={e => { e.stopPropagation(); }}
        {...longPress}
      >
        <SvgIcon 
          id={isTriggered ? icons.triggered : isArmed ? icons.armed : icons.disarmed} 
          size={44} 
          color={isArmed ? 'var(--icon-on)' : 'var(--icon-off)'} 
          className={isArmed || isTriggered ? 'icon-glow' : ''} 
        />
      </span>
      <span style={{ fontSize: 12, color: display.color, fontWeight: 600 }}>
        {display.label}
      </span>
      {Modal}
    </div>
  );

  // 2x2 Size
  return (
    <div className="w-body">
      <div className="w-row">
        <div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ 
            width: 10, 
            height: 10, 
            borderRadius: '50%', 
            background: display.color,
            boxShadow: isTriggered ? `0 0 8px ${display.color}` : 'none',
            flexShrink: 0,
            animation: isTriggered ? 'pulse 1s infinite' : 'none'
          }} />
          <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
            {display.label}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div 
          style={{ cursor: 'pointer', fontSize: 48 }}
          onClick={e => { e.stopPropagation(); }}
          {...longPress}
        >
          {display.emoji}
        </div>
        <div className="w-name">Sistema de Alarma</div>
        <div style={{ fontSize: 13, color: display.color, fontWeight: 700 }}>
          {display.label}
        </div>
      </div>
      {Modal}
    </div>
  );
}
```

- [ ] **Step 2: Update catalog to use AlarmV2**

```javascript
// In src/catalog/widgetCatalog.jsx - MODIFY the Alarma line:
// FROM:
// { id: 'alarma',          category: 'Seguridad', categoryIcon: '◆', icon: '🚨', name: 'Alarma',            sizes: ['1x1','2x2'],             defaultConfig: { armed: false, name: 'Alarma' }, component: Alarma },

// TO:
// { id: 'alarma',          category: 'Seguridad', categoryIcon: '◆', icon: '🚨', name: 'Alarma',            sizes: ['1x1','2x2'],             defaultConfig: { pin: '1234', exitDelay: 60, entryDelay: 30, name: 'Sistema de Alarma' }, component: AlarmV2 },

// And update the import at the top:
// FROM:
// import Alarma from '../components/widgets/Alarma';

// TO:
// import AlarmV2 from '../components/widgets/AlarmV2';
```

- [ ] **Step 3: Commit**

```bash
git add src/components/widgets/AlarmV2.jsx src/catalog/widgetCatalog.jsx
git commit -m "feat: implement complete professional alarm system with V2 widget"
```

---

### Task 6: Add Styles for Alarm UI

**Files:**
- Modify: `src/index.css` or widget-specific CSS file

**Purpose:** Add animation and styling for alarm system.

- [ ] **Step 1: Add pulse animation**

```css
/* Add to your CSS file */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add pulse animation for alarm indicators"
```

---

### Task 7: Clean Up Old Alarma Component

**Files:**
- Delete: `src/components/widgets/Alarma.jsx`

**Purpose:** Remove outdated implementation.

- [ ] **Step 1: Delete old file**

```bash
git rm src/components/widgets/Alarma.jsx
git commit -m "refactor: remove old Alarma component, replaced by AlarmV2"
```

---

## Summary

This plan transforms the alarm from a basic toggle into a professional security system with:

✅ **State Machine** - Proper state transitions (Disarmed → Armed → Triggered → Silenced)  
✅ **Zone Management** - Perimeter, interior, special sensors with independent control  
✅ **Security** - PIN protection with configurable codes and lockout protection  
✅ **Timers** - Entry/exit delays and configurable alarm duration  
✅ **Event History** - Complete audit trail with timestamps and zone tracking  
✅ **Multi-Screen UI** - Control, Zones, History, and Configuration panels  
✅ **Professional UX** - Clear status, panic button, visual feedback  

**Total effort:** ~8-10 tasks, suitable for parallel execution or batch implementation.

---

**Plan saved to:** `docs/superpowers/plans/2026-06-13-alarm-system-refactor.md`

## Execution Options

**1. Subagent-Driven (recommended)** - Dispatch fresh subagents per task, review between tasks for quality gates  
**2. Inline Execution** - Execute tasks sequentially in this session with checkpoints

**Which approach would you like?**

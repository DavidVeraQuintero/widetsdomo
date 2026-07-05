import React, { useState } from 'react';
import { WIDGET_SIZES } from './WidgetTemplates';
import AlarmKeypad from './AlarmKeypad';
import { ALARM_STATES, DEVICE_STATES, DEVICE_TYPES } from '../../hooks/useAlarmState';

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
    [ALARM_STATES.DISARMED]: { label: 'Desarmada', color: '#22c55e', emoji: '✔' },
    [ALARM_STATES.ARMED_AWAY]: { label: 'Ausencia', color: '#f59e0b', emoji: '🔒' },
    [ALARM_STATES.ARMED_HOME]: { label: 'Casa', color: '#f59e0b', emoji: '🏠' },
    [ALARM_STATES.ARMED_NIGHT]: { label: 'Noche', color: '#f59e0b', emoji: '🌙' },
    [ALARM_STATES.TRIGGERED]: { label: '¡ALARMA!', color: '#ef4444', emoji: '🚨' },
    [ALARM_STATES.SILENCED]: { label: 'Silenciada', color: '#f59e0b', emoji: '🔇' }
  };

  const display = alarmStateDisplay[state.alarmState];
  const modeConfig = state.currentMode && state.config.armingModes?.[state.currentMode];
  const activeDevicesCount = state.devices.filter(d => d.activeInMode && d.armed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Estado Principal */}
      <div style={{ textAlign: 'center' }}>
        <div className="w-text-xs" style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Estado</div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: display.color, marginBottom: '0.5rem' }}>
          {display.emoji}
        </div>
        <div className="w-text-xl" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {display.label}
        </div>
        {modeConfig && (
          <div className="w-text-xs" style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {modeConfig.name} • {activeDevicesCount} dispositivos activos
          </div>
        )}
      </div>

      {/* Botón Pánico */}
      <button
        className="w-btn"
        style={{
          width: '100%',
          borderColor: '#ef4444',
          color: 'var(--text-primary)',
          padding: '0.75rem',
          fontWeight: 600
        }}
        onClick={() => actions.panic()}
        onMouseDown={e => e.stopPropagation()}
      >
        🚨 PÁNICO
      </button>

      {/* Control Buttons */}
      {state.alarmState === ALARM_STATES.DISARMED ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          {armModes.map(mode => (
            <button
              key={mode.id}
              className="w-btn w-text-xs"
              style={{ padding: '0.5rem 0.25rem' }}
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
                padding: '0.625rem'
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
                padding: '0.625rem'
              }}
              onClick={() => setPinStep('disarm')}
              disabled={isLocked}
              onMouseDown={e => e.stopPropagation()}
            >
              {isLocked ? `Bloqueado (${Math.ceil((state.security.lockedUntil - Date.now()) / 1000)}s)` : 'Desarmar'}
            </button>
          ) : (
            <div className="w-text-xs" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>
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

// Dispositivos Screen
export function DispositivosScreen({ state, actions }) {
  const deviceTypeLabels = {
    [DEVICE_TYPES.PERIMETER]: 'Perimetral',
    [DEVICE_TYPES.INTERIOR]: 'Interior',
    [DEVICE_TYPES.SPECIAL]: 'Especial'
  };

  const deviceStateColors = {
    [DEVICE_STATES.NORMAL]: '#22c55e',
    [DEVICE_STATES.OPEN]: '#f59e0b',
    [DEVICE_STATES.TRIGGERED]: '#ef4444'
  };

  const deviceStateEmoji = {
    [DEVICE_STATES.NORMAL]: '✔',
    [DEVICE_STATES.OPEN]: '⚠',
    [DEVICE_STATES.TRIGGERED]: '🚨'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="w-text-xs" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.5rem' }}>
        {state.devices.length} dispositivos configurados
        {state.currentMode && <div className="w-text-xs" style={{ marginTop: '0.25rem' }}>Modo: {state.config.armingModes?.[state.currentMode]?.name}</div>}
      </div>
      {state.devices.map(device => (
        <div
          key={device.id}
          style={{
            padding: '0.625rem 0.75rem',
            borderLeft: `4px solid ${deviceStateColors[device.state]}`,
            background: device.activeInMode === false && state.currentMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
            borderRadius: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: device.activeInMode === false && state.currentMode ? 0.5 : 1
          }}
        >
          <input
            type="checkbox"
            checked={device.armed}
            onChange={() => actions.toggleDeviceArmed(device.id)}
            onMouseDown={e => e.stopPropagation()}
            style={{
              cursor: 'pointer',
              width: '1.125rem',
              height: '1.125rem',
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1 }}>
            <div className="w-text-xs" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {deviceStateEmoji[device.state]} {device.name}
            </div>
            <div className="w-text-xs" style={{ color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              {deviceTypeLabels[device.type]}
              {state.currentMode && (device.activeInMode ? ' ✔' : ' ✗')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Backwards compatibility export
export function ZonasScreen(props) {
  return <DispositivosScreen {...props} />;
}

// Historial Screen
export function HistorialScreen({ state }) {
  const eventLabels = {
    'armed': '🔒 Armada',
    'disarmed': '✔ Desarmada',
    'entry-delay-start': '⏱ Entrada en cuenta regresiva',
    'exit-delay-start': '⏱ Salida en cuenta regresiva',
    'triggered': '🚨 Disparada',
    'device-open': '⚠ Dispositivo activado',
    'device-closed': '✔ Dispositivo desactivado',
    'zone-open': '⚠ Dispositivo activado',
    'zone-closed': '✔ Dispositivo desactivado',
    'failed-pin': '❌ PIN incorrecto',
    'lockout': '🔐 Bloqueada',
    'silenced': '🔇 Silenciada',
    'reset': '🔄 Reset',
    'panic': '🆘 Pánico'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '18.75rem', overflowY: 'auto' }}>
      {state.events.length === 0 ? (
        <div className="w-text-xs" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.25rem 0' }}>
          Sin eventos registrados
        </div>
      ) : (
        state.events.map(event => (
          <div
            key={event.id}
            style={{
              padding: '0.5rem 0.625rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 4,
              borderLeft: '2px solid var(--accent)'
            }}
          >
            <div className="w-text-xs" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {eventLabels[event.type] || event.type}
            </div>
            {(event.deviceName || event.zoneName) && (
              <div className="w-text-xs" style={{ color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                Dispositivo: {event.deviceName || event.zoneName}
              </div>
            )}
            <div className="w-text-xs" style={{ color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* PIN Configuration */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
        <div className="w-text-xs" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="password"
              placeholder="Nuevo PIN"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              maxLength={6}
            />
            <input
              type="password"
              placeholder="Confirmar PIN"
              value={newPinConfirm}
              onChange={e => setNewPinConfirm(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              maxLength={6}
            />
            {pinError && <div className="w-text-xs" style={{ color: '#ef4444' }}>{pinError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
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
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
        <div className="w-text-xs" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Temporizadores (segundos)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="w-text-xs" style={{ color: 'var(--text-primary)' }}>
            Tiempo de Salida: {state.config.exitDelay}s
            <input
              type="range"
              min="30"
              max="180"
              value={state.config.exitDelay}
              onChange={e => actions.updateConfig({ exitDelay: parseInt(e.target.value) })}
              style={{ marginLeft: '0.5rem', width: '6.25rem' }}
            />
          </label>
          <label className="w-text-xs" style={{ color: 'var(--text-primary)' }}>
            Tiempo de Entrada: {state.config.entryDelay}s
            <input
              type="range"
              min="10"
              max="60"
              value={state.config.entryDelay}
              onChange={e => actions.updateConfig({ entryDelay: parseInt(e.target.value) })}
              style={{ marginLeft: '0.5rem', width: '6.25rem' }}
            />
          </label>
        </div>
      </div>

      {/* System Info */}
      <div className="w-text-xs" style={{ color: 'var(--text-secondary)', paddingTop: '0.75rem' }}>
        <div>Dispositivos Activos: {state.devices.filter(d => d.armed).length}/{state.devices.length}</div>
        <div>Eventos Registrados: {state.events.length}</div>
        <div>Versión: 2.0</div>
      </div>
    </div>
  );
}

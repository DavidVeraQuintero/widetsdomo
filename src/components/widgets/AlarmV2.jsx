import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { WIDGET_SIZES } from './WidgetTemplates';
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
          { id: 'zones', label: '📱 Dispositivos' },
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
        alarmState.setState(prev => ({
          ...prev,
          timers: { ...prev.timers, exitDelay: null }
        }));
      } else if (timerName === 'entryDelay') {
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
    [ALARM_STATES.DISARMED]: { label: 'Desarmada', emoji: '✔', color: '#22c55e' },
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
        style={{ cursor: 'pointer' }}
        onClick={e => { e.stopPropagation(); }}
        {...longPress}
      >
        <SvgIcon
          id={isTriggered ? icons.triggered : isArmed ? icons.armed : icons.disarmed}
          size={WIDGET_SIZES.SIZE_2X2.iconSize} className={` ${isArmed || isTriggered ? 'icon-glow' : ''}`}
          color={isArmed ? 'var(--icon-on)' : 'var(--icon-off)'}
        />
      </span>
      <span className="w-text-xs" style={{ color: display.color, fontWeight: 600 }}>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <div
          style={{ cursor: 'pointer', fontSize: '3rem' }}
          onClick={e => { e.stopPropagation(); }}
          {...longPress}
        >
          {display.emoji}
        </div>
        <div className="w-name">Sistema de Alarma</div>
        <div className="w-text-sm" style={{ color: display.color, fontWeight: 700 }}>
          {display.label}
        </div>
      </div>
      {Modal}
    </div>
  );
}

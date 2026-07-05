import { useState, useCallback } from 'react';

// Alarm States
export const ALARM_STATES = {
  DISARMED: 'disarmed',
  ARMED_AWAY: 'armed-away',
  ARMED_HOME: 'armed-home',
  ARMED_NIGHT: 'armed-night',
  TRIGGERED: 'triggered',
  SILENCED: 'silenced'
};

// Device Types
export const DEVICE_TYPES = {
  PERIMETER: 'perimeter',
  INTERIOR: 'interior',
  SPECIAL: 'special'
};

// Device States
export const DEVICE_STATES = {
  NORMAL: 'normal',
  OPEN: 'open',
  TRIGGERED: 'triggered'
};

// Keep ZONE_TYPES and ZONE_STATES for backwards compatibility
export const ZONE_TYPES = DEVICE_TYPES;
export const ZONE_STATES = DEVICE_STATES;

// Default configuration
export const DEFAULT_ALARM_CONFIG = {
  pin: '1234',
  exitDelay: 60,
  entryDelay: 30,
  alarmTimeout: 600,
  maxFailedAttempts: 3,
  lockoutDuration: 300,
  devices: [
    { id: 'door-front', name: 'Puerta Principal', type: DEVICE_TYPES.PERIMETER, armed: true },
    { id: 'door-back', name: 'Puerta Trasera', type: DEVICE_TYPES.PERIMETER, armed: true },
    { id: 'window-living', name: 'Ventana Sala', type: DEVICE_TYPES.PERIMETER, armed: true },
    { id: 'motion-living', name: 'Movimiento Sala', type: DEVICE_TYPES.INTERIOR, armed: true },
    { id: 'motion-bedroom', name: 'Movimiento Dormitorio', type: DEVICE_TYPES.INTERIOR, armed: false },
    { id: 'smoke', name: 'Detector Humo', type: DEVICE_TYPES.SPECIAL, armed: true },
    { id: 'flood', name: 'Sensor Inundación', type: DEVICE_TYPES.SPECIAL, armed: true }
  ],
  // Configuración de dispositivos por modo
  armingModes: {
    'away': {
      name: 'Ausencia',
      icon: '🔒',
      description: 'Todos los sensores activos',
      activeDevices: ['door-front', 'door-back', 'window-living', 'motion-living', 'motion-bedroom', 'smoke', 'flood']
    },
    'home': {
      name: 'Casa',
      icon: '🏠',
      description: 'Solo perimetral (puertas/ventanas)',
      activeDevices: ['door-front', 'door-back', 'window-living', 'smoke', 'flood']
    },
    'night': {
      name: 'Noche',
      icon: '🌙',
      description: 'Solo entrada principal',
      activeDevices: ['door-front', 'smoke', 'flood']
    }
  }
};

// Event types for history
export const EVENT_TYPES = {
  ARMED: 'armed',
  DISARMED: 'disarmed',
  ENTRY_DELAY_START: 'entry-delay-start',
  EXIT_DELAY_START: 'exit-delay-start',
  TRIGGERED: 'triggered',
  DEVICE_OPEN: 'device-open',
  DEVICE_CLOSED: 'device-closed',
  FAILED_PIN: 'failed-pin',
  LOCKOUT: 'lockout',
  SILENCED: 'silenced',
  RESET: 'reset',
  PANIC: 'panic'
};

export function useAlarmState(initialConfig = DEFAULT_ALARM_CONFIG) {
  // Merge with defaults to ensure all required fields exist
  const mergedConfig = {
    ...DEFAULT_ALARM_CONFIG,
    ...initialConfig
  };

  const [state, setState] = useState({
    alarmState: ALARM_STATES.DISARMED,
    currentMode: null,
    config: mergedConfig,
    devices: (mergedConfig.devices || mergedConfig.zones || []).map(d => ({
      ...d,
      state: DEVICE_STATES.NORMAL,
      activeInMode: true
    })),
    zones: (mergedConfig.devices || mergedConfig.zones || []).map(d => ({
      ...d,
      state: DEVICE_STATES.NORMAL,
      activeInMode: true
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
    lastTriggeredDevice: null,
    lastTriggeredZone: null,
    silencedAt: null
  });

  // Add event to history
  const addEvent = useCallback((type, deviceId = null) => {
    setState(prev => ({
      ...prev,
      events: [{
        id: Date.now(),
        type,
        deviceId,
        deviceName: deviceId ? prev.devices.find(d => d.id === deviceId)?.name : null,
        zoneId: deviceId,
        zoneName: deviceId ? prev.devices.find(d => d.id === deviceId)?.name : null,
        timestamp: new Date(),
        state: prev.alarmState
      }, ...prev.events].slice(0, 100)
    }));
  }, []);

  // Trigger alarm (when device is activated while armed)
  const triggerAlarm = useCallback((deviceId) => {
    setState(prev => {
      if (prev.alarmState === ALARM_STATES.DISARMED) return prev;

      return {
        ...prev,
        alarmState: ALARM_STATES.TRIGGERED,
        lastTriggeredDevice: deviceId,
        lastTriggeredZone: deviceId,
        devices: prev.devices.map(d =>
          d.id === deviceId ? { ...d, state: DEVICE_STATES.TRIGGERED } : d
        ),
        zones: prev.zones.map(z =>
          z.id === deviceId ? { ...z, state: DEVICE_STATES.TRIGGERED } : z
        )
      };
    });
    addEvent(EVENT_TYPES.TRIGGERED, deviceId);
  }, [addEvent]);

  // Arm alarm with selected mode
  const arm = useCallback((mode) => {
    setState(prev => {
      if (prev.alarmState !== ALARM_STATES.DISARMED) return prev;

      // Get active devices for this mode
      const armingConfig = prev.config.armingModes?.[mode];
      const activeDeviceIds = armingConfig?.activeDevices || armingConfig?.activeZones || [];

      // Update devices based on mode
      const updatedDevices = prev.devices.map(device => ({
        ...device,
        activeInMode: activeDeviceIds.includes(device.id)
      }));

      // Keep zones in sync for backwards compatibility
      const updatedZones = prev.zones.map(zone => ({
        ...zone,
        activeInMode: activeDeviceIds.includes(zone.id)
      }));

      return {
        ...prev,
        alarmState: mode === 'away' ? ALARM_STATES.ARMED_AWAY :
                    mode === 'home' ? ALARM_STATES.ARMED_HOME :
                    ALARM_STATES.ARMED_NIGHT,
        currentMode: mode,
        devices: updatedDevices,
        zones: updatedZones,
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
      devices: prev.devices.map(d => ({ ...d, state: DEVICE_STATES.NORMAL })),
      zones: prev.zones.map(z => ({ ...z, state: DEVICE_STATES.NORMAL })),
      lastTriggeredDevice: null,
      lastTriggeredZone: null,
      security: { ...prev.security, failedAttempts: 0 }
    }));
    addEvent(EVENT_TYPES.RESET);
  }, [disarm, addEvent]);

  // Update device state
  const updateDevice = useCallback((deviceId, deviceState) => {
    setState(prev => {
      const device = prev.devices.find(d => d.id === deviceId);
      if (!device) return prev;

      const isBecomingOpen = deviceState === DEVICE_STATES.OPEN;
      const isArmed = [ALARM_STATES.ARMED_AWAY, ALARM_STATES.ARMED_HOME, ALARM_STATES.ARMED_NIGHT].includes(prev.alarmState);
      // Solo dispara si el dispositivo está activo en el modo actual
      const isActiveInMode = device.activeInMode !== false;
      const shouldTrigger = isBecomingOpen && device.armed && isArmed && isActiveInMode;

      if (shouldTrigger) {
        triggerAlarm(deviceId);
      }

      return {
        ...prev,
        devices: prev.devices.map(d =>
          d.id === deviceId ? { ...d, state: deviceState } : d
        ),
        zones: prev.zones.map(z =>
          z.id === deviceId ? { ...z, state: deviceState } : z
        )
      };
    });
  }, [triggerAlarm]);

  // Keep updateZone for backwards compatibility
  const updateZone = updateDevice;

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

  // Update device armed status
  const toggleDeviceArmed = useCallback((deviceId) => {
    setState(prev => ({
      ...prev,
      devices: prev.devices.map(d =>
        d.id === deviceId ? { ...d, armed: !d.armed } : d
      ),
      zones: prev.zones.map(z =>
        z.id === deviceId ? { ...z, armed: !z.armed } : z
      )
    }));
  }, []);

  // Keep toggleZoneArmed for backwards compatibility
  const toggleZoneArmed = toggleDeviceArmed;

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
      updateDevice,
      updateZone,
      recordFailedPin,
      isLockedOut,
      updateConfig,
      toggleDeviceArmed,
      toggleZoneArmed,
      addEvent
    }
  };
}

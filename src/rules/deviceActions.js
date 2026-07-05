// src/rules/deviceActions.js
export const DEVICE_ACTIONS = {
  'lampara-simple': [
    { command: 'on',     label: 'Encender' },
    { command: 'off',    label: 'Apagar' },
    { command: 'toggle', label: 'Toggle' },
  ],
  'lampara-dimmer': [
    { command: 'on',       label: 'Encender' },
    { command: 'off',      label: 'Apagar' },
    { command: 'setLevel', label: 'Nivel', argType: 'level' },
  ],
  'lampara-rgb': [
    { command: 'on',  label: 'Encender' },
    { command: 'off', label: 'Apagar' },
  ],
  'lampara-cct': [
    { command: 'on',  label: 'Encender' },
    { command: 'off', label: 'Apagar' },
  ],
  'tira-led': [
    { command: 'on',       label: 'Encender' },
    { command: 'off',      label: 'Apagar' },
    { command: 'setLevel', label: 'Nivel', argType: 'level' },
  ],
  'tira-led-rgb': [
    { command: 'on',  label: 'Encender' },
    { command: 'off', label: 'Apagar' },
  ],
  'enchufe': [
    { command: 'on',     label: 'Encender' },
    { command: 'off',    label: 'Apagar' },
    { command: 'toggle', label: 'Toggle' },
  ],
  'cerradura': [
    { command: 'lock',   label: 'Bloquear' },
    { command: 'unlock', label: 'Desbloquear' },
  ],
  'persiana-roller': [
    { command: 'open',        label: 'Abrir' },
    { command: 'close',       label: 'Cerrar' },
    { command: 'setPosition', label: 'Posición', argType: 'level' },
  ],
  'cortina': [
    { command: 'open',        label: 'Abrir' },
    { command: 'close',       label: 'Cerrar' },
    { command: 'setPosition', label: 'Posición', argType: 'level' },
  ],
  'toldo': [
    { command: 'open',        label: 'Abrir' },
    { command: 'close',       label: 'Cerrar' },
    { command: 'setPosition', label: 'Posición', argType: 'level' },
  ],
  'veneciana': [
    { command: 'open',        label: 'Abrir' },
    { command: 'close',       label: 'Cerrar' },
    { command: 'setPosition', label: 'Posición', argType: 'level' },
  ],
  'ventilador':        [{ command: 'on', label: 'Encender' }, { command: 'off', label: 'Apagar' }],
  'termostato':        [{ command: 'on', label: 'Encender' }, { command: 'off', label: 'Apagar' }],
  'aire-acondicionado':[{ command: 'on', label: 'Encender' }, { command: 'off', label: 'Apagar' }],
  'calefactor':        [{ command: 'on', label: 'Encender' }, { command: 'off', label: 'Apagar' }],
};

export const WIDGET_ICONS = {
  'lampara-simple': '💡', 'lampara-dimmer': '🔆', 'lampara-rgb': '🎨', 'lampara-cct': '💫',
  'tira-led-rgb': '✨', 'tira-led': '✨', 'enchufe': '🔌', 'termostato': '🌡',
  'aire-acondicionado': '❄', 'calefactor': '🔥', 'ventilador': '🌀',
  'puerta': '🚪', 'ventana': '🪟', 'cerradura': '🔒',
  'sensor-movimiento': '👁', 'sensor-presencia': '🧑', 'sensor-temp': '🌡',
  'sensor-aire': '💨', 'sensor-humo': '🔥', 'sensor-inundacion': '💧', 'sensor-luz': '☀',
  'persiana-roller': '📋', 'cortina': '🎭', 'toldo': '⛺', 'veneciana': '🪞',
  'time': '⏰',
};

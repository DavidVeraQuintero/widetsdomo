// src/rules/deviceConditions.js
export const DEVICE_CONDITIONS = {
  'puerta':          [{ attribute: 'contact',     operators: ['eq'],            valueType: 'enum',   values: ['open','closed'] }],
  'ventana':         [{ attribute: 'contact',     operators: ['eq'],            valueType: 'enum',   values: ['open','closed'] }],
  'lampara-simple':  [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'lampara-dimmer':  [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'lampara-rgb':     [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'lampara-cct':     [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'tira-led':        [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'tira-led-rgb':    [{ attribute: 'switch',      operators: ['eq'],            valueType: 'enum',   values: ['on','off'] }],
  'enchufe': [
    { attribute: 'switch', operators: ['eq'],            valueType: 'enum',   values: ['on','off'] },
    { attribute: 'power',  operators: ['eq','gte','lte'], valueType: 'number', unit: 'W' },
  ],
  'sensor-movimiento': [{ attribute: 'motion',    operators: ['eq'],            valueType: 'enum',   values: ['active','inactive'] }],
  'sensor-presencia':  [{ attribute: 'presence',  operators: ['eq'],            valueType: 'enum',   values: ['present','not present'] }],
  'cerradura':         [{ attribute: 'lock',       operators: ['eq'],            valueType: 'enum',   values: ['locked','unlocked'] }],
  'sensor-temp':       [{ attribute: 'temperature', operators: ['eq','gte','lte'], valueType: 'number', unit: '°C' }],
  'sensor-luz':        [{ attribute: 'illuminance', operators: ['eq','gte','lte'], valueType: 'number', unit: 'lux' }],
  'sensor-aire':       [{ attribute: 'airQualityIndex', operators: ['eq','gte','lte'], valueType: 'number', unit: 'AQI' }],
  'sensor-humo':       [{ attribute: 'smoke',      operators: ['eq'],            valueType: 'enum',   values: ['detected','clear'] }],
  'sensor-inundacion': [{ attribute: 'water',      operators: ['eq'],            valueType: 'enum',   values: ['wet','dry'] }],
};

export const TIME_CONDITION = { operators: ['eq','gte','lte'], valueType: 'time' };

export const OPERATOR_LABELS = { eq: '=', gte: '≥', lte: '≤' };

export const VALUE_LABELS = {
  open: 'abierta', closed: 'cerrada',
  on: 'encendida', off: 'apagada',
  active: 'activo', inactive: 'inactivo',
  present: 'presente', 'not present': 'ausente',
  locked: 'bloqueada', unlocked: 'desbloqueada',
  detected: 'detectado', clear: 'despejado',
  wet: 'mojado', dry: 'seco',
};

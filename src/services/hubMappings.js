// Hubitat Maker API capability → widget type IDs
export const HUBITAT_CAP_TO_WIDGETS = {
  Switch:                 ['lampara-simple', 'enchufe', 'tv'],
  AudioVolume:            ['tv'],
  SwitchLevel:            ['lampara-dimmer', 'tira-led'],
  ColorControl:           ['lampara-rgb', 'tira-led-rgb'],
  ColorTemperature:       ['lampara-cct'],
  Thermostat:             ['termostato', 'aire-acondicionado', 'calefactor'],
  FanControl:             ['ventilador'],
  Lock:                   ['cerradura'],
  ContactSensor:          ['puerta', 'ventana'],
  MotionSensor:           ['sensor-movimiento'],
  PresenceSensor:         ['sensor-presencia'],
  TemperatureMeasurement: ['sensor-temp'],
  AirQuality:             ['sensor-aire'],
  SmokeDetector:          ['sensor-humo'],
  WaterSensor:            ['sensor-inundacion'],
  IlluminanceMeasurement: ['sensor-luz'],
  WindowShade:            ['persiana-roller', 'cortina', 'toldo', 'veneciana'],
};

// Home Assistant entity domain → widget type IDs
export const HA_DOMAIN_TO_WIDGETS = {
  light:         ['lampara-simple', 'lampara-dimmer', 'lampara-rgb', 'lampara-cct', 'tira-led-rgb', 'tira-led'],
  switch:        ['enchufe'],
  climate:       ['termostato', 'aire-acondicionado', 'calefactor'],
  fan:           ['ventilador'],
  lock:          ['cerradura'],
  binary_sensor: ['puerta', 'ventana', 'sensor-movimiento', 'sensor-presencia', 'sensor-humo', 'sensor-inundacion'],
  sensor:        ['sensor-temp', 'sensor-aire', 'sensor-luz'],
  cover:         ['persiana-roller', 'cortina', 'toldo', 'veneciana'],
};

// Widget types that show a device count badge and lock (0 devices) when a hub is configured
export const HUB_LOCKABLE_WIDGET_TYPES = new Set([
  'lampara-simple', 'lampara-dimmer', 'lampara-rgb', 'lampara-cct',
  'tira-led-rgb', 'tira-led', 'termostato', 'aire-acondicionado',
  'calefactor', 'ventilador', 'puerta', 'ventana', 'cerradura',
  'sensor-movimiento', 'sensor-presencia', 'sensor-temp', 'sensor-aire',
  'sensor-humo', 'sensor-inundacion', 'sensor-luz', 'enchufe',
  'persiana-roller', 'cortina', 'toldo', 'veneciana', 'tv',
]);

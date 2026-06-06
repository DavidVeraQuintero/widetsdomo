export const WIDGET_ICON_META = {
  // ── ILUMINACIÓN ──
  'lampara-simple':    { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'lightbulb' } },
  'lampara-dimmer':    { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'lightbulb-dim' } },
  'lampara-rgb':       { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'lightbulb-color' } },
  'lampara-cct':       { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'lightbulb' } },
  'tira-led-rgb':      { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'strip-led' } },
  'tira-led':          { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'strip-led' } },
  // ── CLIMA ──
  'aire-acondicionado':{ states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'snowflake' } },
  'termostato':        { states: ['idle','heating'], labels: { idle: 'En espera', heating: 'Calentando' }, defaults: { idle: 'thermometer', heating: 'flame' } },
  'ventilador':        { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'fan' } },
  'calefactor':        { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'flame' } },
  'humidificador':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'droplets' } },
  'purificador':       { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'wind' } },
  // ── SEGURIDAD ──
  'puerta':            { states: ['closed','open'], labels: { closed: 'Cerrada', open: 'Abierta' }, defaults: { closed: 'door', open: 'door-open' } },
  'ventana':           { states: ['closed','open'], labels: { closed: 'Cerrada', open: 'Abierta' }, defaults: { closed: 'window', open: 'window-open' } },
  'cerradura':         { states: ['locked','unlocked'], labels: { locked: 'Bloqueada', unlocked: 'Desbloqueada' }, defaults: { locked: 'lock', unlocked: 'unlock' } },
  'camara-ip':         { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'camera' } },
  'sensor-movimiento': { states: ['idle','detected'], labels: { idle: 'Sin actividad', detected: 'Detectado' }, defaults: { idle: 'eye', detected: 'motion-person' } },
  'sensor-presencia':  { states: ['absent','present'], labels: { absent: 'Ausente', present: 'Presente' }, defaults: { absent: 'eye-off', present: 'motion-person' } },
  'alarma':            { states: ['disarmed','armed','triggered'], labels: { disarmed: 'Desarmada', armed: 'Armada', triggered: 'Activada' }, defaults: { disarmed: 'bell-off', armed: 'bell', triggered: 'alert' } },
  // ── PERSIANAS ──
  'persiana-roller':   { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'blinds' } },
  'cortina':           { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'curtain' } },
  'toldo':             { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'awning' } },
  'veneciana':         { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'slats' } },
  // ── SENSORES ──
  'sensor-temp':       { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'thermometer' } },
  'sensor-aire':       { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'wind' } },
  'sensor-humo':       { states: ['ok','alert'], labels: { ok: 'Normal', alert: 'Alerta' }, defaults: { ok: 'smoke', alert: 'alert' } },
  'sensor-inundacion': { states: ['ok','alert'], labels: { ok: 'Normal', alert: 'Inundación' }, defaults: { ok: 'water-drop', alert: 'alert' } },
  'sensor-luz':        { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'light-sensor' } },
  'estacion-meteo':    { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'thermometer' } },
  // ── ENERGÍA ──
  'enchufe':           { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'plug' } },
  'medidor-consumo':   { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'meter' } },
  'panel-solar':       { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'solar' } },
  'bateria':           { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'battery' } },
  // ── MULTIMEDIA ──
  'tv':                { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'tv' } },
  'musica':            { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'music' } },
  'altavoz':           { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'speaker' } },
  // ── ESCENAS ──
  'escena-individual': { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'star' } },
  'panel-escenas':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'home' } },
  'escena-activa':     { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'star' } },
  // ── AUTOMATIZACIÓN ──
  'temporizador':      { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'timer' } },
  'regla-auto':        { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'rule' } },
  'estado-hogar':      { states: ['default'], labels: { default: 'Icono' }, defaults: { default: 'home' } },
};

import { WIDGET_SIZES } from '../../catalog/widgetSizes';

export const HEADER_HEIGHT  = 40;
export const CHILD_PADDING  = 16;
export const MIN_GROUP_WIDTH  = 220;
export const MIN_GROUP_HEIGHT = 140;

export const RGB_TYPES     = new Set(['lampara-rgb', 'tira-led-rgb']);
export const DIMMER_TYPES  = new Set(['lampara-rgb', 'tira-led-rgb', 'lampara-dimmer', 'tira-led', 'lampara-cct']);
export const CURTAIN_TYPES = new Set(['cortina', 'persiana-roller', 'toldo', 'veneciana']);

// height devuelto es solo el área de contenido (sin header).
// El header (HEADER_HEIGHT) se suma en GrupoWidget al calcular la altura total.
export function computeGroupSize(children) {
  if (!children || children.length === 0) {
    return { width: MIN_GROUP_WIDTH, height: MIN_GROUP_HEIGHT };
  }
  let maxW = 0, maxH = 0;
  for (const child of children) {
    const s = WIDGET_SIZES[child.size] || WIDGET_SIZES['2x2'];
    maxW = Math.max(maxW, child.x + s.width);
    maxH = Math.max(maxH, child.y + s.height);
  }
  return {
    width:  Math.max(MIN_GROUP_WIDTH,  maxW + CHILD_PADDING),
    height: Math.max(MIN_GROUP_HEIGHT - HEADER_HEIGHT, maxH + CHILD_PADDING),
  };
}

function hasControllableProp(cfg) {
  return 'on' in cfg || 'armed' in cfg || 'recording' in cfg;
}

export function hasControllable(children) {
  return children.some(c => hasControllableProp(c.config));
}

export function getMasterState(children) {
  const list = children.filter(c => hasControllableProp(c.config));
  if (list.length === 0) return false;
  return list.every(c => c.config.on || c.config.armed || c.config.recording);
}

export function hasRGB(children)      { return children.some(c => RGB_TYPES.has(c.type)); }
export function hasDimmer(children)   { return children.some(c => DIMMER_TYPES.has(c.type)); }
export function hasCurtains(children) { return children.some(c => CURTAIN_TYPES.has(c.type)); }

export function applyMasterToggle(children, value) {
  return children.map(child => {
    const cfg   = child.config;
    const patch = {};
    if ('on'        in cfg) patch.on        = value;
    if ('armed'     in cfg) patch.armed     = value;
    if ('recording' in cfg) patch.recording = value;
    return Object.keys(patch).length > 0
      ? { ...child, config: { ...cfg, ...patch } }
      : child;
  });
}

export function applyRGBColor(children, color) {
  return children.map(child =>
    RGB_TYPES.has(child.type)
      ? { ...child, config: { ...child.config, color } }
      : child
  );
}

export function applyBrightness(children, brightness) {
  return children.map(child => {
    if (!DIMMER_TYPES.has(child.type)) return child;
    if (child.type === 'lampara-cct') {
      return { ...child, config: { ...child.config, colorTemp: brightness } };
    }
    return { ...child, config: { ...child.config, brightness } };
  });
}

export function applyCurtainPosition(children, position) {
  return children.map(child =>
    CURTAIN_TYPES.has(child.type)
      ? { ...child, config: { ...child.config, position } }
      : child
  );
}

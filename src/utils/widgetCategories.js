// Mapeo de tipos de widgets a categorías de domótica
export const WIDGET_CATEGORIES = {
  // Luces
  'lampara': 'Luces',
  'luz': 'Luces',
  'light': 'Luces',

  // Enchufes/Interruptores
  'enchufe': 'Enchufes',
  'switch': 'Enchufes',
  'outlet': 'Enchufes',
  'interruptor': 'Enchufes',

  // Cámaras
  'camara': 'Cámaras',
  'camera': 'Cámaras',
  'video': 'Cámaras',

  // Sensores
  'sensor': 'Sensores',
  'temperatura': 'Sensores',
  'humedad': 'Sensores',
  'movimiento': 'Sensores',
  'door': 'Sensores',
  'motion': 'Sensores',

  // Cerraduras
  'cerradura': 'Cerraduras',
  'lock': 'Cerraduras',
  'puerta': 'Cerraduras',

  // Persianas/Cortinas
  'persiana': 'Persianas',
  'cortina': 'Persianas',
  'blind': 'Persianas',

  // Clima
  'termostato': 'Clima',
  'aire': 'Clima',
  'ac': 'Clima',
  'ventilador': 'Clima',
  'fan': 'Clima',

  // Calendario/Agendas
  'calendario': 'Calendario',
  'calendar': 'Calendario',
  'agenda': 'Calendario',
  'evento': 'Calendario',

  // Grupos
  'grupo': 'Grupos',
  'group': 'Grupos',
};

export function getCategoryForWidget(widget) {
  const category = WIDGET_CATEGORIES[widget.type.toLowerCase()];
  return category || 'Otros';
}

export function groupWidgetsByCategory(widgets) {
  const groups = {};

  widgets.forEach(widget => {
    const category = getCategoryForWidget(widget);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(widget);
  });

  // Ordenar categorías por nombre
  return Object.keys(groups)
    .sort()
    .reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {});
}

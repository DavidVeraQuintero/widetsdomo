import { CELL_SIZE } from '../catalog/widgetSizes';

// Tamaño de celda en modo compact - mantener igual a CELL_SIZE
// Los widgets mantienen su tamaño original, solo el número de columnas cambia
export const COMPACT_CELL_SIZE = CELL_SIZE; // 95px

// Calcula el número de columnas que caben en el ancho disponible
export function getCompactColumns(viewportWidth) {
  // Forzar 4 columnas en móvil - el usuario quiere esto aunque sea apretado
  if (viewportWidth < 600) return 4;   // Móvil: siempre 4
  if (viewportWidth < 1000) return 6;  // Tablet pequeño
  if (viewportWidth < 1400) return 8;  // Tablet
  return 12;                           // Desktop
}

// Calcula las dimensiones dinámicas del canvas en modo compact
export function getCompactCanvasDimensions(widgets, viewportWidth) {
  const cols = getCompactColumns(viewportWidth);
  const width = cols * COMPACT_CELL_SIZE;

  if (widgets.length === 0) {
    return { width, height: COMPACT_CELL_SIZE * 2 };
  }

  // Calcula la altura máxima necesaria
  let maxY = 0;
  const WIDGET_PADDING = 12;

  widgets.forEach(widget => {
    const { height } = getWidgetDimensions(widget);
    const widgetBottom = (widget.y || 0) + height;
    maxY = Math.max(maxY, widgetBottom);
  });

  const height = Math.max(maxY + WIDGET_PADDING, COMPACT_CELL_SIZE * 2);
  return { width, height };
}

// Reorganiza widgets en un layout compacto sin scroll horizontal
export function calculateCompactLayout(widgets, viewportWidth, canvasWidth) {
  if (widgets.length === 0) return [];

  // Determinar el número de columnas según viewport
  const cols = getCompactColumns(viewportWidth);
  const WIDGET_PADDING = 12;
  // maxWidth = espacio real de widgets (90px cada uno) + padding entre ellos
  // Ej: 4 widgets * 90px + 3 espacios * 12px = 396px
  const maxWidth = (cols * 90) + ((cols - 1) * WIDGET_PADDING);

  // Ordenar widgets por posición (arriba a abajo, izquierda a derecha)
  const sorted = [...widgets].sort((a, b) => {
    const aRow = Math.floor(a.y / CELL_SIZE);
    const bRow = Math.floor(b.y / CELL_SIZE);
    if (aRow !== bRow) return aRow - bRow;
    return a.x - b.x;
  });

  // Reorganizar en filas con padding
  const reorganized = [];
  let currentX = WIDGET_PADDING;
  let currentY = WIDGET_PADDING;
  let rowHeight = 0;

  sorted.forEach(widget => {
    const { width, height } = getWidgetDimensions(widget);
    const widgetWidth = width + WIDGET_PADDING;

    // Si no cabe en la fila actual, pasar a la siguiente
    if (currentX + widgetWidth > maxWidth && currentX > WIDGET_PADDING) {
      currentY += rowHeight + WIDGET_PADDING;
      currentX = WIDGET_PADDING;
      rowHeight = 0;
    }

    // Ajustar a grid
    const newX = currentX;
    const newY = currentY;

    reorganized.push({
      ...widget,
      originalX: widget.x,
      originalY: widget.y,
      x: newX,
      y: newY,
    });

    currentX += widgetWidth;
    rowHeight = Math.max(rowHeight, height);
  });

  return reorganized;
}

// Obtiene dimensiones de un widget (reducidas 10% en compact mode)
function getWidgetDimensions(widget) {
  // Tipos de widget y sus dimensiones predeterminadas
  const typeSizes = {
    'grupo': { width: 185, height: 185 },
  };

  let size = null;

  if (widget.size) {
    const sizeMap = {
      '1x1': { width: 90,  height: 90 },
      '1x2': { width: 90,  height: 185 },
      '2x1': { width: 185, height: 90 },
      '2x2': { width: 185, height: 185 },
      '2x4': { width: 185, height: 390 },
      '4x2': { width: 390, height: 185 },
      '4x4': { width: 390, height: 390 },
      '4x6': { width: 390, height: 595 },
      '2x6': { width: 185, height: 595 },
      '2x8': { width: 185, height: 800 },
    };
    size = sizeMap[widget.size] || { width: 185, height: 185 };
  } else {
    size = typeSizes[widget.type] || { width: 185, height: 185 };
  }

  // Mantener tamaño original - no escalar
  return size;
}

// Restaura posiciones originales
export function restoreOriginalPositions(widgets) {
  return widgets.map(w => ({
    ...w,
    x: w.originalX ?? w.x,
    y: w.originalY ?? w.y,
  }));
}

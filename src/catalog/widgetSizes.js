// Dimensiones en píxeles para cada tamaño de widget
// Formato "colsXrows" → { width, height }
export const WIDGET_SIZES = {
  '1x1': { width: 90,  height: 90  },
  '1x2': { width: 90,  height: 185 },
  '2x1': { width: 185, height: 90  },
  '2x2': { width: 185, height: 185 },
  '2x4': { width: 185, height: 390 },
  '4x2': { width: 390, height: 185 },
  '4x4': { width: 390, height: 390 },
  '2x6': { width: 185, height: 595 },
  '2x8': { width: 185, height: 800 },
};

export const SNAP_SIZE  = 5;  // píxeles de snap a grilla
export const CELL_SIZE  = 95; // tamaño de una celda de grid (widget 1×1 + gap)

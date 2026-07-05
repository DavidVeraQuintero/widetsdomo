import { WIDGET_SIZES } from '../../catalog/widgetSizes';
import CanvasWidget from './CanvasWidget';
import CategoryHeader from './CategoryHeader';

export default function CategorySection({
  categoryName,
  categoryIcon,
  widgets,
  isExpanded,
  onToggle,
  canvasW,
  responsiveCols = 2,
}) {
  if (widgets.length === 0) return null;

  // Layout masonry con tamaños originales, sin escalar
  const padding = 8;
  const gap = 8;
  const CELL_SIZE = 95;
  const fittingCols = Math.floor((canvasW - padding * 2) / CELL_SIZE);
  const numCols = Math.max(1, fittingCols);

  const columnHeights = Array(numCols).fill(padding);
  const arranged = [];

  const sorted = [...widgets].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  sorted.forEach((widget) => {
    const size = WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2'];
    const widgetCols = Math.max(1, Math.round(size.width / 90));
    const clampedCols = Math.min(widgetCols, numCols);

    let minHeight = Infinity;
    let bestColIndex = 0;

    for (let i = 0; i <= numCols - clampedCols; i++) {
      const maxH = Math.max(...columnHeights.slice(i, i + clampedCols));
      if (maxH < minHeight) {
        minHeight = maxH;
        bestColIndex = i;
      }
    }

    const posX = padding + bestColIndex * CELL_SIZE;
    const posY = Math.max(...columnHeights.slice(bestColIndex, bestColIndex + clampedCols));

    arranged.push({
      ...widget,
      x: Math.round(posX),
      y: Math.round(posY),
      _responsiveScale: 1,
    });

    for (let i = bestColIndex; i < bestColIndex + clampedCols; i++) {
      columnHeights[i] = posY + size.height + gap;
    }
  });

  const sectionHeight = columnHeights.length > 0 ? Math.max(...columnHeights) + padding : 0;

  return (
    <div style={{ marginBottom: '16px' }}>
      <CategoryHeader
        categoryName={categoryName}
        categoryIcon={categoryIcon}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      {isExpanded && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: sectionHeight,
            marginTop: '8px',
          }}
        >
          {arranged.map((widget) => (
            <CanvasWidget
              key={widget.id}
              widget={widget}
              responsiveScale={widget._responsiveScale || 1}
              isResponsive={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

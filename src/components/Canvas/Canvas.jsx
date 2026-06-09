import { useRef, useState, useEffect } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import { SNAP_SIZE, CELL_SIZE, WIDGET_SIZES } from '../../catalog/widgetSizes';
import { MIN_GROUP_WIDTH, MIN_GROUP_HEIGHT } from '../widgets/grupoUtils';
import CanvasWidget from './CanvasWidget';
import styles from './Canvas.module.css';

export default function Canvas() {
  const { state, dispatch } = useDashboard();
  const canvasRef = useRef(null);
  const innerRef = useRef(null);

  const snap = (v) =>
    state.snapToGrid ? Math.round(v / SNAP_SIZE) * SNAP_SIZE : v;

  const { cols, rows } = state.grid;
  const canvasW = cols * CELL_SIZE;
  const canvasH = rows * CELL_SIZE;

  // Escala automática: encoge el canvas para que quepa en el ancho disponible
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => {
      const cs = window.getComputedStyle(el);
      const availW = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const isMobile = window.innerWidth < 768;
      // En móvil: 2 columnas; en desktop: 4 columnas
      const minCols = isMobile ? 2 : 4;
      const targetW = Math.min(canvasW, minCols * CELL_SIZE);
      setZoom(Math.min(1, availW / targetW));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    const handleResize = () => update();
    window.addEventListener('resize', handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [canvasW]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('widgetType');
    if (!type) return;
    const def = getCatalogEntry(type);
    if (!def) return;

    if (type !== 'grupo') {
      const contentEl = e.target.closest('[data-grupo-content]');
      const groupEl   = e.target.closest('[data-widget-type="grupo"]');
      if (contentEl && groupEl) {
        const widgetId    = groupEl.dataset.widgetId;
        const targetGroup = state.widgets.find(w => w.id === widgetId);
        if (targetGroup) {
          const rect   = contentEl.getBoundingClientRect();
          const childX = snap(Math.max(0, (e.clientX - rect.left) / zoom));
          const childY = snap(Math.max(0, (e.clientY - rect.top) / zoom));
          const newChild = {
            id: `${type}-${Date.now()}`,
            type,
            size: def.sizes[Math.min(1, def.sizes.length - 1)],
            config: { ...def.defaultConfig },
            x: childX,
            y: childY,
          };
          dispatch({
            type: 'UPDATE_CONFIG',
            id: widgetId,
            config: { ...targetGroup.config, children: [...(targetGroup.config.children || []), newChild] },
          });
          return;
        }
      }
    }

    const rect = innerRef.current.getBoundingClientRect();
    const wSize = type === 'grupo'
      ? { width: MIN_GROUP_WIDTH, height: MIN_GROUP_HEIGHT }
      : (WIDGET_SIZES[def.sizes[Math.min(1, def.sizes.length - 1)]] || WIDGET_SIZES['2x2']);
    const maxX = Math.max(0, canvasW - wSize.width);
    const maxY = Math.max(0, canvasH - wSize.height);
    const x = snap(Math.min(maxX, Math.max(0, (e.clientX - rect.left) / zoom - 45)));
    const y = snap(Math.min(maxY, Math.max(0, (e.clientY - rect.top)  / zoom - 45)));
    dispatch({
      type: 'ADD_WIDGET',
      payload: {
        id: `${type}-${Date.now()}`,
        type,
        x,
        y,
        size: def.sizes[Math.min(1, def.sizes.length - 1)],
        config: { ...def.defaultConfig },
      },
    });
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('[data-widget-id]')) return;
    e.preventDefault();
  };

  const handleClick = (e) => {
    if (e.target === innerRef.current || e.target === canvasRef.current) {
      dispatch({ type: 'SELECT_WIDGET', id: null });
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.canvasArea}>
        <div className={styles.canvasBg} />
        <div className={styles.canvasTint} />
        <div className={styles.canvasHour} />

        <div
          ref={canvasRef}
          className={styles.canvas}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div
            ref={innerRef}
            className={styles.canvasInner}
            style={{ width: canvasW, height: canvasH, '--cell': `${CELL_SIZE}px`, zoom }}
          >
            {state.widgets.map(w => (
              <CanvasWidget key={w.id} widget={w} zoom={zoom} />
            ))}
            {state.widgets.length === 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.35)', fontSize: 13, pointerEvents: 'none',
              }}>
                Arrastra un widget aquí para comenzar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

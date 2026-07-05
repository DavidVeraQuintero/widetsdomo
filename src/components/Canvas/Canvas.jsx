import { useRef, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { useMeta } from '../../store/metaStore.jsx';
import { useHub } from '../../store/hubStore.jsx';
import { HUB_LOCKABLE_WIDGET_TYPES } from '../../services/hubMappings.js';
import DevicePickerModal from '../Hubs/DevicePickerModal.jsx';
import SyncIndicator from '../SyncIndicator/SyncIndicator.jsx';
import { getCatalogEntry, WIDGET_CATALOG } from '../../catalog/widgetCatalog.jsx';
import { SNAP_SIZE, CELL_SIZE, WIDGET_SIZES } from '../../catalog/widgetSizes';
import { MIN_GROUP_WIDTH, MIN_GROUP_HEIGHT } from '../widgets/grupoUtils';
import { detectDashboardScale, applyCanvasScale, clampZoom, calculateFinalScale } from '../../utils/responsiveScale.js';
import { useResponsiveGrid } from '../../utils/useResponsiveGrid.js';
import CanvasWidget from './CanvasWidget';
import CategorySection from './CategorySection';
import styles from './Canvas.module.css';

export default function Canvas() {
  const { state, dispatch } = useDashboard();
  const { state: metaState, dispatch: metaDispatch } = useMeta();
  const { hubsConfigured, hubs, devices: hubDevices, assignments } = useHub();
  const [pendingDrop, setPendingDrop] = useState(null);
  const canvasRef = useRef(null);
  const innerRef = useRef(null);

  const [dashboardScale, setDashboardScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const innerCanvasRef = useRef(null);

  const snap = (v) =>
    state.snapToGrid ? Math.round(v / SNAP_SIZE) * SNAP_SIZE : v;

  // Observar el ancho real del contenedor del canvas (descuenta padding del .canvas)
  useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  const responsiveCols = useResponsiveGrid();
  const { rows, cols } = state.grid;

  // Responsivo activo en modo Responsivo (no original, no categorizado)
  const isResponsive = !metaState.viewOriginal && !metaState.viewCategorized;

  // Original: tamaño fijo configurado. Responsive/Categoría: ancho real del contenedor
  const canvasW = metaState.viewOriginal ? cols * CELL_SIZE : containerWidth;

  // En modo responsivo, reorganizar widgets dinámicamente
  const displayWidgets = isResponsive ? calculateResponsiveLayout(state.widgets, canvasW, responsiveCols) : state.widgets;

  // Agrupar widgets por categoría para vista categorizada
  function getWidgetsByCategory() {
    const categories = new Map();

    state.widgets.forEach((widget) => {
      const catalog = getCatalogEntry(widget.type);
      const category = catalog?.category || 'Otros';
      const categoryIcon = catalog?.categoryIcon || '📦';

      if (!categories.has(category)) {
        categories.set(category, { icon: categoryIcon, widgets: [] });
      }
      categories.get(category).widgets.push(widget);
    });

    // Ordenar categorías alfabéticamente
    return Array.from(categories.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, data]) => ({
        name,
        icon: data.icon,
        widgets: data.widgets,
      }));
  }

  function calculateResponsiveLayout(widgets, availableWidth, numCols) {
    const padding = 8;
    const gap = 8;
    // Cuántas columnas de CELL_SIZE caben en el ancho disponible (sin límite artificial)
    const fittingCols = Math.floor((availableWidth - padding * 2) / CELL_SIZE);

    const columnHeights = Array(Math.max(1, fittingCols)).fill(padding);
    const arranged = [];

    const sorted = [...widgets].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    sorted.forEach(widget => {
      const size = WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2'];
      // Columnas que ocupa el widget según su ancho original
      const widgetCols = Math.max(1, Math.round(size.width / 90));
      const clampedCols = Math.min(widgetCols, fittingCols);

      let minHeight = Infinity;
      let bestColIndex = 0;

      for (let i = 0; i <= fittingCols - clampedCols; i++) {
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

    return arranged;
  }

  let canvasH = rows * CELL_SIZE;
  if (metaState.viewCategorized) {
    // En vista categorizada, usar altura automática (auto)
    canvasH = 'auto';
  } else if (displayWidgets.length > 0) {
    const lowestWidget = displayWidgets.reduce((max, w) => {
      const size = WIDGET_SIZES[w.size] || WIDGET_SIZES['2x2'];
      const scale = w._responsiveScale || 1;
      const scaledHeight = Math.round(size.height * scale);
      const widgetBottom = (w.y || 0) + scaledHeight;
      return Math.max(max, widgetBottom);
    }, 0);
    canvasH = Math.max(lowestWidget + 60, rows * CELL_SIZE);
  }

  const [, drop] = useDrop(() => ({
    accept: 'WIDGET',
    drop: (item, monitor) => {
      if (monitor.didDrop()) return; // ya lo capturó un target hijo (ej: grupo)
      const offset = monitor.getClientOffset();
      if (!offset || !innerRef.current) return;

      const rect = innerRef.current.getBoundingClientRect();
      const type = item.widgetType;
      const def = item.def ?? getCatalogEntry(type);
      if (!def) return;

      const sizeKey = def.sizes[Math.min(1, def.sizes.length - 1)];
      const wSize = WIDGET_SIZES[sizeKey] || WIDGET_SIZES['2x2'] || { width: 120, height: 120 };
      const maxX = Math.max(0, canvasW - wSize.width);
      const maxY = Math.max(0, canvasH - wSize.height);
      const x = snap(Math.min(maxX, Math.max(0, (offset.x - rect.left) - 45)));
      const y = snap(Math.min(maxY, Math.max(0, (offset.y - rect.top) - 45)));

      const addDirect = (extraConfig = {}) => {
        dispatch({
          type: 'ADD_WIDGET',
          payload: {
            id: `${type}-${Date.now()}`, type, x, y,
            size: sizeKey,
            config: { ...(def.defaultConfig ?? {}), ...extraConfig },
          },
        });
      };

      if (hubsConfigured && HUB_LOCKABLE_WIDGET_TYPES.has(type)) {
        const allDevsList = Object.values(hubDevices).flat();
        const matchingDevices = Object.entries(assignments)
          .filter(([, wt]) => wt === type)
          .map(([key]) => {
            const sep = key.indexOf(':');
            const hubId = key.slice(0, sep);
            const deviceId = key.slice(sep + 1);
            const full = allDevsList.find(d => d.hubId === hubId && d.deviceId === deviceId);
            if (full) return full;
            const hub = hubs.find(h => h.id === hubId);
            return { hubId, deviceId, name: `Dispositivo ${deviceId}`, hubName: hub?.name ?? '', reachable: true };
          });
        if (matchingDevices.length === 1) {
          const dev = matchingDevices[0];
          addDirect({ hubId: dev.hubId, deviceId: dev.deviceId, hubDeviceName: dev.name });
        } else if (matchingDevices.length >= 2) {
          setPendingDrop({ type, def, x, y, sizeKey, matchingDevices });
        } else {
          addDirect();
        }
        return;
      }

      addDirect();
    },
  }));


  // Disabled auto-scale - widgets maintain fixed size, canvas scrolls if needed
  // useEffect(() => {
  //   // Initial scale calculation on mount
  //   if (innerCanvasRef.current) {
  //     const initialScale = detectDashboardScale(innerCanvasRef.current);
  //     setDashboardScale(initialScale);
  //     applyCanvasScale(innerCanvasRef.current, initialScale);
  //   }

  //   // Recalculate on window resize
  //   const handleResize = () => {
  //     if (innerCanvasRef.current) {
  //       const newScale = detectDashboardScale(innerCanvasRef.current);
  //       setDashboardScale(newScale);
  //       const finalScale = calculateFinalScale(newScale, userZoom);
  //       applyCanvasScale(innerCanvasRef.current, finalScale);
  //     }
  //   };

  //   window.addEventListener('resize', handleResize);
  //   return () => window.removeEventListener('resize', handleResize);
  // }, [userZoom]);

  // Disabled - no auto-scale transform
  // useEffect(() => {
  //   if (innerCanvasRef.current) {
  //     const finalScale = calculateFinalScale(dashboardScale, userZoom);
  //     applyCanvasScale(innerCanvasRef.current, finalScale);
  //   }
  // }, [dashboardScale, userZoom]);

  // Pinch-to-zoom with mouse wheel (Ctrl+Scroll) - no aplica en vista categorizada
  useEffect(() => {
    if (metaState.viewCategorized) return;

    const handleWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();

      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = clampZoom(userZoom * zoomDelta);
      setUserZoom(newZoom);

      if (innerCanvasRef.current) {
        const finalScale = calculateFinalScale(dashboardScale, newZoom);
        applyCanvasScale(innerCanvasRef.current, finalScale);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [dashboardScale, userZoom, metaState.viewCategorized]);

  // Touch pinch-to-zoom (two-finger pinch) - no aplica en vista categorizada
  useEffect(() => {
    if (metaState.viewCategorized) return;

    let lastTouchDistance = 0;

    const handleTouchMove = (e) => {
      if (e.touches.length !== 2) {
        lastTouchDistance = 0;
        return;
      }

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      if (lastTouchDistance === 0) {
        lastTouchDistance = distance;
        return;
      }

      e.preventDefault();

      const ratio = distance / lastTouchDistance;
      const newZoom = clampZoom(userZoom * ratio);
      setUserZoom(newZoom);

      if (innerCanvasRef.current) {
        const finalScale = calculateFinalScale(dashboardScale, newZoom);
        applyCanvasScale(innerCanvasRef.current, finalScale);
      }

      lastTouchDistance = distance;
    };

    const handleTouchEnd = () => {
      lastTouchDistance = 0;
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dashboardScale, userZoom, metaState.viewCategorized]);


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
          onClick={handleClick}
        >
          <div
            ref={(el) => {
              drop(el);
              innerRef.current = el;
              innerCanvasRef.current = el;
            }}
            className={styles.canvasInner}
            style={{
              width: metaState.viewOriginal ? canvasW : '100%',
              height: metaState.viewOriginal ? canvasH : 'auto',
              '--cell': `${CELL_SIZE}px`,
              ...(!metaState.viewOriginal ? {
                display: 'block',
                border: 'none',
                padding: '16px',
              } : {}),
            }}
          >
            {metaState.viewCategorized ? (
              // Vista categorizada
              <div style={{ display: 'flex', flexDirection: 'column', padding: '0' }}>
                {getWidgetsByCategory().map((category) => (
                  <CategorySection
                    key={category.name}
                    categoryName={category.name}
                    categoryIcon={category.icon}
                    widgets={category.widgets}
                    isExpanded={metaState.expandedGroups[category.name] !== false}
                    onToggle={() => {
                      metaDispatch({
                        type: 'TOGGLE_GROUP',
                        category: category.name,
                      });
                    }}
                    canvasW={canvasW}
                    responsiveCols={responsiveCols}
                  />
                ))}
                {state.widgets.length === 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: '40px', padding: '16px',
                  }}>
                    Toca un widget en el panel para agregar
                  </div>
                )}
              </div>
            ) : (
              // Vista normal (responsiva o original)
              <>
                {displayWidgets.map(w => (
                  <CanvasWidget
                    key={w.id}
                    widget={w}
                    zoom={dashboardScale * userZoom}
                    responsiveScale={w._responsiveScale || 1}
                    isResponsive={isResponsive}
                  />
                ))}
                {displayWidgets.length === 0 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.35)', fontSize: 13, pointerEvents: 'none',
                  }}>
                    Toca un widget en el panel para agregar
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <SyncIndicator />
      {pendingDrop && (
        <DevicePickerModal
          widgetType={pendingDrop.type}
          def={pendingDrop.def}
          devices={pendingDrop.matchingDevices}
          onConfirm={(dev) => {
            dispatch({
              type: 'ADD_WIDGET',
              payload: {
                id: `${pendingDrop.type}-${Date.now()}`,
                type: pendingDrop.type,
                x: pendingDrop.x,
                y: pendingDrop.y,
                size: pendingDrop.sizeKey,
                config: { ...(pendingDrop.def.defaultConfig ?? {}), hubId: dev.hubId, deviceId: dev.deviceId, hubDeviceName: dev.name },
              },
            });
            setPendingDrop(null);
          }}
          onCancel={() => setPendingDrop(null)}
        />
      )}
    </div>
  );
}

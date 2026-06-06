import { useRef } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import { WIDGET_SIZES, SNAP_SIZE, CELL_SIZE } from '../../catalog/widgetSizes';
import { computeGroupSize, HEADER_HEIGHT } from '../widgets/grupoUtils';
import styles from './Canvas.module.css';

const RGB_TYPES = new Set(['lampara-rgb', 'tira-led-rgb', 'lampara-cct']);

function cctToHex(t) {
  const lerp = (a, b, f) => Math.round(a + (b - a) * f);
  const hexFromRgb = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  if (t <= 50) {
    const f = t / 50;
    return hexFromRgb(lerp(0xff, 0xfc, f), lerp(0x9a, 0xd5, f), lerp(0x00, 0x90, f));
  }
  const f = (t - 50) / 50;
  return hexFromRgb(lerp(0xfc, 0xd0, f), lerp(0xd5, 0xe8, f), lerp(0x90, 0xff, f));
}

function getRgbColor(type, config) {
  if (type === 'lampara-cct') return cctToHex(config.colorTemp ?? 50);
  return config.color ?? '#3b82f6';
}

function computeRgbCardStyle(rgbStyle, color) {
  switch (rgbStyle) {
    case 'border': return {
      border: `1.5px solid ${color}CC`,
      boxShadow: `0 0 16px ${color}55, 0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)`,
    };
    case 'tint': return {
      background: `${color}38`,
      border: `1px solid ${color}66`,
    };
    case 'bar':
    default: return {};
  }
}

function computeOnCardStyle(rgbStyle) {
  switch (rgbStyle) {
    case 'border': return {
      border: '1.5px solid rgba(255,255,255,0.45)',
      boxShadow: '0 0 14px rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.12)',
    };
    case 'tint': return {
      background: 'rgba(255,255,255,0.18)',
    };
    case 'bar':
    default: return {};
  }
}

function isOn(config) {
  return !!(config.on || config.armed || config.recording);
}

export default function CanvasWidget({ widget, zoom = 1 }) {
  const { state, dispatch } = useDashboard();
  const dragging = useRef(false);
  const origin = useRef(null);
  const isSelected = state.selectedId === widget.id;

  const isGrupo = widget.type === 'grupo';
  const size = isGrupo ? { width: undefined, height: undefined } : (WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2']);

  // Tamaño efectivo para clamping de arrastre
  const effectiveSize = isGrupo
    ? (() => { const gs = computeGroupSize(widget.config.children || []); return { width: gs.width, height: gs.height + HEADER_HEIGHT }; })()
    : size;
  const def = getCatalogEntry(widget.type);
  const WidgetComponent = def?.component;

  const isRgb = !isGrupo && RGB_TYPES.has(widget.type) && widget.config.on;
  const rgbColor = isRgb ? getRgbColor(widget.type, widget.config) : null;
  const widgetOn = !isGrupo && !isRgb && isOn(widget.config);
  const rgbCardStyle = isRgb
    ? computeRgbCardStyle(state.theme.rgbStyle, rgbColor)
    : widgetOn
      ? computeOnCardStyle(state.theme.rgbStyle)
      : {};

  const handleMouseDown = (e) => {
    if (e.target.closest('input, button, select, textarea')) return;
    e.stopPropagation();
    e.preventDefault();

    dispatch({ type: 'SELECT_WIDGET', id: widget.id });

    dragging.current = true;
    origin.current = {
      mx: e.clientX, my: e.clientY,
      wx: widget.x,  wy: widget.y,
    };

    const snap = (v) =>
      state.snapToGrid ? Math.round(v / SNAP_SIZE) * SNAP_SIZE : v;

    const canvasW = state.grid.cols * CELL_SIZE;
    const canvasH = state.grid.rows * CELL_SIZE;
    const maxX = Math.max(0, canvasW - effectiveSize.width);
    const maxY = Math.max(0, canvasH - effectiveSize.height);

    const clamp = (nx, ny) => [
      snap(Math.max(0, Math.min(maxX, nx))),
      snap(Math.max(0, Math.min(maxY, ny))),
    ];

    const onMove = (e) => {
      if (!dragging.current) return;
      const [nx, ny] = clamp(
        origin.current.wx + (e.clientX - origin.current.mx) / zoom,
        origin.current.wy + (e.clientY - origin.current.my) / zoom,
      );
      dispatch({ type: 'MOVE_WIDGET', id: widget.id, x: nx, y: ny });
    };

    const onUp = (ev) => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      // Detectar si el widget quedó encima de un grupo al soltar
      if (widget.type !== 'grupo') {
        const [finalX, finalY] = clamp(
          origin.current.wx + (ev.clientX - origin.current.mx) / zoom,
          origin.current.wy + (ev.clientY - origin.current.my) / zoom,
        );
        const s  = WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2'];
        const cx = finalX + s.width  / 2;
        const cy = finalY + s.height / 2;

        const targetGroup = state.widgets.find(w => {
          if (w.type !== 'grupo' || w.id === widget.id) return false;
          const gs = computeGroupSize(w.config.children || []);
          return cx >= w.x && cx <= w.x + gs.width &&
                 cy >= w.y + HEADER_HEIGHT && cy <= w.y + HEADER_HEIGHT + gs.height;
        });

        if (targetGroup) {
          dispatch({
            type: 'MOVE_TO_GROUP',
            widgetId: widget.id,
            groupId:  targetGroup.id,
            x: Math.max(0, finalX - targetGroup.x),
            y: Math.max(0, finalY - targetGroup.y - HEADER_HEIGHT),
          });
        }
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className={`${styles.widget} ${isSelected ? styles.selected : ''}`}
      data-widget-id={widget.id}
      data-widget-type={widget.type}
      style={{
        left: widget.x,
        top: widget.y,
        ...(isGrupo ? {} : { width: size.width, height: size.height }),
        ...rgbCardStyle,
      }}
      onMouseDown={handleMouseDown}
    >
      {WidgetComponent ? (
        <WidgetComponent
          size={widget.size}
          config={widget.config}
          accentColor="rgba(255,255,255,0.85)"
          onConfigChange={(config) =>
            dispatch({ type: 'UPDATE_CONFIG', id: widget.id, config })
          }
        />
      ) : (
        <div className="w-body w-center">
          <div className="w-sub">Widget desconocido: {widget.type}</div>
        </div>
      )}
      {isRgb && state.theme.rgbStyle === 'bar' && (
        <div
          className={styles.colorBar}
          style={{ background: rgbColor, boxShadow: `0 -2px 8px ${rgbColor}88` }}
        />
      )}
      {widgetOn && state.theme.rgbStyle === 'bar' && (
        <div
          className={styles.colorBar}
          style={{ background: 'rgba(255,255,255,0.55)', boxShadow: '0 -2px 8px rgba(255,255,255,0.20)' }}
        />
      )}
    </div>
  );
}

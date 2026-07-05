import { useRef, useEffect } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import { WIDGET_SIZES, SNAP_SIZE } from '../../catalog/widgetSizes';
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
  return !!(config.on || config.active || config.activeScene || config.armed || config.recording);
}

function isModalOpen() {
  return document.querySelector('[style*="z-index: 9000"]') !== null ||
         document.querySelector('[role="dialog"]') !== null;
}

export default function CanvasWidget({ widget, zoom = 1, compactMode = false, responsiveScale = 1, isResponsive = false }) {
  const { state, dispatch } = useDashboard();
  const nodeRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const isSelected = state.selectedId === widget.id;

  const isGrupo = widget.type === 'grupo';
  const size = isGrupo ? { width: undefined, height: undefined } : (WIDGET_SIZES[widget.size] || WIDGET_SIZES['2x2']);

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

  const modalOpen = isModalOpen();

  useEffect(() => {
    const el = nodeRef.current;
    if (!el || compactMode || isResponsive) return;

    const handlePointerDown = (e) => {
      // Para grupos, solo arrastrar desde el header
      if (isGrupo && !e.target.closest('[data-grupo-header]')) return;
      dispatch({ type: 'SELECT_WIDGET', id: widget.id });
      if (!isModalOpen()) {
        dragRef.current = {
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          origX: widget.x,
          origY: widget.y,
        };
        e.preventDefault();
      }
    };

    const handlePointerMove = (e) => {
      if (!dragRef.current.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      dispatch({
        type: 'MOVE_WIDGET',
        id: widget.id,
        x: dragRef.current.origX + dx / zoom,
        y: dragRef.current.origY + dy / zoom,
      });
    };

    const handlePointerUp = (e) => {
      if (dragRef.current.isDragging && !isGrupo) {
        const movedEnough =
          Math.abs(e.clientX - dragRef.current.startX) > 8 ||
          Math.abs(e.clientY - dragRef.current.startY) > 8;

        if (movedEnough) {
          // Buscar si se soltó encima de un grupo
          const elements = document.elementsFromPoint(e.clientX, e.clientY);
          const groupEl = elements.find(
            el => el.dataset?.widgetType === 'grupo' && el.dataset?.widgetId !== widget.id
          );
          if (groupEl) {
            const groupId = groupEl.dataset.widgetId;
            const contentEl = groupEl.querySelector('[data-grupo-content]');
            if (contentEl) {
              const rect = contentEl.getBoundingClientRect();
              const snap = (v) => Math.round(v / SNAP_SIZE) * SNAP_SIZE;
              const x = snap(Math.max(0, e.clientX - rect.left));
              const y = snap(Math.max(0, e.clientY - rect.top));
              dispatch({ type: 'MOVE_TO_GROUP', widgetId: widget.id, groupId, x, y });
              dragRef.current.isDragging = false;
              return;
            }
          }
        }
      }
      dragRef.current.isDragging = false;
    };

    el.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [widget.x, widget.y, widget.id, zoom, dispatch, compactMode, isResponsive]);

  return (
    <div
      ref={nodeRef}
      className={`${styles.widget} ${isSelected ? styles.selected : ''}`}
      data-widget-id={widget.id}
      data-widget-type={widget.type}
      style={{
        left: widget.x,
        top: widget.y,
        ...(isGrupo ? {} : { width: size.width, height: size.height }),
        ...rgbCardStyle,
        cursor: isResponsive || modalOpen ? 'not-allowed' : (compactMode ? 'default' : (isGrupo ? 'default' : 'grab')),
        opacity: isResponsive ? 0.75 : (compactMode ? 0.85 : 1),
        transform: responsiveScale !== 1 ? `scale(${responsiveScale})` : undefined,
        transformOrigin: 'top left',
        touchAction: (isResponsive || modalOpen) ? 'auto' : 'none',
      }}
      onTouchStart={(e) => {
        dispatch({ type: 'SELECT_WIDGET', id: widget.id });
        if (!compactMode && !isResponsive && !isModalOpen()) {
          dragRef.current = {
            isDragging: true,
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            origX: widget.x,
            origY: widget.y,
          };
        }
      }}
    >
      {WidgetComponent ? (
        <WidgetComponent
          size={widget.size}
          config={widget.config}
          accentColor="rgba(255,255,255,0.85)"
          widgetId={widget.id}
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

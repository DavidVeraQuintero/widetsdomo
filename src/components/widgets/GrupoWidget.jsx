import { useState, useRef } from 'react';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import { WIDGET_SIZES, SNAP_SIZE } from '../../catalog/widgetSizes';
import { useDashboard } from '../../store/dashboardStore.jsx';
import SvgIcon from './SvgIcon';
import IconPicker from './IconPicker';
import GrupoModal from './GrupoModal';
import {
  computeGroupSize, hasControllable, applyMasterToggle, getMasterState,
  HEADER_HEIGHT,
} from './grupoUtils';

// ── Helpers de estilo RGB (misma lógica que CanvasWidget) ──────────────────
const CHILD_RGB_TYPES = new Set(['lampara-rgb', 'tira-led-rgb', 'lampara-cct']);

function cctToHex(t) {
  const lerp = (a, b, f) => Math.round(a + (b - a) * f);
  const hex = (r, g, b) => '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
  if (t <= 50) { const f = t/50; return hex(lerp(0xff,0xfc,f),lerp(0x9a,0xd5,f),lerp(0x00,0x90,f)); }
  const f = (t-50)/50; return hex(lerp(0xfc,0xd0,f),lerp(0xd5,0xe8,f),lerp(0x90,0xff,f));
}

function getChildRgbColor(type, cfg) {
  if (type === 'lampara-cct') return cctToHex(cfg.colorTemp ?? 50);
  return cfg.color ?? '#3b82f6';
}

function childIsOn(cfg) { return !!(cfg.on || cfg.armed || cfg.recording); }

function childCardStyle(type, cfg, rgbStyle) {
  const isRgb = CHILD_RGB_TYPES.has(type) && cfg.on;
  const on    = !isRgb && childIsOn(cfg);
  const color = isRgb ? getChildRgbColor(type, cfg) : null;

  const base = {
    background: 'rgba(255,255,255,0.11)',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)',
  };

  if (isRgb) {
    if (rgbStyle === 'border') return { ...base,
      border: `1.5px solid ${color}CC`,
      boxShadow: `0 0 16px ${color}55, 0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)`,
    };
    if (rgbStyle === 'tint') return { ...base, background: `${color}38`, border: `1px solid ${color}66` };
    return { ...base, border: '1px solid rgba(255,255,255,0.20)' };
  }
  if (on) {
    if (rgbStyle === 'border') return { ...base,
      border: '1.5px solid rgba(255,255,255,0.45)',
      boxShadow: '0 0 14px rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.12)',
    };
    if (rgbStyle === 'tint') return { ...base, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.20)' };
    return { ...base, border: '1px solid rgba(255,255,255,0.20)' };
  }
  return { ...base, border: '1px solid rgba(255,255,255,0.20)' };
}
// ──────────────────────────────────────────────────────────────────────────

function ChildWrapper({ child, accentColor, onConfigChange, onMove }) {
  const { state, dispatch } = useDashboard();
  const dragging = useRef(false);
  const origin   = useRef(null);
  const def = getCatalogEntry(child.type);
  const WidgetComponent = def?.component;
  const childSize = WIDGET_SIZES[child.size] || WIDGET_SIZES['2x2'];

  const rgbStyle  = state.theme.rgbStyle;
  const cardStyle = childCardStyle(child.type, child.config, rgbStyle);
  const isRgb     = CHILD_RGB_TYPES.has(child.type) && child.config.on;
  const rgbColor  = isRgb ? getChildRgbColor(child.type, child.config) : null;
  const isOn      = !isRgb && childIsOn(child.config);

  const handleMouseDown = (e) => {
    if (e.target.closest('input, button, select, textarea')) return;
    e.stopPropagation();
    dispatch({ type: 'SELECT_WIDGET', id: child.id });
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, wx: child.x, wy: child.y };

    const snap = (v) => Math.round(v / SNAP_SIZE) * SNAP_SIZE;

    const onMouseMove = (ev) => {
      if (!dragging.current) return;
      const nx = snap(Math.max(0, origin.current.wx + (ev.clientX - origin.current.mx)));
      const ny = snap(Math.max(0, origin.current.wy + (ev.clientY - origin.current.my)));
      onMove(nx, ny);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: child.x, top: child.y,
        width: childSize.width, height: childSize.height,
        borderRadius: 10, overflow: 'hidden',
        cursor: 'grab', userSelect: 'none',
        ...cardStyle,
      }}
      onMouseDown={handleMouseDown}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
    >
      {WidgetComponent && (
        <WidgetComponent
          size={child.size}
          config={child.config}
          accentColor={accentColor}
          onConfigChange={onConfigChange}
        />
      )}
      {isRgb && rgbStyle === 'bar' && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:5, pointerEvents:'none',
          borderRadius:'0 0 9px 9px', background: rgbColor,
          boxShadow: `0 -2px 8px ${rgbColor}88`,
        }} />
      )}
      {isOn && rgbStyle === 'bar' && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:5, pointerEvents:'none',
          borderRadius:'0 0 9px 9px', background:'rgba(255,255,255,0.55)',
          boxShadow:'0 -2px 8px rgba(255,255,255,0.20)',
        }} />
      )}
    </div>
  );
}

export default function GrupoWidget({ config, onConfigChange, accentColor }) {
  const { name = 'Grupo', icon = 'home', children = [] } = config;
  const [modal, setModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const longPressTimer = useRef(null);
  const nameInputRef = useRef(null);

  const { width, height } = computeGroupSize(children);
  const showToggle = hasControllable(children);
  const allOn  = showToggle && getMasterState(children);
  const allOff = showToggle && children
    .filter(c => 'on' in c.config || 'armed' in c.config || 'recording' in c.config)
    .every(c => !c.config.on && !c.config.armed && !c.config.recording);

  const patch = (p) => onConfigChange({ ...config, ...p });
  const patchChildren = (newChildren) => patch({ children: newChildren });

  const startEditName = (e) => {
    e.stopPropagation();
    setDraftName(name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed) patch({ name: trimmed });
    setEditingName(false);
  };

  // Long-press para el HEADER — NO para propagación (el drag del grupo lo maneja CanvasWidget)
  // Cancela el timer si el mouse se mueve (= es un drag, no un press)
  const startHeaderLongPress = () => {
    longPressTimer.current = setTimeout(() => setModal(true), 500);
    const cancel = () => clearTimeout(longPressTimer.current);
    document.addEventListener('mousemove', cancel, { once: true });
    document.addEventListener('mouseup',   cancel, { once: true });
  };

  // Long-press para el FONDO del canvas interno — sí para propagación (no queremos drag desde ahí)
  const startBgLongPress = (e) => {
    if (e.target !== e.currentTarget) return;
    e.stopPropagation();
    longPressTimer.current = setTimeout(() => setModal(true), 500);
  };
  const clearLongPress = () => clearTimeout(longPressTimer.current);

  const updateChild = (childId, newCfg) =>
    patchChildren(children.map(c => c.id === childId ? { ...c, config: newCfg } : c));

  const moveChild = (childId, x, y) =>
    patchChildren(children.map(c => c.id === childId ? { ...c, x, y } : c));

  return (
    <div style={{ width, display: 'inline-flex', flexDirection: 'column' }}>
      {/* ── Header ── long-press abre modal, clic en icono abre picker inline en modal */}
      <div
        style={{
          height: HEADER_HEIGHT,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 10px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
        onMouseDown={startHeaderLongPress}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
          {/* Icono — muestra el icono SVG, clic abre modal */}
          <div
            style={{
              width: 22, height: 22, borderRadius: 5, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.12)',
              cursor: 'pointer',
            }}
            onMouseDown={e => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setModal(true); }}
            title="Abrir configuración del grupo"
          >
            <SvgIcon id={icon} size={14} color="white" />
          </div>

          {/* Nombre — doble clic para editar inline */}
          {editingName ? (
            <input
              ref={nameInputRef}
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
              onClick={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              style={{
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 4, color: 'white', fontSize: 12, fontWeight: 700,
                padding: '1px 5px', outline: 'none', width: 90, flexShrink: 0,
              }}
            />
          ) : (
            <span
              style={{ color: 'white', fontSize: 13, fontWeight: 700, cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              onMouseDown={e => e.stopPropagation()}
              onDoubleClick={startEditName}
              title="Doble clic para editar nombre"
            >{name}</span>
          )}

          <span style={{
            fontSize: 8, color: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4,
            padding: '1px 5px', letterSpacing: 0.5, flexShrink: 0,
          }}>GRUPO</span>
        </div>

        {showToggle && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
            onMouseDown={e => e.stopPropagation()}
          >
            <button
              onClick={() => patchChildren(applyMasterToggle(children, false))}
              title="Apagar todo"
              style={{
                background: allOff ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.05)',
                border: allOff ? '1px solid rgba(255,255,255,0.60)' : '1px solid rgba(255,255,255,0.18)',
                color: allOff ? 'white' : 'rgba(255,255,255,0.42)',
                borderRadius: 5, fontSize: 9, padding: '3px 7px',
                cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              }}
            >OFF</button>
            <button
              onClick={() => patchChildren(applyMasterToggle(children, true))}
              title="Encender todo"
              style={{
                background: allOn ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.05)',
                border: allOn ? '1px solid rgba(255,255,255,0.60)' : '1px solid rgba(255,255,255,0.18)',
                color: allOn ? 'white' : 'rgba(255,255,255,0.42)',
                borderRadius: 5, fontSize: 9, padding: '3px 7px',
                cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              }}
            >ON</button>
          </div>
        )}
      </div>

      {/* ── Canvas interno ── */}
      <div
        data-grupo-content="true"
        style={{ position: 'relative', width, height, flexShrink: 0 }}
        onMouseDown={startBgLongPress}
        onMouseUp={clearLongPress}
        onMouseLeave={clearLongPress}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      >
        {children.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.25)', fontSize: 11, gap: 5,
            pointerEvents: 'none',
          }}>
            <span>⊕</span><span>Arrastra widgets aquí</span>
          </div>
        )}
        {children.map(child => (
          <ChildWrapper
            key={child.id}
            child={child}
            accentColor={accentColor}
            onConfigChange={(cfg) => updateChild(child.id, cfg)}
            onMove={(x, y) => moveChild(child.id, x, y)}
          />
        ))}
      </div>

      {modal && (
        <GrupoModal
          config={config}
          onConfigChange={onConfigChange}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}

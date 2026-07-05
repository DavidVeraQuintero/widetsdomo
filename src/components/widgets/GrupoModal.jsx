import { useState } from 'react';
import ColorWheel from './ColorWheel';
import Slider from './Slider';
import Toggle from './Toggle';
import SvgIcon from './SvgIcon';
import { ModalBase } from './widgetUtils';
import { ICONS, ICON_CATEGORIES } from './iconLibrary';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import { WIDGET_SIZES } from '../../catalog/widgetSizes';
import {
  hasRGB, hasDimmer, hasCurtains, hasControllable, getMasterState,
  applyMasterToggle, applyRGBColor, applyBrightness, applyCurtainPosition,
  CHILD_PADDING,
} from './grupoUtils';

const RGB_PRESETS = ['#ef4444','#f97316','#fbbf24','#22c55e','#3b82f6','#7c3aed','#ec4899','#ffffff'];

const LABEL = {
  fontSize: 11, color: 'rgba(255,255,255,0.45)',
  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 600,
};

function autoPlace(currentChildren) {
  if (currentChildren.length === 0) return { x: CHILD_PADDING, y: CHILD_PADDING };
  let maxBottom = 0;
  for (const c of currentChildren) {
    const s = WIDGET_SIZES[c.size] || WIDGET_SIZES['2x2'];
    maxBottom = Math.max(maxBottom, c.y + s.height);
  }
  return { x: CHILD_PADDING, y: maxBottom + CHILD_PADDING };
}

function InlineIconGrid({ currentId, onSelect }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState(Object.keys(ICON_CATEGORIES)[0]);
  const icons = search.trim()
    ? Object.keys(ICONS).filter(id => id.includes(search.toLowerCase()))
    : ICON_CATEGORIES[cat] || [];

  return (
    <div
      style={{ marginTop: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 10 }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar icono..."
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
          color: 'white', fontSize: 12, padding: '4px 8px',
          outline: 'none', marginBottom: 8, boxSizing: 'border-box',
        }}
      />
      {!search.trim() && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.keys(ICON_CATEGORIES).map(c => (
            <button key={c}
              style={{
                fontSize: 11, padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
                background: cat === c ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${cat === c ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.12)'}`,
                color: 'white',
              }}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => setCat(c)}
            >{c}</button>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
        {icons.map(id => (
          <div key={id} title={id}
            style={{
              width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
              background: id === currentId ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${id === currentId ? 'rgba(59,130,246,0.6)' : 'transparent'}`,
            }}
            onMouseDown={e => e.stopPropagation()}
            onClick={() => onSelect(id)}
          >
            <SvgIcon id={id} size={14} color={id === currentId ? '#93c5fd' : 'white'} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WidgetRow({ icon, name, category, actionLabel, onAction, actionStyle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 8, padding: '7px 10px',
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'white' }}>{name}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{category}</div>
      </div>
      <button
        style={{
          fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', flexShrink: 0,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
          color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap',
          ...actionStyle,
        }}
        onClick={onAction}
        onMouseDown={e => e.stopPropagation()}
      >{actionLabel}</button>
    </div>
  );
}

export default function GrupoModal({ config, onConfigChange, onClose, groupId }) {
  const { name = 'Grupo', icon = 'home', children = [] } = config;
  const { state, dispatch } = useDashboard();

  const [draftName,  setDraftName]  = useState(name);
  const [showIcons,  setShowIcons]  = useState(false);
  const [rgbColor,   setRgbColor]   = useState('#3b82f6');
  const [brightness, setBrightness] = useState(75);
  const [position,   setPosition]   = useState(50);

  const alreadyInGroup   = new Set(children.map(c => c.id));
  const availableWidgets = state.widgets.filter(w => w.type !== 'grupo' && !alreadyInGroup.has(w.id));

  const masterOn     = getMasterState(children);
  const showToggle   = hasControllable(children);
  const showRGB      = hasRGB(children);
  const showDimmer   = hasDimmer(children);
  const showCurtains = hasCurtains(children);
  const hasControls  = showRGB || showDimmer || showCurtains;

  const patchConfig   = (p)           => onConfigChange({ ...config, ...p });
  const patchChildren = (newChildren) => patchConfig({ children: newChildren });

  const commitName = () => {
    const t = draftName.trim();
    if (t && t !== name) patchConfig({ name: t });
  };

  return (
    <ModalBase
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SvgIcon id={icon} size={16} color="white" />
          <span>{name}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            · {children.length} dispositivo{children.length !== 1 ? 's' : ''}
          </span>
        </div>
      }
      headerRight={showToggle
        ? <Toggle on={masterOn} onToggle={() => patchChildren(applyMasterToggle(children, !masterOn))} />
        : null
      }
      onClose={onClose}
      borderColor="rgba(255,255,255,0.22)"
      containerStyle={{ width: 'min(92vw, 860px)', maxHeight: '92vh' }}
    >
      {/* ── Nombre e icono ── */}
      <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={LABEL}>Nombre e icono</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="w-btn"
            style={{ width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onClick={() => setShowIcons(v => !v)}
            onMouseDown={e => e.stopPropagation()}
            title="Cambiar icono"
          >
            <SvgIcon id={icon} size={20} color="white" />
          </button>
          <input
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); }}
            onMouseDown={e => e.stopPropagation()}
            placeholder="Nombre del grupo"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8,
              color: 'white', fontSize: 14, fontWeight: 600,
              padding: '8px 12px', outline: 'none',
            }}
          />
        </div>
        {showIcons && (
          <InlineIconGrid
            currentId={icon}
            onSelect={(id) => { patchConfig({ icon: id }); setShowIcons(false); }}
          />
        )}
      </div>

      {/* ── Cuerpo en 2 columnas ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: hasControls ? '1fr 1fr' : '1fr',
        gap: 24,
        alignItems: 'start',
      }}>

        {/* ── Columna izquierda: controles ── */}
        {hasControls && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {showRGB && (
              <div>
                <div style={LABEL}>🎨 Color RGB</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <ColorWheel color={rgbColor} onChange={setRgbColor} size={160} />
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                  {RGB_PRESETS.map(c => (
                    <button key={c}
                      style={{
                        width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: rgbColor === c ? '2.5px solid white' : '1px solid rgba(255,255,255,0.15)',
                        flexShrink: 0,
                      }}
                      onClick={() => setRgbColor(c)}
                      onMouseDown={e => e.stopPropagation()}
                    />
                  ))}
                </div>
                <button className="w-btn"
                  style={{ width: '100%', padding: '8px 0', background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.5)', color: '#c4b5fd' }}
                  onClick={() => patchChildren(applyRGBColor(children, rgbColor))}
                  onMouseDown={e => e.stopPropagation()}
                >
                  Aplicar color a todos
                </button>
              </div>
            )}

            {showDimmer && (
              <div>
                <div style={LABEL}>🔆 Brillo · {brightness}%</div>
                <Slider value={brightness} onChange={setBrightness} showVal={false} />
                <button className="w-btn"
                  style={{ width: '100%', padding: '8px 0', marginTop: 10 }}
                  onClick={() => patchChildren(applyBrightness(children, brightness))}
                  onMouseDown={e => e.stopPropagation()}
                >
                  Aplicar brillo a todos
                </button>
              </div>
            )}

            {showCurtains && (
              <div>
                <div style={LABEL}>📋 Persianas · {position}%</div>
                <Slider value={position} onChange={setPosition} showVal={false} />
                <button className="w-btn"
                  style={{ width: '100%', padding: '8px 0', marginTop: 10 }}
                  onClick={() => patchChildren(applyCurtainPosition(children, position))}
                  onMouseDown={e => e.stopPropagation()}
                >
                  Aplicar posición a todas
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Columna derecha: gestión de widgets ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* En el grupo */}
          <div>
            <div style={LABEL}>
              En el grupo
              <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>
                {children.length}
              </span>
            </div>
            {children.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '12px 0', textAlign: 'center' }}>
                Sin widgets — agrega desde el dashboard
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
                {children.map(child => {
                  const def = getCatalogEntry(child.type);
                  return (
                    <WidgetRow
                      key={child.id}
                      icon={def?.icon || '📦'}
                      name={child.config?.name || def?.name || child.type}
                      category={def?.category || ''}
                      actionLabel="← Sacar"
                      actionStyle={{ color: 'rgba(255,180,180,0.9)', borderColor: 'rgba(255,100,100,0.25)', background: 'rgba(255,80,80,0.1)' }}
                      onAction={() => dispatch({ type: 'EJECT_FROM_GROUP', groupId, childId: child.id })}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Agregar del dashboard */}
          {groupId && (
            <div>
              <div style={LABEL}>
                Agregar del dashboard
                <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>
                  {availableWidgets.length}
                </span>
              </div>
              {availableWidgets.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: '12px 0', textAlign: 'center' }}>
                  No hay widgets disponibles en el dashboard
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
                  {availableWidgets.map(w => {
                    const def = getCatalogEntry(w.type);
                    return (
                      <WidgetRow
                        key={w.id}
                        icon={def?.icon || '📦'}
                        name={w.config?.name || def?.name || w.type}
                        category={def?.category || ''}
                        actionLabel="→ Meter"
                        onAction={() => {
                          const pos = autoPlace(children);
                          dispatch({ type: 'MOVE_TO_GROUP', widgetId: w.id, groupId, x: pos.x, y: pos.y });
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  );
}

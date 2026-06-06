import { useState } from 'react';
import ColorWheel from './ColorWheel';
import Slider from './Slider';
import Toggle from './Toggle';
import SvgIcon from './SvgIcon';
import { ModalBase } from './widgetUtils';
import { ICONS, ICON_CATEGORIES } from './iconLibrary';
import {
  hasRGB, hasDimmer, hasCurtains, hasControllable, getMasterState,
  applyMasterToggle, applyRGBColor, applyBrightness, applyCurtainPosition,
} from './grupoUtils';

const RGB_PRESETS = ['#ef4444','#f97316','#fbbf24','#22c55e','#3b82f6','#7c3aed','#ec4899','#ffffff'];

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
          color: 'white', fontSize: 11, padding: '4px 8px',
          outline: 'none', marginBottom: 8, boxSizing: 'border-box',
        }}
      />
      {!search.trim() && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
          {Object.keys(ICON_CATEGORIES).map(c => (
            <button key={c}
              style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
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

export default function GrupoModal({ config, onConfigChange, onClose }) {
  const { name = 'Grupo', icon = 'home', children = [] } = config;

  const [draftName,   setDraftName]   = useState(name);
  const [showIcons,   setShowIcons]   = useState(false);
  const [rgbColor,    setRgbColor]    = useState('#3b82f6');
  const [brightness,  setBrightness]  = useState(75);
  const [position,    setPosition]    = useState(50);

  const masterOn     = getMasterState(children);
  const showToggle   = hasControllable(children);
  const showRGB      = hasRGB(children);
  const showDimmer   = hasDimmer(children);
  const showCurtains = hasCurtains(children);
  const showMessage  = !showRGB && !showDimmer && !showCurtains;

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
          <span>{name} — Control</span>
        </div>
      }
      headerRight={showToggle
        ? <Toggle on={masterOn} onToggle={() => patchChildren(applyMasterToggle(children, !masterOn))} />
        : null
      }
      onClose={onClose}
      borderColor="rgba(255,255,255,0.25)"
    >
      {/* ── Nombre e Icono ── */}
      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Nombre e icono
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="w-btn"
            style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onClick={() => setShowIcons(v => !v)}
            onMouseDown={e => e.stopPropagation()}
            title="Cambiar icono"
          >
            <SvgIcon id={icon} size={18} color="white" />
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
              border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6,
              color: 'white', fontSize: 13, fontWeight: 600,
              padding: '6px 10px', outline: 'none',
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

      {/* ── Dispositivos ── */}
      {showRGB && (
        <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            🎨 Color RGB
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <ColorWheel color={rgbColor} onChange={setRgbColor} size={130} />
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
            {RGB_PRESETS.map(c => (
              <button key={c}
                style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: rgbColor === c ? '2px solid white' : '1px solid rgba(255,255,255,0.15)' }}
                onClick={() => setRgbColor(c)}
                onMouseDown={e => e.stopPropagation()}
              />
            ))}
          </div>
          <button className="w-btn"
            style={{ width: '100%', padding: '6px 0', background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.5)', color: '#c4b5fd' }}
            onClick={() => patchChildren(applyRGBColor(children, rgbColor))}
            onMouseDown={e => e.stopPropagation()}
          >
            Aplicar color a todos
          </button>
        </div>
      )}

      {showDimmer && (
        <div style={{ marginBottom: showCurtains ? 16 : 0, paddingBottom: showCurtains ? 16 : 0, borderBottom: showCurtains ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            🔆 Brillo · {brightness}%
          </div>
          <Slider value={brightness} onChange={setBrightness} showVal={false} />
          <button className="w-btn"
            style={{ width: '100%', padding: '6px 0', marginTop: 8 }}
            onClick={() => patchChildren(applyBrightness(children, brightness))}
            onMouseDown={e => e.stopPropagation()}
          >
            Aplicar brillo a todos
          </button>
        </div>
      )}

      {showCurtains && (
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            📋 Persianas · {position}%
          </div>
          <Slider value={position} onChange={setPosition} showVal={false} />
          <button className="w-btn"
            style={{ width: '100%', padding: '6px 0', marginTop: 8 }}
            onClick={() => patchChildren(applyCurtainPosition(children, position))}
            onMouseDown={e => e.stopPropagation()}
          >
            Aplicar posición a todas
          </button>
        </div>
      )}

      {showMessage && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-secondary)', fontSize: 12 }}>
          <div style={{ marginBottom: 6 }}>
            {children.length} dispositivo{children.length !== 1 ? 's' : ''} agrupado{children.length !== 1 ? 's' : ''}
          </div>
          {children.length > 0 && (
            <div style={{ fontSize: 10 }}>
              Sin dimmers, RGB ni persianas —<br />usa el toggle del header para controlarlos todos
            </div>
          )}
        </div>
      )}
    </ModalBase>
  );
}

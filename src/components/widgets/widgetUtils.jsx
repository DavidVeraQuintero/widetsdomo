import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SvgIcon from './SvgIcon';
import IconPicker from './IconPicker';
import { WIDGET_ICON_META } from './widgetIconMeta';

export function useLongPress(onLongPress, delay = 500) {
  const timer = useRef(null);
  return {
    onMouseDown: (e) => { e.stopPropagation(); timer.current = setTimeout(onLongPress, delay); },
    onMouseUp:    () => clearTimeout(timer.current),
    onMouseLeave: () => clearTimeout(timer.current),
  };
}

// Reusable icons section for widget modals
export function IconSection({ typeId, config, onConfigChange, resolvedIcons }) {
  const [openPicker, setOpenPicker] = useState(null); // stateKey
  const meta = WIDGET_ICON_META[typeId];
  if (!meta) return null;
  const setIcon = (stateKey, iconId) => {
    onConfigChange({ ...config, icons: { ...(config.icons || {}), [stateKey]: iconId } });
  };
  const resetIcons = () => {
    const { icons: _, ...rest } = config;
    onConfigChange(rest);
  };
  const hasOverride = !!(config.icons && Object.keys(config.icons).length > 0);
  return (
    <div style={{ marginTop:16, borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:.8 }}>Iconos</span>
        {hasOverride && (
          <button className="w-btn" style={{ fontSize:9, padding:'1px 6px', borderColor:'#f59e0b', color:'var(--text-secondary)' }}
            onMouseDown={e=>e.stopPropagation()} onClick={resetIcons}>Restablecer</button>
        )}
      </div>
      {meta.states.map(stateKey => (
        <div key={stateKey} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          {meta.states.length > 1 && (
            <span style={{ fontSize:11, color:'#64748b', flex:1 }}>{meta.labels[stateKey]}</span>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:6, marginLeft: meta.states.length > 1 ? 0 : 'auto' }}>
            <div style={{ width:26, height:26, borderRadius:6, background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <SvgIcon id={resolvedIcons[stateKey]} size={14} color="var(--text-secondary)" />
            </div>
            <button className="w-btn" style={{ fontSize:10, padding:'2px 8px' }}
              onMouseDown={e=>e.stopPropagation()} onClick={() => setOpenPicker(stateKey)}>
              Cambiar
            </button>
          </div>
          {openPicker === stateKey && (
            <IconPicker
              currentId={resolvedIcons[stateKey]}
              onChange={id => { setIcon(stateKey, id); setOpenPicker(null); }}
              onClose={() => setOpenPicker(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function ModalBase({ title, headerRight, onClose, borderColor = 'rgba(255,255,255,0.3)', children }) {
  return createPortal(
    <div
      style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.65)' }}
      onMouseDown={e => { e.stopPropagation(); onClose(); }}
    >
      <div
        style={{ background:'linear-gradient(135deg,#0f172a,#0a1f3d)', border:`1px solid ${borderColor}`, borderRadius:16, padding:22, width:280, boxShadow:`0 0 40px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.6)`, maxHeight:'85vh', overflowY:'auto' }}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ color:'#e2e8f0', fontWeight:700, fontSize:14 }}>{title}</div>
          {headerRight}
        </div>
        {children}
        <div style={{ textAlign:'center', marginTop:14, fontSize:10, color:'rgba(255,255,255,0.25)' }}>Clic fuera para cerrar</div>
      </div>
    </div>,
    document.body
  );
}

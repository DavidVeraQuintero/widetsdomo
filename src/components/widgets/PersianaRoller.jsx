import { useState } from 'react';
import Slider from './Slider';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

// Roller blind descending from the top inside a window frame
const RollerVisual = ({ position, color, height = 64 }) => {
  const covered = 100 - position;
  const slatCount = Math.max(1, Math.floor(covered * height / 900));
  return (
    <div style={{
      width: '100%', height, borderRadius: 6, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(180deg, #0d1b2a 0%, #1a2744 100%)',
      border: '2px solid var(--border)',
    }}>
      {/* Blind panel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: `${covered}%`, background: color, opacity: 0.82,
        transition: 'height 0.3s ease',
      }}>
        {Array.from({ length: slatCount }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0, height: 1,
            top: `${((i + 1) / (slatCount + 1)) * 100}%`,
            background: 'rgba(0,0,0,0.18)',
          }} />
        ))}
      </div>
      {/* Roller tube */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 7,
        background: `linear-gradient(180deg, ${color} 0%, color-mix(in srgb,${color} 70%,#000) 100%)`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
      }} />
    </div>
  );
};

function PersianaModal({ position, name, config, onConfigChange, onClose, accentColor }) {
  const icons = useWidgetIcons('persiana-roller', config.icons);
  const setPos = (v) => onConfigChange({ position: v });
  return (
    <ModalBase title="Persiana Roller" onClose={onClose} borderColor={accentColor}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{name}</div>
      <RollerVisual position={position} color={accentColor} height={90} />
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Posición · {position}%</div>
        <Slider value={position} onChange={setPos} unit="%" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={() => setPos(100)} onMouseDown={e => e.stopPropagation()}>▲ Abrir</button>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={() => setPos(50)} onMouseDown={e => e.stopPropagation()}>■ 50%</button>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={() => setPos(0)} onMouseDown={e => e.stopPropagation()}>▼ Cerrar</button>
      </div>
      <IconSection typeId="persiana-roller" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function PersianaRoller({ size, config, onConfigChange, accentColor }) {
  const { position = 60, name = 'Persiana' } = config;
  const [modal, setModal] = useState(false);
  const setPos = (v) => onConfigChange({ ...config, position: v });
  const adj = (d) => setPos(Math.max(0, Math.min(100, position + d)));
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('persiana-roller', config.icons);

  const Modal = modal && (
    <PersianaModal position={position} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x2') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 10px 10px', gap: 5, overflow: 'hidden' }}>
      <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}>{name}</div>
      <div style={{ flex: 1, cursor: 'pointer', minHeight: 0 }} {...longPress}>
        <RollerVisual position={position} color={accentColor} height="100%" />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center', flexShrink:0 }}>{position}%</div>
      <div style={{ display: 'flex', gap: 5, flexShrink:0 }}>
        <button className="w-btn-icon" style={{ flex:1, height: 26, fontSize: 12 }} onClick={e => { e.stopPropagation(); adj(25); }} onMouseDown={e => e.stopPropagation()}>▲</button>
        <button className="w-btn-icon" style={{ flex:1, height: 26, fontSize: 12 }} onClick={e => { e.stopPropagation(); setPos(50); }} onMouseDown={e => e.stopPropagation()}>■</button>
        <button className="w-btn-icon" style={{ flex:1, height: 26, fontSize: 12 }} onClick={e => { e.stopPropagation(); adj(-25); }} onMouseDown={e => e.stopPropagation()}>▼</button>
      </div>
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '8px 12px', gap: 10, overflow: 'hidden' }}>
      <div style={{ width: 48, flexShrink: 0, cursor: 'pointer' }} {...longPress}>
        <RollerVisual position={position} color={accentColor} height={48} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="w-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 4px' }}>{position}%</div>
        <Slider value={position} onChange={setPos} showVal={false} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button className="w-btn-icon" style={{ width: 22, height: 22, fontSize: 12 }} onClick={e => { e.stopPropagation(); adj(25); }} onMouseDown={e => e.stopPropagation()}>▲</button>
        <button className="w-btn-icon" style={{ width: 22, height: 22, fontSize: 12 }} onClick={e => { e.stopPropagation(); adj(-25); }} onMouseDown={e => e.stopPropagation()}>▼</button>
      </div>
      {Modal}
    </div>
  );

  // 2x2
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px', gap: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0, marginRight:6 }}>{name}</div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, flexShrink:0 }}>{position}%</span>
      </div>
      <div style={{ flex: 1, cursor: 'pointer', minHeight: 0 }} {...longPress}>
        <RollerVisual position={position} color={accentColor} height="100%" />
      </div>
      <Slider value={position} onChange={setPos} showVal={false} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setPos(100); }} onMouseDown={e => e.stopPropagation()}>▲ Abrir</button>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setPos(50); }} onMouseDown={e => e.stopPropagation()}>■</button>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setPos(0); }} onMouseDown={e => e.stopPropagation()}>▼ Cerrar</button>
      </div>
      {Modal}
    </div>
  );
}

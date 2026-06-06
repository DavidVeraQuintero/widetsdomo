import { useState } from 'react';
import Slider from './Slider';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

// Horizontal awning extending from a wall
const ToldoVisual = ({ position, color, height = 60 }) => {
  const extPct = position * 0.78; // max ~78% of container to leave room for wall
  return (
    <div style={{
      width: '100%', height, borderRadius: 6, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(180deg, #0d1b2a 0%, #1a2744 100%)',
      border: '2px solid var(--border)',
      display: 'flex', alignItems: 'center',
    }}>
      {/* Wall */}
      <div style={{
        width: 14, height: '100%', flexShrink: 0,
        background: 'linear-gradient(90deg, #3a3a3a, #4a4a4a)',
        borderRight: '1px solid #555',
      }} />
      {/* Awning container */}
      <div style={{ flex: 1, position: 'relative', height: '100%' }}>
        {/* Fabric */}
        <div style={{
          position: 'absolute',
          top: '15%', left: 0,
          width: `${extPct}%`, height: '55%',
          background: `repeating-linear-gradient(90deg, ${color}bb 0px, ${color}dd 12px, ${color}77 12px, ${color}99 24px)`,
          borderRadius: '0 4px 6px 0',
          transition: 'width 0.3s ease',
          boxShadow: '2px 4px 8px rgba(0,0,0,0.35)',
          minWidth: position > 0 ? 4 : 0,
        }}>
          {/* Valance */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 7,
            background: `repeating-linear-gradient(90deg, ${color}ee 0, ${color}ee 10px, ${color}99 10px, ${color}99 14px)`,
            borderRadius: '0 0 4px 4px',
          }} />
        </div>
        {/* Support arm */}
        <div style={{
          position: 'absolute', top: '68%', left: 0,
          width: `${extPct}%`, height: 2,
          background: 'linear-gradient(90deg, #777, #555)',
          transition: 'width 0.3s ease',
          minWidth: position > 0 ? 4 : 0,
        }} />
        {/* % badge */}
        <div style={{
          position: 'absolute', bottom: 4, right: 8,
          fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)',
        }}>{position}%</div>
      </div>
    </div>
  );
};

function ToldoModal({ position, name, config, onConfigChange, onClose, accentColor }) {
  const icons = useWidgetIcons('toldo', config.icons);
  const setPos = (v) => onConfigChange({ position: v });
  return (
    <ModalBase title="Toldo" onClose={onClose} borderColor={accentColor}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{name}</div>
      <ToldoVisual position={position} color={accentColor} height={80} />
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 9, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Extensión · {position}%</div>
        <Slider value={position} onChange={setPos} unit="%" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={() => setPos(100)} onMouseDown={e => e.stopPropagation()}>Extender</button>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={() => setPos(50)} onMouseDown={e => e.stopPropagation()}>50%</button>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={() => setPos(0)} onMouseDown={e => e.stopPropagation()}>Recoger</button>
      </div>
      <IconSection typeId="toldo" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Toldo({ size, config, onConfigChange, accentColor }) {
  const { position = 40, name = 'Toldo' } = config;
  const [modal, setModal] = useState(false);
  const setPos = (v) => onConfigChange({ ...config, position: v });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('toldo', config.icons);

  const Modal = modal && (
    <ToldoModal position={position} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x2') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px', gap: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="w-label">Toldo</div>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>{position}%</span>
      </div>
      <div className="w-name">{name}</div>
      <div style={{ flex: 1, cursor: 'pointer', minHeight: 0 }} {...longPress}>
        <ToldoVisual position={position} color={accentColor} height="100%" />
      </div>
      <Slider value={position} onChange={setPos} showVal={false} />
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '8px 12px', gap: 10, overflow: 'hidden' }}>
      <div style={{ width: 80, flexShrink: 0, cursor: 'pointer' }} {...longPress}>
        <ToldoVisual position={position} color={accentColor} height={48} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="w-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 6 }}>{position}%</span>
        </div>
        <Slider value={position} onChange={setPos} showVal={false} />
      </div>
      {Modal}
    </div>
  );

  // 2x2
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px', gap: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="w-label">Toldo</div>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700 }}>{position}%</span>
      </div>
      <div className="w-name">{name}</div>
      <div style={{ flex: 1, cursor: 'pointer', minHeight: 0 }} {...longPress}>
        <ToldoVisual position={position} color={accentColor} height="100%" />
      </div>
      <Slider value={position} onChange={setPos} showVal={false} />
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setPos(100); }} onMouseDown={e => e.stopPropagation()}>Extender</button>
        <button className="w-btn w-btn-sm" style={{ flex: 1 }} onClick={e => { e.stopPropagation(); setPos(0); }} onMouseDown={e => e.stopPropagation()}>Recoger</button>
      </div>
      {Modal}
    </div>
  );
}

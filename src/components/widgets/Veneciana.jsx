import { useState } from 'react';
import Slider from './Slider';
import SvgIcon from './SvgIcon';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase, IconSection } from './widgetUtils';

// Horizontal venetian slats — angle rotates them, position controls how many are down
const VenetianVisual = ({ position, angle, color, height = 64 }) => {
  const SLATS = 8;
  const raised = position / 100; // 0 = all down, 1 = all up
  // scaleY: angle=0 → slat face on (tall, visible), angle=90 → edge on (thin)
  const slatScaleY = Math.max(0.12, Math.abs(Math.cos((angle * Math.PI) / 180)));
  return (
    <div style={{
      width: '100%', height, borderRadius: 6, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(180deg, #0d1b2a 0%, #1a2744 100%)',
      border: '2px solid var(--border)',
      padding: '5px 5px 14px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      boxSizing: 'border-box',
    }}>
      {Array.from({ length: SLATS }).map((_, i) => {
        const isRaised = i >= SLATS * (1 - raised);
        return (
          <div key={i} style={{
            height: 6,
            background: isRaised ? 'transparent' : color,
            borderRadius: 2,
            opacity: isRaised ? 0 : 0.85,
            transform: `scaleY(${slatScaleY})`,
            transition: 'transform 0.2s ease, opacity 0.2s',
            boxShadow: isRaised ? 'none' : `0 1px 3px rgba(0,0,0,0.4)`,
            transformOrigin: 'center',
          }} />
        );
      })}
      {/* Lift cord */}
      <div style={{ position: 'absolute', top: 5, bottom: 14, left: '75%', width: 1, background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', top: 5, bottom: 14, left: '85%', width: 1, background: 'rgba(255,255,255,0.12)' }} />
    </div>
  );
};

function VenecianaModal({ position, angle, name, config, onConfigChange, onClose, accentColor }) {
  const icons = useWidgetIcons('veneciana', config.icons);
  return (
    <ModalBase title="Veneciana" onClose={onClose} borderColor={accentColor}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{name}</div>
      <VenetianVisual position={position} angle={angle} color={accentColor} height={80} />
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Posición · {position}%</div>
        <Slider value={position} onChange={v => onConfigChange({ position: v })} unit="%" />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Ángulo lamas · {angle}°</div>
        <Slider value={angle} min={0} max={90} onChange={v => onConfigChange({ angle: v })} unit="°" />
      </div>
      <IconSection typeId="veneciana" config={config} onConfigChange={onConfigChange} resolvedIcons={icons} />
    </ModalBase>
  );
}

export default function Veneciana({ size, config, onConfigChange, accentColor }) {
  const { position = 50, angle = 45, name = 'Veneciana' } = config;
  const [modal, setModal] = useState(false);
  const setPos = (v) => onConfigChange({ ...config, position: v });
  const setAngle = (v) => onConfigChange({ ...config, angle: v });
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const longPress = useLongPress(() => setModal(true));
  const icons = useWidgetIcons('veneciana', config.icons);

  const Modal = modal && (
    <VenecianaModal position={position} angle={angle} name={name} config={config} onConfigChange={patchConfig} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x2') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '8px 10px 10px', gap: 5, overflow: 'hidden' }}>
      <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}>{name}</div>
      <div style={{ flex: 1, cursor: 'pointer', minHeight: 0 }} {...longPress}>
        <VenetianVisual position={position} angle={angle} color={accentColor} height="100%" />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'center', flexShrink:0 }}>{position}%</div>
      <Slider value={position} onChange={setPos} showVal={false} />
      {Modal}
    </div>
  );

  if (size === '2x1') return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '8px 12px', gap: 10, overflow: 'hidden' }}>
      <div style={{ width: 52, flexShrink: 0, cursor: 'pointer' }} {...longPress}>
        <VenetianVisual position={position} angle={angle} color={accentColor} height={48} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="w-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 4px' }}>{position}% · {angle}°</div>
        <Slider value={position} onChange={setPos} showVal={false} />
      </div>
      {Modal}
    </div>
  );

  // 2x2
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '10px', gap: 6, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="w-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0, marginRight:6 }}>{name}</div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, flexShrink:0 }}>{position}% · {angle}°</span>
      </div>
      <div style={{ flex: 1, cursor: 'pointer', minHeight: 0 }} {...longPress}>
        <VenetianVisual position={position} angle={angle} color={accentColor} height="100%" />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Posición</div>
      <Slider value={position} onChange={setPos} showVal={false} />
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ángulo lamas</div>
      <Slider value={angle} min={0} max={90} onChange={setAngle} showVal={false} />
      {Modal}
    </div>
  );
}

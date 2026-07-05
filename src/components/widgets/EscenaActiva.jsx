import { useState } from 'react';
import SvgIcon from './SvgIcon';
import { useLongPress, ModalBase } from './widgetUtils';

const SCENE_ICON = {
  'Noche': 'moon', 'noche': 'moon',
  'Película': 'film', 'Pelicula': 'film', 'pelicula': 'film',
  'Lectura': 'book', 'lectura': 'book',
  'Fiesta': 'music', 'fiesta': 'music',
  'Mañana': 'sun', 'Manana': 'sun', 'manana': 'sun',
  'Relax': 'heart', 'relax': 'heart',
};

function getIcon(name) {
  return SCENE_ICON[name] || 'star';
}

function EscenaActivaModal({ config, onConfigChange, onClose, accentColor }) {
  const { activeScene = 'Película' } = config;
  const icon = getIcon(activeScene);
  const deactivate = () => { onConfigChange({ ...config, activeScene: null }); onClose(); };
  return (
    <ModalBase title={activeScene} onClose={onClose} borderColor={accentColor}>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
        <SvgIcon id={icon} size={72} color="var(--icon-on)" className="icon-glow" />
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>● Activa ahora</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={e => { e.stopPropagation(); deactivate(); }} onMouseDown={e => e.stopPropagation()} className="w-btn">
          ⏹ Desactivar
        </button>
      </div>
    </ModalBase>
  );
}

export default function EscenaActiva({ size, config, onConfigChange, accentColor }) {
  const { activeScene = 'Película' } = config;
  const [modal, setModal] = useState(false);
  const icon = getIcon(activeScene);
  const deactivate = () => onConfigChange({ ...config, activeScene: null });
  const longPress = useLongPress(() => setModal(true));

  const Modal = modal && (
    <EscenaActivaModal config={config} onConfigChange={onConfigChange} onClose={() => setModal(false)} accentColor={accentColor} />
  );

  if (size === '1x2') return (
    <div className="w-body w-center" {...longPress}>
      <SvgIcon id={icon} size={44} color="var(--icon-on)" className="icon-glow" />
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{activeScene}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>● Activa ahora</div>
      <button onClick={e => { e.stopPropagation(); deactivate(); }} onMouseDown={e => e.stopPropagation()} className="w-btn w-btn-sm">⏹ Parar</button>
      {Modal}
    </div>
  );

  // 2x2
  return (
    <div className="w-body w-center" {...longPress}>
      <SvgIcon id={icon} size={52} color="var(--icon-on)" className="icon-glow" />
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{activeScene}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>● Activa</div>
      <button onClick={e => { e.stopPropagation(); deactivate(); }} onMouseDown={e => e.stopPropagation()} className="w-btn w-btn-sm" style={{ marginTop: 4 }}>⏹ Desactivar</button>
      {Modal}
    </div>
  );
}

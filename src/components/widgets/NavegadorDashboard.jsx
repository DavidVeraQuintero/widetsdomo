import { useState, useRef } from 'react';
import { useMeta } from '../../store/metaStore.jsx';
import SvgIcon from './SvgIcon';
import IconPicker from './IconPicker';

function ConfigModal({ config, onSave, onClose }) {
  const { state: metaState } = useMeta();
  const { dashboards } = metaState;
  const [localTargetId, setLocalTargetId] = useState(config.targetId ?? '');
  const [localIconId, setLocalIconId] = useState(config.iconId ?? 'home');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const stop = e => e.stopPropagation();

  function handleSave() {
    const db = dashboards.find(d => d.id === localTargetId);
    onSave({ ...config, targetId: localTargetId, targetName: db?.name ?? '', iconId: localIconId });
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) { stop(e); onClose(); } }}
    >
      <div
        style={{ background: 'linear-gradient(135deg,#0f172a,#0a1f3d)', border: '2px solid #1e3a5f', borderRadius: 16, padding: 20, width: 280, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 0 40px rgba(0,0,0,0.7)' }}
        onMouseDown={stop}
        onClick={stop}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>⚙ Configurar navegador</span>
          <button className="w-btn" style={{ padding: '2px 8px', fontSize: 11 }} onMouseDown={stop} onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Dashboard destino</label>
          <select
            value={localTargetId}
            onChange={e => setLocalTargetId(e.target.value)}
            onMouseDown={stop}
            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', padding: '6px 10px', fontSize: 12, outline: 'none', width: '100%' }}
          >
            <option value="">— elegir —</option>
            {dashboards.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Ícono</label>
          <button
            className="w-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 12 }}
            onMouseDown={stop}
            onClick={() => setShowIconPicker(true)}
          >
            <SvgIcon id={localIconId} size={18} color="rgba(255,255,255,0.85)" />
            <span>Cambiar ícono</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="w-btn w-btn-sm" onMouseDown={stop} onClick={onClose}>Cancelar</button>
          <button
            className="w-btn w-btn-sm"
            disabled={!localTargetId}
            onMouseDown={stop}
            onClick={handleSave}
            style={localTargetId
              ? { background: '#1d4ed8', borderColor: '#3b82f6', color: '#93c5fd', cursor: 'pointer' }
              : { cursor: 'not-allowed' }
            }
          >Guardar</button>
        </div>
      </div>

      {showIconPicker && (
        <IconPicker
          currentId={localIconId}
          onChange={id => { setLocalIconId(id); setShowIconPicker(false); }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  );
}

export default function NavegadorDashboard({ size, config, onConfigChange }) {
  const { state: metaState, dispatch: metaDispatch } = useMeta();
  const { dashboards } = metaState;
  const { targetId = '', targetName = '', iconId = 'home' } = config;

  const [showModal, setShowModal] = useState(false);
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef(null);

  const targetExists = !!targetId && dashboards.some(d => d.id === targetId);
  const isConfigured = !!targetId;

  function startPress(e) {
    if (e.button !== 0) return;
    setPressing(true);
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      setPressing(false);
      setShowModal(true);
    }, 500);
  }

  function endPress() {
    const timerPending = pressTimer.current !== null;
    clearTimeout(pressTimer.current);
    pressTimer.current = null;
    setPressing(false);
    if (timerPending && targetExists) {
      metaDispatch({ type: 'SET_ACTIVE', id: targetId });
    }
  }

  function cancelPress() {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
      setPressing(false);
    }
  }

  const pressHandlers = {
    onMouseDown: startPress,
    onMouseUp: endPress,
    onMouseLeave: cancelPress,
    onMouseMove: cancelPress,
  };

  const iconColor = isConfigured && targetExists ? 'rgba(255,255,255,0.85)' : 'var(--text-dim)';
  const nameText = isConfigured ? targetName : 'Sin configurar';
  const nameOpacity = isConfigured && targetExists ? 1 : 0.45;
  const iconSize = size === '2x2' ? 48 : size === '1x2' ? 40 : 28;
  const icon = <SvgIcon id={iconId} size={iconSize} color={iconColor} />;
  const containerStyle = { cursor: 'pointer', opacity: pressing ? 0.6 : 1, transition: 'opacity 0.1s', userSelect: 'none' };

  const modal = showModal && (
    <ConfigModal
      config={config}
      onSave={c => { onConfigChange(c); setShowModal(false); }}
      onClose={() => setShowModal(false)}
    />
  );

  function subLine() {
    if (!isConfigured) return 'Long press para configurar';
    if (!targetExists) return 'Destino eliminado';
    return 'Toca para ir →';
  }

  if (size === '1x1') return (
    <>
      <div className="w-body w-center" style={containerStyle} {...pressHandlers}>
        {icon}
        <div style={{ fontSize: 9, color: 'var(--text-primary)', opacity: nameOpacity, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {nameText}
        </div>
      </div>
      {modal}
    </>
  );

  if (size === '1x2') return (
    <>
      <div className="w-body w-center" style={containerStyle} {...pressHandlers}>
        <div className="w-label" style={{ color: 'var(--accent)' }}>🧭 Navegar</div>
        {icon}
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', opacity: nameOpacity }}>{nameText}</div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{subLine()}</div>
      </div>
      {modal}
    </>
  );

  if (size === '2x1') return (
    <>
      <div className="w-row-body" style={containerStyle} {...pressHandlers}>
        {icon}
        <div className="w-info">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', opacity: nameOpacity }}>{nameText}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
            {isConfigured && targetExists ? '🧭 Navegar' : isConfigured ? 'Destino eliminado' : 'Sin configurar'}
          </div>
        </div>
        <span style={{ fontSize: 18, color: 'var(--text-dim)', opacity: isConfigured && targetExists ? 1 : 0.3 }}>→</span>
      </div>
      {modal}
    </>
  );

  // 2x2
  return (
    <>
      <div className="w-body w-center" style={containerStyle} {...pressHandlers}>
        <div className="w-label" style={{ color: 'var(--accent)' }}>🧭 Navegar</div>
        {icon}
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', opacity: nameOpacity }}>{nameText}</div>
        {isConfigured && targetExists ? (
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); metaDispatch({ type: 'SET_ACTIVE', id: targetId }); }}
            style={{ background: 'var(--accent-dim)', border: 'none', color: 'var(--accent)', borderRadius: 8, padding: '5px 16px', cursor: 'pointer', fontSize: 12, marginTop: 4 }}
          >Ir →</button>
        ) : (
          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{subLine()}</div>
        )}
      </div>
      {modal}
    </>
  );
}

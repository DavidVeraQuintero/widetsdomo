import { useState } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
import { useHub } from '../../store/hubStore.jsx';
import styles from './PropertiesPanel.module.css';

const ALL_SIZES = ['1x1', '1x2', '2x1', '2x2', '2x4', '4x2', '4x4', '2x6', '2x8', '4x6'];

function findWidgetInState(state) {
  if (!state.selectedId) return { widget: null, parentGroupId: null };
  const topLevel = state.widgets.find(w => w.id === state.selectedId);
  if (topLevel) return { widget: topLevel, parentGroupId: null };
  for (const w of state.widgets) {
    if (w.type !== 'grupo') continue;
    const child = (w.config.children || []).find(c => c.id === state.selectedId);
    if (child) return { widget: child, parentGroupId: w.id };
  }
  return { widget: null, parentGroupId: null };
}

export default function PropertiesPanel() {
  const { state, dispatch } = useDashboard();
  const { deleteRule } = useHub();
  const { widget: selected, parentGroupId } = findWidgetInState(state);
  const def = selected ? getCatalogEntry(selected.type) : null;
  const availSizes = def ? ALL_SIZES.filter(s => def.sizes.includes(s)) : ALL_SIZES;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isSyncedRule = selected?.type === 'regla-auto' && selected?.config?.hubitatSynced;

  if (!selected) {
    return (
      <div className={styles.panel}>
        <div className={styles.title}>⚙ Propiedades</div>
        <div className={styles.empty}>
          Arrastra un widget al canvas o selecciona uno existente
        </div>
      </div>
    );
  }

  const handleResize = (s) => dispatch(
    parentGroupId
      ? { type: 'RESIZE_CHILD', groupId: parentGroupId, childId: selected.id, size: s }
      : { type: 'RESIZE_WIDGET', id: selected.id, size: s }
  );

  const handleMoveX = (x) => dispatch(
    parentGroupId
      ? { type: 'MOVE_CHILD', groupId: parentGroupId, childId: selected.id, x, y: selected.y }
      : { type: 'MOVE_WIDGET', id: selected.id, x, y: selected.y }
  );

  const handleMoveY = (y) => dispatch(
    parentGroupId
      ? { type: 'MOVE_CHILD', groupId: parentGroupId, childId: selected.id, x: selected.x, y }
      : { type: 'MOVE_WIDGET', id: selected.id, x: selected.x, y }
  );

  const handleDelete = () => {
    if (isSyncedRule) {
      setConfirmDelete(true);
      return;
    }
    dispatch(
      parentGroupId
        ? { type: 'REMOVE_FROM_GROUP', groupId: parentGroupId, childId: selected.id }
        : { type: 'REMOVE_WIDGET', id: selected.id }
    );
  };

  const handleConfirmDelete = async () => {
    const hubitatRuleId = selected.config.id;
    try {
      if (hubitatRuleId) await deleteRule(hubitatRuleId, selected.config.hubitatHubId);
    } catch (err) {
      console.warn('[PropertiesPanel] delete from Hubitat failed:', err.message);
    }
    dispatch(
      parentGroupId
        ? { type: 'REMOVE_FROM_GROUP', groupId: parentGroupId, childId: selected.id }
        : { type: 'REMOVE_WIDGET', id: selected.id }
    );
    setConfirmDelete(false);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.title}>⚙ Propiedades</div>

      <div className={styles.label}>Tamaño</div>
      <div className={styles.sizeGrid}>
        {availSizes.map(s => (
          <button
            key={s}
            className={`${styles.sizeBtn} ${selected.size === s ? styles.active : ''}`}
            onClick={() => handleResize(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={styles.label}>Posición (px)</div>
      <div className={styles.coordRow}>
        <div>
          <input
            type="number"
            className={styles.coordInput}
            value={Math.round(selected.x)}
            onChange={e => handleMoveX(Number(e.target.value))}
          />
          <div className={styles.coordLabel}>X</div>
        </div>
        <div>
          <input
            type="number"
            className={styles.coordInput}
            value={Math.round(selected.y)}
            onChange={e => handleMoveY(Number(e.target.value))}
          />
          <div className={styles.coordLabel}>Y</div>
        </div>
      </div>

      <div className={styles.widgetInfo}>
        <div className={styles.widgetName}>{def?.icon} {def?.name}</div>
        <div className={styles.widgetMeta}>
          {selected.type} · {selected.size}
          {parentGroupId && <span style={{ marginLeft: 6, opacity: 0.7 }}>· en grupo</span>}
        </div>
        <button
          className={styles.deleteBtn}
          onClick={handleDelete}
        >
          {parentGroupId ? '⊖ Quitar del grupo' : '🗑 Eliminar widget'}
        </button>
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
          <div style={{ background: 'linear-gradient(135deg,#0f172a,#0a1f3d)', border: '2px solid #1e3a5f',
            borderRadius: '1rem', padding: '1.4rem', width: '22rem', display: 'flex',
            flexDirection: 'column', gap: '1rem', boxShadow: '0 0 40px rgba(0,0,0,0.7)' }}>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.92rem' }}>
              Eliminar regla
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Esta regla está activa en Hubitat. ¿Eliminarla también del hub?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="w-btn" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>
                Cancelar
              </button>
              <button className="w-btn" style={{ flex: 1, color: '#fc8181', borderColor: '#fc8181',
                background: 'rgba(252,129,129,0.1)' }} onClick={handleConfirmDelete}>
                Eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

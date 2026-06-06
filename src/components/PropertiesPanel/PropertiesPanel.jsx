import { useDashboard } from '../../store/dashboardStore.jsx';
import { getCatalogEntry } from '../../catalog/widgetCatalog.jsx';
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
  const { widget: selected, parentGroupId } = findWidgetInState(state);
  const def = selected ? getCatalogEntry(selected.type) : null;
  const availSizes = def ? ALL_SIZES.filter(s => def.sizes.includes(s)) : ALL_SIZES;

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

  const handleDelete = () => dispatch(
    parentGroupId
      ? { type: 'REMOVE_FROM_GROUP', groupId: parentGroupId, childId: selected.id }
      : { type: 'REMOVE_WIDGET', id: selected.id }
  );

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
        <div style={{ color: 'var(--text-dim)', fontSize: 10, marginBottom: 8 }}>
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
    </div>
  );
}

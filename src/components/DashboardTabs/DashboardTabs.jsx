import { useState } from 'react';
import { useMeta } from '../../store/metaStore.jsx';
import styles from './DashboardTabs.module.css';

export default function DashboardTabs() {
  const { state, dispatch } = useMeta();
  const { dashboards, activeDashboardId } = state;
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  function startRename(id, name) {
    setEditingId(id);
    setEditName(name);
  }

  function commitRename(id) {
    const trimmed = editName.trim();
    if (trimmed) dispatch({ type: 'RENAME_DASHBOARD', id, name: trimmed });
    setEditingId(null);
  }

  return (
    <div className={styles.bar}>
      {dashboards.map(d => (
        <div
          key={d.id}
          className={`${styles.tab} ${d.id === activeDashboardId ? styles.active : ''}`}
          onClick={() => dispatch({ type: 'SET_ACTIVE', id: d.id })}
        >
          {editingId === d.id ? (
            <input
              className={styles.renameInput}
              value={editName}
              autoFocus
              onChange={e => setEditName(e.target.value)}
              onBlur={() => commitRename(d.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename(d.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className={styles.tabName}
              onDoubleClick={e => { e.stopPropagation(); startRename(d.id, d.name); }}
            >
              {d.name}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

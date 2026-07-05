import { useState, useRef, useEffect, useCallback } from 'react';
import { useMeta } from '../../store/metaStore.jsx';
import styles from './DashboardTabs.module.css';

export default function DashboardTabs() {
  const { state, dispatch } = useMeta();
  const { dashboards, activeDashboardId } = state;
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [dashboards, checkScroll]);

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 120, behavior: 'smooth' });
  }

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
      {canScrollLeft && (
        <button className={styles.arrow} onClick={() => scroll(-1)} title="Anterior">‹</button>
      )}

      <div className={styles.tabsWrapper} ref={scrollRef}>
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

      {canScrollRight && (
        <button className={styles.arrow} onClick={() => scroll(1)} title="Siguiente">›</button>
      )}
    </div>
  );
}

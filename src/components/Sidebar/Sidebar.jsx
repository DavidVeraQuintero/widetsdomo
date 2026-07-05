import { useState } from 'react';
import { WIDGET_CATALOG } from '../../catalog/widgetCatalog.jsx';
import WidgetItem from './WidgetItem';
import styles from './Sidebar.module.css';

export default function Sidebar({ onAddWidget }) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? WIDGET_CATALOG.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
    : WIDGET_CATALOG;

  const categories = [...new Set(WIDGET_CATALOG.map(w => w.category))];

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.appName}>🏠 Domótica</div>
        <input
          className={styles.search}
          placeholder="🔍 Buscar widget..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className={styles.list}>
        {categories.map(cat => {
          const items = filtered.filter(w => w.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <div className={styles.category}>{items[0].categoryIcon} {cat}</div>
              {items.map(def => <WidgetItem key={def.id} def={def} onAddWidget={onAddWidget} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useMeta } from '../../store/metaStore.jsx';
import { groupWidgetsByCategory } from '../../utils/widgetCategories.js';
import styles from './WidgetGroups.module.css';

export default function WidgetGroups({ widgets }) {
  const { state: metaState, dispatch: metaDispatch } = useMeta();
  const groups = groupWidgetsByCategory(widgets);

  const toggleGroup = (category) => {
    metaDispatch({ type: 'TOGGLE_GROUP', category });
  };

  return (
    <div className={styles.container}>
      {Object.entries(groups).map(([category, categoryWidgets]) => {
        const isExpanded = (metaState.expandedGroups?.[category] ?? true) !== false;

        return (
          <button
            key={category}
            className={styles.groupHeader}
            onClick={() => toggleGroup(category)}
          >
            <span className={styles.chevron}>
              {isExpanded ? '▼' : '▶'}
            </span>
            <span className={styles.categoryName}>
              {category}
            </span>
            <span className={styles.count}>
              ({categoryWidgets.length})
            </span>
          </button>
        );
      })}
    </div>
  );
}

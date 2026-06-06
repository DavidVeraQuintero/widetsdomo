import styles from './Sidebar.module.css';

export default function WidgetItem({ def }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('widgetType', def.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={styles.item}
      draggable
      onDragStart={handleDragStart}
      title={`Arrastra al canvas · Tamaños: ${def.sizes.join(', ')}`}
    >
      <span className={styles.itemIcon}>{def.icon}</span>
      <span className={styles.itemName}>{def.name}</span>
      <span className={styles.itemBadge}>{def.sizes.length}</span>
    </div>
  );
}

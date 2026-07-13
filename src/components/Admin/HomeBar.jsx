import styles from './HomeBar.module.css';

export default function HomeBar({ homeName, onExit }) {
  return (
    <div className={styles.bar}>
      <div className={styles.homeInfo}>
        <span className={styles.label}>Casa actual</span>
        <span className={styles.name}>{homeName || 'Sin nombre'}</span>
      </div>
      <button className={styles.exitBtn} onClick={onExit}>
        ← Salir
      </button>
    </div>
  );
}

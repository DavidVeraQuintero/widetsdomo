import styles from './OfflineModal.module.css';

export default function OfflineModal() {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.dot} />
        <div className={styles.icon}>📡</div>
        <div className={styles.title}>Sin conexión</div>
        <div className={styles.subtitle}>
          No hay internet ni acceso local al hub.<br />
          Verifica tu red — el dashboard se restaurará automáticamente.
        </div>
      </div>
    </div>
  );
}

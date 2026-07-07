import { useSyncStatus } from '../../store/syncStore.jsx';
import styles from './SyncIndicator.module.css';

const LABELS = {
  connected: 'Sincronizado',
  syncing:   'Sincronizando...',
  offline:   'Sin conexión',
};

// Injected at build time by Vite — shows when this JS bundle was compiled.
const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null;
const BUILD_LABEL = BUILD_TIME
  ? new Date(BUILD_TIME).toLocaleString('es', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    }).replace(',', '')
  : null;

export default function SyncIndicator() {
  const { status } = useSyncStatus();
  return (
    <div className={styles.indicator}>
      <span className={`${styles.dot} ${styles[status]}`} />
      {LABELS[status] ?? 'Sin conexión'}
      {BUILD_LABEL && <span className={styles.build}>· {BUILD_LABEL}</span>}
    </div>
  );
}

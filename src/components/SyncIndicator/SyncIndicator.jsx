import { useSyncStatus } from '../../store/syncStore.jsx';
import styles from './SyncIndicator.module.css';

const LABELS = {
  connected: 'Sincronizado',
  syncing:   'Sincronizando...',
  offline:   'Sin conexión',
};

export default function SyncIndicator() {
  const { status } = useSyncStatus();
  return (
    <div className={styles.indicator}>
      <span className={`${styles.dot} ${styles[status]}`} />
      {LABELS[status] ?? 'Sin conexión'}
    </div>
  );
}

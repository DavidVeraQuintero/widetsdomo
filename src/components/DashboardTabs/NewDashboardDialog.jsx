import { useState } from 'react';
import styles from './DashboardTabs.module.css';

export default function NewDashboardDialog({ onConfirm, onCancel }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <div className={styles.overlay} onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <form className={styles.dialog} onSubmit={handleSubmit}>
        <div className={styles.dialogTitle}>Nuevo dashboard</div>
        <input
          className={styles.dialogInput}
          placeholder="Nombre del dashboard"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          onKeyDown={e => e.key === 'Escape' && onCancel()}
        />
        <div className={styles.dialogButtons}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className={styles.confirmBtn} disabled={!name.trim()}>
            Crear
          </button>
        </div>
      </form>
    </div>
  );
}

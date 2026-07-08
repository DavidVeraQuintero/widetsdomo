import { useState, useEffect } from 'react';
import styles from './AccessConfig.module.css';

export default function AccessConfig() {
  const [houseName, setHouseName] = useState('');
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(d => {
        setHouseName(d.houseName ?? '');
        setEmails(d.allowedEmails ?? []);
      })
      .catch(() => {});
  }, []);

  const addEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || emails.includes(trimmed)) return;
    setEmails(prev => [...prev, trimmed]);
    setNewEmail('');
  };

  const removeEmail = (email) => {
    setEmails(prev => prev.filter(e => e !== email));
  };

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseName, allowedEmails: emails }),
      });
      setStatus(res.ok ? 'ok' : 'error');
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(''), 2500);
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.section}>
        <label className={styles.label}>Nombre de la casa</label>
        <input
          className={styles.input}
          type="text"
          value={houseName}
          onChange={e => setHouseName(e.target.value)}
          placeholder="Mi Hogar"
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Cuentas Google permitidas</label>
        <div className={styles.emailList}>
          {emails.length === 0 && (
            <div className={styles.emptyHint}>Sin cuentas configuradas</div>
          )}
          {emails.map(email => (
            <div key={email} className={styles.emailRow}>
              <span className={styles.emailText}>{email}</span>
              <button
                className={styles.removeBtn}
                onClick={() => removeEmail(email)}
                title="Quitar"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className={styles.addRow}>
          <input
            className={styles.input}
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="correo@gmail.com"
          />
          <button className={styles.addBtn} onClick={addEmail} disabled={!newEmail.trim()}>
            +
          </button>
        </div>
      </div>

      <button
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>

      {status === 'ok' && <div className={styles.successMsg}>✓ Guardado</div>}
      {status === 'error' && <div className={styles.errorMsg}>Error al guardar</div>}
    </div>
  );
}

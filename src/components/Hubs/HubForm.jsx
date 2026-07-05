import { useState, useEffect } from 'react';
import { useHub } from '../../store/hubStore.jsx';
import { testHubConnection } from '../../services/hubClient.js';
import styles from './Hubs.module.css';

export default function HubForm({ editHub, onDone }) {
  const { dispatch, refreshHub } = useHub();
  const [type, setType]   = useState(editHub?.type  || 'hubitat');
  const [name, setName]   = useState(editHub?.name  || '');
  const [ip,   setIp]     = useState(editHub?.ip    || '');
  const [appId, setAppId] = useState(editHub?.appId || '');
  const [token, setToken] = useState(editHub?.token || '');
  const [cloudUrl, setCloudUrl] = useState(editHub?.cloudUrl || '');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const hasRequired = ip && token && (type === 'hubitat' ? !!appId : true);
    if (!hasRequired) { setTestResult(null); return; }
    const t = setTimeout(async () => {
      setTesting(true);
      const r = await testHubConnection({ type, ip, appId, token, id: editHub?.id || 'preview', name: name || ip });
      setTestResult(r);
      setTesting(false);
    }, 800);
    return () => clearTimeout(t);
  }, [type, ip, appId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    const hubData = { type, name: name || ip, ip, appId, token, cloudUrl };
    if (editHub) {
      dispatch({ type: 'UPDATE_HUB', id: editHub.id, changes: hubData });
      refreshHub(editHub.id);
    } else {
      dispatch({ type: 'ADD_HUB', hub: hubData });
    }
    onDone();
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_HUB', id: editHub.id });
    onDone();
  };

  const canSave = !!(name && ip && token && (type === 'hubitat' ? appId : true));

  return (
    <div className={styles.form}>
      <div className={styles.formHeader}>
        <button className={styles.backBtn} onClick={onDone}>←</button>
        <span className={styles.formTitle}>{editHub ? 'Editar Hub' : 'Agregar Hub'}</span>
      </div>

      <div className={styles.typeSelector}>
        {[{ id: 'hubitat', emoji: '🏠', label: 'Hubitat' }, { id: 'homeassistant', emoji: '🤖', label: 'Home Assistant' }].map(t => (
          <button key={t.id} className={`${styles.typeBtn} ${type === t.id ? styles.selected : ''}`} onClick={() => setType(t.id)}>
            <span className={styles.typeEmoji}>{t.emoji}</span>
            <span className={styles.typeName}>{t.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>NOMBRE</label>
        <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Casa Principal" />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>IP / URL</label>
        <input className={styles.input} value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.11.15" />
      </div>

      {type === 'hubitat' && (
        <>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>APP ID</label>
              <input className={styles.input} value={appId} onChange={e => setAppId(e.target.value)} placeholder="12" />
            </div>
            <div className={styles.field} style={{ flex: 2 }}>
              <label className={styles.label}>ACCESS TOKEN</label>
              <input className={styles.input} type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>CLOUD URL (Maker API)</label>
            <input
              className={styles.input}
              value={cloudUrl}
              onChange={e => setCloudUrl(e.target.value)}
              placeholder="https://cloud.hubitat.com/api/{uid}/apps/{appId}"
            />
          </div>
        </>
      )}

      {type === 'homeassistant' && (
        <div className={styles.field}>
          <label className={styles.label}>LONG-LIVED TOKEN</label>
          <input className={styles.input} type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="eyJ..." />
        </div>
      )}

      {testing && (
        <div className={`${styles.testResult} ${styles.checking}`}>
          <div className={styles.testDot} />Probando conexión...
        </div>
      )}
      {!testing && testResult && (
        <div className={`${styles.testResult} ${testResult.ok ? (testResult.usedProxy ? styles.proxy : styles.ok) : styles.error}`}>
          <div className={styles.testDot} />
          {testResult.ok
            ? `${testResult.usedProxy ? 'Proxy' : 'Directo'} OK · ${testResult.count} dispositivos`
            : `Error: ${testResult.error}`}
        </div>
      )}

      <button className={styles.saveBtn} onClick={handleSave} disabled={!canSave}>
        {editHub ? 'Guardar cambios' : 'Agregar hub'}
      </button>
      {editHub && (
        <button className={styles.deleteBtn} onClick={handleDelete}>Eliminar hub</button>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useHub } from '../../store/hubStore.jsx';
import HubForm from './HubForm.jsx';
import DeviceCatalog from './DeviceCatalog.jsx';
import styles from './Hubs.module.css';

export default function HubsTab() {
  const { hubs, devices, refreshHub } = useHub();
  const [formHub, setFormHub] = useState(null);
  const [selectedHubId, setSelectedHubId] = useState(() => hubs[0]?.id ?? null);

  if (formHub !== null) {
    return (
      <HubForm
        editHub={formHub === 'new' ? null : formHub}
        onDone={() => setFormHub(null)}
      />
    );
  }

  const selectedHub = hubs.find(h => h.id === selectedHubId) ?? null;
  const devList = selectedHubId ? (devices[selectedHubId] || []) : [];

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          HUBS CONECTADOS
          <button className={styles.addBtn} onClick={() => setFormHub('new')}>+ Agregar</button>
        </div>
        {hubs.length === 0 && (
          <div className={styles.empty}>Sin hubs — conectá Hubitat o Home Assistant</div>
        )}
        {hubs.map(hub => {
          const devCount = (devices[hub.id] || []).length;
          return (
            <div
              key={hub.id}
              className={styles.hubItem}
              onClick={() => setSelectedHubId(hub.id)}
              style={{ outline: selectedHubId === hub.id ? '2px solid #6366f1' : 'none', outlineOffset: '-2px' }}
            >
              <div className={`${styles.statusDot} ${devCount > 0 ? styles.online : styles.offline}`} />
              <div className={styles.hubInfo}>
                <div className={styles.hubName}>{hub.name}</div>
                <div className={styles.hubMeta}>{hub.ip} · {devCount > 0 ? `${devCount} dispositivos` : 'sin conexión'}</div>
              </div>
              <button className={styles.iconBtn} title="Sincronizar" onClick={e => { e.stopPropagation(); refreshHub(hub.id); }}>↻</button>
              <button className={styles.iconBtn} title="Editar" onClick={e => { e.stopPropagation(); setFormHub(hub); }}>✎</button>
            </div>
          );
        })}
      </div>

      {hubs.length > 0 && (
        <>
          <div className={styles.divider} />
          <div className={styles.section} style={{ paddingBottom: 2 }}>
            <div className={styles.sectionTitle}>
              DISPOSITIVOS{selectedHub ? ` · ${selectedHub.name}` : ''}
            </div>
          </div>
          <DeviceCatalog hub={selectedHub} devList={devList} />
        </>
      )}
    </div>
  );
}

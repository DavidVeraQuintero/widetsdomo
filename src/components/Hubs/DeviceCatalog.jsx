import { useState } from 'react';
import { useHub } from '../../store/hubStore.jsx';
import { HUB_LOCKABLE_WIDGET_TYPES } from '../../services/hubMappings.js';
import styles from './Hubs.module.css';

const WIDGET_ICONS = {
  'lampara-simple': '💡', 'lampara-dimmer': '🔆', 'lampara-rgb': '🎨', 'lampara-cct': '💫',
  'tira-led-rgb': '✨', 'tira-led': '✨', 'enchufe': '🔌', 'termostato': '🌡',
  'aire-acondicionado': '❄', 'calefactor': '🔥', 'ventilador': '🌀',
  'sensor-temp': '🌡', 'sensor-aire': '💨', 'sensor-humo': '🔥',
  'sensor-inundacion': '💧', 'sensor-luz': '☀', 'sensor-movimiento': '👁',
  'sensor-presencia': '🧑', 'puerta': '🚪', 'ventana': '🪟', 'cerradura': '🔒',
  'persiana-roller': '📋', 'cortina': '🎭', 'toldo': '⛺', 'veneciana': '🪞',
};

const TYPE_LABELS = {
  'lampara-simple': 'Lámpara', 'lampara-dimmer': 'Dimmer', 'lampara-rgb': 'RGB',
  'lampara-cct': 'CCT', 'tira-led-rgb': 'Tira RGB', 'tira-led': 'Tira LED',
  'enchufe': 'Enchufe', 'termostato': 'Termostato', 'aire-acondicionado': 'AC',
  'calefactor': 'Calefactor', 'ventilador': 'Ventilador',
  'sensor-temp': 'Temp/Hum', 'sensor-aire': 'Calidad Aire', 'sensor-humo': 'Humo',
  'sensor-inundacion': 'Agua', 'sensor-luz': 'Luz', 'sensor-movimiento': 'Movimiento',
  'sensor-presencia': 'Presencia', 'puerta': 'Puerta', 'ventana': 'Ventana',
  'cerradura': 'Cerradura', 'persiana-roller': 'Persiana', 'cortina': 'Cortina',
  'toldo': 'Toldo', 'veneciana': 'Veneciana',
};

const ALL_WIDGET_TYPES = [...HUB_LOCKABLE_WIDGET_TYPES];

export default function DeviceCatalog({ hub, devList }) {
  const { assignments, dispatch } = useHub();
  const [filter, setFilter] = useState('all');

  if (!hub) return <div className={styles.empty}>Seleccioná un hub para ver sus dispositivos</div>;
  if (!devList?.length) return <div className={styles.empty}>Sin dispositivos — usá ↻ para sincronizar</div>;

  const filtered = filter === 'all'
    ? devList
    : filter === 'unassigned'
      ? devList.filter(d => !assignments[`${d.hubId}:${d.deviceId}`])
      : devList.filter(d => assignments[`${d.hubId}:${d.deviceId}`] === filter);

  const assignedCount = devList.filter(d => assignments[`${d.hubId}:${d.deviceId}`]).length;

  return (
    <div className={styles.deviceList}>
      <div className={styles.pills}>
        <button className={`${styles.pill} ${filter === 'all' ? styles.active : ''}`} onClick={() => setFilter('all')}>
          Todos ({devList.length})
        </button>
        <button className={`${styles.pill} ${filter === 'unassigned' ? styles.active : ''}`} onClick={() => setFilter('unassigned')}>
          Sin asignar ({devList.length - assignedCount})
        </button>
      </div>

      {filtered.map(dev => {
        const assignKey = `${dev.hubId}:${dev.deviceId}`;
        const assigned = assignments[assignKey] || '';
        return (
          <div key={dev.deviceId} className={styles.deviceItem}>
            <span className={styles.deviceIcon}>
              {assigned ? (WIDGET_ICONS[assigned] || '📦') : '📦'}
            </span>
            <div className={styles.deviceInfo}>
              <div className={styles.deviceName}>{dev.name}</div>
              <div className={styles.deviceMeta}>{dev.name}</div>
            </div>
            <select
              className={styles.deviceSelect}
              value={assigned}
              onChange={e => dispatch({ type: 'ASSIGN_DEVICE', key: assignKey, widgetTypeId: e.target.value || null })}
            >
              <option value="">— widget</option>
              {ALL_WIDGET_TYPES.map(wt => (
                <option key={wt} value={wt}>{WIDGET_ICONS[wt]} {TYPE_LABELS[wt] || wt}</option>
              ))}
            </select>
            <div className={`${styles.reachDot} ${dev.reachable ? styles.on : styles.off}`} />
          </div>
        );
      })}
    </div>
  );
}

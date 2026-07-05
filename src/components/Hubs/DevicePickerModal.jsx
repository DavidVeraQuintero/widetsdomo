import { useState } from 'react';
import styles from './Hubs.module.css';

export default function DevicePickerModal({ widgetType, def, devices, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(devices[0]?.deviceId ?? null);
  const selectedDevice = devices.find(d => d.deviceId === selected) ?? null;

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <span className={styles.modalIcon}>{def.icon}</span>
            <div>
              <div className={styles.modalTitle}>{def.name}</div>
              <div className={styles.modalSub}>Seleccioná el dispositivo a controlar</div>
            </div>
          </div>
          <div className={styles.modalDivider} />
        </div>

        <div className={styles.pickerList}>
          {devices.map(dev => (
            <div
              key={dev.deviceId}
              className={`${styles.pickerItem} ${selected === dev.deviceId ? styles.selected : ''}`}
              onClick={() => setSelected(dev.deviceId)}
            >
              <div className={`${styles.reachDot} ${dev.reachable ? styles.on : styles.off}`} />
              <div className={styles.pickerInfo}>
                <div className={styles.pickerName}>{dev.name}</div>
                <div className={styles.pickerMeta}>{dev.hubName}</div>
              </div>
              <div className={`${styles.radio} ${selected === dev.deviceId ? styles.checked : ''}`}>
                {selected === dev.deviceId && <div className={styles.radioInner} />}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
          <button className={styles.confirmBtn} disabled={!selectedDevice} onClick={() => onConfirm(selectedDevice)}>
            Agregar widget →
          </button>
        </div>
      </div>
    </div>
  );
}

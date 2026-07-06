import { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { useHub } from '../../store/hubStore.jsx';
import { HUB_LOCKABLE_WIDGET_TYPES } from '../../services/hubMappings.js';
import DevicePickerModal from '../Hubs/DevicePickerModal.jsx';
import styles from './Sidebar.module.css';

export default function WidgetItem({ def, onAddWidget }) {
  const { dispatch } = useDashboard();
  const { hubsConfigured, hubs, deviceCounts, devices: allDevices, assignments } = useHub();
  const isMobile = typeof window !== 'undefined'
    ? !window.matchMedia('(any-pointer: fine)').matches
    : false;
  const longPressTimer = useRef(null);
  const touchStartPos = useRef(null);
  const [pickerData, setPickerData] = useState(null); // { matchingDevices, doAdd }

  const isLockable = HUB_LOCKABLE_WIDGET_TYPES.has(def.id);
  const count = deviceCounts[def.id] ?? 0;
  const isLocked = hubsConfigured && isLockable && count === 0;

  // Ref so canDrag always reads the latest isLocked (factory closure is stale)
  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'WIDGET',
    item: { widgetType: def.id, def },
    canDrag: () => !isLockedRef.current,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const doAdd = (config, touch) => {
    const canvas = document.querySelector('[class*="canvasInner"]');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, touch.clientX - rect.left);
    const y = Math.max(0, touch.clientY - rect.top);
    const widgetId = `${def.id}-${Date.now()}`;
    dispatch({
      type: 'ADD_WIDGET',
      payload: { id: widgetId, type: def.id, x, y, size: def.sizes[Math.min(1, def.sizes.length - 1)], config },
    });
    if (typeof window !== 'undefined') window.widgetIdBeingDragged = widgetId;
    if (onAddWidget) {
      setTimeout(() => {
        if (typeof window !== 'undefined') window.closingSidebar = true;
        onAddWidget();
        setTimeout(() => { if (typeof window !== 'undefined') window.closingSidebar = false; }, 200);
      }, 50);
    }
  };

  const handleMobileLongPress = (e) => {
    if (isLocked) return;
    const touch = e.touches[0];

    if (hubsConfigured && isLockable) {
      const allDevsList = Object.values(allDevices).flat();
      const matchingDevs = Object.entries(assignments)
        .filter(([, wt]) => wt === def.id)
        .map(([key]) => {
          const sep = key.indexOf(':');
          const hubId = key.slice(0, sep);
          const deviceId = key.slice(sep + 1);
          const full = allDevsList.find(d => d.hubId === hubId && d.deviceId === deviceId);
          if (full) return full;
          const hub = hubs.find(h => h.id === hubId);
          return { hubId, deviceId, name: `Dispositivo ${deviceId}`, hubName: hub?.name ?? '', reachable: true };
        });
      if (matchingDevs.length === 1) {
        const dev = matchingDevs[0];
        doAdd({ ...(def.defaultConfig ?? {}), hubId: dev.hubId, deviceId: dev.deviceId, hubDeviceName: dev.name }, touch);
      } else if (matchingDevs.length >= 2) {
        setPickerData({
          matchingDevices: matchingDevs,
          doAdd: (dev) => doAdd({ ...(def.defaultConfig ?? {}), hubId: dev.hubId, deviceId: dev.deviceId, hubDeviceName: dev.name }, touch),
        });
      }
      return;
    }
    doAdd({ ...(def.defaultConfig ?? {}) }, touch);
  };

  const handleTouchStart = (e) => {
    if (!isMobile || isLocked) return;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimer.current = setTimeout(() => handleMobileLongPress(e), 500);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || !touchStartPos.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    touchStartPos.current = null;
  };

  return (
    <>
      <div
        ref={!isMobile && !isLocked ? drag : null}
        onTouchStart={isMobile ? handleTouchStart : null}
        onTouchMove={isMobile ? handleTouchMove : null}
        onTouchCancel={isMobile ? handleTouchCancel : null}
        className={`${styles.item} ${isDragging ? styles.dragging : ''} ${isLocked ? styles.locked : ''}`}
        title={isLocked
          ? `Sin dispositivos de tipo "${def.name}" en tus hubs`
          : `${isMobile ? 'Presiona y sostén' : 'Arrastra al canvas'} · Tamaños: ${def.sizes.join(', ')}`}
      >
        <span className={`${styles.itemIcon} ${isLocked ? styles.lockedIcon : ''}`}>{def.icon}</span>
        <span className={styles.itemName}>{def.name}</span>
        {isLocked
          ? <span className={styles.itemLock}>🔒</span>
          : hubsConfigured && isLockable && count > 0
            ? <span className={styles.itemDeviceBadge}>{count}</span>
            : <span className={styles.itemBadge}>{def.sizes.length}</span>
        }
      </div>
      {pickerData && (
        <DevicePickerModal
          widgetType={def.id}
          def={def}
          devices={pickerData.matchingDevices}
          onConfirm={(dev) => { pickerData.doAdd(dev); setPickerData(null); }}
          onCancel={() => setPickerData(null)}
        />
      )}
    </>
  );
}

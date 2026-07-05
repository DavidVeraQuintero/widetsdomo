import { useCallback } from 'react';
import { useHub } from '../store/hubStore.jsx';

export function useDeviceControl(config) {
  const { sendCommand } = useHub();
  return useCallback((command, arg) => {
    if (!config?.hubId || !config?.deviceId) return;
    sendCommand(config.hubId, config.deviceId, command, arg);
  }, [config?.hubId, config?.deviceId, sendCommand]); // eslint-disable-line react-hooks/exhaustive-deps
}

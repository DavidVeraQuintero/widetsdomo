export const MAX_DASHBOARDS = 10;

export const SYNC_WS_URL = import.meta.env.VITE_SYNC_URL || `ws://${window.location.hostname}:3001`;
export const SYNC_HTTP_URL = SYNC_WS_URL.replace(/^ws/, 'http');

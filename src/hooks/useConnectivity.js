import { useState, useEffect, useRef } from 'react';

// Returns: 'online' | 'lan-only' | 'offline'
export function useConnectivity(hub) {
  const [mode, setMode] = useState('online');
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Check internet by pinging our own server
      let hasInternet = false;
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const r = await fetch('/api/me', { signal: ctrl.signal });
        clearTimeout(t);
        hasInternet = r.status !== 0;
      } catch { hasInternet = false; }

      // Check LAN by trying a direct fetch to local hub via proxy (only when internet is down)
      let hasLan = false;
      if (!hasInternet && hub?.ip) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 2000);
          const r = await fetch('/api/hub-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: hub.type, ip: hub.ip, appId: hub.appId,
              token: hub.token,
              path: `/apps/api/${hub.appId}/devices?access_token=${hub.token}`,
            }),
            signal: ctrl.signal,
          });
          clearTimeout(t);
          hasLan = r.ok;
        } catch { hasLan = false; }
      }

      if (cancelled) return;

      if (hasInternet)     setMode('online');
      else if (hasLan)     setMode('lan-only');
      else                 setMode('offline');

      timerRef.current = setTimeout(check, 10_000);
    }

    check();

    const onOnline  = () => check();
    const onOffline = () => check();
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [hub?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return mode;
}

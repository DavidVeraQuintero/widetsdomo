import { useState, useEffect, useRef } from 'react';

const LAN_TIMEOUT_MS   = 1000;
const CLOUD_TIMEOUT_MS = 3000;

// Returns: 'local' | 'cloud' | 'offline'
// 'local'  — Hubitat reachable on LAN → commands go direct
// 'cloud'  — internet up but no LAN   → commands go via Render proxy
// 'offline'— neither reachable        → blocking modal
export function useConnectivity(hub) {
  const [mode, setMode] = useState('cloud');
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const [hasLan, hasInternet] = await Promise.all([
        // LAN: no-cors ping to hub IP — any response = reachable, no CORS issues
        hub?.ip
          ? (async () => {
              try {
                const ctrl = new AbortController();
                const t = setTimeout(() => ctrl.abort(), LAN_TIMEOUT_MS);
                await fetch(`https://${hub.ip}`, { signal: ctrl.signal, mode: 'no-cors' });
                clearTimeout(t);
                return true;
              } catch { return false; }
            })()
          : Promise.resolve(false),

        // Internet: ping own server
        (async () => {
          try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), CLOUD_TIMEOUT_MS);
            const r = await fetch('/api/me', { signal: ctrl.signal });
            clearTimeout(t);
            return r.status !== 0;
          } catch { return false; }
        })(),
      ]);

      if (cancelled) return;

      if (hasLan)           setMode('local');
      else if (hasInternet) setMode('cloud');
      else                  setMode('offline');

      timerRef.current = setTimeout(check, 10_000);
    }

    check();

    window.addEventListener('online',  check);
    window.addEventListener('offline', check);

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
      window.removeEventListener('online',  check);
      window.removeEventListener('offline', check);
    };
  }, [hub?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return mode;
}

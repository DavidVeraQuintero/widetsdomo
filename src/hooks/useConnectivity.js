import { useState, useEffect, useRef } from 'react';

const LAN_TIMEOUT_MS   = 1200;
const CLOUD_TIMEOUT_MS = 3000;

// Returns: 'local' | 'cloud' | 'offline'
// 'local'  — Hubitat responds on LAN via HTTPS → commands go direct, no cloud hop
// 'cloud'  — internet up but hub not reachable on LAN → commands via cloud.hubitat.com
// 'offline'— neither reachable                        → blocking modal
//
// LAN detection uses https:// (not http://) so it works from HTTPS pages without
// mixed-content blocking. Hubitat C8/C8 Pro listens on HTTPS locally. The result
// is cached in window.__hubLanReachable so hubClient can read it synchronously.
export function useConnectivity(hub) {
  const [mode, setMode] = useState('cloud');
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const [hasLan, hasInternet] = await Promise.all([
        hub?.ip
          ? (async () => {
              try {
                const ctrl = new AbortController();
                const t = setTimeout(() => ctrl.abort(), LAN_TIMEOUT_MS);
                // mode:'no-cors' → opaque response, but any non-throw means hub is up.
                // Uses HTTPS so no mixed-content warning on the page security indicator.
                await fetch(`https://${hub.ip}`, { signal: ctrl.signal, mode: 'no-cors' });
                clearTimeout(t);
                return true;
              } catch { return false; }
            })()
          : Promise.resolve(false),

        // Cloud: ping own server
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

      // Expose LAN status globally — hubClient.js reads this without React context
      window.__hubLanReachable = hasLan;

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

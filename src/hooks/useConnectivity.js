import { useState, useEffect, useRef } from 'react';

const CLOUD_TIMEOUT_MS = 3000;

// Detect if local IP is on the same /24 subnet as the hub using WebRTC ICE candidates.
// This requires NO connection to the hub and NO cert trust — the browser reveals its
// own local IPs as part of the WebRTC negotiation process.
async function isOnHubSubnet(hubIp) {
  if (!hubIp) return false;
  const hubPrefix = hubIp.split('.').slice(0, 3).join('.'); // e.g. "192.168.11"
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    await pc.createOffer().then(o => pc.setLocalDescription(o));
    return new Promise(resolve => {
      let done = false;
      const finish = (val) => { if (done) return; done = true; pc.close(); resolve(val); };
      setTimeout(() => finish(false), 800);
      pc.onicecandidate = (e) => {
        if (!e?.candidate?.candidate) return;
        const m = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m && m[1].startsWith(hubPrefix + '.')) finish(true);
      };
    });
  } catch { return false; }
}

// Returns: 'local' | 'cloud' | 'offline'
// 'local'  — device is on same /24 as Hubitat → commands attempt LAN first
// 'cloud'  — internet up, not on hub subnet  → commands via cloud.hubitat.com
// 'offline'— no internet and not on hub subnet → blocking modal
//
// LAN detection uses WebRTC ICE candidates so it works without trusting the hub's
// self-signed cert. window.__hubLanReachable is set so hubClient reads it without
// React context. Commands always attempt LAN first when on subnet, falling back to
// cloud silently if the cert hasn't been trusted yet.
export function useConnectivity(hub) {
  const [mode, setMode] = useState('cloud');
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const [hasLan, hasInternet] = await Promise.all([
        isOnHubSubnet(hub?.ip),
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

      timerRef.current = setTimeout(check, 15_000);
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

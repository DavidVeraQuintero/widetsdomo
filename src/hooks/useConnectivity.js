import { useState, useEffect, useRef } from 'react';

const CLOUD_TIMEOUT_MS = 3000;
const LAN_PROBE_MS     = 1500;

// Method 1 — WebRTC: discover local IPs without touching the hub or needing cert trust.
// Returns true if any local IP is in the same /24 as hubIp.
async function webrtcOnSubnet(hubIp) {
  if (!hubIp) return false;
  const hubPrefix = hubIp.split('.').slice(0, 3).join('.');
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    await pc.createOffer().then(o => pc.setLocalDescription(o));
    return await new Promise(resolve => {
      let done = false;
      const finish = (v) => { if (done) return; done = true; pc.close(); resolve(v); };
      setTimeout(() => finish(false), 800);
      pc.onicecandidate = (e) => {
        if (!e?.candidate?.candidate) return;
        const m = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m && m[1].startsWith(hubPrefix + '.')) finish(true);
      };
    });
  } catch { return false; }
}

// Method 2 — HTTPS timing: a fast non-abort failure means the hub responded (TCP
// reached it) but rejected the cert. That's still "hub is on LAN".
// A true timeout (AbortError) means the hub is unreachable from this network.
async function httpsProbeOnLan(hubIp) {
  if (!hubIp) return false;
  const t0 = performance.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LAN_PROBE_MS);
    await fetch(`https://${hubIp}`, { signal: ctrl.signal, mode: 'no-cors' });
    clearTimeout(timer);
    return true; // responded — cert trusted
  } catch (e) {
    const elapsed = performance.now() - t0;
    // Fast non-abort = cert error but hub IS physically reachable
    return e.name !== 'AbortError' && elapsed < LAN_PROBE_MS * 0.9;
  }
}

// Returns: 'local' | 'cloud' | 'offline'
// Uses both WebRTC (subnet check, no cert needed) and HTTPS timing (fast-fail = reachable)
// so detection works whether or not the hub cert has been trusted in this browser.
export function useConnectivity(hub) {
  const [mode, setMode] = useState('cloud');
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const [hasLan, hasInternet] = await Promise.all([
        hub?.ip
          ? Promise.any([webrtcOnSubnet(hub.ip), httpsProbeOnLan(hub.ip)]).catch(() => false)
          : Promise.resolve(false),

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

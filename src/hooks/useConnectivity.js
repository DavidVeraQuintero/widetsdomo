import { useState, useEffect, useRef } from 'react';

const CLOUD_TIMEOUT_MS = 3000;
const LAN_PROBE_MS     = 1500;

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

async function httpsProbeOnLan(hubIp) {
  if (!hubIp) return false;
  const t0 = performance.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LAN_PROBE_MS);
    await fetch(`https://${hubIp}`, { signal: ctrl.signal, mode: 'no-cors' });
    clearTimeout(timer);
    return true;
  } catch (e) {
    const elapsed = performance.now() - t0;
    return e.name !== 'AbortError' && elapsed < LAN_PROBE_MS * 0.9;
  }
}

async function checkInternet() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), CLOUD_TIMEOUT_MS);
    const r = await fetch('/api/me', { signal: ctrl.signal });
    clearTimeout(t);
    return r.status !== 0;
  } catch { return false; }
}

// Returns: 'local' | 'cloud' | 'offline'
// If hub is detected on LAN (WebRTC subnet or fast HTTPS response), mode is 'local'
// immediately — no need to wait for the internet ping. Internet is only checked when
// LAN is not available to distinguish 'cloud' from 'offline'.
export function useConnectivity(hub) {
  const [mode, setMode] = useState('cloud');
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // Check LAN first — if detected, no need to wait for internet ping
      const hasLan = hub?.ip
        ? await Promise.any([webrtcOnSubnet(hub.ip), httpsProbeOnLan(hub.ip)]).catch(() => false)
        : false;

      if (cancelled) return;

      window.__hubLanReachable = hasLan;

      if (hasLan) {
        setMode('local');
      } else {
        // Only ping internet when not on LAN
        const hasInternet = await checkInternet();
        if (!cancelled) setMode(hasInternet ? 'cloud' : 'offline');
      }

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

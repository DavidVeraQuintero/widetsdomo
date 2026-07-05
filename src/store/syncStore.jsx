import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { DashboardContext } from './dashboardStore.jsx';
import { MetaContext } from './metaStore.jsx';
import { HubContext } from './hubStore.jsx';
import { SYNC_WS_URL, SYNC_HTTP_URL } from '../config.js';

const SyncStatusContext = createContext({ status: 'offline', httpUrl: SYNC_HTTP_URL });

export function useSyncStatus() {
  return useContext(SyncStatusContext);
}

export function SyncProvider({ children }) {
  const dashCtx = useContext(DashboardContext);
  const metaCtx = useContext(MetaContext);
  const hubCtx = useContext(HubContext);

  const wsRef = useRef(null);
  const [status, setStatus] = useState('offline');
  const dashPendingRemote = useRef(false);
  const metaPendingRemote = useRef(false);
  const hubPendingRemote = useRef(false);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);
  const serverHasData = useRef(false); // true once server sends non-empty FULL_STATE
  const handleIncomingRef = useRef(null);
  const syncingTimer = useRef(null);

  // --- WebSocket lifecycle ---

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(SYNC_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnectDelay.current = 1000;
    };

    ws.onclose = () => {
      setStatus('offline');
      wsRef.current = null;
      clearTimeout(syncingTimer.current); // cancel any pending status reset
      const delay = reconnectDelay.current;
      reconnectDelay.current = Math.min(delay * 2, 30000);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      handleIncomingRef.current?.(msg);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  // --- Incoming message handler ---

  function clearLocalData() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('domotica'))
      .forEach(k => localStorage.removeItem(k));
  }

  function handleIncoming(msg) {
    switch (msg.type) {
      case 'RESET': {
        // Server was intentionally wiped — clear all local data and reset state
        clearLocalData();
        if (msg.wipedAt) localStorage.setItem('domotica-wiped-at', String(msg.wipedAt));
        dashPendingRemote.current = true;
        metaPendingRemote.current = true;
        hubPendingRemote.current = true;
        dashCtx.dispatch({ type: 'RESET' });
        metaCtx.dispatch({ type: 'RESET' });
        hubCtx.dispatch({ type: 'RESET' });
        break;
      }

      case 'FULL_STATE': {
        const { dashboards, meta, wipedAt } = msg;

        // If the server was wiped after our last visit, clear local data and don't re-seed
        const localWipedAt = parseInt(localStorage.getItem('domotica-wiped-at') || '0');
        if (wipedAt && wipedAt > localWipedAt) {
          clearLocalData();
          localStorage.setItem('domotica-wiped-at', String(wipedAt));
          serverHasData.current = true; // prevent SEED_STATE from re-populating server
          dashPendingRemote.current = true;
          metaPendingRemote.current = true;
          hubPendingRemote.current = true;
          dashCtx.dispatch({ type: 'RESET' });
          metaCtx.dispatch({ type: 'RESET' });
          hubCtx.dispatch({ type: 'RESET' });
          break;
        }

        if (dashboards?.length > 0 || meta) serverHasData.current = true;

        // Write all dashboard states to localStorage so DashboardProvider
        // remounts with fresh data if the active dashboard changes
        if (Array.isArray(dashboards)) {
          dashboards.forEach(({ id, state }) => {
            if (state) {
              localStorage.setItem(`domotica-dashboard-${id}`, JSON.stringify(state));
            }
          });
        }

        // Update current dashboard state
        if (Array.isArray(dashboards)) {
          const activeDash = dashboards.find(
            d => d.id === metaCtx.state.activeDashboardId
          );
          if (activeDash?.state) {
            dashPendingRemote.current = true;
            dashCtx.dispatch({ type: 'SET_STATE', payload: activeDash.state });
          }
        }

        // Update meta (may cause DashboardProvider remount via key change in App.jsx;
        // that's fine — it will load fresh data from localStorage we just wrote above)
        if (meta) {
          // Preserve device-specific preferences — activeDashboardId is local per device
          const devicePrefs = {
            viewOriginal: metaCtx.state.viewOriginal,
            viewCategorized: metaCtx.state.viewCategorized,
            activeDashboardId: metaCtx.state.activeDashboardId,
          };
          // If the server doesn't know the active dashboard yet (just created locally),
          // don't suppress the outgoing PATCH_META — we need to tell the server about it.
          const localActiveId = metaCtx.state.activeDashboardId;
          const serverKnowsActive = !localActiveId || (meta.dashboards || []).some(d => d.id === localActiveId);
          metaPendingRemote.current = serverKnowsActive;
          metaCtx.dispatch({ type: 'SET_META', payload: { ...meta, ...devicePrefs } });
        }

        if (Array.isArray(msg.hubs) && msg.hubs.length > 0) {
          serverHasData.current = true;
          hubPendingRemote.current = true;
          hubCtx.dispatch({ type: 'SET_HUBS', hubs: msg.hubs, assignments: msg.assignments });
        }
        break;
      }

      case 'PATCH_DASHBOARD': {
        const { dashboardId, state } = msg;
        if (dashboardId === metaCtx.state.activeDashboardId && state) {
          dashPendingRemote.current = true;
          dashCtx.dispatch({ type: 'SET_STATE', payload: state });
        } else if (state) {
          // Update localStorage for inactive dashboard so it loads correctly on switch
          localStorage.setItem(`domotica-dashboard-${dashboardId}`, JSON.stringify(state));
        }
        break;
      }

      case 'PATCH_META': {
        if (msg.meta) {
          // Preserve device-specific preferences — activeDashboardId is local per device
          const devicePrefs = {
            viewOriginal: metaCtx.state.viewOriginal,
            viewCategorized: metaCtx.state.viewCategorized,
            activeDashboardId: metaCtx.state.activeDashboardId,
          };
          // Always trust PATCH_META from server — don't restore dashboards the server removed.
          // (The FULL_STATE handler handles preserving locally-created dashboards on new WS connect.)
          metaPendingRemote.current = true;
          metaCtx.dispatch({
            type: 'SET_META',
            payload: { ...msg.meta, ...devicePrefs },
          });
        }
        break;
      }

      case 'PATCH_HUBS': {
        if (Array.isArray(msg.hubs)) {
          hubPendingRemote.current = true;
          hubCtx.dispatch({ type: 'SET_HUBS', hubs: msg.hubs, assignments: msg.assignments });
        }
        break;
      }

      case 'DEVICE_EVENT': {
        window.dispatchEvent(new CustomEvent('hub:device-event', { detail: msg }));
        break;
      }

      case 'IMAGE_ADDED':
      case 'IMAGE_REMOVED':
        // Images are referenced by URL; no extra client action needed.
        // Theme state sync (via PATCH_DASHBOARD) handles customBackgrounds list.
        break;
    }
  }
  handleIncomingRef.current = handleIncoming;

  // --- Outgoing sync effects ---

  const send = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  useEffect(() => {
    if (dashPendingRemote.current) {
      dashPendingRemote.current = false;
      return;
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    setStatus('syncing');
    send({
      type: 'PATCH_DASHBOARD',
      dashboardId: metaCtx.state.activeDashboardId,
      name: metaCtx.state.dashboards.find(d => d.id === metaCtx.state.activeDashboardId)?.name,
      state: dashCtx.state,
      ts: Date.now(),
    });
    clearTimeout(syncingTimer.current);
    syncingTimer.current = setTimeout(() => setStatus('connected'), 500);
  }, [dashCtx.state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (metaPendingRemote.current) {
      metaPendingRemote.current = false;
      return;
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    // Exclude device-specific preferences from sync (activeDashboardId is per device)
    const { viewOriginal, viewCategorized, activeDashboardId: _aid, ...metaToSync } = metaCtx.state;
    send({ type: 'PATCH_META', meta: metaToSync, ts: Date.now() });
  }, [metaCtx.state]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hubPendingRemote.current) {
      hubPendingRemote.current = false;
      return;
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    send({ type: 'PATCH_HUBS', hubs: hubCtx.hubs, assignments: hubCtx.assignments, ts: Date.now() });
  }, [hubCtx.hubs, hubCtx.assignments]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- First-run migration: seed server if it has no data ---
  // Waits 300ms after connect to allow FULL_STATE to arrive and set serverHasData.
  // Only seeds if server sent an empty FULL_STATE (fresh install or wiped server).

  useEffect(() => {
    if (status !== 'connected') return;

    const timer = setTimeout(() => {
      if (serverHasData.current) return; // server already has data, skip seed
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      // Exclude device-specific preferences from seed
      const { viewOriginal, viewCategorized, activeDashboardId: _aid2, ...metaToSync } = metaCtx.state;
      send({
        type: 'SEED_STATE',
        dashboards: metaCtx.state.dashboards.map(d => ({
          id: d.id,
          name: d.name,
          state: (() => {
            try {
              return JSON.parse(
                localStorage.getItem(`domotica-dashboard-${d.id}`) || 'null'
              );
            } catch { return null; }
          })(),
        })).filter(d => d.state !== null),
        meta: metaToSync,
        hubs: hubCtx.hubs,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Patch contexts ---

  return (
    <DashboardContext.Provider value={dashCtx}>
      <MetaContext.Provider value={metaCtx}>
        <SyncStatusContext.Provider value={{ status, httpUrl: SYNC_HTTP_URL }}>
          {children}
        </SyncStatusContext.Provider>
      </MetaContext.Provider>
    </DashboardContext.Provider>
  );
}

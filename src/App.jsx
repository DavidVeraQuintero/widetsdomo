import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MetaProvider, useMeta } from './store/metaStore.jsx';
import { DashboardProvider, useDashboard } from './store/dashboardStore.jsx';
import { SyncProvider } from './store/syncStore.jsx';
import { CalendarProvider } from './store/calendarStore.jsx';
import DashboardTabs from './components/DashboardTabs/DashboardTabs.jsx';
import ThemeApplier from './components/ThemeApplier.jsx';
import Sidebar from './components/Sidebar/Sidebar';
import Canvas from './components/Canvas/Canvas';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import ThemePicker from './components/Canvas/ThemePicker';
import GlobalIconSettings from './components/GlobalIconSettings/GlobalIconSettings';
import styles from './App.module.css';
import { HubProvider, useHub } from './store/hubStore.jsx';
import Login from './components/Login/Login.jsx';
import HubsTab from './components/Hubs/HubsTab.jsx';
import RulesEngine from './rules/rulesEngine.js';
import HubDeviceSync from './components/Hubs/HubDeviceSync.jsx';
import { useConnectivity } from './hooks/useConnectivity.js';
import OfflineModal from './components/Modal/OfflineModal.jsx';

const TABS = [
  { id: 'widgets', icon: '📦', label: 'Widgets' },
  { id: 'props',   icon: '⚙️',  label: 'Propiedades' },
  { id: 'temas',   icon: '🎨', label: 'Temas' },
  { id: 'iconos',  icon: '🔣', label: 'Iconos' },
  { id: 'hubs',    icon: '🏠', label: 'Hubs' },
];

function AppContent({ onLogout }) {
  const { dispatch } = useDashboard();
  const { hubs } = useHub();
  const mode = useConnectivity(hubs[0] ?? null);

  const [activeTab, setActiveTab] = useState('widgets');
  const [panelOpen, setPanelOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const handleTabClick = (id) => {
    if (activeTab === id) {
      setPanelOpen(o => !o);
    } else {
      setActiveTab(id);
      setPanelOpen(true);
    }
  };

  // Mobile touch drag
  useEffect(() => {
    const handleTouchMove = (e) => {
      const widgetId = window.widgetIdBeingDragged;
      if (!widgetId) return;
      const touch = e.touches?.[0];
      if (!touch) return;
      const canvas = document.querySelector('[class*="canvasInner"]');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dispatch({ type: 'MOVE_WIDGET', id: widgetId, x: Math.max(0, touch.clientX - rect.left), y: Math.max(0, touch.clientY - rect.top) });
    };
    const handleTouchEnd = () => { window.widgetIdBeingDragged = null; };
    if (window.innerWidth < 768) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      document.addEventListener('touchend', handleTouchEnd, { capture: true });
      return () => {
        document.removeEventListener('touchmove', handleTouchMove, { capture: true });
        document.removeEventListener('touchend', handleTouchEnd, { capture: true });
      };
    }
  }, [dispatch]);

  return (
    <>
      {mode === 'offline' && <OfflineModal />}
      <ThemeApplier />
      <RulesEngine />
      <HubDeviceSync />

      <div className={styles.shell}>
        {/* ── Hamburger (visible solo cuando sidebar oculto) ─────── */}
        {!sidebarVisible && (
          <button
            className={styles.hamburger}
            onClick={() => setSidebarVisible(true)}
            title="Mostrar panel"
          >
            ☰
          </button>
        )}

        {/* ── Icon strip ─────────────────────────────────────────── */}
        <nav className={`${styles.iconStrip} ${!sidebarVisible ? styles.iconStripHidden : ''}`}>
          <div className={styles.stripTop}>
            <button
              className={styles.collapseBtn}
              onClick={() => { setSidebarVisible(false); setPanelOpen(false); }}
              title="Ocultar panel"
            >
              ☰
            </button>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.iconBtn} ${activeTab === tab.id && panelOpen ? styles.iconBtnActive : ''}`}
                onClick={() => handleTabClick(tab.id)}
                title={tab.label}
              >
                <span className={styles.iconBtnIcon}>{tab.icon}</span>
                <span className={styles.iconBtnLabel}>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.stripBottom}>
            {/* Connection chip */}
            {mode !== 'offline' && (
              <div className={styles.connChip} title={mode === 'local' ? 'Modo local (LAN directo)' : 'Conectado a la nube'}>
                <span className={`${styles.connDot} ${mode === 'local' ? styles.connDotGreen : styles.connDotAmber}`} />
              </div>
            )}
            {/* Account / logout */}
            <button
              className={`${styles.iconBtn} ${activeTab === 'cuenta' && panelOpen ? styles.iconBtnActive : ''}`}
              onClick={() => handleTabClick('cuenta')}
              title="Cuenta"
            >
              <span className={styles.iconBtnIcon}>👤</span>
              <span className={styles.iconBtnLabel}>Cuenta</span>
            </button>
          </div>
        </nav>

        {/* ── Content panel ──────────────────────────────────────── */}
        <div className={`${styles.contentPanel} ${panelOpen && sidebarVisible ? styles.contentPanelOpen : ''}`}>
          {panelOpen && (
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                {TABS.find(t => t.id === activeTab)?.label ?? 'Cuenta'}
              </span>
              <button className={styles.panelClose} onClick={() => setPanelOpen(false)} title="Ocultar panel">
                ‹
              </button>
            </div>
          )}
          {activeTab === 'widgets' && <Sidebar onAddWidget={() => setPanelOpen(false)} />}
          {activeTab === 'props'   && <PropertiesPanel />}
          {activeTab === 'temas'   && <ThemePicker />}
          {activeTab === 'iconos'  && <GlobalIconSettings />}
          {activeTab === 'hubs'    && <HubsTab />}
          {activeTab === 'cuenta'  && (
            <div className={styles.cuentaPanel}>
              <div className={styles.cuentaTitle}>👤 admin</div>
              <div className={styles.cuentaSub}>Sesión activa · cookie 30 días</div>
              <button className={styles.logoutBtn} onClick={onLogout}>
                ⏻ Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {/* ── Canvas ─────────────────────────────────────────────── */}
        <div className={styles.canvasArea}>
          <Canvas />
        </div>
      </div>
    </>
  );
}

function AppInner({ onLogout }) {
  const { state: metaState } = useMeta();
  const { activeDashboardId } = metaState;
  const storageKey = `domotica-dashboard-${activeDashboardId}`;

  return (
    <DashboardProvider key={activeDashboardId} storageKey={storageKey}>
      <SyncProvider>
        <AppContent onLogout={onLogout} />
      </SyncProvider>
    </DashboardProvider>
  );
}

const SESSION_KEY = 'domotica_session_expiry';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then(r => {
        if (r.ok) {
          setAuthenticated(true);
        } else {
          // 401 — real auth failure, clear cached session
          localStorage.removeItem(SESSION_KEY);
        }
      })
      .catch(() => {
        // Network error (Render unreachable) — trust local session if not expired
        const expiry = parseInt(localStorage.getItem(SESSION_KEY) || '0');
        if (expiry > Date.now()) setAuthenticated(true);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleAuth = () => {
    localStorage.setItem(SESSION_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setAuthenticated(true);
  };

  const handleLogout = async () => {
    localStorage.removeItem(SESSION_KEY);
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    setAuthenticated(false);
  };

  if (!authChecked) return null;
  if (!authenticated) return <Login onAuth={handleAuth} />;

  return (
    <MetaProvider>
      <HubProvider>
        <CalendarProvider>
          <DashboardTabs />
          <DndProvider backend={HTML5Backend}>
            <AppInner onLogout={handleLogout} />
          </DndProvider>
        </CalendarProvider>
      </HubProvider>
    </MetaProvider>
  );
}

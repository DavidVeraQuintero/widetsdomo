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
import StatusBar from './components/StatusBar/StatusBar.jsx';
import AdminPanel from './components/Admin/AdminPanel.jsx';
import HomePicker from './components/Auth/HomePicker.jsx';
import HomeBar from './components/Admin/HomeBar.jsx';

const TABS = [
  { id: 'widgets', icon: '📦', label: 'Widgets' },
  { id: 'props',   icon: '⚙️',  label: 'Propiedades' },
  { id: 'temas',   icon: '🎨', label: 'Temas' },
  { id: 'iconos',  icon: '🔣', label: 'Iconos' },
  { id: 'hubs',    icon: '🏠', label: 'Hubs' },
];

function AppContent({ onLogout, onExitHome, homeName }) {
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
        {!sidebarVisible && (
          <button className={styles.hamburger} onClick={() => setSidebarVisible(true)} title="Mostrar panel">☰</button>
        )}

        <nav className={`${styles.iconStrip} ${!sidebarVisible ? styles.iconStripHidden : ''}`}>
          <div className={styles.stripTop}>
            <button className={styles.collapseBtn} onClick={() => { setSidebarVisible(false); setPanelOpen(false); }} title="Ocultar panel">☰</button>
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
            {mode !== 'offline' && (
              <div className={styles.connChip} title={mode === 'local' ? 'Modo local (LAN directo)' : 'Conectado a la nube'}>
                <span className={`${styles.connDot} ${mode === 'local' ? styles.connDotGreen : styles.connDotAmber}`} />
              </div>
            )}
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

        <div className={`${styles.contentPanel} ${panelOpen && sidebarVisible ? styles.contentPanelOpen : ''}`}>
          {panelOpen && (
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>
                {TABS.find(t => t.id === activeTab)?.label ?? 'Cuenta'}
              </span>
              <button className={styles.panelClose} onClick={() => setPanelOpen(false)} title="Ocultar panel">‹</button>
            </div>
          )}
          {activeTab === 'widgets' && <Sidebar onAddWidget={() => setPanelOpen(false)} />}
          {activeTab === 'props'   && <PropertiesPanel />}
          {activeTab === 'temas'   && <ThemePicker />}
          {activeTab === 'iconos'  && <GlobalIconSettings />}
          {activeTab === 'hubs'    && <HubsTab />}
          {activeTab === 'cuenta'  && (
            <div className={styles.cuentaPanel}>
              <HomeBar homeName={homeName} onExit={onExitHome} />
              <button className={styles.logoutBtn} onClick={onLogout}>⏻ Cerrar sesión</button>
            </div>
          )}
        </div>

        <div className={styles.canvasArea}>
          <Canvas />
          <StatusBar mode={mode} />
        </div>
      </div>
    </>
  );
}

function AppInner({ onLogout, onExitHome, homeName }) {
  const { state: metaState } = useMeta();
  const { activeDashboardId } = metaState;
  const storageKey = `domotica-dashboard-${activeDashboardId}`;

  return (
    <DashboardProvider key={activeDashboardId} storageKey={storageKey}>
      <SyncProvider>
        <AppContent onLogout={onLogout} onExitHome={onExitHome} homeName={homeName} />
      </SyncProvider>
    </DashboardProvider>
  );
}

const SESSION_KEY = 'domotica_session_expiry';

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null); // { ok, isAdmin, email, homeId, homeName? } | null

  const loadSession = () => {
    setSessionChecked(false);
    fetch('/api/session/info')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.ok) {
          localStorage.setItem(SESSION_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
          setSessionInfo(data);
        } else {
          localStorage.removeItem(SESSION_KEY);
          setSessionInfo(null);
        }
      })
      .catch(() => {
        const expiry = parseInt(localStorage.getItem(SESSION_KEY) || '0');
        if (expiry > Date.now()) {
          setSessionInfo({ ok: true, isAdmin: false, email: null, homeId: null });
        } else {
          setSessionInfo(null);
        }
      })
      .finally(() => setSessionChecked(true));
  };

  useEffect(() => { loadSession(); }, []);

  const handleAuth = () => { loadSession(); };

  const handleLogout = async () => {
    localStorage.removeItem(SESSION_KEY);
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    setSessionInfo(null);
  };

  const handleEnterHome = (homeId, homeName) => {
    // Clear stale localStorage before providers mount so they start with clean defaults
    Object.keys(localStorage)
      .filter(k => k.startsWith('domotica'))
      .forEach(k => localStorage.removeItem(k));
    setSessionInfo(prev => ({ ...prev, homeId, homeName }));
  };

  const handleExitHome = async () => {
    await fetch('/api/session/exit-home', { method: 'POST' }).catch(() => {});
    setSessionInfo(prev => ({ ...prev, homeId: null, homeName: null }));
  };

  if (!sessionChecked) return null;
  if (!sessionInfo) return <Login onAuth={handleAuth} />;

  const { isAdmin, homeId, homeName } = sessionInfo;

  if (isAdmin && !homeId) {
    return <AdminPanel onEnterHome={handleEnterHome} onLogout={handleLogout} />;
  }

  if (!isAdmin && !homeId) {
    return <HomePicker onEnterHome={handleEnterHome} onLogout={handleLogout} />;
  }

  return (
    <MetaProvider>
      <HubProvider>
        <CalendarProvider>
          <DashboardTabs />
          <DndProvider backend={HTML5Backend}>
            <AppInner onLogout={handleLogout} onExitHome={handleExitHome} homeName={homeName} />
          </DndProvider>
        </CalendarProvider>
      </HubProvider>
    </MetaProvider>
  );
}

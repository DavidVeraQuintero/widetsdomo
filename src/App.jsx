import { useState, useRef, useEffect } from 'react';
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
import { useConnectivity } from './hooks/useConnectivity.js';
import OfflineModal from './components/Modal/OfflineModal.jsx';

const TABS = [
  { id: 'widgets', icon: '📦', label: 'Widgets' },
  { id: 'props',   icon: '⚙',  label: 'Propiedades' },
  { id: 'temas',   icon: '🎨', label: 'Temas' },
  { id: 'iconos',  icon: '🔣', label: 'Iconos' },
  { id: 'hubs',    icon: '🏠', label: 'Hubs' },
];

function AppContent({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, pos, onMouseDown, onTouchStart }) {
  const { dispatch } = useDashboard();
  const { hubs } = useHub();
  const mode = useConnectivity(hubs[0] ?? null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [sidebarOpen, setSidebarOpen]);

  // Handle widget drag on mobile globally
  useEffect(() => {
    const handleTouchMove = (e) => {
      const widgetId = typeof window !== 'undefined' ? window.widgetIdBeingDragged : null;
      if (!widgetId) return;

      const touch = e.touches?.[0];
      if (!touch) return;

      const canvas = document.querySelector('[class*="canvasInner"]');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const newX = Math.max(0, touch.clientX - rect.left);
      const newY = Math.max(0, touch.clientY - rect.top);

      dispatch({ type: 'MOVE_WIDGET', id: widgetId, x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      const isClosingSidebar = typeof window !== 'undefined' ? window.closingSidebar : false;
      if (isClosingSidebar) return;
      if (typeof window !== 'undefined') window.widgetIdBeingDragged = null;
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
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
      {mode !== 'offline' && (
        <div style={{
          position: 'fixed', bottom: 10, right: 10, zIndex: 200,
          background: 'rgba(10,18,40,0.7)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999,
          padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,0.55)',
          display: 'flex', alignItems: 'center', gap: 5, pointerEvents: 'none',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: mode === 'online' ? '#22c55e' : '#f59e0b', display: 'inline-block' }} />
          {mode === 'online' ? 'Cloud' : 'Local'}
        </div>
      )}
      <div className={styles.layout}>
        <Canvas />
        <div ref={panelRef} className={styles.floatingPanel} style={{ left: pos.x, top: pos.y, display: sidebarOpen ? 'flex' : 'none' }}>
          <div className={styles.dragHandle} onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
            <span className={styles.dragDots}>⠿</span>
          </div>
          <div className={styles.tabBar}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
              >
                {tab.icon}
              </button>
            ))}
            <button
              className={styles.tabClose}
              onClick={() => setSidebarOpen(false)}
              title="Cerrar panel"
            >
              ✕
            </button>
          </div>
          <div className={styles.tabContent}>
            {activeTab === 'widgets' && <Sidebar onAddWidget={() => setSidebarOpen(false)} />}
            {activeTab === 'props'   && <PropertiesPanel />}
            {activeTab === 'temas'   && <ThemePicker />}
            {activeTab === 'iconos'  && <GlobalIconSettings />}
            {activeTab === 'hubs'    && <HubsTab />}
          </div>
        </div>
        {!sidebarOpen ? (
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(true)}
            title="Mostrar panel"
          >
            ☰
          </button>
        ) : null}
      </div>
    </>
  );
}

function AppInner() {
  const { state: metaState } = useMeta();
  const { activeDashboardId } = metaState;
  const storageKey = `domotica-dashboard-${activeDashboardId}`;

  // Panel state lives here — survives dashboard switches (DashboardProvider remounts but AppInner doesn't)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('widgets');
  const [pos, setPos] = useState({ x: 12, y: 12 });
  const dragOffset = useRef(null);

  const startDrag = (clientX, clientY, isTouch = false) => {
    dragOffset.current = { dx: clientX - pos.x, dy: clientY - pos.y };
    const onMove = (e) => {
      const x = isTouch && e.touches ? e.touches[0].clientX : e.clientX;
      const y = isTouch && e.touches ? e.touches[0].clientY : e.clientY;
      setPos({ x: x - dragOffset.current.dx, y: y - dragOffset.current.dy });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
    if (isTouch) {
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    } else {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }
  };

  const handleMouseDown = (e) => { startDrag(e.clientX, e.clientY, false); e.preventDefault(); };
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    startDrag(e.touches[0].clientX, e.touches[0].clientY, true);
    e.preventDefault();
  };

  return (
    <DashboardProvider key={activeDashboardId} storageKey={storageKey}>
      <SyncProvider>
        <AppContent
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pos={pos}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
      </SyncProvider>
    </DashboardProvider>
  );
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then(r => { if (r.ok) setAuthenticated(true); })
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);

  if (!authChecked) return null;

  if (!authenticated) {
    return <Login onAuth={() => setAuthenticated(true)} />;
  }

  return (
    <MetaProvider>
      <HubProvider>
        <CalendarProvider>
          <DashboardTabs />
          <DndProvider backend={HTML5Backend}>
            <AppInner />
          </DndProvider>
        </CalendarProvider>
      </HubProvider>
    </MetaProvider>
  );
}

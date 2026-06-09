import { useState, useRef } from 'react';
import { MetaProvider, useMeta } from './store/metaStore.jsx';
import { DashboardProvider } from './store/dashboardStore.jsx';
import { CalendarProvider } from './store/calendarStore.jsx';
import DashboardTabs from './components/DashboardTabs/DashboardTabs.jsx';
import ThemeApplier from './components/ThemeApplier.jsx';
import Sidebar from './components/Sidebar/Sidebar';
import Canvas from './components/Canvas/Canvas';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import ThemePicker from './components/Canvas/ThemePicker';
import GlobalIconSettings from './components/GlobalIconSettings/GlobalIconSettings';
import styles from './App.module.css';

const TABS = [
  { id: 'widgets', icon: '📦', label: 'Widgets' },
  { id: 'props',   icon: '⚙',  label: 'Propiedades' },
  { id: 'temas',   icon: '🎨', label: 'Temas' },
  { id: 'iconos',  icon: '🔣', label: 'Iconos' },
];

function AppInner() {
  const { state: metaState } = useMeta();
  const { activeDashboardId } = metaState;
  const storageKey = `domotica-dashboard-${activeDashboardId}`;

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

  const handleMouseDown = (e) => {
    startDrag(e.clientX, e.clientY, false);
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY, true);
    e.preventDefault();
  };

  return (
    <DashboardProvider key={activeDashboardId} storageKey={storageKey}>
      <ThemeApplier />
      <div className={styles.layout}>
        <Canvas />
        {sidebarOpen ? (
          <div className={styles.floatingPanel} style={{ left: pos.x, top: pos.y }}>
            <div className={styles.dragHandle} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
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
              {activeTab === 'widgets' && <Sidebar />}
              {activeTab === 'props'   && <PropertiesPanel />}
              {activeTab === 'temas'   && <ThemePicker />}
              {activeTab === 'iconos'  && <GlobalIconSettings />}
            </div>
          </div>
        ) : (
          <button
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(true)}
            title="Mostrar panel"
          >
            ☰
          </button>
        )}
      </div>
    </DashboardProvider>
  );
}

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'unconfigured_client_id';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <MetaProvider>
        <CalendarProvider>
          <DashboardTabs />
          <AppInner />
        </CalendarProvider>
      </MetaProvider>
    </GoogleOAuthProvider>
  );
}

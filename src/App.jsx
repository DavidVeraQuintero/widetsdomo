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

  const startDrag = (e) => {
    dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    const onMove = (e) => {
      setPos({ x: e.clientX - dragOffset.current.dx, y: e.clientY - dragOffset.current.dy });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    e.preventDefault();
  };

  return (
    <DashboardProvider key={activeDashboardId} storageKey={storageKey}>
      <ThemeApplier />
      <div className={styles.layout}>
        <Canvas />
        {sidebarOpen ? (
          <div className={styles.floatingPanel} style={{ left: pos.x, top: pos.y }}>
            <div className={styles.dragHandle} onMouseDown={startDrag}>
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

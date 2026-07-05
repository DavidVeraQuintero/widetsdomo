import { useEffect, useRef } from 'react';
import { useDashboard } from '../store/dashboardStore.jsx';
import { loadImage } from '../store/imageDB.js';

export default function ThemeApplier() {
  const { state } = useDashboard();
  const { theme } = state;
  const objUrlRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;

    if (theme.room.startsWith('custom-')) {
      delete root.dataset.room;
      const customBg = theme.customBackgrounds?.find(bg => bg.id === theme.room);
      if (customBg?.url) {
        // Server image: use URL directly, no IndexedDB blob needed
        if (objUrlRef.current) { URL.revokeObjectURL(objUrlRef.current); objUrlRef.current = null; }
        root.style.setProperty('--bg-photo', `url(${customBg.url})`);
      } else {
        // IndexedDB fallback (offline-uploaded images)
        loadImage(theme.room).then(url => {
          if (!url) return;
          if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
          objUrlRef.current = url;
          root.style.setProperty('--bg-photo', `url(${url})`);
        });
      }
    } else {
      if (objUrlRef.current) {
        URL.revokeObjectURL(objUrlRef.current);
        objUrlRef.current = null;
      }
      root.style.removeProperty('--bg-photo');
      root.dataset.room = theme.room;
    }

    root.dataset.palette = theme.palette;
    root.dataset.time = theme.time;
  }, [theme.room, theme.palette, theme.time, theme.customBackgrounds]);

  useEffect(() => {
    return () => {
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    };
  }, []);

  return null;
}

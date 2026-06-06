import { useRef, useState, useEffect } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { useMeta } from '../../store/metaStore.jsx';
import { MAX_DASHBOARDS } from '../../config.js';
import { saveImage, loadImage, deleteImage } from '../../store/imageDB.js';
import NewDashboardDialog from '../DashboardTabs/NewDashboardDialog.jsx';
import styles from './ThemePicker.module.css';

const ROOMS = [
  { id: 'sala',       emoji: '🛋️', label: 'Sala' },
  { id: 'dormitorio', emoji: '🛏️', label: 'Dorm.' },
  { id: 'cocina',     emoji: '🍳', label: 'Cocina' },
  { id: 'jardin',     emoji: '🌿', label: 'Jardín' },
];

const PALETTES = [
  { id: 'calido', label: 'Cálido',  from: '#c8852a', to: '#f4c96e' },
  { id: 'frio',   label: 'Frío',    from: '#1e3a5f', to: '#7dd3fc' },
  { id: 'oscuro', label: 'Oscuro',  from: '#1c1c1c', to: '#d4af37' },
  { id: 'neutro', label: 'Neutro',  from: '#374151', to: '#d1d5db' },
];

const TIMES = [
  { id: 'amanecer',  emoji: '🌅', label: 'Amanecer' },
  { id: 'dia',       emoji: '☀️', label: 'Día' },
  { id: 'atardecer', emoji: '🌇', label: 'Atardecer' },
  { id: 'noche',     emoji: '🌙', label: 'Noche' },
];

const RGB_STYLES = [
  { id: 'border', emoji: '🔲', label: 'Borde' },
  { id: 'tint',   emoji: '🎨', label: 'Tinte' },
  { id: 'bar',    emoji: '▬',  label: 'Barra' },
];

async function resizeImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    const tmpUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      const scale = img.width > MAX ? MAX / img.width : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(tmpUrl);
      canvas.toBlob(resolve, 'image/jpeg', 0.85);
    };
    img.src = tmpUrl;
  });
}

function CustomChip({ bg, isSelected, onSelect, onDelete }) {
  const [thumbUrl, setThumbUrl] = useState(null);

  useEffect(() => {
    let url;
    loadImage(bg.id).then(u => {
      url = u;
      setThumbUrl(u);
    });
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [bg.id]);

  return (
    <button
      className={`${styles.roomBtn} ${styles.customChip} ${isSelected ? styles.sel : ''}`}
      style={thumbUrl ? { backgroundImage: `url(${thumbUrl})` } : undefined}
      onClick={() => onSelect(bg.id)}
      title={bg.label}
    >
      <span
        className={styles.deleteBtn}
        role="button"
        onClick={e => { e.stopPropagation(); onDelete(bg.id); }}
      >✕</span>
    </button>
  );
}

export default function ThemePicker() {
  const { state, dispatch } = useDashboard();
  const { state: metaState, dispatch: metaDispatch } = useMeta();
  const { theme } = state;
  const { dashboards, activeDashboardId } = metaState;
  const fileRef = useRef(null);
  const [showCreate, setShowCreate] = useState(false);

  const canDelete  = dashboards.length > 1;
  const atLimit    = dashboards.length >= MAX_DASHBOARDS;
  const hasWidgets = state.widgets.length > 0;

  const set = patch => dispatch({ type: 'SET_THEME', patch });

  function handleCreate(name) {
    metaDispatch({ type: 'CREATE_DASHBOARD', name });
    setShowCreate(false);
  }

  function handleDeleteDashboard() {
    if (!window.confirm('¿Eliminar el dashboard actual y todos sus widgets? Esta acción no se puede deshacer.')) return;
    metaDispatch({ type: 'DELETE_DASHBOARD', id: activeDashboardId });
  }

  function handleClear() {
    if (!window.confirm('¿Limpiar todos los widgets del dashboard actual? Esta acción no se puede deshacer.')) return;
    dispatch({ type: 'CLEAR_CANVAS' });
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const blob = await resizeImage(file);
    const id = `custom-${Date.now()}`;
    await saveImage(id, blob);
    dispatch({ type: 'ADD_CUSTOM_BG', payload: { id, label: file.name } });
    set({ room: id });
  }

  async function handleDelete(id) {
    await deleteImage(id);
    dispatch({ type: 'REMOVE_CUSTOM_BG', id });
  }

  const canAdd = theme.customBackgrounds.length < 3;

  return (
    <div className={styles.picker}>
      <div className={styles.section}>
        <div className={styles.label}>AMBIENTE</div>
        <div className={styles.roomGrid}>
          {ROOMS.map(r => (
            <button
              key={r.id}
              className={`${styles.roomBtn} ${theme.room === r.id ? styles.sel : ''}`}
              onClick={() => set({ room: r.id })}
            >
              <span className={styles.emoji}>{r.emoji}</span>
              {r.label}
            </button>
          ))}
          {theme.customBackgrounds.map(bg => (
            <CustomChip
              key={bg.id}
              bg={bg}
              isSelected={theme.room === bg.id}
              onSelect={id => set({ room: id })}
              onDelete={handleDelete}
            />
          ))}
          {canAdd && (
            <button
              className={`${styles.roomBtn} ${styles.addBtn}`}
              onClick={() => fileRef.current.click()}
            >
              <span className={styles.emoji}>＋</span>
              Añadir
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.label}>PALETA</div>
        <div className={styles.paletteRow}>
          {PALETTES.map(p => (
            <button
              key={p.id}
              className={`${styles.paletteChip} ${theme.palette === p.id ? styles.sel : ''}`}
              style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
              title={p.label}
              onClick={() => set({ palette: p.id })}
            />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>HORA</div>
        <div className={styles.timePills}>
          {TIMES.map(t => (
            <button
              key={t.id}
              className={`${styles.timePill} ${theme.time === t.id ? styles.sel : ''}`}
              onClick={() => set({ time: t.id })}
            >
              {t.emoji}<br />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>ESTILO RGB</div>
        <div className={styles.timePills}>
          {RGB_STYLES.map(s => (
            <button
              key={s.id}
              className={`${styles.timePill} ${theme.rgbStyle === s.id ? styles.sel : ''}`}
              onClick={() => set({ rgbStyle: s.id })}
            >
              {s.emoji}<br />{s.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>TAMAÑO</div>
        <div className={styles.gridRow}>
          <div className={styles.gridField}>
            <span className={styles.gridFieldLabel}>Ancho (col)</span>
            <div className={styles.stepper}>
              <button className={styles.stepBtn}
                onClick={() => dispatch({ type: 'SET_GRID', patch: { cols: Math.max(4, state.grid.cols - 1) } })}>−</button>
              <span className={styles.stepVal}>{state.grid.cols}</span>
              <button className={styles.stepBtn}
                onClick={() => dispatch({ type: 'SET_GRID', patch: { cols: Math.min(24, state.grid.cols + 1) } })}>+</button>
            </div>
          </div>
          <div className={styles.gridField}>
            <span className={styles.gridFieldLabel}>Alto (fila)</span>
            <div className={styles.stepper}>
              <button className={styles.stepBtn}
                onClick={() => dispatch({ type: 'SET_GRID', patch: { rows: Math.max(2, state.grid.rows - 1) } })}>−</button>
              <span className={styles.stepVal}>{state.grid.rows}</span>
              <button className={styles.stepBtn}
                onClick={() => dispatch({ type: 'SET_GRID', patch: { rows: Math.min(16, state.grid.rows + 1) } })}>+</button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.clearSection}>
        <div className={styles.label}>DASHBOARD</div>
        <div className={styles.btnRow}>
          <button
            className={styles.createBtn}
            onClick={() => setShowCreate(true)}
            disabled={atLimit}
            title={atLimit ? `Límite de ${MAX_DASHBOARDS} dashboards alcanzado` : 'Crear nuevo dashboard'}
          >
            + Crear Dashboard
          </button>
          <button
            className={styles.dangerBtn}
            onClick={handleDeleteDashboard}
            disabled={!canDelete}
            title={!canDelete ? 'No se puede eliminar el único dashboard' : 'Eliminar dashboard actual'}
          >
            🗑 Eliminar
          </button>
        </div>
        <button
          className={styles.clearBtn}
          onClick={handleClear}
          disabled={!hasWidgets}
          title={!hasWidgets ? 'El dashboard no tiene widgets' : 'Eliminar todos los widgets del dashboard'}
        >
          ✕ Limpiar Dashboard
        </button>
      </div>
      {showCreate && (
        <NewDashboardDialog
          onConfirm={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

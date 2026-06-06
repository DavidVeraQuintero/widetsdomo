# Custom Backgrounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir al usuario subir hasta 3 imágenes propias como fondos del dashboard, integradas en la sección AMBIENTE del ThemePicker junto a los ambientes predefinidos.

**Architecture:** Las imágenes se guardan como blobs en IndexedDB (`widgets-images` DB). Los metadatos (`id`, `label`) se persisten en localStorage dentro del objeto `theme.customBackgrounds`. `ThemeApplier` detecta rooms con prefijo `custom-` y aplica `--bg-photo` como inline style usando object URLs.

**Tech Stack:** React 18, Vite, CSS Modules, IndexedDB (nativo), Canvas API (nativo)

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/store/imageDB.js` | Crear | CRUD de imágenes en IndexedDB |
| `src/store/dashboardStore.jsx` | Modificar | Estado `customBackgrounds`, acciones ADD/REMOVE |
| `src/components/ThemeApplier.jsx` | Modificar | Soporte para rooms `custom-*` |
| `src/components/Canvas/ThemePicker.jsx` | Modificar | UI: chips personalizados, upload, botón + |
| `src/components/Canvas/ThemePicker.module.css` | Modificar | Estilos para chips personalizados y botón + |

---

### Task 1: Crear módulo IndexedDB (`src/store/imageDB.js`)

**Files:**
- Create: `src/store/imageDB.js`

- [ ] **Step 1: Crear el archivo con las 4 funciones**

Crear `src/store/imageDB.js` con el siguiente contenido completo:

```js
const DB_NAME = 'widgets-images';
const DB_VERSION = 1;
const STORE = 'backgrounds';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

export async function saveImage(id, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ id, blob });
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

export async function loadImage(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = e => {
      if (e.target.result) resolve(URL.createObjectURL(e.target.result.blob));
      else resolve(null);
    };
    req.onerror = e => reject(e.target.error);
  });
}

export async function deleteImage(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}
```

- [ ] **Step 2: Verificar en consola del navegador**

Con la app corriendo (`npm run dev`), abre DevTools → Console y ejecuta:

```js
import('/src/store/imageDB.js').then(async m => {
  const blob = new Blob(['fake'], { type: 'image/jpeg' });
  await m.saveImage('test-id', blob);
  const url = await m.loadImage('test-id');
  console.log('URL ok:', url.startsWith('blob:'));
  await m.deleteImage('test-id');
  const gone = await m.loadImage('test-id');
  console.log('Deleted ok:', gone === null);
});
```

Esperado: `URL ok: true` y `Deleted ok: true`

- [ ] **Step 3: Commit**

```bash
git add src/store/imageDB.js
git commit -m "feat: add IndexedDB module for custom background images"
```

---

### Task 2: Extender `dashboardStore.jsx`

**Files:**
- Modify: `src/store/dashboardStore.jsx`

- [ ] **Step 1: Añadir `customBackgrounds` al estado por defecto**

En `DEFAULT_STATE`, modificar el objeto `theme`:

```js
theme: { room: 'sala', palette: 'calido', time: 'atardecer', rgbStyle: 'border', customBackgrounds: [] },
```

- [ ] **Step 2: Asegurar que `loadState` hidrata `customBackgrounds`**

En la función `loadState`, la línea que hidrata `theme` ya hace spread de DEFAULT_STATE.theme, por lo que `customBackgrounds` quedará como `[]` si no existe en localStorage. No necesita cambio adicional.

Verificar que la línea existente dice:
```js
theme: { ...DEFAULT_STATE.theme, ...(saved.theme ?? {}) },
```

Si es así, no tocar nada.

- [ ] **Step 3: Añadir los dos nuevos casos al reducer**

Dentro del `switch` en `reducer`, justo antes del `case 'SET_THEME'`, añadir:

```js
case 'ADD_CUSTOM_BG': {
  if (state.theme.customBackgrounds.length >= 3) return state;
  const next = {
    ...state,
    theme: {
      ...state.theme,
      customBackgrounds: [...state.theme.customBackgrounds, action.payload],
    },
  };
  persist(next);
  return next;
}
case 'REMOVE_CUSTOM_BG': {
  const next = {
    ...state,
    theme: {
      ...state.theme,
      customBackgrounds: state.theme.customBackgrounds.filter(bg => bg.id !== action.id),
      room: state.theme.room === action.id ? 'sala' : state.theme.room,
    },
  };
  persist(next);
  return next;
}
```

- [ ] **Step 4: Verificar en la app**

Abre DevTools → Application → Local Storage → `localhost`. Despacha desde la consola:

```js
// Pega esto en consola, en el contexto de la app React
window.__dispatch?.({ type: 'ADD_CUSTOM_BG', payload: { id: 'custom-test', label: 'test.jpg' } })
```

(Si `__dispatch` no existe, este paso se verifica visualmente en Task 4.)

- [ ] **Step 5: Commit**

```bash
git add src/store/dashboardStore.jsx
git commit -m "feat: add customBackgrounds to theme state with ADD/REMOVE actions"
```

---

### Task 3: Actualizar `ThemeApplier.jsx`

**Files:**
- Modify: `src/components/ThemeApplier.jsx`

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

```jsx
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
      loadImage(theme.room).then(url => {
        if (!url) return;
        if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
        objUrlRef.current = url;
        root.style.setProperty('--bg-photo', `url(${url})`);
      });
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
  }, [theme.room, theme.palette, theme.time]);

  useEffect(() => {
    return () => {
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    };
  }, []);

  return null;
}
```

- [ ] **Step 2: Verificar que los rooms predefinidos siguen funcionando**

Corre la app (`npm run dev`). Cambia entre Sala, Dorm., Cocina, Jardín en el ThemePicker. El fondo debe cambiar igual que antes.

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeApplier.jsx
git commit -m "feat: ThemeApplier supports custom- room ids via IndexedDB object URLs"
```

---

### Task 4: Actualizar `ThemePicker.jsx`

**Files:**
- Modify: `src/components/Canvas/ThemePicker.jsx`

- [ ] **Step 1: Reemplazar el contenido completo del archivo**

```jsx
import { useRef, useState, useEffect } from 'react';
import { useDashboard } from '../../store/dashboardStore.jsx';
import { saveImage, loadImage, deleteImage } from '../../store/imageDB.js';
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
  const { theme } = state;
  const fileRef = useRef(null);

  const set = patch => dispatch({ type: 'SET_THEME', patch });

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
    </div>
  );
}
```

- [ ] **Step 2: Verificar compilación sin errores**

```bash
npm run build
```

Esperado: sin errores. Warnings de tamaño de bundle son aceptables.

- [ ] **Step 3: Commit**

```bash
git add src/components/Canvas/ThemePicker.jsx
git commit -m "feat: ThemePicker with custom background upload chips and + button"
```

---

### Task 5: Añadir estilos CSS para chips personalizados

**Files:**
- Modify: `src/components/Canvas/ThemePicker.module.css`

- [ ] **Step 1: Añadir las clases nuevas al final del archivo**

Añadir al final de `ThemePicker.module.css`:

```css
/* Custom background chips */
.customChip {
  background-size: cover;
  background-position: center;
  position: relative;
  padding: 0;
  min-height: 46px;
  overflow: visible;
}

.deleteBtn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.90);
  border: 1px solid rgba(255, 255, 255, 0.30);
  color: white;
  font-size: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  z-index: 1;
  transition: background 0.15s;
}
.deleteBtn:hover { background: #ef4444; }

/* Add button */
.addBtn {
  border-style: dashed;
  color: #475569;
  font-size: 9px;
}
.addBtn:hover { color: #94a3b8; }
```

- [ ] **Step 2: Verificar la rejilla en el navegador**

Corre la app. Abre el ThemePicker. Verifica:
- Los 4 ambientes predefinidos siguen igual
- El botón "＋ Añadir" aparece después de los predefinidos
- Clic en "＋ Añadir" → abre el selector de archivos del SO
- Selecciona una imagen → aparece como chip con miniatura en la rejilla
- El fondo del dashboard cambia a tu imagen
- La ✕ roja aparece en la esquina del chip
- Clic en ✕ → elimina el chip y el fondo vuelve a Sala
- Subir 3 imágenes → el botón "＋ Añadir" desaparece
- Recargar página → los chips personalizados persisten con sus miniaturas

- [ ] **Step 3: Commit final**

```bash
git add src/components/Canvas/ThemePicker.module.css
git commit -m "style: add CSS for custom background chips, delete button, and add button"
```

---

## Verificación final de spec

| Requisito del spec | Task |
|---|---|
| Subir imagen desde dispositivo | Task 4 (`handleFile`) |
| Redimensionar a 1200px, JPEG 0.85 | Task 4 (`resizeImage`) |
| Guardar blob en IndexedDB | Task 1 (`saveImage`) |
| Metadatos en localStorage | Task 2 (`ADD_CUSTOM_BG`) |
| Máximo 3 fondos | Task 2 (guard en reducer) + Task 4 (`canAdd`) |
| Chips con miniatura real | Task 4 (`CustomChip`) + Task 5 (`.customChip`) |
| Botón ✕ para eliminar | Task 4 (`handleDelete`) + Task 5 (`.deleteBtn`) |
| Botón ✕ desaparece al eliminar el room activo → fallback sala | Task 2 (`REMOVE_CUSTOM_BG`) |
| Botón ＋ oculto cuando hay 3 | Task 4 (`canAdd`) |
| `--bg-photo` como inline style para custom rooms | Task 3 (`ThemeApplier`) |
| Revoke object URLs (no memory leaks) | Task 3 (cleanup effect) + Task 4 (`CustomChip` cleanup) |
| Persiste al recargar | Task 1 (IndexedDB) + Task 2 (localStorage metadata) |

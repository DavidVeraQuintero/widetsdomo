# Mejora de Widget de Cámara IP - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mejorar el widget CamaraIP con visualización en tiempo real, grabación, captura de pantalla, y información completa en dos vistas (compacta y modal expandida).

**Architecture:** El componente será unificado con lógica condicional para renderizar vista pequeña (grid 2x2) o modal expandido. Usaremos hooks internos para separar concerns: grabación, captura de pantalla, y estado de cámara. La imagen estática simulará el stream de video.

**Tech Stack:** React, CSS custom properties (variables del sistema), Canvas API para captura de pantalla

---

## Estructura de Archivos

**Modificar:**
- `src/components/widgets/CamaraIP.jsx` - Rewrite completo

**Crear (opcional):**
- Imagen estática demo: `public/demo-camera.jpg` (reutilizar si existe)

---

## Task 1: Crear Hooks Internos - useRecording

**Files:**
- Modify: `src/components/widgets/CamaraIP.jsx` (agregar hook al inicio del archivo)

- [ ] **Step 1: Escribir hook useRecording**

Agregar al inicio de CamaraIP.jsx, antes de los componentes:

```javascript
function useRecording(initialState = false) {
  const [recording, setRecording] = useState(initialState);
  const startRecording = useCallback(() => setRecording(true), []);
  const stopRecording = useCallback(() => setRecording(false), []);
  const toggleRecording = useCallback(() => setRecording(r => !r), []);
  return { recording, startRecording, stopRecording, toggleRecording };
}
```

- [ ] **Step 2: Verificar que el hook está importado correctamente**

Ya está en el mismo archivo, no requiere import.

---

## Task 2: Crear Hook - useCameraStatus

**Files:**
- Modify: `src/components/widgets/CamaraIP.jsx`

- [ ] **Step 1: Escribir hook useCameraStatus**

Agregar después de useRecording:

```javascript
function useCameraStatus(config = {}) {
  const [timestamp, setTimestamp] = useState(new Date());
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    timestamp,
    connected,
    resolution: config.resolution || '1920x1080',
    fps: config.fps || 30,
    setConnected,
  };
}
```

---

## Task 3: Crear Hook - useScreenshot

**Files:**
- Modify: `src/components/widgets/CamaraIP.jsx`

- [ ] **Step 1: Escribir hook useScreenshot**

Agregar después de useCameraStatus:

```javascript
function useScreenshot() {
  const takeScreenshot = useCallback((imageSrc, cameraName) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `camara-${cameraName}-${timestamp}.png`;
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      });
    };
    
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
  }, []);

  return { takeScreenshot };
}
```

---

## Task 4: Crear Componente Preview Reutilizable

**Files:**
- Modify: `src/components/widgets/CamaraIP.jsx`

- [ ] **Step 1: Escribir componente Preview**

Reemplazar las dos definiciones `Preview` duplicadas con un componente compartido. Agregar antes de los componentes principales:

```javascript
function CameraPreview({ h = 90, recording, timestamp, imageSrc = 'https://via.placeholder.com/1920x1080?text=Camera+Stream' }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#0a0a0a,#1a1a2e)',
      borderRadius: 6,
      height: h,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      backgroundImage: `url(${imageSrc})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {recording && (
        <div style={{
          position: 'absolute',
          top: 6,
          right: 6,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#ef4444',
          boxShadow: '0 0 6px #ef4444',
        }} />
      )}
      <div style={{
        position: 'absolute',
        bottom: 6,
        left: 8,
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
      }}>
        {timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
}
```

---

## Task 5: Refactor Vista Modal Expandida

**Files:**
- Modify: `src/components/widgets/CamaraIP.jsx` - reemplazar CamaraModal

- [ ] **Step 1: Escribir nuevo CamaraModal con botones flotantes**

Reemplazar el componente `CamaraModal` existente con:

```javascript
function CamaraModal({ 
  recording, 
  name, 
  config, 
  onConfigChange, 
  onClose,
  cameraStatus,
  onScreenshot,
  imageSrc 
}) {
  const icons = useWidgetIcons('camara-ip', config.icons);
  
  return (
    <ModalBase
      title="📹 Cámara IP"
      onClose={onClose}
      borderColor={recording ? '#ef4444' : '#888'}
    >
      <div style={{ position: 'relative' }}>
        {/* Preview grande */}
        <CameraPreview 
          h={300}
          recording={recording}
          timestamp={cameraStatus.timestamp}
          imageSrc={imageSrc}
        />
        
        {/* Botones flotantes */}
        <button
          onClick={() => onConfigChange({ recording: !recording })}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: recording ? '#ef4444' : 'rgba(136, 136, 136, 0.8)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 20,
            transition: 'all 0.2s ease',
          }}
          title={recording ? 'Detener grabación' : 'Iniciar grabación'}
        >
          {recording ? '⏹' : '⏺'}
        </button>
        
        <button
          onClick={() => onScreenshot(imageSrc, name)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(136, 136, 136, 0.8)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 18,
            transition: 'all 0.2s ease',
          }}
          title="Capturar pantalla"
        >
          📸
        </button>
        
        {/* Overlay inferior con información */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.5))',
          padding: '16px 12px',
          color: 'var(--text-primary)',
          fontSize: 12,
        }}>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>{name}</div>
          <div style={{ marginBottom: 4 }}>
            {recording ? '● Grabando' : '○ Inactiva'}
            {' • '}
            <span style={{ color: cameraStatus.connected ? '#22c55e' : '#888' }}>
              {cameraStatus.connected ? '🟢 Conectada' : '⭕ Desconectada'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
            {cameraStatus.resolution} • {cameraStatus.fps} FPS
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
```

---

## Task 6: Refactor Vista Pequeña (Grid 2x2)

**Files:**
- Modify: `src/components/widgets/CamaraIP.jsx` - reemplazar componente principal

- [ ] **Step 1: Reescribir componente CamaraIP principal**

Reemplazar el componente `CamaraIP` existente completamente:

```javascript
export default function CamaraIP({ size, config, onConfigChange, accentColor }) {
  const { recording = false, name = 'Cámara IP' } = config;
  const [modal, setModal] = useState(false);
  
  const recordingHook = useRecording(recording);
  const cameraStatus = useCameraStatus(config);
  const screenshotHook = useScreenshot();
  
  const toggle = () => {
    recordingHook.toggleRecording();
    onConfigChange({ ...config, recording: !recording });
  };
  
  const patchConfig = (p) => onConfigChange({ ...config, ...p });
  const icons = useWidgetIcons('camara-ip', config.icons);
  const longPress = useLongPress(() => setModal(true));
  
  const imageSrc = config.imageSrc || 'https://via.placeholder.com/1920x1080?text=Camera+Stream';

  const Modal = modal && (
    <CamaraModal
      recording={recordingHook.recording}
      name={name}
      config={config}
      onConfigChange={patchConfig}
      onClose={() => setModal(false)}
      cameraStatus={cameraStatus}
      onScreenshot={screenshotHook.takeScreenshot}
      imageSrc={imageSrc}
    />
  );

  if (size === '2x2') {
    return (
      <div className="w-body">
        <div className="w-row">
          <div className="w-name">{name}</div>
          <Toggle on={recordingHook.recording} onToggle={toggle} />
        </div>
        <div style={{ cursor: 'pointer' }} {...longPress}>
          <CameraPreview
            h={90}
            recording={recordingHook.recording}
            timestamp={cameraStatus.timestamp}
            imageSrc={imageSrc}
          />
        </div>
        <div className="w-row">
          <div style={{
            fontSize: 11,
            color: recordingHook.recording ? '#ef4444' : 'var(--text-secondary)',
          }}>
            {recordingHook.recording ? '● Grabando' : '○ Inactiva'}
          </div>
          <div style={{
            fontSize: 11,
            color: cameraStatus.connected ? '#22c55e' : '#888',
          }}>
            {cameraStatus.connected ? '🟢 Conectada' : '⭕ Desconectada'}
          </div>
        </div>
        {Modal}
      </div>
    );
  }

  // Vista más grande (1x3 o similar)
  return (
    <div className="w-body">
      <div className="w-row">
        <div className="w-name">{name}</div>
        <Toggle on={recordingHook.recording} onToggle={toggle} />
      </div>
      <div style={{ cursor: 'pointer' }} {...longPress}>
        <CameraPreview
          h={200}
          recording={recordingHook.recording}
          timestamp={cameraStatus.timestamp}
          imageSrc={imageSrc}
        />
      </div>
      <div className="w-row" style={{ gap: 12 }}>
        <div className="w-status" style={{
          color: recordingHook.recording ? '#ef4444' : 'var(--text-primary)',
          fontWeight: recordingHook.recording ? 600 : 400,
        }}>
          {recordingHook.recording ? '● Grabando' : '○ Inactiva'}
        </div>
        <div style={{
          fontSize: 12,
          color: cameraStatus.connected ? '#22c55e' : '#888',
        }}>
          {cameraStatus.connected ? '🟢 Conectada' : '⭕ Desconectada'}
        </div>
      </div>
      {Modal}
    </div>
  );
}
```

---

## Task 7: Verificar Imports y Testing Manual

**Files:**
- Verify: `src/components/widgets/CamaraIP.jsx`

- [ ] **Step 1: Verificar que todos los imports están presentes**

El archivo debe tener al inicio:

```javascript
import { useState, useCallback, useEffect } from 'react';
import Toggle from './Toggle';
import { useWidgetIcons } from './useWidgetIcons';
import { useLongPress, ModalBase } from './widgetUtils';
```

- [ ] **Step 2: Iniciar dev server y probar manualmente**

Run: `npm run dev` (o el comando correspondiente)

Expected: App inicia sin errores en la consola

- [ ] **Step 3: Navegar al dashboard con widget CamaraIP**

Expected: 
- Widget se ve en grid 2x2 con nombre, toggle, y preview
- El timestamp se actualiza cada segundo
- Estado muestra "● Grabando" o "○ Inactiva"
- Indicador de conexión muestra verde

- [ ] **Step 4: Hacer long press en el widget**

Expected:
- Se abre modal expandido
- Imagen más grande
- Botones flotantes en esquinas superiores
- Overlay con información completa (nombre, resolución, FPS, estado)

- [ ] **Step 5: Probar grabación en modal**

Expected:
- Botón rojo de grabación (esquina superior izquierda)
- Al hacer click, cambia a "Grabando" y indicador rojo parpadeante
- Al hacer click nuevamente, detiene grabación

- [ ] **Step 6: Probar captura de pantalla**

Expected:
- Botón 📸 en esquina superior derecha
- Al hacer click, descarga PNG con nombre: `camara-{nombre}-{timestamp}.png`

- [ ] **Step 7: Verificar que toggle en vista pequeña funciona**

Expected:
- Toggle en esquina superior derecha de widget pequeño
- Al hacer click, cambia estado grabación
- Se refleja en modal si está abierto

---

## Task 8: Commit de Cambios

**Files:**
- Modified: `src/components/widgets/CamaraIP.jsx`

- [ ] **Step 1: Verificar estado de git**

Run: `git status`

Expected: `src/components/widgets/CamaraIP.jsx` modificado

- [ ] **Step 2: Commit**

```bash
git add src/components/widgets/CamaraIP.jsx
git commit -m "feat: improve camera IP widget with recording, screenshots, and dual views

- Add unified component with small grid view and expanded modal
- Implement internal hooks: useRecording, useScreenshot, useCameraStatus
- Display real-time information: timestamp, resolution, FPS, connection status
- Add floating action buttons in modal for recording and screenshots
- Auto-updating timestamp and live connection indicator"
```

---

# Diseño: Widget de Cámara IP Mejorado

**Fecha:** 2026-06-16  
**Estado:** Especificación Inicial  
**Componente:** CamaraIP.jsx

## Resumen Ejecutivo

Mejora del widget de Cámara IP para soportar visualización en tiempo real, grabación, captura de pantalla y toda la información relevante. El widget tendrá dos vistas: una compacta en grid (2x2) y una expandida en modal accesible por long press.

## Visión General

El usuario podrá:
- Ver video en tiempo real (imagen estática para demo, extensible a stream real)
- Grabar/detener grabación
- Capturar pantalla (descargar PNG)
- Ver información completa: timestamp, estado, resolución, FPS, nombre, conexión
- Acceder a controles desde dos contextos: vista pequeña (grid) y vista grande (modal)

## Requerimientos Funcionales

### Vista Pequeña (Grid 2x2)
- Mostrar imagen estática de fondo
- Nombre de cámara (arriba izquierda)
- Toggle grabar/parar (arriba derecha)
- Indicador de estado (ej: "Grabando" rojo o "Conectada" verde)
- Timestamp en esquina inferior izquierda (discreto)
- Long press abre modal expandido

### Vista Grande (Modal)
- Imagen grande que ocupa la mayoría del espacio
- Overlay inferior con información (dark): timestamp, resolución, FPS, nombre, estado
- Botones flotantes:
  - **Esquina superior izquierda:** Grabar (rojo cuando activo)
  - **Esquina superior derecha:** Capturar + Cerrar

### Funcionalidades Principales

#### Grabación
- Botón inicia/detiene grabación
- Visual feedback: indicador rojo cuando está activa
- Simula guardado de datos (para demo)
- Captura timestamp de duración

#### Captura de Pantalla
- Descarga PNG con nombre: `camara-{nombre}-{timestamp}.png`
- Feedback visual: flash o notificación breve
- Accesible desde modal

#### Estado en Tiempo Real
- Timestamp se actualiza cada segundo
- Indicador de conexión (verde = conectada, gris = desconectada)
- FPS: 30 (simulado, extensible a real)
- Resolución: 1920x1080 (configurable)

## Diseño Técnico

### Arquitectura del Componente

**Componente Principal:** `CamaraIP`
- Renderiza vista pequeña o modal según contexto
- Gestiona estado de grabación, modal, captura
- Lógica compartida mediante hooks internos

**Hooks Internos:**
- `useRecording()` — Gestiona estado de grabación
- `useScreenshot()` — Captura y descarga de imagen
- `useCameraStatus()` — Estado de conexión y actualización de timestamp

### Flujo de Datos

```
config (from parent)
  ├── name: string
  ├── resolution: string (1920x1080)
  ├── fps: number (30)
  └── icons: object

state (local)
  ├── recording: boolean
  ├── connected: boolean
  ├── modal: boolean
  └── timestamp: Date
```

### Estructura Visual

**Paleta de Colores:**
- Respeta variables CSS del sistema (`--text-primary`, `--border`, `--icon-on`, etc.)
- Rojo grabación: `#ef4444` (consistente con actual)
- Indicador conectado: `#22c55e` (verde)
- Fondo: gradiente oscuro `135deg, #0a0a0a, #1a1a2e`

### Responsividad

- **2x2:** Vista compacta, preview altura 90px
- **1x3 o mayor:** Preview altura 240px (o apropiada al tamaño)
- Modal: Pantalla completa o modal centrado

## Implementación

### Archivos a Modificar
- `src/components/widgets/CamaraIP.jsx` — Rewrite completo

### Fases
1. **Refactor base:** Estructura unificada con vistas pequeña/grande
2. **Hooks de funcionalidad:** useRecording, useScreenshot, useCameraStatus
3. **Integración visual:** Botones flotantes, overlay de información, feedback
4. **Polish:** Animaciones, transiciones, información

## Testing

### Casos de Prueba
- [ ] Vista pequeña renderiza correctamente (2x2)
- [ ] Long press abre modal
- [ ] Botón grabar inicia/detiene grabación (visual feedback)
- [ ] Captura de pantalla descarga PNG con nombre correcto
- [ ] Timestamp se actualiza cada segundo
- [ ] Indicador de conexión muestra estado
- [ ] Información se muestra en modal (FPS, resolución, nombre, estado)
- [ ] Responsividad en diferentes tamaños

## Futuros

- Integración con stream real (RTSP, HLS, HTTP)
- Historial de grabaciones
- Zoom/PTZ si la cámara lo soporta
- Detección de movimiento y alertas
- Soporte multi-cámara en grid

---

**Aprobado por:** (pendiente usuario)

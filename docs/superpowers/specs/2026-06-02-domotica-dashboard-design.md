# Dashboard Domótica — Diseño

**Fecha:** 2026-06-02  
**Stack:** React + Vite + CSS Modules (sin UI libraries externas)  
**Entregable:** App React que corre con `npm run dev` en localhost

---

## Resumen

Dashboard de domótica con catálogo de widgets de dispositivos del hogar. El usuario arrastra widgets desde un panel lateral al canvas principal y los posiciona libremente. Cada widget tiene tamaños predefinidos (1×1 a 4×4) y muestra el estado simulado del dispositivo.

---

## Arquitectura — Archivos

```
widgets/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx                    # Layout raíz: Sidebar | Canvas | PropertiesPanel
    ├── App.css                    # Tema global dark blue
    ├── store/
    │   └── dashboardStore.js      # Estado global con useReducer + localStorage
    ├── catalog/
    │   └── widgetCatalog.js       # Array WIDGET_CATALOG: todos los tipos de widget
    ├── components/
    │   ├── Sidebar/
    │   │   ├── Sidebar.jsx        # Lista de categorías + buscador
    │   │   └── WidgetItem.jsx     # Item arrastrable del catálogo
    │   ├── Canvas/
    │   │   ├── Canvas.jsx         # Drop zone + grilla
    │   │   └── CanvasWidget.jsx   # Widget instanciado: draggable, seleccionable
    │   ├── PropertiesPanel/
    │   │   └── PropertiesPanel.jsx # Tamaño, X/Y, color acento, eliminar
    │   └── widgets/               # Un componente por tipo de dispositivo
    │       ├── LamparaSimple.jsx
    │       ├── LamparaDimmer.jsx
    │       ├── LamparaRGB.jsx
    │       ├── LamparaCCT.jsx     
    │       ├── TiraLED.jsx
    │       ├── AireAcondicionado.jsx
    │       ├── Termostato.jsx
    │       ├── Ventilador.jsx
    │       ├── Calefactor.jsx
    │       ├── Humidificador.jsx
    │       ├── PurificadorAire.jsx
    │       ├── Puerta.jsx
    │       ├── Ventana.jsx
    │       ├── CerraduraInteligente.jsx
    │       ├── CamaraIP.jsx
    │       ├── SensorMovimiento.jsx
    │       ├── Alarma.jsx
    │       ├── PersianaRoller.jsx
    │       ├── Cortina.jsx
    │       ├── Toldo.jsx
    │       ├── Veneciana.jsx
    │       ├── SensorTempHumedad.jsx
    │       ├── SensorCalidadAire.jsx
    │       ├── SensorHumoGas.jsx
    │       ├── SensorInundacion.jsx
    │       ├── SensorLuminosidad.jsx
    │       ├── EstacionMeteorologica.jsx
    │       ├── Enchufe.jsx
    │       ├── MedidorConsumo.jsx
    │       ├── PanelSolar.jsx
    │       ├── Bateria.jsx
    │       ├── TV.jsx
    │       ├── Musica.jsx
    │       ├── AltavozInteligente.jsx
    │       ├── EscenaIndividual.jsx
    │       ├── PanelEscenas.jsx
    │       ├── EscenaActiva.jsx
    │       ├── Temporizador.jsx
    │       ├── ReglaAutomatica.jsx
    │       └── EstadoHogar.jsx
    └── hooks/
        ├── useDrag.js             # HTML5 Drag API: drag from sidebar
        └── useCanvasDrag.js       # mousedown/move/up: reposicionar en canvas
```

### Responsabilidades clave

- **`dashboardStore.js`**: `useReducer` con acciones `ADD_WIDGET`, `MOVE_WIDGET`, `RESIZE_WIDGET`, `UPDATE_CONFIG`, `REMOVE_WIDGET`. Persiste en `localStorage` en cada dispatch.
- **`widgetCatalog.js`**: array con `{ id, category, icon, name, sizes[], defaultConfig, component }`. El campo `component` es la referencia al componente React.
- **`Canvas.jsx`**: recibe eventos `onDragOver` / `onDrop` del sidebar. Renderiza cada widget instanciado en posición absoluta `{ left: x, top: y }`.
- **`CanvasWidget.jsx`**: wrapper que maneja selección, repositionamiento con mouse, y muestra el componente de widget correcto según tipo y tamaño.
- **Componentes de widget**: reciben `{ size, config, onConfigChange }`. Renderizan su UI según `size` (1x1 muestra mínimo, 4x4 muestra todo).

---

## Layout

```
┌─────────────┬──────────────────────────────┬──────────────┐
│   SIDEBAR   │         CANVAS               │  PROPIEDADES │
│  220px      │         flex:1               │  180px       │
│─────────────│──────────────────────────────│──────────────│
│ 🔍 Buscar   │ [toolbar: Agregar|Limpiar|   │ Tamaño widget│
│─────────────│          Guardar]            │ 1×1 1×2 2×2  │
│ 💡 Luces    │                              │ 2×4 4×2 4×4  │
│  Lámpara    │  [grilla 60px · widgets      │              │
│  RGB        │   posicionados libremente]   │ Posición X,Y │
│  CCT        │                              │ [input] [inp]│
│  Tira LED   │                              │              │
│─────────────│                              │ Color acento │
│ 🌡 Clima    │                              │ ● ● ● ● ● ● │
│  AC         │                              │              │
│  Termostato │                              │ Widget activo│
│  Ventilador │                              │ [Editar][🗑] │
│─────────────│                              │              │
│ ... (más)   │                              │              │
└─────────────┴──────────────────────────────┴──────────────┘
```

---

## Catálogo de Widgets (30+ dispositivos)

### 💡 Iluminación
| Widget | Tamaños | Contenido |
|--------|---------|-----------|
| Lámpara simple | 1×1, 1×2, 2×2 | Icono + toggle ON/OFF |
| Lámpara Dimmer | 1×1, 1×2, 2×2 | Toggle + slider brillo |
| Lámpara RGB | 1×1, 1×2, 2×2, 4×4 | Color wheel + slider brillo + toggle |
| Lámpara CCT | 1×2, 2×2 | Slider temperatura de color (cálido↔frío) |
| Tira LED | 1×2, 2×2, 2×4 | Color wheel + brillo + segmentos |

### 🌡 Clima
| Widget | Tamaños | Contenido |
|--------|---------|-----------|
| Aire Acondicionado | 1×1, 1×2, 2×2, 4×2 | Temperatura grande + modo + botones +/− |
| Termostato | 1×2, 2×2 | Temp actual/objetivo + slider |
| Ventilador | 1×1, 1×2 | Toggle + velocidad (1-3) |
| Calefactor | 1×1, 1×2 | Toggle + temperatura |
| Humidificador | 1×1, 1×2 | Toggle + % humedad |
| Purificador de aire | 1×2, 2×2 | Calidad del aire + toggle |

### 🔐 Seguridad
| Widget | Tamaños | Contenido |
|--------|---------|-----------|
| Puerta | 1×1, 1×2, 2×2 | Icono puerta + estado (abierta/cerrada) + cerrojo |
| Ventana | 1×1, 1×2 | Icono ventana + estado |
| Cerradura inteligente | 1×1, 1×2 | Icono candado + botón bloquear/desbloquear |
| Cámara IP | 2×2, 2×4, 4×4 | Placeholder video + estado grabación |
| Sensor movimiento | 1×1, 1×2 | Indicador activo/inactivo + última detección |
| Alarma | 1×1, 2×2 | Estado alarma + botón armar/desarmar |

### 🪟 Persianas / Cortinas
| Widget | Tamaños | Contenido |
|--------|---------|-----------|
| Persiana roller | 1×2, 2×2 | Slider % apertura + botones ↑↓stop |
| Cortina | 1×2, 2×2 | Slider + botones |
| Toldo | 1×2, 2×2 | Slider + indicador extensión |
| Veneciana | 1×2, 2×2 | Slider posición + slider ángulo lamas |

### 📡 Sensores
| Widget | Tamaños | Contenido |
|--------|---------|-----------|
| Temperatura/Humedad | 1×1, 1×2, 2×2 | Valor grande °C + % humedad |
| Calidad del aire | 1×2, 2×2 | Índice AQI + CO2 ppm + escala |
| Sensor humo/gas | 1×1, 1×2 | Indicador OK/Alerta |
| Sensor inundación | 1×1, 1×2 | Indicador seco/mojado |
| Sensor luminosidad | 1×1, 1×2 | Valor lux + icono sol |
| Estación meteorológica | 2×2, 2×4 | Temp, humedad, presión, viento |

### ⚡ Energía
| Widget | Tamaños | Contenido |
|--------|---------|-----------|
| Enchufe inteligente | 1×1, 1×2, 2×2 | Toggle + watts en tiempo real |
| Medidor de consumo | 2×2, 2×4 | Gráfico de barras kWh + total del día |
| Panel solar | 2×2, 2×4 | kW generando + gráfico |
| Batería/Almacenamiento | 1×2, 2×2 | % carga + estado (cargando/descargando) |

### 🎵 Multimedia
| Widget | Tamaños | Contenido |
|--------|---------|-----------|
| TV | 1×2, 2×2, 2×4 | Toggle + fuente + control volumen |
| Música / Sonos | 1×2, 2×2, 2×4, 4×4 | Portada + artista + controles reproducción + slider |
| Altavoz inteligente | 1×1, 1×2 | Toggle + volumen |

### 🎬 Escenas
| Widget | Tamaños | Contenido |
|--------|---------|-----------|
| Escena individual | 1×1, 1×2 | Botón activar una escena + icono + nombre |
| Panel de escenas | 2×2, 2×4, 4×2 | Grid de 4-8 escenas configurables (Noche, Lectura, Película, Fiesta, etc.) — clic activa la escena, resalta la activa |
| Escena activa | 1×2, 2×2 | Muestra qué escena está activa + botón desactivar |

Cada escena tiene: nombre editable, icono (emoji), color de fondo personalizable, y lista de acciones asociadas (solo visual en el mockup).

### 🤖 Automatización
| Widget | Tamaños | Contenido |
|--------|---------|-----------|
| Temporizador | 1×2, 2×2 | Countdown + botón activar |
| Regla automática | 1×2, 2×2 | Toggle activar/desactivar + descripción |
| Estado del hogar | 2×2, 2×4 | Resumen: dispositivos activos, alertas, consumo |

---

## Tamaños de Widget (grilla de 60px)

| Tamaño | Píxeles | Uso típico |
|--------|---------|------------|
| 1×1 | 90×90 | Icono + estado, toggle rápido |
| 1×2 | 90×185 | Icono + nombre + control básico |
| 2×2 | 185×185 | Control completo (slider, rueda color) |
| 2×4 | 185×390 | Info extendida + controles avanzados |
| 4×2 | 390×185 | Horizontal extendido (música, consumo) |
| 4×4 | 390×390 | Panel completo (cámara, música full, RGB) |

*(celda = 60px, margen entre celdas = 5px → tamaño = N×60 + (N-1)×5)*

---

## Drag & Drop

### Flujo: agregar widget
1. Usuario arrastra un item del sidebar
2. Ghost preview semitransparente sigue el cursor
3. Al soltar sobre el canvas → widget se crea en esa posición
4. Widget queda seleccionado → panel derecho muestra sus propiedades

### Flujo: reposicionar widget
1. Usuario hace clic y arrastra un widget del canvas
2. Snap opcional a grilla de 60px (toggle en panel)
3. Panel de propiedades actualiza X,Y en tiempo real
4. Usuario también puede escribir X,Y directamente en los inputs

### Flujo: cambiar tamaño
1. Usuario selecciona un widget
2. En panel derecho selecciona nuevo tamaño
3. Widget se redimensiona manteniendo posición top-left

---

## Persistencia

El layout se guarda en `localStorage` como JSON al hacer clic en "Guardar" o automáticamente al mover/agregar. Al abrir la página se restaura el estado previo.

Estructura guardada:
```json
{
  "widgets": [
    {
      "id": "lamp-rgb-1",
      "type": "lamp-rgb",
      "name": "Sala",
      "x": 120,
      "y": 80,
      "size": "2x2",
      "config": { "color": "#3b82f6", "brightness": 75, "on": true }
    }
  ]
}
```

---

## Interactividad de los Widgets

Cada widget tiene estado simulado (no conectado a hardware real):
- **Toggles**: cambian ON/OFF con animación
- **Sliders**: arrastrable, actualiza valor mostrado
- **Botones +/−**: incrementan/decrementan el valor (temperatura, volumen)
- **Color wheel**: clic cambia color del widget (cambio visual)
- **Sensores**: muestran valores estáticos de demo

---

## Comportamiento Visual

- Hover sobre widget en sidebar: resaltar con borde azul
- Widget seleccionado en canvas: borde azul + sombra
- Widget en hover: borde azul suave
- Animación al agregar widget: fade-in + scale desde 0.8
- Grilla visible como patrón de puntos en el canvas

# Widget Agrupador — Spec de Diseño

**Fecha:** 2026-06-04
**Estado:** Aprobado

---

## Resumen

Un widget contenedor ("grupo") que se coloca en el canvas y permite arrastrar otros widgets desde el sidebar directamente dentro de él. Los widgets internos mantienen su tamaño y apariencia originales y pueden reposicionarse libremente dentro del grupo. El grupo crece automáticamente según el contenido. Si los widgets internos incluyen dispositivos controlables, el grupo expone controles maestros (toggle, color, brillo, posición de persianas).

---

## Comportamiento del usuario

1. El usuario arrastra "Grupo" desde el sidebar al canvas → aparece una caja vacía con header y hint de drop.
2. El usuario arrastra cualquier widget del sidebar y lo suelta **sobre** el grupo → el widget aparece dentro del grupo a su tamaño real.
3. El usuario puede mover los widgets dentro del grupo (drag interno libre).
4. El grupo crece o se ajusta automáticamente al mover/agregar widgets.
5. Si el grupo contiene dispositivos con `on`/`armed`/`recording`, el header muestra un toggle maestro que los enciende/apaga todos.
6. Long-press sobre el **fondo** del grupo (no sobre un widget hijo) abre el modal de control masivo.

---

## Estructura de datos

El grupo vive como un widget normal en el store. Sus hijos se guardan en `config.children`:

```js
{
  id: 'grupo-sala-1234',
  type: 'grupo',
  x: 100,
  y: 50,
  size: 'dynamic',
  config: {
    name: 'Sala',
    children: [
      {
        id: 'child-abc',
        type: 'lampara-rgb',
        size: '2x2',
        config: { on: true, color: '#7c3aed', brightness: 80, name: 'RGB Techo' },
        x: 10,
        y: 10,
      },
      {
        id: 'child-def',
        type: 'persiana-roller',
        size: '1x2',
        config: { position: 60, name: 'Persiana' },
        x: 205,
        y: 10,
      },
    ],
  },
}
```

No se agregan acciones nuevas al store. Toda mutación de hijos usa `UPDATE_CONFIG` existente, reemplazando el array `children` completo.

---

## Tamaño dinámico

El grupo no tiene `size` fijo. Su ancho y alto se calculan en cada render:

```
groupWidth  = max(child.x + WIDGET_SIZES[child.size].width)  + PADDING (16px)
groupHeight = HEADER_HEIGHT (40px) + max(child.y + WIDGET_SIZES[child.size].height) + PADDING (16px)
```

Mínimo cuando está vacío: `220 × 140 px`.

---

## Header del grupo

Siempre visible, altura fija 40px.

| Elemento | Condición |
|---|---|
| Icono + nombre del grupo | Siempre |
| Badge "GRUPO" | Siempre |
| Toggle maestro "Todos" | Si algún hijo tiene propiedad `on`, `armed` o `recording` |

**Toggle maestro:**
- Detecta el estado predominante de los hijos controlables.
- Al activar: itera `children` y fija `on/armed/recording = true` en los que aplican.
- Al desactivar: fija `on/armed/recording = false`.

---

## Canvas interno

- Contenedor con `position: relative` debajo del header.
- Cada hijo se renderiza con `position: absolute` en `(child.x, child.y)`.
- Usa el componente existente de cada widget (mismo que en el canvas principal).
- Drag interno: `mousedown` sobre un hijo inicia drag relativo al grupo (misma lógica que `CanvasWidget` pero con coordenadas relativas al grupo).
- Long-press sobre el **fondo** (no sobre un hijo): abre `GrupoModal`.
- Hint de drop: texto `⊕ Arrastra más widgets aquí` visible cuando no hay hijos o hay espacio vacío.

---

## Detección de drop en Canvas.jsx

En `handleDrop`, antes de crear el widget normalmente, verificar si el punto de drop cae dentro de un grupo:

```js
function isInsideGroup(groupWidget, dropX, dropY) {
  const bounds = computeGroupBounds(groupWidget); // usa children para calcular w/h
  return (
    dropX >= groupWidget.x && dropX <= groupWidget.x + bounds.width &&
    dropY >= groupWidget.y + 40 && dropY <= groupWidget.y + bounds.height // +40 = header
  );
}

const targetGroup = state.widgets.find(w => w.type === 'grupo' && isInsideGroup(w, rawX, rawY));

if (targetGroup) {
  const childX = snap(rawX - targetGroup.x - 8);
  const childY = snap(rawY - targetGroup.y - 48); // 40 header + 8 padding
  // dispatch UPDATE_CONFIG con nuevo child en targetGroup.config.children
} else {
  // dispatch ADD_WIDGET normal
}
```

---

## Modal de control masivo (GrupoModal)

Se abre con long-press (500ms) sobre el fondo del grupo. Usa `ModalBase` existente con `createPortal`.

Las secciones se generan dinámicamente según los tipos de hijos:

### Sección 🎨 Color RGB
**Condición:** hay al menos un hijo de tipo `lampara-rgb` o `tira-led-rgb`.

Contenido:
- `ColorWheel` para elegir un color.
- Fila de 8 presets de color rápido.
- Botón "Aplicar color a todos" → itera hijos RGB y actualiza `config.color`.

### Sección 🔆 Brillo
**Condición:** hay al menos un hijo de tipo `lampara-rgb`, `tira-led-rgb`, `lampara-dimmer`, `tira-led` o `lampara-cct`.

Contenido:
- `Slider` 0–100%.
- Botón "Aplicar brillo a todos" → itera hijos dimmer/RGB y actualiza `config.brightness` (o `config.colorTemp` para CCT, mapeado 0–100).

### Sección 📋 Persianas
**Condición:** hay al menos un hijo de tipo `cortina`, `persiana-roller`, `toldo` o `veneciana`.

Contenido:
- `Slider` 0–100% (posición de apertura).
- Botón "Aplicar posición a todas" → itera hijos de persiana y actualiza `config.position`.

### Sin secciones especiales
Si el grupo solo contiene interruptores simples o sensores, el modal muestra un mensaje informativo y el toggle maestro (si aplica). Los sensores no tienen sección de control.

---

## Categorización de widgets internos

| Categoría | IDs |
|---|---|
| RGB | `lampara-rgb`, `tira-led-rgb` |
| Dimmer (brillo) | `lampara-rgb`, `tira-led-rgb`, `lampara-dimmer`, `tira-led`, `lampara-cct` |
| Interruptores | `lampara-simple`, `enchufe`, `ventilador`, `calefactor`, `humidificador`, `purificador`, `puerta`, `ventana`, `cerradura`, `alarma`, `aire-acondicionado`, `tv`, `musica`, `altavoz` |
| Persianas | `cortina`, `persiana-roller`, `toldo`, `veneciana` |
| Sensores (solo lectura) | `sensor-movimiento`, `sensor-presencia`, `sensor-humo`, `sensor-inundacion`, `sensor-luz`, `sensor-temp`, `sensor-aire`, `estacion-meteo`, `medidor-consumo`, `panel-solar`, `bateria`, `camara-ip`, `temporizador`, `regla-auto`, `estado-hogar` |

Los sensores no participan en ninguna sección del modal ni en el toggle maestro.

---

## Archivos nuevos y modificados

### Nuevos
- `src/components/widgets/GrupoWidget.jsx` — componente principal del grupo
- `src/components/widgets/GrupoModal.jsx` — modal de control masivo

### Modificados
- `src/catalog/widgetCatalog.jsx` — agregar entrada para `grupo` en categoría "Organización"
- `src/components/Canvas/Canvas.jsx` — interceptar drop sobre grupos en `handleDrop`
- `src/components/Canvas/CanvasWidget.jsx` — excluir el widget `grupo` de los estilos RGB/ON (el grupo maneja su propio estilo)

---

## Restricciones y límites

- Los grupos **no se pueden anidar** (un grupo no puede contener otro grupo).
- Los widgets tipo sensor dentro de un grupo son visibles pero no controlables masivamente.
- El drag desde el sidebar solo crea hijos si el punto de drop cae **dentro del área de contenido** del grupo (por debajo del header).
- Al eliminar un grupo del canvas, sus hijos se eliminan también (no se "sueltan" al canvas).
